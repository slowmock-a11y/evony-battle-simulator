// One-shot migration:
//   - parse data/Master Generals Spreadsheet_{range,ground,mounted,siege}.csv
//   - extract Main Skill cols (ATK, DEF, HP, MS) per general
//   - rewrite data/generals.json:
//       * drop  skill_atk_pct / skill_def_pct / skill_hp_pct / skill_march_size_pct
//       * rename main_skill_atk / def / hp  →  main_skill_atk_pct / def_pct / hp_pct
//       * add   main_skill_march_size_pct   (from CSV; null for non-combat entries)
//   - report any JSON↔CSV discrepancies so we catch silent data drift
//
// Run: node scripts/migrate-main-skill-pct.js
// After: node scripts/regen-generals-data.js

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const DATA_DIR = path.join(repoRoot, 'data');
const GENERALS_JSON = path.join(DATA_DIR, 'generals.json');

const CSV_BY_TROOP = {
  RANGED:  'Master Generals Spreadsheet_range.csv',
  GROUND:  'Master Generals Spreadsheet_ground.csv',
  MOUNTED: 'Master Generals Spreadsheet_mounted.csv',
  SIEGE:   'Master Generals Spreadsheet_siege.csv',
};

// CSV columns (0-indexed) in the Main General section:
// 0:# 1:A/U 2:Name 3:MC 4-6:C1/C2/C3
// 7-10:  Skill Books ATK%/DEF%/HP%/MS%  (ignored — constant placeholder)
// 11-14: Main Skill ATK/DEF/HP/MS       (what we want)
const COL_NAME = 2;
const COL_MAIN_ATK = 11;
const COL_MAIN_DEF = 12;
const COL_MAIN_HP  = 13;
const COL_MAIN_MS  = 14;

function parseCsvField(raw) {
  const t = String(raw).trim();
  if (t === '' || t === '-') return 0;
  // CSVs use European decimals (1.737,94). Integers pass through unchanged.
  const n = Number(t.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const lines = text.split(/\r?\n/);
  const out = {};
  // Main data rows are between row index 2 and the 'Assistant' section separator.
  for (let i = 2; i < lines.length; i++) {
    const row = lines[i];
    const stripped = row.replace(/;/g, '').trim();
    if (stripped === '') break;               // blank separator → end of main section
    if (/^Assistant/i.test(row)) break;       // assistant subsection → stop
    const cols = row.split(';');
    if (cols.length <= COL_MAIN_MS) continue;
    if (!cols[0].trim().startsWith('#')) continue;
    const name = (cols[COL_NAME] || '').trim();
    if (!name) continue;                      // placeholder rows with empty name
    out[name] = {
      atk: parseCsvField(cols[COL_MAIN_ATK]),
      def: parseCsvField(cols[COL_MAIN_DEF]),
      hp:  parseCsvField(cols[COL_MAIN_HP]),
      ms:  parseCsvField(cols[COL_MAIN_MS]),
    };
  }
  return out;
}

// ---- 1. Parse per-troop CSVs ----
// Key by `${troop}|${name}` so same-name generals in different troop types don't collide
// (e.g. Yue Fei exists in both GROUND and MOUNTED).
const mainSkill = {};
const key = (troop, name) => `${troop}|${name}`;
let totalRows = 0;
for (const [troop, file] of Object.entries(CSV_BY_TROOP)) {
  const data = parseCsv(path.join(DATA_DIR, file));
  for (const [name, vals] of Object.entries(data)) {
    mainSkill[key(troop, name)] = vals;
    totalRows++;
  }
  console.log(`  ${file}: ${Object.keys(data).length} named rows`);
}
console.log(`Total: ${totalRows} (troop, general) rows across CSVs`);

// ---- 2. Load and transform generals.json ----
const generals = JSON.parse(fs.readFileSync(GENERALS_JSON, 'utf-8'));
const COMBAT = new Set(['RANGED', 'GROUND', 'MOUNTED', 'SIEGE']);

const missingInCsv = [];
const discrepancies = [];

for (const g of generals) {
  // Drop deprecated skill_*_pct fields (placeholder defaults of 25/25/25/12).
  delete g.skill_atk_pct;
  delete g.skill_def_pct;
  delete g.skill_hp_pct;
  delete g.skill_march_size_pct;

  // Coalesce pre- and post-migration values so the script is re-runnable.
  const prevAtk = g.main_skill_atk ?? g.main_skill_atk_pct ?? null;
  const prevDef = g.main_skill_def ?? g.main_skill_def_pct ?? null;
  const prevHp  = g.main_skill_hp  ?? g.main_skill_hp_pct  ?? null;
  const prevMs  = g.main_skill_march_size_pct ?? null;

  if (COMBAT.has(g.troop_type)) {
    const csv = mainSkill[key(g.troop_type, g.name)];
    if (!csv) {
      missingInCsv.push(`${g.name} (${g.troop_type})`);
      g.main_skill_atk_pct = prevAtk;
      g.main_skill_def_pct = prevDef;
      g.main_skill_hp_pct  = prevHp;
      g.main_skill_march_size_pct = prevMs;
    } else {
      if (prevAtk !== csv.atk || prevDef !== csv.def || prevHp !== csv.hp) {
        discrepancies.push({
          name: `${g.name} (${g.troop_type})`,
          json: { atk: prevAtk, def: prevDef, hp: prevHp },
          csv:  { atk: csv.atk, def: csv.def, hp: csv.hp },
        });
      }
      g.main_skill_atk_pct = csv.atk;
      g.main_skill_def_pct = csv.def;
      g.main_skill_hp_pct  = csv.hp;
      g.main_skill_march_size_pct = csv.ms;
    }
  } else {
    // Non-combat entries (SUB_CITY, DUTY, WALL) don't have per-troop CSVs.
    g.main_skill_atk_pct = prevAtk;
    g.main_skill_def_pct = prevDef;
    g.main_skill_hp_pct  = prevHp;
    g.main_skill_march_size_pct = prevMs;
  }
  delete g.main_skill_atk;
  delete g.main_skill_def;
  delete g.main_skill_hp;
}

// ---- 3. Stable field ordering so diffs are readable ----
function reorder(g) {
  const front = [
    'name', 'troop_type', 'type', 'role', 'tavern',
    'main_skill_atk_pct', 'main_skill_def_pct', 'main_skill_hp_pct', 'main_skill_march_size_pct',
  ];
  const out = {};
  for (const k of front) if (k in g) out[k] = g[k];
  for (const k of Object.keys(g)) if (!(k in out)) out[k] = g[k];
  return out;
}
const reordered = generals.map(reorder);

// ---- 4. Report & write ----
console.log(`\nProcessed ${generals.length} entries.`);
if (missingInCsv.length) {
  console.log(`\nCombat generals missing from per-troop CSVs (${missingInCsv.length}):`);
  for (const n of missingInCsv) console.log(`  - ${n}`);
}
if (discrepancies.length) {
  console.log(`\nValue discrepancies JSON vs CSV (${discrepancies.length}):`);
  for (const d of discrepancies) {
    console.log(`  ${d.name}:  JSON=${JSON.stringify(d.json)}  CSV=${JSON.stringify(d.csv)}`);
  }
}
if (!missingInCsv.length && !discrepancies.length) {
  console.log('All combat generals cross-verify against CSVs.');
}

fs.writeFileSync(GENERALS_JSON, JSON.stringify(reordered, null, 2) + '\n');
console.log(`\nWrote ${GENERALS_JSON}`);
