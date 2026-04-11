# Evony PvP Battle Mechanics — Known Facts

Reference document for the march-vs-march battle simulator. Sources: community research, theriagames.com, in-game observation.

---

## Troop Types

Four troop types, each with tiers T1 through T14:

| Type    | Role     | Key Trait                        |
|---------|----------|----------------------------------|
| Ground  | Tank     | Highest DEF (~3x ATK), highest HP (~6x ATK), slow |
| Ranged  | Balanced | ATK ≈ DEF, moderate HP (~2x ATK), range 500 |
| Mounted | Striker  | Highest ATK, moderate DEF/HP, fastest (speed 600) |
| Siege   | Glass    | Lowest stats, extreme range (1400–2178) |

---

## Base Troop Stats (T1–T14)

Speed and Range are constant across tiers per type:
- Ground:  Speed 350, Range 50
- Ranged:  Speed 100, Range 500
- Mounted: Speed 600, Range 50
- Siege:   Speed 75,  Range varies by tier

### Ground

| Tier | ATK   | DEF    | HP     |
|------|-------|--------|--------|
| T1   | 100   | 300    | 600    |
| T2   | 140   | 410    | 810    |
| T3   | 190   | 550    | 1,090  |
| T4   | 260   | 740    | 1,470  |
| T5   | 350   | 1,000  | 1,980  |
| T6   | 470   | 1,350  | 2,670  |
| T7   | 630   | 1,820  | 3,600  |
| T8   | 850   | 2,460  | 4,860  |
| T9   | 1,150 | 3,320  | 6,560  |
| T10  | 1,550 | 4,480  | 8,860  |
| T11  | 1,940 | 5,600  | 11,080 |
| T12  | 2,425 | 7,000  | 13,850 |
| T13  | 2,910 | 8,400  | 16,620 |
| T14  | 3,570 | 10,330 | 20,440 |

### Ranged

| Tier | ATK   | DEF   | HP    |
|------|-------|-------|-------|
| T1   | 130   | 100   | 250   |
| T2   | 180   | 140   | 340   |
| T3   | 240   | 190   | 460   |
| T4   | 320   | 260   | 620   |
| T5   | 430   | 350   | 840   |
| T6   | 580   | 470   | 1,130 |
| T7   | 780   | 630   | 1,530 |
| T8   | 1,050 | 850   | 2,070 |
| T9   | 1,420 | 1,150 | 2,790 |
| T10  | 1,920 | 1,550 | 3,770 |
| T11  | 2,400 | 1,940 | 4,720 |
| T12  | 3,000 | 2,425 | 5,900 |
| T13  | 3,450 | 2,780 | 6,780 |
| T14  | 4,070 | 3,280 | 8,000 |

### Mounted

| Tier | ATK   | DEF   | HP     |
|------|-------|-------|--------|
| T1   | 220   | 150   | 400    |
| T2   | 300   | 200   | 540    |
| T3   | 410   | 270   | 730    |
| T4   | 550   | 360   | 990    |
| T5   | 740   | 490   | 1,340  |
| T6   | 1,000 | 660   | 1,810  |
| T7   | 1,350 | 890   | 2,440  |
| T8   | 1,820 | 1,200 | 3,290  |
| T9   | 2,460 | 1,620 | 4,440  |
| T10  | 3,320 | 2,190 | 5,990  |
| T11  | 4,150 | 2,740 | 7,490  |
| T12  | 5,187 | 3,425 | 9,362  |
| T13  | 5,800 | 3,830 | 10,480 |
| T14  | 6,670 | 4,400 | 12,050 |

### Siege

| Tier | ATK   | DEF   | HP    | Range |
|------|-------|-------|-------|-------|
| T1   | 100   | 50    | 100   | 1,400 |
| T2   | 140   | 70    | 140   | 1,400 |
| T3   | 190   | 90    | 190   | 1,400 |
| T4   | 260   | 120   | 260   | 1,400 |
| T5   | 350   | 160   | 350   | 1,556 |
| T6   | 470   | 220   | 470   | 1,556 |
| T7   | 630   | 300   | 630   | 1,556 |
| T8   | 850   | 410   | 850   | 1,556 |
| T9   | 1,150 | 550   | 1,150 | 1,711 |
| T10  | 1,550 | 740   | 1,550 | 1,711 |
| T11  | 1,940 | 930   | 1,940 | 1,867 |
| T12  | 2,425 | 1,162 | 2,425 | 1,867 |
| T13  | 2,780 | 1,330 | 2,780 | 2,178 |
| T14  | 3,280 | 1,560 | 3,280 | 2,178 |

