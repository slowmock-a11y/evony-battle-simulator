# Battle Simulator — Battlefield Visual Specification

A real-time visual representation of the battlefield that updates as the simulation progresses through steps and rounds.

---

## Battlefield Layout

Two armies face each other, troops arranged by range (front line = short range, back line = long range).

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          BATTLEFIELD                                     │
│                                                                          │
│   ATTACKER                                              DEFENDER         │
│                                                                          │
│   ┌─────────┐                                          ┌─────────┐      │
│   │ SIEGE   │  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  range 1400+    │ SIEGE   │      │
│   │ T14:1000│                                          │ T14:1000│      │
│   │ T13: 500│                                          │ T12: 800│      │
│   └─────────┘                                          └─────────┘      │
│                                                                          │
│   ┌─────────┐                                          ┌─────────┐      │
│   │ RANGED  │  ▒▒▒▒▒▒▒▒▒▒▒▒▒  range 500               │ RANGED  │      │
│   │ T14:2000│                                          │ T14:1500│      │
│   │ T12:1000│                                          │ T11:2000│      │
│   └─────────┘                                          └─────────┘      │
│                                                                          │
│   ┌─────────┐                                          ┌─────────┐      │
│   │ MOUNTED │  ▒▒▒  range 50                            │ MOUNTED │      │
│   │ T14:5000│                                          │ T14:3000│      │
│   │ T13:3000│                                          │ T13:4000│      │
│   └─────────┘                                          └─────────┘      │
│                                                                          │
│   ┌─────────┐                                          ┌─────────┐      │
│   │ GROUND  │  ▒  range 50                              │ GROUND  │      │
│   │ T14:8000│                                          │ T14:6000│      │
│   │ T12:5000│                                          │ T12:5000│      │
│   └─────────┘                                          └─────────┘      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Arrangement top-to-bottom = back-to-front:**
- Siege at top (back line, longest range — fires first)
- Ranged below (mid line)
- Mounted below (front line)
- Ground at bottom (front line — fires last)

This mirrors the phase order: top fires first, bottom fires last.

---

## Troop Blocks

Each troop type block shows its layers (tiers with troops > 0), stacked highest tier first.

```
┌─────────────┐
│  MOUNTED    │  ← troop type label + color
│  T14: 5,000 │  ← tier : current count
│  T13: 3,000 │
│  T10: 1,200 │
│  ───────────│
│  Total: 9,200│ ← sum
└─────────────┘
```

- **Color coding per type:**
  - Ground: brown/earth
  - Ranged: green
  - Mounted: blue
  - Siege: red/orange

- **Only show tiers with count > 0** (no empty rows)
- **Bar or fill indicator** showing remaining troops vs starting count

```
┌──────────────────┐
│  MOUNTED         │
│  T14: ████░ 3,000│  ← 60% remaining (started at 5,000)
│  T13: ██░░░ 1,200│  ← 40% remaining
│  ─────────────── │
│  Total: 4,200    │
└──────────────────┘
```

---

## Active Phase Highlight

When stepping through the battle, the currently active phase is highlighted and an attack arrow shows the action.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     Round 2, Phase: RANGED                               │
│                                                                          │
│   ATTACKER                                              DEFENDER         │
│                                                                          │
│   ┌─────────┐                                          ┌─────────┐      │
│   │ SIEGE   │                                          │ SIEGE   │      │
│   │ T14: 812│                                          │ T14: 650│      │
│   └─────────┘                                          └─────────┘      │
│                                                                          │
│   ┌═════════╗      ══════ ATTACKING ══════▶            ┌─────────┐      │
│   ║ RANGED  ║─────── 48,000 dmg ──────────────────────▶│ MOUNTED │      │
│   ║ T14:2000║         1,948 killed                     │ T14:▼058│      │
│   ║ T12:1000║                                          │ T13:4000│      │
│   ╚═════════╝                                          └─────────┘      │
│                                                                          │
│   ┌─────────┐                                          ┌─────────┐      │
│   │ MOUNTED │                                          │ MOUNTED │      │
│   │ T14:4200│                                          │  (above)│      │
│   └─────────┘                                          └─────────┘      │
│                                                                          │
│   ┌─────────┐                                          ┌─────────┐      │
│   │ GROUND  │                                          │ GROUND  │      │
│   │ T14:7100│                                          │ T14:5400│      │
│   └─────────┘                                          └─────────┘      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

Visual cues for the active step:
- **Bold/highlighted border** on the attacking troop block
- **Arrow** from attacker to target showing damage and kills
- **Flash/color change** on the target block when taking damage
- **Header** shows current Round + Phase

---

## Step-by-Step Flow Visualization

Shows the full sequence of a round:

