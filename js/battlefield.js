var Battlefield = (function () {
    'use strict';

    var container;
    var tooltipEl;
    var svgOverlay, svgLine;
    var attackInfoEl;
    var detailPanelEl;
    var currentAttackerArmy, currentDefenderArmy;
    var startAttacker, startDefender;
    var attackerBuffs, defenderBuffs;
    var currentPhaseIndex = -1; // -1 = pre-battle

    var BATTLEFIELD_LENGTH = 1500;

    // Y positions: top = back line (long range), bottom = front line
    var Y_POSITIONS = { SIEGE: 20, RANGED: 40, MOUNTED: 60, GROUND: 80 };

    var TYPE_LETTERS = { GROUND: 'G', RANGED: 'R', MOUNTED: 'M', SIEGE: 'S' };

    // Engine positions (0–1500), updated from events
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

    function getTypePosition(pos, side, type) {
        // Legacy per-type format
        if (pos[side][type] !== undefined) return pos[side][type];
        // Per-layer format: find frontmost alive layer of this type
        var best = null;
        for (var key in pos[side]) {
            if (key.indexOf(type + '_') === 0) {
                var val = pos[side][key];
                if (best === null) best = val;
                else if (side === 'ATT') best = Math.max(best, val);
                else best = Math.min(best, val);
            }
        }
        return best !== null ? best : (side === 'ATT' ? 0 : BATTLEFIELD_LENGTH);
    }

    function calcPosition(type, side) {
        var pos = currentPositions || defaultPositions();
        var sideKey = side === 'ATT' ? 'ATT' : 'DEF';
        return { x: mapToScreen(getTypePosition(pos, sideKey, type)), y: Y_POSITIONS[type] };
    }

    function computeVerticalOffsets(layers) {
        var offsets = {};
        if (!layers) return offsets;

        // Group layers by (type, range) — same range = same visual circle
        var byTypeRange = {};
        layers.forEach(function (l) {
            var stats = TroopData.getStats(l.type, l.tier);
            var key = l.type + '_R' + stats.range;
            if (!byTypeRange[key]) byTypeRange[key] = { type: l.type, range: stats.range, tiers: [] };
            byTypeRange[key].tiers.push(l.tier);
        });

        // Group range-groups by type
        var groupsByType = {};
        for (var key in byTypeRange) {
            var g = byTypeRange[key];
            if (!groupsByType[g.type]) groupsByType[g.type] = [];
            groupsByType[g.type].push(g);
        }

        var SPREAD = 3; // vertical spread in % between staggered groups

        for (var type in groupsByType) {
            var typeGroups = groupsByType[type];
            if (typeGroups.length <= 1) continue;

            typeGroups.sort(function (a, b) { return a.range - b.range; });
            var mid = (typeGroups.length - 1) / 2;

            typeGroups.forEach(function (g, i) {
                var yOff = (i - mid) * SPREAD;
                g.tiers.forEach(function (tier) {
                    offsets[type + '_' + tier] = yOff;
                });
            });
        }

        return offsets;
    }

    function calcLayerPosition(type, tier, side) {
        var pos = currentPositions || defaultPositions();
        var sideKey = side === 'ATT' ? 'ATT' : 'DEF';
        var key = type + '_' + tier;
        if (pos[sideKey][key] !== undefined) {
            return { x: mapToScreen(pos[sideKey][key]), y: Y_POSITIONS[type] };
        }
        return { x: mapToScreen(getTypePosition(pos, sideKey, type)), y: Y_POSITIONS[type] };
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

        container.appendChild(svgOverlay);

        // Attack info panel (below battlefield)
        attackInfoEl = document.getElementById('attack-info');

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

        // Remove old unit markers, indicators, and axis
        clearIndicators();
        container.querySelectorAll('.unit-marker, .bf-axis-tick, .bf-axis-label').forEach(function (m) { m.remove(); });

        // Place per-layer unit markers
        placeLayerMarkers(attArmy, startAttacker, attBuffs, 'ATT');
        placeLayerMarkers(defArmy, startDefender, defBuffs, 'DEF');

        // Render axis and persistent indicators
        renderAxis();
        renderAllRangeIndicators();
        renderAllSpeedProjections();
        if (hoveredUnit) {
            highlightHoveredIndicators(hoveredUnit.type, hoveredUnit.side);
        }
    }

    function formatTierRange(tiers) {
        if (tiers.length === 1) return 'T' + tiers[0];
        return 'T' + tiers[0] + '-' + tiers[tiers.length - 1];
    }

    function placeLayerMarkers(army, startSnap, buffs, side) {
        // Group layers by (type, range) — same range = same position always
        var groups = {};
        startSnap.forEach(function (sl) {
            var stats = TroopData.getStats(sl.type, sl.tier);
            var groupKey = sl.type + '_R' + stats.range;
            if (!groups[groupKey]) {
                groups[groupKey] = { type: sl.type, range: stats.range, tiers: [] };
            }
            groups[groupKey].tiers.push(sl.tier);
        });

        // Count groups per type to decide label style
        var groupCountsByType = {};
        for (var key in groups) {
            var g = groups[key];
            groupCountsByType[g.type] = (groupCountsByType[g.type] || 0) + 1;
        }

        var vOffsets = computeVerticalOffsets(startSnap);

        for (var key in groups) {
            var group = groups[key];
            var type = group.type;
            group.tiers.sort(function (a, b) { return a - b; });
            var repTier = group.tiers[group.tiers.length - 1]; // highest tier as representative

            // Aggregate current count across all tiers in this group
            var currentCount = 0;
            var allEliminated = true;
            for (var i = 0; i < army.layers.length; i++) {
                var l = army.layers[i];
                if (l.type === type && group.tiers.indexOf(l.tier) >= 0) {
                    currentCount += l.count;
                    if (l.count > 0) allEliminated = false;
                }
            }

            var pos = calcLayerPosition(type, repTier, side);
            var yOffset = vOffsets[type + '_' + repTier] || 0;
            pos.y += yOffset;

            var marker = document.createElement('div');
            marker.className = 'unit-marker';
            marker.dataset.type = type;
            marker.dataset.tier = repTier;
            marker.dataset.tiers = group.tiers.join(',');
            marker.dataset.side = side;
            if (allEliminated) marker.classList.add('eliminated');

            marker.style.left = pos.x + '%';
            marker.style.top = pos.y + '%';
            // Face-side alignment: front edge of icon square at the engine position
            // Icon is 44px wide; shift by half-icon (22px) so the face edge sits at X
            if (side === 'ATT') {
                marker.style.transform = 'translate(calc(-50% - 22px), -50%)';
            } else {
                marker.style.transform = 'translate(calc(-50% + 22px), -50%)';
            }

            // Icon circle
            var icon = document.createElement('div');
            icon.className = 'unit-icon icon-' + type.toLowerCase();
            icon.textContent = TYPE_LETTERS[type];
            marker.appendChild(icon);

            // Count
            var countEl = document.createElement('div');
            countEl.className = 'unit-count';
            countEl.textContent = formatNum(currentCount);
            marker.appendChild(countEl);

            // Label: show tier range when multiple groups exist, otherwise type name
            var label = document.createElement('div');
            label.className = 'unit-label';
            label.textContent = groupCountsByType[type] > 1 ? formatTierRange(group.tiers) : TroopData.TYPES[type].name;
            marker.appendChild(label);

            // Click handler — detail panel shows all tiers of this type
            var typeLayers = army.layers.filter(function (l) { return l.type === type; });
            var typeStartLayers = startSnap.filter(function (l) { return l.type === type; });
            marker.addEventListener('click', function (e) {
                e.stopPropagation();
                showDetailPanel(marker, typeLayers, typeStartLayers, type, buffs, side);
            });

            // Hover tooltip + indicators
            marker.addEventListener('mouseenter', function (e) {
                showTooltip(e, type, buffs, side);
                hoveredUnit = { type: type, side: side };
                highlightHoveredIndicators(type, side);
            });
            marker.addEventListener('mousemove', function (e) { moveTooltip(e); });
            marker.addEventListener('mouseleave', function () {
                hideTooltip();
                resetHoveredIndicators(type, side);
                hoveredUnit = null;
            });

            container.appendChild(marker);
        }
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

        var sourceMarker = findMarker(sourceSide, event.sourceType, event.sourceTier);
        var targetMarker = findMarker(targetSide, event.targetType, event.targetTier);

        if (sourceMarker) sourceMarker.classList.add('highlighted');
        if (targetMarker) targetMarker.classList.add('damaged');

        if (sourceMarker && targetMarker) {
            var contRect = container.getBoundingClientRect();
            var srcRect = sourceMarker.querySelector('.unit-icon').getBoundingClientRect();
            var tgtRect = targetMarker.querySelector('.unit-icon').getBoundingClientRect();

            var cx1 = (srcRect.left + srcRect.right) / 2 - contRect.left;
            var cy1 = (srcRect.top + srcRect.bottom) / 2 - contRect.top;
            var cx2 = (tgtRect.left + tgtRect.right) / 2 - contRect.left;
            var cy2 = (tgtRect.top + tgtRect.bottom) / 2 - contRect.top;

            // Shorten both ends so arrows don't overlap the icons
            var dx = cx2 - cx1;
            var dy = cy2 - cy1;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var gap = 32; // square half-width (22) + gap (10)
            if (dist > gap * 2) {
                var ux = dx / dist;
                var uy = dy / dist;
                var x1 = cx1 + ux * gap;
                var y1 = cy1 + uy * gap;
                var x2 = cx2 - ux * gap;
                var y2 = cy2 - uy * gap;
            } else {
                var x1 = cx1; var y1 = cy1;
                var x2 = cx2; var y2 = cy2;
            }

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

            // Attack info panel
            var srcName = event.sourceType.charAt(0).toUpperCase() + event.sourceType.slice(1);
            var tgtName = event.targetType.charAt(0).toUpperCase() + event.targetType.slice(1);
            attackInfoEl.innerHTML =
                srcName + ' T' + event.sourceTier + ' (' + formatNum(event.sourceCount) + ')'
                + ' \u2192 ' + tgtName + ' T' + event.targetTier + ' (' + formatNum(event.targetCountBefore) + ')'
                + ' \u00a0|\u00a0 <span class="ai-dmg">' + formatNum(event.damage) + ' dmg</span>'
                + ' \u00b7 ' + formatNum(event.kills) + ' killed';
        }
    }

    function highlightCounter(event) {
        if (!attackInfoEl) return;
        attackInfoEl.innerHTML += ' \u00a0\u21a9\u00a0 <span class="ai-counter">' + formatNum(event.kills) + ' counter-kills</span>';
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
        if (attackInfoEl) attackInfoEl.innerHTML = '&nbsp;';
    }

    function findMarker(side, type, tier) {
        if (tier !== undefined) {
            // Try exact match on representative tier first
            var exact = container.querySelector('.unit-marker[data-side="' + side + '"][data-type="' + type + '"][data-tier="' + tier + '"]');
            if (exact) return exact;
            // Search grouped markers that contain this tier
            var markers = container.querySelectorAll('.unit-marker[data-side="' + side + '"][data-type="' + type + '"]');
            for (var i = 0; i < markers.length; i++) {
                var tiers = markers[i].dataset.tiers;
                if (tiers && (',' + tiers + ',').indexOf(',' + tier + ',') >= 0) return markers[i];
            }
            return null;
        }
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
        // Remove unit markers, indicators, and axis
        container.querySelectorAll('.unit-marker, .bf-axis-tick, .bf-axis-label').forEach(function (m) { m.remove(); });
        clearIndicators();
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

    function setPhase(phase, positions, round) {
        // Update round label
        if (round != null) {
            var roundLabel = document.getElementById('round-label');
            if (roundLabel) roundLabel.textContent = 'Round ' + round;
        }

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

        // Re-render indicators at new positions
        clearIndicators();
        renderAllRangeIndicators();
        renderAllSpeedProjections();
        if (hoveredUnit) {
            highlightHoveredIndicators(hoveredUnit.type, hoveredUnit.side);
        }
    }

    function repositionMarkers() {
        var attOffsets = computeVerticalOffsets(startAttacker);
        var defOffsets = computeVerticalOffsets(startDefender);
        var markers = container.querySelectorAll('.unit-marker');
        markers.forEach(function (m) {
            var tier = m.dataset.tier;
            var side = m.dataset.side;
            var pos = tier
                ? calcLayerPosition(m.dataset.type, parseInt(tier), side)
                : calcPosition(m.dataset.type, side);
            var offsets = side === 'ATT' ? attOffsets : defOffsets;
            var yOffset = offsets[m.dataset.type + '_' + tier] || 0;
            m.style.left = pos.x + '%';
            m.style.top = (pos.y + yOffset) + '%';
        });
    }

    function resetPhase() {
        currentPhaseIndex = -1;
        var roundLabel = document.getElementById('round-label');
        if (roundLabel) roundLabel.textContent = 'Round 1';
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

    function renderAxis() {
        // Minor ticks every 50, major ticks every 100
        for (var val = 0; val <= BATTLEFIELD_LENGTH; val += 50) {
            var screenX = mapToScreen(val);
            var isMajor = val % 100 === 0;

            var tick = document.createElement('div');
            tick.className = 'bf-axis-tick ' + (isMajor ? 'major' : 'minor');
            tick.style.left = screenX + '%';
            container.appendChild(tick);

            if (isMajor) {
                var label = document.createElement('div');
                label.className = 'bf-axis-label';
                label.style.left = screenX + '%';
                label.textContent = val;
                container.appendChild(label);
            }
        }
    }

    function getLayerEnginePos(type, tier, side) {
        var pos = currentPositions || defaultPositions();
        var key = type + '_' + tier;
        if (pos[side][key] !== undefined) return pos[side][key];
        return getTypePosition(pos, side, type);
    }

    function renderAllRangeIndicators() {
        ['ATT', 'DEF'].forEach(function (side) {
            var army = side === 'ATT' ? currentAttackerArmy : currentDefenderArmy;
            var snap = side === 'ATT' ? startAttacker : startDefender;
            if (!army || !snap) return;
            var vOffsets = computeVerticalOffsets(snap);

            // Group alive layers by (type, range)
            var groups = {};
            army.layers.forEach(function (l) {
                if (l.count <= 0) return;
                var stats = TroopData.getStats(l.type, l.tier);
                var key = l.type + '_R' + stats.range;
                if (!groups[key]) {
                    groups[key] = { type: l.type, range: stats.range, repTier: l.tier };
                }
                if (l.tier > groups[key].repTier) groups[key].repTier = l.tier;
            });

            for (var key in groups) {
                var g = groups[key];
                if (g.range <= 50) continue;

                var enginePos = getLayerEnginePos(g.type, g.repTier, side);
                var extentPos;
                if (side === 'ATT') {
                    extentPos = Math.min(enginePos + g.range, BATTLEFIELD_LENGTH);
                } else {
                    extentPos = Math.max(enginePos - g.range, 0);
                }

                var screenStart = mapToScreen(Math.min(enginePos, extentPos));
                var screenEnd = mapToScreen(Math.max(enginePos, extentPos));
                var color = TroopData.TYPES[g.type].color;
                var yOffset = vOffsets[g.type + '_' + g.repTier] || 0;

                var bar = document.createElement('div');
                bar.className = 'bf-range-indicator';
                bar.dataset.indSide = side;
                bar.dataset.indType = g.type;
                bar.style.left = screenStart + '%';
                bar.style.width = (screenEnd - screenStart) + '%';
                bar.style.top = (Y_POSITIONS[g.type] + yOffset) + '%';
                bar.style.background = color;
                container.appendChild(bar);
            }
        });
    }

    function renderAllSpeedProjections() {
        ['ATT', 'DEF'].forEach(function (side) {
            var army = side === 'ATT' ? currentAttackerArmy : currentDefenderArmy;
            var snap = side === 'ATT' ? startAttacker : startDefender;
            if (!army || !snap) return;
            var vOffsets = computeVerticalOffsets(snap);

            // Group alive layers by (type, range)
            var groups = {};
            army.layers.forEach(function (l) {
                if (l.count <= 0) return;
                var stats = TroopData.getStats(l.type, l.tier);
                var key = l.type + '_R' + stats.range;
                if (!groups[key]) {
                    groups[key] = { type: l.type, range: stats.range, repTier: l.tier };
                }
                if (l.tier > groups[key].repTier) groups[key].repTier = l.tier;
            });

            for (var key in groups) {
                var g = groups[key];
                var enginePos = getLayerEnginePos(g.type, g.repTier, side);
                var speed = getSpeed(g.type);
                var projectedPos;
                if (side === 'ATT') {
                    projectedPos = Math.min(enginePos + speed, BATTLEFIELD_LENGTH);
                } else {
                    projectedPos = Math.max(enginePos - speed, 0);
                }

                var screenX = mapToScreen(projectedPos);
                var color = TroopData.TYPES[g.type].color;
                var yOffset = vOffsets[g.type + '_' + g.repTier] || 0;

                var ghost = document.createElement('div');
                ghost.className = 'bf-speed-projection';
                ghost.dataset.indSide = side;
                ghost.dataset.indType = g.type;
                ghost.style.left = screenX + '%';
                ghost.style.top = (Y_POSITIONS[g.type] + yOffset) + '%';
                ghost.style.borderColor = color;
                ghost.style.background = color;
                container.appendChild(ghost);
            }
        });
    }

    function highlightHoveredIndicators(type, side) {
        container.querySelectorAll('.bf-range-indicator[data-ind-side="' + side + '"][data-ind-type="' + type + '"]').forEach(function (el) {
            el.style.opacity = '0.22';
        });
        container.querySelectorAll('.bf-speed-projection[data-ind-side="' + side + '"][data-ind-type="' + type + '"]').forEach(function (el) {
            el.style.opacity = '0.30';
        });
    }

    function resetHoveredIndicators(type, side) {
        container.querySelectorAll('.bf-range-indicator[data-ind-side="' + side + '"][data-ind-type="' + type + '"]').forEach(function (el) {
            el.style.opacity = '';
        });
        container.querySelectorAll('.bf-speed-projection[data-ind-side="' + side + '"][data-ind-type="' + type + '"]').forEach(function (el) {
            el.style.opacity = '';
        });
    }

    // --- Helpers ---

    function snapshotArmy(army) {
        return army.layers.map(function (l) {
            return { type: l.type, tier: l.tier, count: l.count, startCount: l.startCount };
        });
    }

    function formatNum(n) {
        return Math.round(n).toLocaleString();
    }

    return {
        init: init,
        render: render,
        highlightAttack: highlightAttack,
        highlightCounter: highlightCounter,
        clearHighlights: clearHighlights,
        showEndState: showEndState,
        updateSummary: updateSummary,
        hideSummary: hideSummary,
        setPhase: setPhase,
        resetPhase: resetPhase,
        reset: reset
    };
})();
