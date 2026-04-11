var Battlefield = (function () {
    'use strict';

    var container;
    var tooltipEl;
    var currentAttackerArmy, currentDefenderArmy;
    var startAttacker, startDefender;
    var attackerBuffs, defenderBuffs;

    function init() {
        container = document.getElementById('battlefield');
        tooltipEl = document.createElement('div');
        tooltipEl.className = 'tooltip';
        tooltipEl.style.display = 'none';
        document.body.appendChild(tooltipEl);
    }

    function render(attArmy, defArmy, attBuffs, defBuffs) {
        currentAttackerArmy = attArmy;
        currentDefenderArmy = defArmy;
        attackerBuffs = attBuffs;
        defenderBuffs = defBuffs;

        if (!startAttacker) {
            startAttacker = snapshotArmy(attArmy);
            startDefender = snapshotArmy(defArmy);
        }

        container.innerHTML = '';

        var attSide = document.createElement('div');
        attSide.className = 'bf-side attacker';
        var defSide = document.createElement('div');
        defSide.className = 'bf-side defender';

        TroopData.PHASE_ORDER.forEach(function (type) {
            var attBlock = buildBlock(attArmy, type, startAttacker, attBuffs, 'ATT');
            var defBlock = buildBlock(defArmy, type, startDefender, defBuffs, 'DEF');
            if (attBlock) attSide.appendChild(attBlock);
            if (defBlock) defSide.appendChild(defBlock);
        });

        container.appendChild(attSide);
        container.appendChild(defSide);
    }

    function buildBlock(army, type, startSnap, buffs, side) {
        var layers = army.layers.filter(function (l) { return l.type === type; });
        var startLayers = startSnap.filter(function (l) { return l.type === type; });
        if (startLayers.length === 0) return null;

        var info = TroopData.TYPES[type];
        var total = 0, totalStart = 0;
        layers.forEach(function (l) { total += l.count; });
        startLayers.forEach(function (l) { totalStart += l.startCount; });

        var block = document.createElement('div');
        block.className = 'troop-block ' + info.borderClass;
        block.dataset.type = type;
        block.dataset.side = side;

        var eliminated = total === 0;
        if (eliminated) block.classList.add('eliminated');

        var typeLabel = document.createElement('div');
        typeLabel.className = 'block-type ' + info.colorClass;
        typeLabel.textContent = info.name;
        block.appendChild(typeLabel);

        // Show layers with startCount > 0
        startLayers.forEach(function (sl) {
            var current = 0;
            for (var i = 0; i < layers.length; i++) {
                if (layers[i].tier === sl.tier) { current = layers[i].count; break; }
            }
            var pct = sl.startCount > 0 ? (current / sl.startCount * 100) : 0;

            var row = document.createElement('div');
            row.className = 'block-layer';
            row.innerHTML =
                '<span>T' + sl.tier + ':</span>' +
                '<div class="fill-bar"><div class="fill" style="width:' + pct + '%;background:' + info.color + '"></div></div>' +
                '<span>' + formatNum(current) + '</span>';
            block.appendChild(row);
        });

        var totalRow = document.createElement('div');
        totalRow.className = 'block-total';
        totalRow.textContent = 'Total: ' + formatNum(total);
        block.appendChild(totalRow);

        // Tooltip
        block.addEventListener('mouseenter', function (e) { showTooltip(e, type, buffs, side); });
        block.addEventListener('mousemove', function (e) { moveTooltip(e); });
        block.addEventListener('mouseleave', hideTooltip);

        return block;
    }

    function showTooltip(e, type, buffs, side) {
        var info = TroopData.TYPES[type];
        var b = buffs[type] || { atk: 0, def: 0, hp: 0 };
        var chain = TroopData.TARGET_PRIORITY[type].map(function (t) {
            return TroopData.TYPES[t].name;
        }).join(' > ');

        var html = '<div class="tt-title ' + info.colorClass + '">' + info.name + ' (' + side + ')</div>';
        html += '<div class="tt-row">Targets: ' + chain + '</div>';

        // Show effective stats for highest available tier
        TroopData.TIERS.slice().reverse().some(function (tier) {
            var stats = TroopData.getStats(type, tier);
            var effAtk = stats.atk * (1 + b.atk / 100);
            var effDef = stats.def * (1 + b.def / 100);
            var effHp = stats.hp * (1 + b.hp / 100);
            html += '<div class="tt-row">T' + tier + ' ATK: ' + formatNum(stats.atk);
            if (b.atk) html += ' <span class="tt-buff">(+' + b.atk + '% = ' + formatNum(Math.round(effAtk)) + ')</span>';
            html += '</div>';
            html += '<div class="tt-row">T' + tier + ' DEF: ' + formatNum(stats.def);
            if (b.def) html += ' <span class="tt-buff">(+' + b.def + '% = ' + formatNum(Math.round(effDef)) + ')</span>';
            html += '</div>';
            html += '<div class="tt-row">T' + tier + ' HP: ' + formatNum(stats.hp);
            if (b.hp) html += ' <span class="tt-buff">(+' + b.hp + '% = ' + formatNum(Math.round(effHp)) + ')</span>';
            html += '</div>';
            return true; // only show one tier
        });

        tooltipEl.innerHTML = html;
        tooltipEl.style.display = 'block';
        moveTooltip(e);
    }

    function moveTooltip(e) {
        tooltipEl.style.left = (e.pageX + 15) + 'px';
        tooltipEl.style.top = (e.pageY + 10) + 'px';
    }

    function hideTooltip() {
        tooltipEl.style.display = 'none';
    }

    function highlightAttack(event) {
        clearHighlights();

        var sourceBlock = findBlock(event.side === 'ATTACKER' ? 'ATT' : 'DEF', event.sourceType);
        var targetSide = event.side === 'ATTACKER' ? 'DEF' : 'ATT';
        var targetBlock = findBlock(targetSide, event.targetType);

        if (sourceBlock) sourceBlock.classList.add('highlighted');

        // Show attack info between the blocks
        var arrow = container.querySelector('.attack-arrow');
        if (!arrow) {
            arrow = document.createElement('div');
            arrow.className = 'attack-arrow';
            container.appendChild(arrow);
        }

        var sideLabel = event.side === 'ATTACKER' ? 'ATT' : 'DEF';
        arrow.innerHTML = sideLabel + ' ' + TroopData.TYPES[event.sourceType].name + ' T' + event.sourceTier +
            ' → ' + TroopData.TYPES[event.targetType].name + ' T' + event.targetTier +
            '<br>' + formatNum(event.damage) + ' dmg, ' + formatNum(event.kills) + ' killed';
        arrow.style.display = 'block';

        // Position arrow vertically centered between source and target
        if (sourceBlock && targetBlock) {
            var srcRect = sourceBlock.getBoundingClientRect();
            var tgtRect = targetBlock.getBoundingClientRect();
            var contRect = container.getBoundingClientRect();
            var midY = ((srcRect.top + srcRect.bottom) / 2 + (tgtRect.top + tgtRect.bottom) / 2) / 2 - contRect.top;
            arrow.style.top = midY + 'px';
        }
    }

    function clearHighlights() {
        container.querySelectorAll('.highlighted').forEach(function (el) {
            el.classList.remove('highlighted');
        });
        var arrow = container.querySelector('.attack-arrow');
        if (arrow) arrow.style.display = 'none';
    }

    function findBlock(side, type) {
        return container.querySelector('.troop-block[data-side="' + side + '"][data-type="' + type + '"]');
    }

    function showEndState(result) {
        clearHighlights();
        var banner = document.createElement('div');
        banner.className = 'winner-banner';
        if (result.winner === 'ATTACKER') banner.textContent = '★ ATTACKER WINS ★';
        else if (result.winner === 'DEFENDER') banner.textContent = '★ DEFENDER WINS ★';
        else banner.textContent = '— DRAW —';
        banner.textContent += ' (Round ' + result.rounds + ')';
        container.insertBefore(banner, container.firstChild);
    }

    function reset() {
        container.innerHTML = '';
        startAttacker = null;
        startDefender = null;
        currentAttackerArmy = null;
        currentDefenderArmy = null;
    }

    // --- Summary Bar ---

    function updateSummary(attArmy, defArmy) {
        var bar = document.getElementById('summary-bar');
        bar.classList.add('visible');

        var attTotal = 0, attStart = 0, defTotal = 0, defStart = 0;
        var attByType = {}, defByType = {};

        TroopData.PHASE_ORDER.forEach(function (type) {
            attByType[type] = { current: 0, start: 0 };
            defByType[type] = { current: 0, start: 0 };
        });

        attArmy.layers.forEach(function (l) {
            attByType[l.type].current += l.count;
            attByType[l.type].start += l.startCount;
            attTotal += l.count;
            attStart += l.startCount;
        });
        defArmy.layers.forEach(function (l) {
            defByType[l.type].current += l.count;
            defByType[l.type].start += l.startCount;
            defTotal += l.count;
            defStart += l.startCount;
        });

        bar.innerHTML = '<div class="summary-content">' +
            buildSummaryHtml('Attacker', attByType, attTotal, attStart) +
            buildSummaryHtml('Defender', defByType, defTotal, defStart) +
            '</div>';
    }

    function buildSummaryHtml(title, byType, total, start) {
        var pct = start > 0 ? Math.round(total / start * 100) : 0;
        var lostPct = start > 0 ? Math.round((1 - total / start) * 100) : 0;
        var html = '<div class="summary-side"><h4>' + title + '</h4>';
        TroopData.PHASE_ORDER.forEach(function (type) {
            var info = TroopData.TYPES[type];
            var d = byType[type];
            if (d.start === 0) return;
            var loss = d.start > 0 ? Math.round((1 - d.current / d.start) * 100) : 0;
            html += '<div class="summary-row"><span class="' + info.colorClass + '">' + info.name + '</span>' +
                '<span>' + formatNum(d.start) + ' → ' + formatNum(d.current) +
                ' <span class="loss">(-' + loss + '%)</span></span></div>';
        });
        html += '<div class="summary-row" style="font-weight:700"><span>TOTAL</span>' +
            '<span>' + formatNum(start) + ' → ' + formatNum(total) +
            ' <span class="loss">(-' + lostPct + '%)</span></span></div>';
        html += '<div class="health-bar"><div class="fill" style="width:' + pct + '%"></div></div>';
        html += '</div>';
        return html;
    }

    function hideSummary() {
        document.getElementById('summary-bar').classList.remove('visible');
    }

    // --- Phase Indicator ---

    function setPhase(phase) {
        var dots = document.querySelectorAll('.phase-dot');
        var found = false;
        dots.forEach(function (dot) {
            if (dot.dataset.phase === phase) {
                dot.className = 'phase-dot active';
                found = true;
            } else if (!found) {
                dot.className = 'phase-dot done';
            } else {
                dot.className = 'phase-dot';
            }
        });
    }

    function resetPhase() {
        document.querySelectorAll('.phase-dot').forEach(function (dot) {
            dot.className = 'phase-dot';
        });
    }

    // --- Helpers ---

    function snapshotArmy(army) {
        return army.layers.map(function (l) {
            return { type: l.type, tier: l.tier, count: l.count, startCount: l.startCount };
        });
    }

    function formatNum(n) {
        return n.toLocaleString();
    }

    return {
        init: init,
        render: render,
        highlightAttack: highlightAttack,
        clearHighlights: clearHighlights,
        showEndState: showEndState,
        updateSummary: updateSummary,
        hideSummary: hideSummary,
        setPhase: setPhase,
        resetPhase: resetPhase,
        reset: reset
    };
})();
