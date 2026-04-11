var App = (function () {
    'use strict';

    var battleResult;
    var previousResult = null;
    var isSimulated = false;

    // Display armies — separate copies that get events applied incrementally
    var displayAtt, displayDef;
    var attBuffs, defBuffs;

    function init() {
        ArmyConfig.init('attacker-panel');
        ArmyConfig.init('defender-panel');
        Battlefield.init();
        BattleLog.init();

        document.getElementById('mirror-btn').addEventListener('click', function () {
            ArmyConfig.mirror('attacker-panel', 'defender-panel');
        });

        var slider = document.getElementById('speed-slider');
        var label = document.getElementById('speed-label');
        slider.addEventListener('input', function () {
            label.textContent = slider.value + 'ms';
        });

        document.getElementById('btn-step').addEventListener('click', onStep);
        document.getElementById('btn-round').addEventListener('click', onRound);
        document.getElementById('btn-full').addEventListener('click', onFull);
        document.getElementById('btn-reset').addEventListener('click', onReset);
    }

    function ensureSimulated() {
        if (isSimulated) return true;
        runSimulation();
        return isSimulated;
    }

    function runSimulation() {
        var attCounts = ArmyConfig.getTroopCounts('attacker-panel');
        var defCounts = ArmyConfig.getTroopCounts('defender-panel');
        attBuffs = ArmyConfig.getBuffs('attacker-panel');
        defBuffs = ArmyConfig.getBuffs('defender-panel');

        // Simulate on throwaway copies
        var simAtt = BattleEngine.createArmy(attCounts, attBuffs);
        var simDef = BattleEngine.createArmy(defCounts, defBuffs);

        var attTotal = simAtt.layers.reduce(function (s, l) { return s + l.count; }, 0);
        var defTotal = simDef.layers.reduce(function (s, l) { return s + l.count; }, 0);
        if (attTotal === 0 || defTotal === 0) {
            isSimulated = false;
            return;
        }

        battleResult = BattleEngine.simulate(simAtt, simDef);

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
        // Determine which army was hit (the TARGET army, opposite of the acting side)
        var targetArmy = evt.side === 'ATTACKER' ? displayDef : displayAtt;
        for (var i = 0; i < targetArmy.layers.length; i++) {
            var l = targetArmy.layers[i];
            if (l.type === evt.targetType && l.tier === evt.targetTier) {
                l.count = Math.max(0, l.count - evt.kills);
                break;
            }
        }
    }

    function onEvent(evt, index, total) {
        applyEvent(evt);
        Battlefield.render(displayAtt, displayDef, attBuffs, defBuffs);
        Battlefield.highlightAttack(evt);
        Battlefield.setPhase(evt.phase);
        Battlefield.updateSummary(displayAtt, displayDef);
        BattleLog.addEntry(evt, index, total);
    }

    function onBattleComplete() {
        Battlefield.showEndState(battleResult);
        Battlefield.clearHighlights();
        updateComparison();
    }

    function onStep() {
        if (!ensureSimulated()) return;
        Playback.step();
    }

    function onRound() {
        if (!ensureSimulated()) return;
        Playback.playRound();
    }

    function onFull() {
        if (!ensureSimulated()) return;
        Playback.playFull();
    }

    function onReset() {
        Playback.reset();
        Battlefield.reset();
        Battlefield.hideSummary();
        Battlefield.resetPhase();
        BattleLog.clear();

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
    }

    // --- Result Comparison ---

    function updateComparison() {
        var panel = document.getElementById('comparison-panel');
        if (!previousResult || !battleResult) {
            panel.classList.remove('visible');
            return;
        }

        var curr = {
            winner: battleResult.winner,
            rounds: battleResult.rounds,
            attSurviving: battleResult.attacker._total,
            defSurviving: battleResult.defender._total
        };

        var attDelta = curr.attSurviving - previousResult.attSurviving;
        var defDelta = curr.defSurviving - previousResult.defSurviving;
        var roundDelta = curr.rounds - previousResult.rounds;

        panel.classList.add('visible');
        panel.innerHTML = '<h3>vs Previous Run</h3>' +
            compRow('ATT surviving', previousResult.attSurviving, curr.attSurviving, attDelta) +
            compRow('DEF surviving', previousResult.defSurviving, curr.defSurviving, defDelta) +
            compRow('Rounds', previousResult.rounds, curr.rounds, roundDelta) +
            '<div class="comp-row"><span>Winner</span><span>' +
            previousResult.winner + ' &rarr; ' + curr.winner + '</span></div>';
    }

    function compRow(label, prev, curr, delta) {
        var cls = delta > 0 ? 'positive' : delta < 0 ? 'negative' : '';
        var sign = delta > 0 ? '+' : '';
        return '<div class="comp-row"><span>' + label + '</span>' +
            '<span>' + formatNum(prev) + ' &rarr; ' + formatNum(curr) +
            ' <span class="comp-delta ' + cls + '">(' + sign + formatNum(delta) + ')</span></span></div>';
    }

    function formatNum(n) {
        return n.toLocaleString();
    }

    document.addEventListener('DOMContentLoaded', init);

    return { init: init };
})();
