var Battlefield = (function () {
    'use strict';

    var container;
    var tooltipEl;
    var svgOverlay, svgLine, svgLabelBg, svgLabel;
    var detailPanelEl;
    var currentAttackerArmy, currentDefenderArmy;
    var startAttacker, startDefender;
    var attackerBuffs, defenderBuffs;
    var currentPhaseIndex = -1; // -1 = pre-battle

    var BATTLEFIELD_LENGTH = 5200;

    // Y positions: top = back line (long range), bottom = front line
    var Y_POSITIONS = { SIEGE: 20, RANGED: 40, MOUNTED: 60, GROUND: 80 };

    var TYPE_LETTERS = { GROUND: 'G', RANGED: 'R', MOUNTED: 'M', SIEGE: 'S' };

    // Engine positions (0–5200), updated from events
    var currentPositions = null;

    function defaultPositions() {
        return {
            ATT: { SIEGE: 0, RANGED: 0, MOUNTED: 0, GROUND: 0 },
            DEF: { SIEGE: BATTLEFIELD_LENGTH, RANGED: BATTLEFIELD_LENGTH, MOUNTED: BATTLEFIELD_LENGTH, GROUND: BATTLEFIELD_LENGTH }
        };
    }

    function mapToScreen(engineX) {
        return 5 + (engineX / BATTLEFIELD_LENGTH) * 90;
    }

    function calcPosition(type, side) {
        var pos = currentPositions || defaultPositions();
        var sideKey = side === 'ATT' ? 'ATT' : 'DEF';
        return { x: mapToScreen(pos[sideKey][type]), y: Y_POSITIONS[type] };
    }

    function init() {
        container = document.getElementById('battlefield');

        // Tooltip
        tooltipEl = document.createElement('div');
        tooltipEl.className = 'tooltip';
        tooltipEl.style.display = 'none';
        document.body.appendChild(tooltipEl);

        // Center line
        var centerLine = document.createElement('div');
        centerLine.className = 'bf-center-line';
        container.appendChild(centerLine);

        // SVG overlay for attack arrows
        svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgOverlay.setAttribute('class', 'bf-svg-overlay');

        var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '8');
        marker.setAttribute('markerHeight', '6');
        marker.setAttribute('refX', '8');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 8 3, 0 6');
        polygon.setAttribute('fill', '#e94560');
        marker.appendChild(polygon);
        defs.appendChild(marker);
        svgOverlay.appendChild(defs);

        svgLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        svgLine.setAttribute('class', 'attack-line');
        svgLine.setAttribute('marker-end', 'url(#arrowhead)');
        svgLine.style.display = 'none';
        svgOverlay.appendChild(svgLine);

        svgLabelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        svgLabelBg.setAttribute('class', 'attack-label-bg');
        svgLabelBg.style.display = 'none';
        svgOverlay.appendChild(svgLabelBg);

        svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        svgLabel.setAttribute('class', 'attack-label');
        svgLabel.style.display = 'none';
        svgOverlay.appendChild(svgLabel);

        container.appendChild(svgOverlay);

        // Detail panel
        detailPanelEl = document.createElement('div');
        detailPanelEl.className = 'detail-panel';
        container.appendChild(detailPanelEl);

        // Dismiss detail panel on click outside
        document.addEventListener('click', function (e) {
            if (!detailPanelEl.contains(e.target) && !e.target.closest('.unit-marker')) {
                detailPanelEl.style.display = 'none';
            }
        });
    }

    function render(attArmy, defArmy, attBuffs, defBuffs) {
        currentAttackerArmy = attArmy;
        currentDefenderArmy = defArmy;
        attackerBuffs = attBuffs;
        defenderBuffs = defBuffs;

        if (!startAttacker) {
            startAttacker = snapshotArmy(attArmy);
            startDefender = snapshotArmy(defArmy);
            if (!currentPositions) {
                currentPositions = defaultPositions();
            }
        }

        // Hide detail panel on re-render
        detailPanelEl.style.display = 'none';

        // Remove old unit markers and indicators
        clearIndicators();
        var oldMarkers = container.querySelectorAll('.unit-marker');
        oldMarkers.forEach(function (m) { m.remove(); });

        // Place unit markers
        TroopData.PHASE_ORDER.forEach(function (type) {
            placeUnit(attArmy, type, startAttacker, attBuffs, 'ATT');
            placeUnit(defArmy, type, startDefender, defBuffs, 'DEF');
        });

        // Re-show indicators if user is still hovering
        if (hoveredUnit) {
            showIndicators(hoveredUnit.type, hoveredUnit.side);
        }
    }

    function placeUnit(army, type, startSnap, buffs, side) {
        var layers = army.layers.filter(function (l) { return l.type === type; });
        var startLayers = startSnap.filter(function (l) { return l.type === type; });
        if (startLayers.length === 0) return;

        var info = TroopData.TYPES[type];
        var total = 0, totalStart = 0;
        layers.forEach(function (l) { total += l.count; });
        startLayers.forEach(function (l) { totalStart += l.startCount; });

        var eliminated = total === 0;
        var pos = calcPosition(type, side);

        var marker = document.createElement('div');
        marker.className = 'unit-marker';
        marker.dataset.type = type;
        marker.dataset.side = side;
        if (eliminated) marker.classList.add('eliminated');

        // Position centered on the point
        marker.style.left = pos.x + '%';
        marker.style.top = pos.y + '%';
        marker.style.transform = 'translate(-50%, -50%)';

        // Icon circle
        var icon = document.createElement('div');
        icon.className = 'unit-icon icon-' + type.toLowerCase();
        icon.textContent = TYPE_LETTERS[type];
        marker.appendChild(icon);

        // Count
        var count = document.createElement('div');
        count.className = 'unit-count';
        count.textContent = formatNum(total);
        marker.appendChild(count);

        // Label
        var label = document.createElement('div');
        label.className = 'unit-label';
        label.textContent = info.name;
        marker.appendChild(label);

        // Click handler for detail panel
        marker.addEventListener('click', function (e) {
            e.stopPropagation();
            showDetailPanel(marker, layers, startLayers, type, buffs, side);
        });

        // Hover tooltip + indicators
        marker.addEventListener('mouseenter', function (e) {
            showTooltip(e, type, buffs, side);
            hoveredUnit = { type: type, side: side };
            showIndicators(type, side);
        });
        marker.addEventListener('mousemove', function (e) { moveTooltip(e); });
        marker.addEventListener('mouseleave', function () {
            hideTooltip();
            hoveredUnit = null;
            clearIndicators();
        });

        container.appendChild(marker);
    }

    // --- Detail Panel ---

    function showDetailPanel(markerEl, layers, startLayers, type, buffs, side) {
        var info = TroopData.TYPES[type];
        var sideLabel = side === 'ATT' ? 'Attacker' : 'Defender';

        var html = '<div class="detail-title ' + info.colorClass + '">' + sideLabel + ' ' + info.name + '</div>';
        html += '<div class="detail-tiers">';

        var tierData = [];
        startLayers.forEach(function (sl) {
            var current = 0;
            for (var i = 0; i < layers.length; i++) {
                if (layers[i].tier === sl.tier) { current = layers[i].count; break; }
            }
            tierData.push({ tier: sl.tier, current: current, start: sl.startCount });
        });
        tierData.sort(function (a, b) { return b.tier - a.tier; });

        tierData.forEach(function (td) {
            var lost = td.start - td.current;
            html += '<div class="detail-tier-row">' +
                    '<span>T' + td.tier + '</span>' +
                    '<span>' + formatNum(td.current) + ' / ' + formatNum(td.start);
            if (lost > 0) {
                html += ' <span class="tier-lost">(-' + formatNum(lost) + ')</span>';
            }
            html += '</span></div>';
        });

        html += '</div>';

        var total = 0, totalStart = 0;
        tierData.forEach(function (td) { total += td.current; totalStart += td.start; });
        html += '<div class="detail-total">Total: ' + formatNum(total) + ' / ' + formatNum(totalStart) + '</div>';

        var chain = TroopData.TARGET_PRIORITY[type].map(function (t) {
            return TroopData.TYPES[t].name;
        }).join(' > ');
        html += '<div class="detail-targets">Targets: ' + chain + '</div>';

        detailPanelEl.innerHTML = html;
        detailPanelEl.style.display = 'block';

        // Position near the marker
        var markerRect = markerEl.getBoundingClientRect();
        var contRect = container.getBoundingClientRect();
        var top = markerRect.top - contRect.top;

        if (side === 'ATT') {
            detailPanelEl.style.left = (markerRect.right - contRect.left + 8) + 'px';
            detailPanelEl.style.right = 'auto';
        } else {
            detailPanelEl.style.left = 'auto';
            detailPanelEl.style.right = (contRect.right - markerRect.left + 8) + 'px';
        }
        detailPanelEl.style.top = Math.max(0, top) + 'px';
    }

    // --- Tooltip ---

    function showTooltip(e, type, buffs, side) {
        var info = TroopData.TYPES[type];
        var b = buffs[type] || { atk: 0, def: 0, hp: 0 };
        var chain = TroopData.TARGET_PRIORITY[type].map(function (t) {
            return TroopData.TYPES[t].name;
        }).join(' > ');

        var html = '<div class="tt-title ' + info.colorClass + '">' + info.name + ' (' + side + ')</div>';
        html += '<div class="tt-row">Targets: ' + chain + '</div>';

        if (b.atk || b.def || b.hp) {
            html += '<div class="tt-row">Buffs: ';
            if (b.atk) html += 'ATK +' + b.atk + '% ';
            if (b.def) html += 'DEF +' + b.def + '% ';
            if (b.hp) html += 'HP +' + b.hp + '%';
            html += '</div>';
        }

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

    // --- Attack Highlight (SVG Arrow) ---

    function highlightAttack(event) {
        clearHighlights();

        var sourceSide = event.side === 'ATTACKER' ? 'ATT' : 'DEF';
        var targetSide = event.side === 'ATTACKER' ? 'DEF' : 'ATT';

        var sourceMarker = findMarker(sourceSide, event.sourceType);
        var targetMarker = findMarker(targetSide, event.targetType);

        if (sourceMarker) sourceMarker.classList.add('highlighted');
        if (targetMarker) targetMarker.classList.add('damaged');

        if (sourceMarker && targetMarker) {
            var contRect = container.getBoundingClientRect();
            var srcRect = sourceMarker.querySelector('.unit-icon').getBoundingClientRect();
            var tgtRect = targetMarker.querySelector('.unit-icon').getBoundingClientRect();

            var x1 = (srcRect.left + srcRect.right) / 2 - contRect.left;
            var y1 = (srcRect.top + srcRect.bottom) / 2 - contRect.top;
            var x2 = (tgtRect.left + tgtRect.right) / 2 - contRect.left;
            var y2 = (tgtRect.top + tgtRect.bottom) / 2 - contRect.top;

            svgLine.setAttribute('x1', x1);
            svgLine.setAttribute('y1', y1);
            svgLine.setAttribute('x2', x2);
            svgLine.setAttribute('y2', y2);
            svgLine.style.display = '';

            // Animate dash
            var len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
            svgLine.style.strokeDasharray = len;
            svgLine.style.strokeDashoffset = len;
            svgLine.getBoundingClientRect();
            svgLine.style.transition = 'stroke-dashoffset 0.25s ease-out';
            svgLine.style.strokeDashoffset = '0';

            // Label with background at midpoint
            var mx = (x1 + x2) / 2;
            var my = (y1 + y2) / 2;
            var labelText = formatNum(event.damage) + ' dmg, ' + formatNum(event.kills) + ' killed';
            svgLabel.textContent = labelText;
            svgLabel.setAttribute('x', mx);
            svgLabel.setAttribute('y', my);
            svgLabel.style.display = '';

            // Background rect for readability
            var textLen = labelText.length * 6;
            svgLabelBg.setAttribute('x', mx - textLen / 2 - 4);
            svgLabelBg.setAttribute('y', my - 8);
            svgLabelBg.setAttribute('width', textLen + 8);
            svgLabelBg.setAttribute('height', 16);
            svgLabelBg.style.display = '';
        }
    }

    function clearHighlights() {
        container.querySelectorAll('.highlighted').forEach(function (el) {
            el.classList.remove('highlighted');
        });
        container.querySelectorAll('.damaged').forEach(function (el) {
            el.classList.remove('damaged');
        });
        if (svgLine) {
            svgLine.style.display = 'none';
            svgLine.style.transition = '';
        }
        if (svgLabel) svgLabel.style.display = 'none';
        if (svgLabelBg) svgLabelBg.style.display = 'none';
    }

    function findMarker(side, type) {
        return container.querySelector('.unit-marker[data-side="' + side + '"][data-type="' + type + '"]');
    }

    // --- End State ---

    function showEndState(result) {
        clearHighlights();

        var banner = container.querySelector('.winner-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.className = 'winner-banner';
            banner.style.position = 'absolute';
            banner.style.top = '50%';
            banner.style.left = '50%';
            banner.style.transform = 'translate(-50%, -50%)';
            banner.style.zIndex = '10';
            banner.style.background = 'rgba(17, 24, 39, 0.9)';
            banner.style.padding = '0.6rem 1.5rem';
            banner.style.borderRadius = '6px';
            banner.style.border = '1px solid #ffd700';
            container.appendChild(banner);
        }
        if (result.winner === 'ATTACKER') banner.textContent = '★ ATTACKER WINS ★';
        else if (result.winner === 'DEFENDER') banner.textContent = '★ DEFENDER WINS ★';
        else banner.textContent = '— DRAW —';
        banner.textContent += ' (Round ' + result.rounds + ')';
    }

    function reset() {
        // Remove unit markers
        container.querySelectorAll('.unit-marker').forEach(function (m) { m.remove(); });
        // Remove winner banner
        var banner = container.querySelector('.winner-banner');
        if (banner) banner.remove();
        if (detailPanelEl) detailPanelEl.style.display = 'none';
        clearHighlights();
        currentPhaseIndex = -1;
        currentPositions = null;
        startAttacker = null;
        startDefender = null;
        currentAttackerArmy = null;
        currentDefenderArmy = null;
    }

    // --- Summary Bar ---

    function updateSummary(attArmy, defArmy) {
        var bar = document.getElementById('summary-bar');
        if (!bar) return;
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
                '<span>' + formatNum(d.start) + ' \u2192 ' + formatNum(d.current) +
                ' <span class="loss">(-' + loss + '%)</span></span></div>';
        });
        html += '<div class="summary-row" style="font-weight:700"><span>TOTAL</span>' +
            '<span>' + formatNum(start) + ' \u2192 ' + formatNum(total) +
            ' <span class="loss">(-' + lostPct + '%)</span></span></div>';
        html += '<div class="health-bar"><div class="fill" style="width:' + pct + '%"></div></div>';
        html += '</div>';
        return html;
    }

    function hideSummary() {
        var bar = document.getElementById('summary-bar');
        if (bar) bar.classList.remove('visible');
    }

    // --- Phase Indicator ---

    function setPhase(phase, positions) {
        // Update phase index
        var idx = TroopData.PHASE_ORDER.indexOf(phase);
        if (idx >= 0) currentPhaseIndex = idx;

        // Update positions from engine
        if (positions) currentPositions = positions;

        // Update phase dots
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

        // Reposition unit markers (CSS transition animates the move)
        repositionMarkers();
    }

    function repositionMarkers() {
        var markers = container.querySelectorAll('.unit-marker');
        markers.forEach(function (m) {
            var pos = calcPosition(m.dataset.type, m.dataset.side);
            m.style.left = pos.x + '%';
            m.style.top = pos.y + '%';
        });
    }

    function resetPhase() {
        currentPhaseIndex = -1;
        document.querySelectorAll('.phase-dot').forEach(function (dot) {
            dot.className = 'phase-dot';
        });
    }

    // --- Range & Speed Indicators ---

    var hoveredUnit = null; // { type, side } — tracks current hover for re-show on render

    function getMaxRangeForType(army, type) {
        var maxRange = 0;
        army.layers.forEach(function (l) {
            if (l.type === type && l.count > 0) {
                var stats = TroopData.getStats(l.type, l.tier);
                if (stats.range > maxRange) maxRange = stats.range;
            }
        });
        return maxRange;
    }

    function getSpeed(type) {
        return TroopData.getStats(type, 1).speed;
    }

    function clearIndicators() {
        container.querySelectorAll('.bf-range-indicator, .bf-speed-projection').forEach(function (el) {
            el.remove();
        });
    }

    function showRangeIndicator(type, side) {
        var army = side === 'ATT' ? currentAttackerArmy : currentDefenderArmy;
        if (!army) return;
        var maxRange = getMaxRangeForType(army, type);
        if (maxRange <= 50) return; // skip melee-range types

        var pos = currentPositions || defaultPositions();
        var enginePos = pos[side][type];
        var extentPos;
        if (side === 'ATT') {
            extentPos = Math.min(enginePos + maxRange, BATTLEFIELD_LENGTH);
        } else {
            extentPos = Math.max(enginePos - maxRange, 0);
        }

        var screenStart = mapToScreen(Math.min(enginePos, extentPos));
        var screenEnd = mapToScreen(Math.max(enginePos, extentPos));
        var color = TroopData.TYPES[type].color;

        var bar = document.createElement('div');
        bar.className = 'bf-range-indicator';
        bar.style.left = screenStart + '%';
        bar.style.width = (screenEnd - screenStart) + '%';
        bar.style.top = Y_POSITIONS[type] + '%';
        bar.style.background = color;
        container.appendChild(bar);
    }

    function showSpeedProjection(type, side) {
        var army = side === 'ATT' ? currentAttackerArmy : currentDefenderArmy;
        if (!army) return;

        // Skip if eliminated
        var alive = false;
        army.layers.forEach(function (l) {
            if (l.type === type && l.count > 0) alive = true;
        });
        if (!alive) return;

        var pos = currentPositions || defaultPositions();
        var enginePos = pos[side][type];
        var speed = getSpeed(type);
        var projectedPos;
        if (side === 'ATT') {
            projectedPos = Math.min(enginePos + speed, BATTLEFIELD_LENGTH);
        } else {
            projectedPos = Math.max(enginePos - speed, 0);
        }

        var screenX = mapToScreen(projectedPos);
        var color = TroopData.TYPES[type].color;

        var ghost = document.createElement('div');
        ghost.className = 'bf-speed-projection';
        ghost.style.left = screenX + '%';
        ghost.style.top = Y_POSITIONS[type] + '%';
        ghost.style.borderColor = color;
        ghost.style.background = color;
        container.appendChild(ghost);
    }

    function showIndicators(type, side) {
        clearIndicators();
        showRangeIndicator(type, side);
        showSpeedProjection(type, side);
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