**Notable pattern:** Siege ATK = Siege HP at every tier.

Source: https://theriagames.com/guide/troop-base-stats/

---

## Phase Order (Attack Sequence)

Troops attack sequentially by **range** (longest range fires first):

| Phase | Type    | Range     | Rationale            |
|-------|---------|-----------|----------------------|
| 1     | Siege   | 1400–2178 | Longest range        |
| 2     | Ranged  | 500       | Second longest       |
| 3     | Mounted | 50        | Speed 600 (tiebreak) |
| 4     | Ground  | 50        | Speed 350 (tiebreak) |

**Within each phase:**
1. Attacker's troops strike defender's target layer
2. Defender's **surviving** troops counter back on attacker's layer

This means the attacker has a slight edge — they reduce the defender's count before the counterstrike.

**Within a side (same type, multiple tiers):**
Higher tier attacks before lower tier.

**Confidence levels:**
- Siege before Ranged before melee: HIGH (range-based, widely confirmed)
- Mounted before Ground: MEDIUM (inferred from speed tiebreak, not conclusively proven)
- Attacker strikes first within phase: CONFIRMED by user
- Higher tier first within type: MEDIUM (widely accepted, not proven)

---

## Targeting Priority

Each troop type has a full priority chain determining **who** it attacks (1 = first choice, 4 = last):

| Attacker \ Target | Siege | Range | Mounted | Ground |
|--------------------|-------|-------|---------|--------|
| **Siege**          | 1     | 2     | 4       | 3      |
| **Range**          | 4     | 2     | 1       | 3      |
| **Mounted**        | 2     | 4     | 3       | 1      |
| **Ground**         | 2     | 1     | 4       | 3      |

As priority chains:
```
Siege   → [Siege, Range, Ground, Mounted]
Range   → [Mounted, Range, Ground, Siege]
Mounted → [Ground, Siege, Mounted, Range]
Ground  → [Range, Siege, Ground, Mounted]
```

**Within a priority level** (e.g. multiple Mounted layers): target highest tier first, then largest troop count.

Source: theriagames.com "Game Evony: Battle Mechanics - describe attack order"

---

## Damage Formula

```
damage = troopCount × ATK × modifier × ATK / (ATK + DEF)
kills  = floor(damage / target_HP_per_troop)
```

Where:
- `troopCount` = current surviving count of the attacking layer
- `ATK` = per-troop attack stat of the attacker
- `DEF` = per-troop defense stat of the target
- `modifier` = type matchup multiplier (see below)
- `target_HP_per_troop` = per-troop HP of the target

The `ATK/(ATK+DEF)` ratio ensures:
- Damage is always > 0 (no zero-damage edge cases)
- High DEF reduces damage proportionally, not by flat subtraction
- The ratio is always between 0 and 1

Source: common Evony community formula

---

## Damage Multipliers

Bonus damage when attacking your counter target:

| Matchup           | Multiplier |
|--------------------|-----------|
| Range → Mounted    | 1.2×      |
| Mounted → Ground   | 1.2×      |
| Ground → Range     | 1.2×      |
| Siege → Siege      | 1.5×      |
| All other matchups | 1.0×      |

**No penalty** for being on the wrong side — only bonuses.

The counter triangle:
```
Range ──1.2×──▶ Mounted ──1.2×──▶ Ground ──1.2×──▶ Range
Siege ──1.5×──▶ Siege
```

---

## Battle End Condition

**Currently assumed:** Battle ends when one side has zero troops remaining.

**Unknown:** Whether field march-vs-march battles have a fixed round cap (community often cites 4 rounds, but this is unconfirmed for this battle type).

---

## Not Yet Modeled (Deferred)

These mechanics exist in Evony but are excluded from the initial simulator:

- **Generals:** Base stats (Leadership, Attack, Defense, Politics), ascending stars
- **General Skills:** Passive modifiers (e.g. +20% ranged attack)
- **General Specialties:** Additional modifiers
- **Equipment:** Gear on generals affecting troop stats
- **Research Buffs:** Technology tree bonuses
- **Civilization Buffs:** Civilization-specific bonuses
- **Alliance Buffs:** Alliance tech and territory bonuses
- **Monarch Gear:** Monarch equipment bonuses
- **Sub-city Buffs:** Subordinate city bonuses
- **Wounded/Killed Ratio:** How losses split between wounded (recoverable) and killed
- **Wall/Trap Mechanics:** Only relevant for city attacks, not march-vs-march
- **Rally Mechanics:** Multiple marches joining — march-vs-march only for now
