// One-shot: tag generals with their Ascension-update runestone discount tier.
// Adds `runestone_discount` field on each matching general in data/generals.json.
// Values: "runestone" | "runestone_blood" | null
// Source: YouTube "The Hidden Cost-Benefit of the Ascension Update" (2026-04-21).

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const jsonPath = path.join(repoRoot, 'data/generals.json');

const runestoneOnly = [
    'Emperor Qin Shihuang', 'Washington', 'Oda Nobunaga', 'Jumong', 'Peter the Great',
    'Huo Qubing', 'Li Shimin', 'William Wallace', 'Trajan', 'Edward the Black Prince',
    'Khalid', 'Barbarossa', 'Li Jing', 'Sherman', 'Honda Tadakatsu',
    'Ulysses S. Grant', 'Himiko', 'Vladimir the Great', 'Hannibal', 'Winfield Scott',
    'Alfred the Great', 'Roland', 'Robert Guiscard', 'Robert the Bruce', 'Thutmose III',
    'Gnarr', 'Henry V', 'Soult', 'George A. Custer', 'Mordred',
    'Edward III', 'Zucca', 'Turenne', 'Charles XII', 'John Churchill',
    'Poligenus', 'Aurelian'
];

const runestoneBlood = [
    'Empress Wu', 'Lincoln', 'Tokugawa Ieyasu', 'King Sejong', 'Charles the Great',
    'King Arthur', 'Pompey', 'Catherine II', 'Nero', 'Empress Dowager Cixi',
    'Charles Martel', 'Andrew Jackson', 'Minamoto no Yoshitsune', 'Martinus', 'Mansa Musa',
    'Arminius', 'Margaret I', 'Scipio Africanus', 'Harald', 'Ludwig', 'Athena', 'Pythia'
];

// OCR-vs-dataset aliases: left is in the source list, right is the dataset spelling.
const aliases = {
    'Ulysses S. Grant':       'Ulysses',
    'George A. Custer':       'George Custer',
    'Minamoto no Yoshitsune': 'Minamoto No Yoshitsune'
};

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const byName = new Map();
data.forEach(g => byName.set(g.name, g));

function tag(list, tier) {
    const missing = [];
    list.forEach(rawName => {
        const key = aliases[rawName] || rawName;
        const entry = byName.get(key);
        if (!entry) { missing.push(rawName); return; }
        entry.runestone_discount = tier;
    });
    return missing;
}

const missA = tag(runestoneOnly, 'runestone');
const missB = tag(runestoneBlood, 'runestone_blood');

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n');

console.log('Tagged', runestoneOnly.length - missA.length, 'runestone-only');
console.log('Tagged', runestoneBlood.length - missB.length, 'runestone+blood');
if (missA.length) console.log('Not found (runestone-only):', missA);
if (missB.length) console.log('Not found (runestone+blood):', missB);