```
┌─────────────────────────────────────────────────────────────────┐
│                      ROUND PHASES                                │
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │ 1.SIEGE  │──▶│ 2.RANGED │──▶│3.MOUNTED │──▶│ 4.GROUND │    │
│  │          │   │          │   │          │   │          │    │
│  │ ATT→DEF  │   │ ATT→DEF  │   │ ATT→DEF  │   │ ATT→DEF  │    │
│  │ DEF→ATT  │   │ DEF→ATT  │   │ DEF→ATT  │   │ DEF→ATT  │    │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘    │
│       ●              ○              ○              ○             │
│    current                                                      │
│                                                                  │
│  Within each phase:                                              │
│  ┌─────────────────────────────────────┐                        │
│  │  1a. ATT highest tier → DEF target  │                        │
│  │  1b. ATT next tier   → DEF target   │                        │
│  │  1c. ...all ATT layers of this type │                        │
│  │  ─────────────────────────────────  │                        │
│  │  2a. DEF highest tier → ATT target  │  ← survivors only     │
│  │  2b. DEF next tier   → ATT target   │                        │
│  │  2c. ...all DEF layers of this type │                        │
│  └─────────────────────────────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary Bar (always visible)

A compact summary bar above or below the battlefield showing army totals:

```
┌──────────────────────────────────────────────────────────────────┐
│  ATTACKER                          │          DEFENDER           │
│  Ground:  13,000 → 7,100  (-45%)  │  Ground:   11,000 → 5,400  │
│  Ranged:   3,000 → 2,800  ( -7%)  │  Ranged:    3,500 → 1,200  │
│  Mounted:  8,000 → 4,200  (-48%)  │  Mounted:   7,000 → 3,058  │
│  Siege:    1,500 →   812  (-46%)  │  Siege:     1,000 →   650  │
│  ─────────────────────────────────┼───────────────────────────  │
│  TOTAL:   25,500 → 14,912 (-42%)  │  TOTAL:    22,500 → 10,308 │
│                                    │                             │
│  ████████████████░░░░░░░░  58%    │  ░░░░░░░░████████████  46%  │
│                                    │                             │
│  Round: 2 / Phase: Ranged         │  Step: 14 of ~112           │
└──────────────────────────────────────────────────────────────────┘
```

- **Start → Current** counts per type with % loss
- **Health bar** showing total army remaining as percentage
- **Progress indicator**: current round, phase, step count

---

## Battle End State

When one side is eliminated:

```
┌──────────────────────────────────────────────────────────────────┐
│                      ★ ATTACKER WINS ★                           │
│                     Battle ended: Round 6                         │
│                                                                   │
│   ATTACKER (surviving)              DEFENDER (eliminated)         │
│                                                                   │
│   ┌─────────┐                      ┌ ─ ─ ─ ─ ┐                  │
│   │ RANGED  │                        SIEGE                       │
│   │ T14:1200│                      │ T14:   0 │                  │
│   └─────────┘                      └ ─ ─ ─ ─ ┘                  │
│                                                                   │
│   ┌─────────┐                      ┌ ─ ─ ─ ─ ┐                  │
│   │ MOUNTED │                        RANGED                      │
│   │ T14: 890│                      │ T14:   0 │                  │
│   └─────────┘                      └ ─ ─ ─ ─ ┘                  │
│                                                                   │
│   ┌─────────┐                      ┌ ─ ─ ─ ─ ┐                  │
│   │ GROUND  │                        MOUNTED                     │
│   │ T14:2100│                      │ T14:   0 │                  │
│   │ T12: 450│                      └ ─ ─ ─ ─ ┘                  │
│   └─────────┘                                                    │
│                                                                   │
│  ────────────────────────────────────────────────────────────    │
│  Total losses:  ATT 15,360 (60%)  │  DEF 22,500 (100%)          │
│  Rounds: 6  │  Steps: 87                                         │
│                                                                   │
│  [ Reset ]  [ Replay Step-by-Step ]                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Controls Integration

The battlefield visual sits between the input panels and the battle log:

```
┌──────────────────────────────────────────┐
│  ATTACKER inputs  │  DEFENDER inputs     │  ← troop counts + buffs
├──────────────────────────────────────────┤
│  [ ▶ Step ] [ ▶▶ Round ] [ ▶▶▶ Full ]  │  ← controls
│  [ ↺ Reset ]                             │
├──────────────────────────────────────────┤
│  ┌─ Round Phase Indicator ────────────┐  │  ← phase dots
│  │  ● Siege  ○ Ranged  ○ Mtd  ○ Gnd  │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│                                          │
│          BATTLEFIELD VISUAL              │  ← troop blocks + arrows
│          (as shown above)                │
│                                          │
├──────────────────────────────────────────┤
│          SUMMARY BAR                     │  ← totals + health bars
├──────────────────────────────────────────┤
│          BATTLE LOG                      │  ← text event log
└──────────────────────────────────────────┘
```
