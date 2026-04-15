# Evony PvP Battle Mechanics — Known Facts

Reference document for the march-vs-march battle simulator. Sources: community research, theriagames.com, in-game observation.

---

## Troop Types

Four troop types, each with tiers T1 through T15:

| Type    | Role     | Key Trait                        |
|---------|----------|----------------------------------|
| Ground  | Tank     | Highest DEF (~3x ATK), highest HP (~6x ATK), slow |
| Ranged  | Balanced | ATK ≈ DEF, moderate HP (~2x ATK), range 500 |
| Mounted | Striker  | Highest ATK, moderate DEF/HP, fast (actual speed 300, displayed 600) |
| Siege   | Glass    | Lowest stats, extreme range (1400–2178) |

---

## Base Troop Stats (T1–T15)

Speed and Range are constant across tiers per type. **Actual values** from the game database differ from displayed UI values — the UI inflates some stats.

| Type    | Displayed Speed | Actual Speed | Range          |
|---------|----------------|-------------|----------------|
| Ground  | 350            | 350         | 50             |
| Ranged  | 100            | 100         | 500            |
| Mounted | 600            | **300**     | 50             |
| Siege   | 75             | 75          | varies by tier |

**Note:** Mounted displayed speed (600) is double the actual game-DB value (300). Source: database file analysis by [@DerrickDefies](https://www.youtube.com/@DerrickDefies).

**Open questions:** Ground speed, Ranged speed, Ranged range, Ground range, and Mounted range may also differ from displayed values — unconfirmed.

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
| T15  | 4,230 | 11,760 | 24,260 |

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
| T15  | 4,690 | 3,780 | 9,220 |

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
| T15  | 7,540 | 4,970 | 13,620 |

### Siege

| Tier | ATK   | DEF   | HP    | Actual Range | Displayed Range |
|------|-------|-------|-------|-------------|-----------------|
| T1   | 100   | 50    | 100   | **900**     | 1,400           |
| T2   | 140   | 70    | 140   | **900**     | 1,400           |
| T3   | 190   | 90    | 190   | **900**     | 1,400           |
| T4   | 260   | 120   | 260   | **900**     | 1,400           |
| T5   | 350   | 160   | 350   | **1,000**   | 1,556           |
| T6   | 470   | 220   | 470   | **1,000**   | 1,556           |
| T7   | 630   | 300   | 630   | **1,000**   | 1,556           |
| T8   | 850   | 410   | 850   | **1,000**   | 1,556           |
| T9   | 1,150 | 550   | 1,150 | **1,100**   | 1,711           |
| T10  | 1,550 | 740   | 1,550 | **1,100**   | 1,711           |
| T11  | 1,940 | 930   | 1,940 | **1,200**   | 1,867           |
| T12  | 2,425 | 1,162 | 2,425 | **1,200**   | 1,867           |
| T13  | 2,780 | 1,330 | 2,780 | **1,400**   | 2,178           |
| T14  | 3,280 | 1,560 | 3,280 | **1,400**   | 2,178           |
| T15  | 3,780 | 1,790 | 3,780 | **1,400**   | 2,178           |

**Notable pattern:** Siege ATK = Siege HP at every tier.

**Siege range source:** Actual range values from game database analysis by [@DerrickDefies](https://www.youtube.com/@DerrickDefies) — [Speed and Range Mechanics video](https://www.youtube.com/watch?v=zaM5ajYqudE). ATK/DEF/HP source: https://theriagames.com/guide/troop-base-stats/

---

## Phase Order (Attack Sequence)

Troops attack sequentially by **actual speed** (fastest first). When speed is tied, the defender acts first.

| Phase | Type    | Actual Speed | Rationale                |
|-------|---------|-------------|--------------------------|
| 1     | Ground  | 350         | Fastest                  |
| 2     | Mounted | 300         | Second fastest           |
| 3     | Ranged  | 100         | Third                    |
| 4     | Siege   | 75          | Slowest                  |

**Within each phase:**
1. Attacker's troops strike defender's target layer (full damage formula)
2. Surviving target counter-strikes attacker's layer **if attacker is within target's range** (reduced formula: targetATK / attackerHP, flat)
3. Defender's troops strike attacker's target layer (full damage formula)
4. Surviving target counter-strikes defender's layer **if defender is within target's range** (reduced formula)

The attacker has a slight edge — they reduce the defender's count before the defender's main attack. Counter-strikes deal incidental return damage using a simplified formula with no type modifier or defense ratio. Counter-strikes are range-gated: e.g., Ground and Mounted (both range 50) cannot counter-strike Ranged or Siege attacking from beyond 50 units.

**Within a side (same type, multiple tiers):**
Higher tier attacks before lower tier.

**Confidence levels:**
- Speed-based ordering: HIGH (confirmed from game database analysis by @DerrickDefies)
- Defender first on speed tie: MEDIUM (from evonyanswers community research)
- Attacker strikes first within phase: CONFIRMED by user
- Higher tier first within type: MEDIUM (widely accepted, not proven)

Source: evonyanswers.com — "Order of Movement and/or Attack for Troop Groups is determined by Actual Speed."

---

## Battlefield

Linear battlefield, **1500 units** long. Attacker starts at position 0, defender at position 1500.

```
Attacker start (0)                Defender start (1500)
    ├──────── 1500 units ────────┤
```

Each troop type has its own independent position on the field (8 positions total: 4 per side). Troops never share a forced formation — they advance and hold independently.

Source: game database analysis by [@DerrickDefies](https://www.youtube.com/@DerrickDefies), confirmed by evonyanswers.com.

---

## Movement Model

Each round, before attacking, each troop type evaluates movement using **minimum-distance movement** with an **effective range** detection concept:

**Effective Range** = Actual Speed + Actual Range (determines detection, not firing)

1. **Check:** Is any enemy unit within **actual range** from current position?
2. **YES → Hold.** Stay at current position. Fire at highest-priority target in range.
3. **NO → Check effective range:** Is the highest-priority enemy target within **effective range**?
4. **YES → Minimum move.** Move only the **minimum distance** needed to bring that target into actual range.
5. **NO → Advance.** Move forward by full `speed` units toward the enemy side.

Key rules:
- **Speed is distance per round:** Ground moves 350 units/round, Mounted 300, Ranged 100, Siege 75.
- **Direction is always forward:** Attacker moves toward 1500, defender moves toward 0. Troops never reverse.
- **Minimum-distance movement:** Troops don't blindly advance full speed. They calculate the smallest movement needed to bring their priority target into firing range.
- **Melee collision:** When two troops would pass through each other, they stop at melee range (50 units apart).
- **No passing:** An attacker troop can never reach a position beyond any defender troop (and vice versa).

### Engagement Lock

Once a troop begins attacking a target type, it **stays locked on** that type until:
1. All enemy troops of that type are eliminated, OR
2. A higher-priority target type enters the troop's effective range

Only when one of these conditions triggers does the troop re-evaluate its target using the priority chain.

**Effective Range examples (base, no gear bonuses):**
```
Ground:         350 + 50   = 400
Mounted:        300 + 50   = 350
Ranged:         100 + 500  = 600
Siege T1–T4:    75  + 900  = 975
Siege T13–T15:  75  + 1400 = 1475
```

**Engagement cascade on a 1500 field (typical, both sides identical):**

```
Round 1:  Siege (ER 975+) detects approaching troops. Ground/Mounted advance.
Round 2:  Mounted pairs close to melee near midfield.
Round 3:  Ground pairs lock in melee.
Round ~5: Ranged reach engagement range.
Round ~7: All types engaged, siege firing into melee zone.
```

On the shorter 1500-unit field, engagements happen much faster than the old 5200-unit model.

**Confidence:** Minimum-distance movement, effective range concept, and engagement lock from evonyanswers.com (based on @DerrickDefies analysis). Battlefield length 1500 confirmed.

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
kills  = damage / target_HP_per_troop   (decimal, no floor — fractions accumulate)

counter_kills = targetATK / attackerHP   (flat, no modifier, no DEF ratio)
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

Tier-dependent 4×4 coefficient matrices. Values below 1.0 are penalties; above 1.0 are bonuses. Two cells change at T11+.

### T1–T10

| Attacker \ Target | Ground | Ranged | Mounted | Siege |
|--------------------|--------|--------|---------|-------|
| Ground             | 1.0    | 1.2    | 0.7     | 1.1   |
| Ranged             | 0.8    | 1.0    | 1.2     | 1.1   |
| Mounted            | 1.2    | 0.8    | 1.0     | 0.9   |
| Siege              | 0.35   | 0.4    | 0.3     | 0.5   |

### T11–T15

| Attacker \ Target | Ground | Ranged | Mounted | Siege   |
|--------------------|--------|--------|---------|---------|
| Ground             | 1.0    | 1.2    | 0.7     | 1.1     |
| Ranged             | 0.8    | 1.0    | 1.2     | 1.1     |
| Mounted            | 1.2    | 0.8    | 1.0     | **1.1** |
| Siege              | 0.35   | 0.4    | 0.3     | **0.6** |

Key interactions:
- Counter triangle with bonuses AND penalties: Range→Mounted 1.2× / Mounted→Range 0.8×, Mounted→Ground 1.2× / Ground→Mounted 0.7×, Ground→Range 1.2× / Range→Ground 0.8×
- Mounted penalised against Siege at T1–T10 (0.9×), becomes bonus at T11+ (1.1×)
- Siege vs Siege slightly less punishing at T11+ (0.5× → 0.6×)
- Siege are offensively weak against all types (0.3×–0.6×)

Source: community research by [@DerrickDefies](https://www.youtube.com/@DerrickDefies) — [Battle Mechanics video](https://www.youtube.com/watch?v=fZm_MtJ1kyg&t=102s)

---

## Battle End Condition

**Currently assumed:** Battle ends when one side has zero troops remaining.

**Unknown:** Whether field march-vs-march battles have a fixed round cap (community often cites 4 rounds, but this is unconfirmed for this battle type).

---

## Open Questions (Unconfirmed Values)

The following values are used as-is from the game UI but have **not been confirmed** against the actual game database files. They may be inflated like Mounted speed and Siege range were:

- **Ground actual speed:** Currently 350 (matches evonyanswers MER=350+50=400). But does the UI doubling apply here too?
- **Ranged actual speed:** Currently 100. Could be 50 if the UI doubling applies.
- **Ranged actual range:** Currently 500. The game-file range order is reportedly Siege > Ground > Ranged & Mounted — if true, Ground range > Ranged range, which contradicts displayed values.
- **Ground actual range:** Currently 50. May be higher in game files (see range order above).
- **Mounted actual range:** Currently 50. Unconfirmed.
- **MER gear bonuses:** The full MER formula includes gear bonuses (15% of actual range + 20 flat). Not modeled yet — base MER only.
- **Round cap:** Whether march-vs-march battles on a 1500-unit field have a fixed round limit.

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
