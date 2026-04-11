# Battle Simulator — UI Input Specification

---

## Army Configuration

Each side (Attacker / Defender) gets an identical input panel.

### Troop Count Inputs

One numeric input per troop type per tier. Default value: **1000**.

```
┌─────────────────── ATTACKER ───────────────────────────────────────┐
│                                                                     │
│  Tier    Ground    Ranged    Mounted    Siege                      │
│  ──────────────────────────────────────────────                    │
│  T1     [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ]               │
│  T2     [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ]               │
│  T3     [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ]               │
│  T4     [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ]               │
│  T5     [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ]               │
│  T6     [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ]               │
│  T7     [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ]               │
│  T8     [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ]               │
│  T9     [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ]               │
│  T10    [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ]               │
│  T11    [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ]               │
│  T12    [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ]               │
│  T13    [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ]               │
│  T14    [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ]               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

- Input type: numeric, min 0, no max
- Default: 1000
- Users set 0 to exclude a troop type/tier from the march

---

### Buff Inputs (per troop type)

Four buff sections, one per troop type. Each has three percentage fields: Attack, Defense, HP.
These represent the **total combined buff** from all sources (general, research, gear, etc.) as a single percentage modifier.

Default value: **0%**

```
┌─────────────────── ATTACKER BUFFS ─────────────────────────────────┐
│                                                                     │
│  Ground Buffs:   Attack [   0 ]%   Defense [   0 ]%   HP [   0 ]% │
│  Ranged Buffs:   Attack [   0 ]%   Defense [   0 ]%   HP [   0 ]% │
│  Mounted Buffs:  Attack [   0 ]%   Defense [   0 ]%   HP [   0 ]% │
│  Siege Buffs:    Attack [   0 ]%   Defense [   0 ]%   HP [   0 ]% │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

- Input type: numeric, allow negative (debuffs), no hard max
- Default: 0
- Unit: percent (e.g. 150 means +150% → base stat × 2.5)

**How buffs apply to the damage formula:**

```
effective_ATK = base_ATK × (1 + attackBuff / 100)
effective_DEF = base_DEF × (1 + defenseBuff / 100)
effective_HP  = base_HP  × (1 + hpBuff / 100)

damage = count × effective_ATK × modifier × effective_ATK / (effective_ATK + effective_DEF)
kills  = floor(damage / effective_HP)
```

Example: Mounted T14 with +150% Attack buff
```
base_ATK = 6,670
effective_ATK = 6,670 × (1 + 150/100) = 6,670 × 2.5 = 16,675
```

---

## Full Layout Sketch

```
┌──────────────────────────────────────────────────────────────────────┐
│                    EVONY BATTLE SIMULATOR                            │
├────────────────────────────┬─────────────────────────────────────────┤
│        ATTACKER            │           DEFENDER                      │
├────────────────────────────┼─────────────────────────────────────────┤
│                            │                                         │
│  ┌── Buffs ─────────────┐  │  ┌── Buffs ─────────────┐              │
│  │ Ground:  A[0] D[0] H[0]│  │ Ground:  A[0] D[0] H[0]│            │
│  │ Ranged:  A[0] D[0] H[0]│  │ Ranged:  A[0] D[0] H[0]│            │
│  │ Mounted: A[0] D[0] H[0]│  │ Mounted: A[0] D[0] H[0]│            │
│  │ Siege:   A[0] D[0] H[0]│  │ Siege:   A[0] D[0] H[0]│            │
│  └─────────────────────────│  └─────────────────────────│            │
│                            │                                         │
│  ┌── Troops ────────────┐  │  ┌── Troops ────────────┐              │
│  │ Tier  G    R    M   S│  │  │ Tier  G    R    M   S│              │
│  │ T1  1000 1000 1000 1000│ │  │ T1  1000 1000 1000 1000│           │
│  │ T2  1000 1000 1000 1000│ │  │ T2  1000 1000 1000 1000│           │
│  │ ...                  │  │  │ ...                  │              │
│  │ T14 1000 1000 1000 1000│ │  │ T14 1000 1000 1000 1000│           │
│  └─────────────────────────│  └─────────────────────────│            │
│                            │                                         │
├────────────────────────────┴─────────────────────────────────────────┤
│                                                                      │
│          [ ▶ Step ]    [ ▶▶ Round ]    [ ▶▶▶ Full Battle ]          │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                         BATTLE LOG                                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Round 1, Phase: Siege                                        │   │
│  │  ATT Siege T14 (1000) → DEF Siege T14 (1000): 750 killed   │   │
│  │  DEF Siege T14 (250)  → ATT Siege T14 (1000): 188 killed   │   │
│  │ Round 1, Phase: Ranged                                       │   │
│  │  ...                                                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Notes

- Buffs are per troop type, not per tier — a +100% Ground Attack buff applies to all Ground tiers equally
- Users manually sum their in-game buffs into a single number per stat — the simulator doesn't need to know the source breakdown
- Negative values are allowed for debuffs (e.g. enemy general reducing your defense)
- The troop count grid is large (14×4 = 56 inputs per side) — UX helpers below

---

## UX: Collapsible Tier Groups & Bulk Actions

### Tier Groups (collapsible)

Tiers are grouped into collapsible sections. **Only the top group is expanded by default** — most players use high tiers.

| Group     | Tiers   | Default State |
|-----------|---------|---------------|
| High      | T10–T14 | **Expanded**  |
| Mid       | T5–T9   | Collapsed     |
| Low       | T1–T4   | Collapsed     |

```
┌─────────────────── ATTACKER TROOPS ──────────────────────┐
│                                                           │
│  [Set all: 0] [Set all: 1000] [Set all: _____ Apply]    │
│                                                           │
│  ▼ High Tiers (T10–T14)                                  │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Tier   Ground    Ranged    Mounted    Siege       │   │
│  │ T14   [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ] │   │
│  │ T13   [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ] │   │
│  │ T12   [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ] │   │
│  │ T11   [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ] │   │
│  │ T10   [  1000 ]  [  1000 ]  [  1000 ]  [  1000 ] │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ▶ Mid Tiers (T5–T9)  ······ 5 tiers, click to expand   │
│                                                           │
│  ▶ Low Tiers (T1–T4)  ······ 4 tiers, click to expand   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Bulk Action Buttons

Placed above the troop grid:

| Button               | Action                                      |
|----------------------|---------------------------------------------|
| `Set all: 0`         | Sets every troop count to 0                 |
| `Set all: 1000`      | Sets every troop count to 1000 (reset)      |
| `Set all: [___] Apply` | Custom value — user types a number, clicks Apply |

These affect **all tiers** (including collapsed ones), not just visible ones.

### Tier ordering within groups

**Highest tier first** (T14 at top) — the tiers you care most about are always visible first when a group is expanded.
