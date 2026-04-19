var App = (function () {
    'use strict';

    let battleResult;
    let previousResult = null;
    let isSimulated = false;
    let isBattleView = false;

    // Display armies — separate copies that get events applied incrementally
    let displayAtt, displayDef;
    let attBuffs, defBuffs;

    function init() {
        ArmyConfig.init('attacker-panel');
        ArmyConfig.init('defender-panel');
        Battlefield.init();
        BattleLog.init();

        const slider = document.getElementById('speed-slider');
        const label = document.getElementById('speed-label');
        slider.addEventListener('input', () => {
            label.textContent = `${slider.value}ms`;
        });

        document.getElementById('btn-step').addEventListener('click', onStep);
        document.getElementById('btn-round').addEventListener('click', onRound);
        document.getElementById('btn-full').addEventListener('click', onFull);
        document.getElementById('btn-reset').addEventListener('click', onReset);
        document.getElementById('btn-battle-view').addEventListener('click', toggleBattleView);
    }

    // --- Battle View Toggle ---

    function toggleBattleView() {
        if (!isBattleView) {
            // Entering battle view — need a simulation first
            if (!ensureSimulated()) return;
            enterBattleView();
        } else {
            exitBattleView();
        }
    }

    function enterBattleView() {
        isBattleView = true;
        const btn = document.getElementById('btn-battle-view');
        const bar = document.querySelector('.controls-bar');
        bar.insertBefore(btn, bar.firstChild);
        document.body.classList.add('battle-view-active');
        btn.textContent = '\u2190 Setup';
    }

    function exitBattleView() {
        isBattleView = false;
        const btn = document.getElementById('btn-battle-view');
        document.querySelector('.battle-view-btn-row').appendChild(btn);
        document.body.classList.remove('battle-view-active');
        btn.innerHTML = '&#9876; Battle View';
    }

    function ensureSimulated() {
        if (isSimulated) return true;
        runSimulation();
        return isSimulated;
    }

    function runSimulation() {
        const attCounts = ArmyConfig.getTroopCounts('attacker-panel');
        const defCounts = ArmyConfig.getTroopCounts('defender-panel');
        attBuffs = ArmyConfig.getBuffs('attacker-panel');
        defBuffs = ArmyConfig.getBuffs('defender-panel');

        // Simulate on throwaway copies
        const simAtt = BattleEngine.createArmy(attCounts, attBuffs);
        const simDef = BattleEngine.createArmy(defCounts, defBuffs);

        const attTotal = simAtt.layers.reduce((s, l) => s + l.count, 0);
        const defTotal = simDef.layers.reduce((s, l) => s + l.count, 0);
        if (attTotal === 0 || defTotal === 0) {
            isSimulated = false;
            return;
        }

        const maxRounds = parseInt(document.getElementById('max-rounds').value, 10) || 100;
        battleResult = BattleEngine.simulate(simAtt, simDef, { maxRounds: maxRounds });

        // Create fresh display armies (not mutated by simulation)
        displayAtt = BattleEngine.createArmy(attCounts, attBuffs);
        displayDef = BattleEngine.createArmy(defCounts, defBuffs);

        Battlefield.render(displayAtt, displayDef, attBuffs, defBuffs);
        Battlefield.updateSummary(displayAtt, displayDef);
        BattleLog.clear();

        Playback.load(battleResult.events, onEvent, onBattleComplete);
        isSimulated = true;
    }

    function applyEvent(evt) {
        if (evt.eventType === 'counter') {
            // Counter hits the ACTING side's army (the attacker who triggered it)
            const counterArmy = evt.side === 'ATT' ? displayAtt : displayDef;
            for (let i = 0; i < counterArmy.layers.length; i++) {
                const l = counterArmy.layers[i];
                if (l.type === evt.targetType && l.tier === evt.targetTier) {
                    l.count = Math.max(0, l.count - evt.kills);
                    break;
                }
            }
            return;
        }
        // Determine which army was hit (the TARGET army, opposite of the acting side)
        const targetArmy = evt.side === 'ATT' ? displayDef : displayAtt;
        for (let i = 0; i < targetArmy.layers.length; i++) {
            const l = targetArmy.layers[i];
            if (l.type === evt.targetType && l.tier === evt.targetTier) {
                l.count = Math.max(0, l.count - evt.kills);
                break;
            }
        }
    }

    function onEvent(evt, index, total) {
        if (evt.eventType === 'attack' || evt.eventType === 'counter') {
            applyEvent(evt);
            Battlefield.render(displayAtt, displayDef, attBuffs, defBuffs);
            if (evt.eventType === 'attack') {
                Battlefield.highlightAttack(evt);
            } else if (evt.eventType === 'counter') {
                Battlefield.highlightCounter(evt);
            }
        } else {
            Battlefield.clearHighlights();
        }
        Battlefield.setPhase(evt.phase, evt.positions, evt.round);
        Battlefield.updateSummary(displayAtt, displayDef);
        BattleLog.addEntry(evt, index, total);
    }

    function updateFullBtn() {
        const btn = document.getElementById('btn-full');
        if (Playback.isAnimating()) {
            btn.textContent = '\u23F8 Pause';
            btn.classList.add('btn-active');
        } else {
            btn.innerHTML = '&#9654;&#9654;&#9654; Full Battle';
            btn.classList.remove('btn-active');
        }
    }

    function onBattleComplete() {
        Battlefield.showEndState(battleResult);
        Battlefield.clearHighlights();
        updateComparison();
        updateFullBtn();
    }

    function onStep() {
        if (!ensureSimulated()) return;
        Playback.step();
        updateFullBtn();
    }

    function onRound() {
        if (!ensureSimulated()) return;
        Playback.playRound();
        updateFullBtn();
    }

    function onFull() {
        if (!ensureSimulated()) return;
        Playback.playFull();
        updateFullBtn();
    }

    function onReset() {
        Playback.reset();

        if (isSimulated && battleResult) {
            previousResult = {
                winner: battleResult.winner,
                rounds: battleResult.rounds,
                attSurviving: battleResult.attacker._total,
                defSurviving: battleResult.defender._total,
                attStart: battleResult.attacker._totalStart,
                defStart: battleResult.defender._totalStart
            };
        }

        isSimulated = false;
        battleResult = null;
        displayAtt = null;
        displayDef = null;

        Battlefield.reset();

        // Re-simulate to restore troops at starting positions
        runSimulation();

        Battlefield.hideSummary();
        Battlefield.resetPhase();
        updateFullBtn();
    }

    // --- Result Comparison ---

    function updateComparison() {
        const panel = document.getElementById('comparison-panel');
        if (!previousResult || !battleResult) {
            panel.classList.remove('visible');
            return;
        }

        const curr = {
            winner: battleResult.winner,
            rounds: battleResult.rounds,
            attSurviving: battleResult.attacker._total,
            defSurviving: battleResult.defender._total
        };

        const attDelta = curr.attSurviving - previousResult.attSurviving;
        const defDelta = curr.defSurviving - previousResult.defSurviving;
        const roundDelta = curr.rounds - previousResult.rounds;

        panel.classList.add('visible');
        panel.innerHTML = `
            <h3>vs Previous Run</h3>
            ${compRow('ATT surviving', previousResult.attSurviving, curr.attSurviving, attDelta)}
            ${compRow('DEF surviving', previousResult.defSurviving, curr.defSurviving, defDelta)}
            ${compRow('Rounds', previousResult.rounds, curr.rounds, roundDelta)}
            <div class="comp-row"><span>Winner</span><span>${previousResult.winner} &rarr; ${curr.winner}</span></div>
        `;
    }

    function compRow(label, prev, curr, delta) {
        const cls = delta > 0 ? 'positive' : delta < 0 ? 'negative' : '';
        const sign = delta > 0 ? '+' : '';
        return `
            <div class="comp-row">
                <span>${label}</span>
                <span>${formatNum(prev)} &rarr; ${formatNum(curr)} <span class="comp-delta ${cls}">(${sign}${formatNum(delta)})</span></span>
            </div>
        `;
    }

    function formatNum(n) {
        return Math.round(n).toLocaleString();
    }

    document.addEventListener('DOMContentLoaded', init);

    return { init: init };
})();
