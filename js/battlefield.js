var Battlefield = (function () {
    'use strict';

    let container;
    let tooltipEl;
    let svgOverlay, svgLine;
    let attackInfoEl;
    let detailPanelEl;
    let currentAttackerArmy, currentDefenderArmy;
    let startAttacker, startDefender;
    let attackerBuffs, defenderBuffs;
    let currentPhaseIndex = -1; // -1 = pre-battle

    const BATTLEFIELD_LENGTH = 1500;

    // Y positions: top = back line (long range), bottom = front line.
    // ARCHER_TOWER sits at Y=100 (defender-only bottom row).
    const Y_POSITIONS = { SIEGE: 20, RANGED: 40, MOUNTED: 60, GROUND: 80, ARCHER_TOWER: 100 };

    // Single-letter codes used in range-tip labels (e.g. "← A800"). The marker
    // icon below uses a separate "AT" string so the tower is recognisable on its row.
    const TYPE_LETTERS = { GROUND: 'G', RANGED: 'R', MOUNTED: 'M', SIEGE: 'S', ARCHER_TOWER: 'A' };

    // Engine positions (0–1500), updated from events
    let currentPositions = null;

    function defaultPositions() {
        return {
            ATT: { SIEGE: 0, RANGED: 0, MOUNTED: 0, GROUND: 0 },
            DEF: { SIEGE: BATTLEFIELD_LENGTH, RANGED: BATTLEFIELD_LENGTH, MOUNTED: BATTLEFIELD_LENGTH, GROUND: BATTLEFIELD_LENGTH, ARCHER_TOWER: BATTLEFIELD_LENGTH }
        };
    }

    function mapToScreen(engineX) {
        return 5 + (engineX / BATTLEFIELD_LENGTH) * 90;
    }

    function getTypePosition(pos, side, type) {
        // Legacy per-type format
        if (pos[side][type] !== undefined) return pos[side][type];
        // Per-layer format: find frontmost alive layer of this type
        let best = null;
        for (const key in pos[side]) {
            if (key.indexOf(type + '_') === 0) {
                const val = pos[side][key];
                if (best === null) best = val;
                else if (side === 'ATT') best = Math.max(best, val);
                else best = Math.min(best, val);
            }
        }
        return best !== null ? best : (side === 'ATT' ? 0 : BATTLEFIELD_LENGTH);
    }

    function calcPosition(type, side) {
        const pos = currentPositions || defaultPositions();
        const sideKey = side === 'ATT' ? 'ATT' : 'DEF';
        return { x: mapToScreen(getTypePosition(pos, sideKey, type)), y: Y_POSITIONS[type] };
    }

    function computeVerticalOffsets(layers) {
        const offsets = {};
        if (!layers) return offsets;

        // Group layers by (type, range) — same range = same visual circle.
        // Skip ARCHER_TOWER: it has no tiers, no stats lookup, and renders standalone.
        const byTypeRange = {};
        layers.forEach((l) => {
            if (l.type === 'ARCHER_TOWER') return;
            const stats = TroopData.getStats(l.type, l.tier);
            const key = `${l.type}_R${stats.range}`;
            if (!byTypeRange[key]) byTypeRange[key] = { type: l.type, range: stats.range, tiers: [] };
            byTypeRange[key].tiers.push(l.tier);
        });

        // Group range-groups by type
        const groupsByType = {};
        for (const key in byTypeRange) {
            const g = byTypeRange[key];
            if (!groupsByType[g.type]) groupsByType[g.type] = [];
            groupsByType[g.type].push(g);
        }

        const SPREAD = 3; // vertical spread in % between staggered groups

        for (const type in groupsByType) {
            const typeGroups = groupsByType[type];
            if (typeGroups.length <= 1) continue;

            typeGroups.sort((a, b) => a.range - b.range);
            const mid = (typeGroups.length - 1) / 2;

            typeGroups.forEach((g, i) => {
                const yOff = (i - mid) * SPREAD;
                g.tiers.forEach((tier) => {
                    offsets[`${type}_${tier}`] = yOff;
                });
            });
        }

        return offsets;
    }

    // Resolve the tier to use for position lookup within a grouped marker.
    // Position must track alive layers — dead tiers freeze their engine position
    // when count hits 0, so using a dead rep tier pins the marker to a grave.
    function resolvePositionTier(type, groupTiers, army) {
        if (!army) return groupTiers[groupTiers.length - 1];
        for (let i = groupTiers.length - 1; i >= 0; i--) {
            const tier = groupTiers[i];
            for (let j = 0; j < army.layers.length; j++) {
                const l = army.layers[j];
                if (l.type === type && l.tier === tier && l.count > 0) return tier;
            }
        }
        return groupTiers[groupTiers.length - 1];
    }

    function calcLayerPosition(type, tier, side, positionTier) {
        const pos = currentPositions || defaultPositions();
        const sideKey = side === 'ATT' ? 'ATT' : 'DEF';
        const lookupTier = positionTier !== undefined ? positionTier : tier;
        const key = `${type}_${lookupTier}`;
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
        const centerLine = document.createElement('div');
        centerLine.className = 'bf-center-line';
        container.appendChild(centerLine);

        // SVG overlay for attack arrows
        svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgOverlay.setAttribute('class', 'bf-svg-overlay');

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '8');
        marker.setAttribute('markerHeight', '6');
        marker.setAttribute('refX', '8');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
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
        document.addEventListener('click', (e) => {
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
        container.querySelectorAll('.unit-marker, .bf-axis-tick, .bf-axis-label').forEach((m) => m.remove());

        // Place per-layer unit markers
        placeLayerMarkers(attArmy, startAttacker, attBuffs, 'ATT');
        placeLayerMarkers(defArmy, startDefender, defBuffs, 'DEF');

        // Render axis and persistent indicators
        renderAxis();
        renderAllRangeIndicators();
        if (hoveredUnit) {
            highlightHoveredIndicators(hoveredUnit.type, hoveredUnit.side, hoveredUnit.repTier);
        }
    }

    function formatTierRange(tiers) {
        if (tiers.length === 1) return `T${tiers[0]}`;
        return `T${tiers[0]}-${tiers[tiers.length - 1]}`;
    }

    function placeLayerMarkers(army, startSnap, buffs, side) {
        // Archer Tower has no tiers and is rendered as a separate fixture marker —
        // skip it in the troop-grouping loop and render explicitly afterwards.
        // AT also never appears on the attacker side.
        if (side === 'DEF') {
            const atStart = startSnap.find((sl) => sl.type === 'ARCHER_TOWER');
            if (atStart) placeArcherTowerMarker(army, side);
        }

        // Group layers by (type, range) — same range = same position always
        const groups = {};
        startSnap.forEach((sl) => {
            if (sl.type === 'ARCHER_TOWER') return;
            const stats = TroopData.getStats(sl.type, sl.tier);
            const groupKey = `${sl.type}_R${stats.range}`;
            if (!groups[groupKey]) {
                groups[groupKey] = { type: sl.type, range: stats.range, tiers: [] };
            }
            groups[groupKey].tiers.push(sl.tier);
        });

        // Count groups per type to decide label style
        const groupCountsByType = {};
        for (const key in groups) {
            const g = groups[key];
            groupCountsByType[g.type] = (groupCountsByType[g.type] || 0) + 1;
        }

        const vOffsets = computeVerticalOffsets(startSnap);

        for (const key in groups) {
            const group = groups[key];
            const type = group.type;
            group.tiers.sort((a, b) => a - b);
            const repTier = group.tiers[group.tiers.length - 1]; // highest tier as representative

            // Aggregate current count across all tiers in this group
            let currentCount = 0;
            let allEliminated = true;
            for (let i = 0; i < army.layers.length; i++) {
                const l = army.layers[i];
                if (l.type === type && group.tiers.includes(l.tier)) {
                    currentCount += l.count;
                    if (l.count > 0) allEliminated = false;
                }
            }

            const posTier = resolvePositionTier(type, group.tiers, army);
            const pos = calcLayerPosition(type, repTier, side, posTier);
            const yOffset = vOffsets[`${type}_${repTier}`] || 0;
            pos.y += yOffset;

            const marker = document.createElement('div');
            marker.className = 'unit-marker';
            marker.dataset.type = type;
            marker.dataset.tier = repTier;
            marker.dataset.tiers = group.tiers.join(',');
            marker.dataset.side = side;
            if (allEliminated) marker.classList.add('eliminated');

            marker.style.left = `${pos.x}%`;
            marker.style.top = `${pos.y}%`;
            // Face-side alignment: front edge of icon square at the engine position
            // Icon is 44px wide; shift by half-icon (22px) so the face edge sits at X
            if (side === 'ATT') {
                marker.style.transform = 'translate(calc(-50% - 22px), -50%)';
            } else {
                marker.style.transform = 'translate(calc(-50% + 22px), -50%)';
            }

            // Icon circle
            const icon = document.createElement('div');
            icon.className = `unit-icon icon-${type.toLowerCase()}`;
            icon.textContent = TYPE_LETTERS[type];
            marker.appendChild(icon);

            // Count
            const countEl = document.createElement('div');
            countEl.className = 'unit-count';
            countEl.textContent = formatNum(currentCount);
            marker.appendChild(countEl);

            // Label: show tier range when multiple groups exist, otherwise type name
            const label = document.createElement('div');
            label.className = 'unit-label';
            label.textContent = groupCountsByType[type] > 1 ? formatTierRange(group.tiers) : TroopData.TYPES[type].name;
            marker.appendChild(label);

            // Click handler — detail panel shows all tiers of this type
            const typeLayers = army.layers.filter((l) => l.type === type);
            const typeStartLayers = startSnap.filter((l) => l.type === type);
            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                showDetailPanel(marker, typeLayers, typeStartLayers, type, buffs, side);
            });

            // Hover tooltip + indicators
            marker.addEventListener('mouseenter', (e) => {
                showTooltip(e, type, buffs, side);
                hoveredUnit = { type: type, side: side, repTier: repTier };
                highlightHoveredIndicators(type, side, repTier);
            });
            marker.addEventListener('mousemove', (e) => moveTooltip(e));
            marker.addEventListener('mouseleave', () => {
                hideTooltip();
                resetHoveredIndicators(type, side);
                hoveredUnit = null;
            });

            container.appendChild(marker);
        }
    }

    function placeArcherTowerMarker(army, side) {
        // Defender-only fixed-position marker at (BATTLEFIELD_LENGTH, Y=100).
        // Renders an HP-fraction bar instead of a troop count.
        if (side !== 'DEF') return;
        const at = army.layers.find((l) => l.type === 'ARCHER_TOWER');
        if (!at) return;

        const info = TroopData.TYPES.ARCHER_TOWER;
        const screenX = mapToScreen(BATTLEFIELD_LENGTH);
        const screenY = Y_POSITIONS.ARCHER_TOWER;

        const marker = document.createElement('div');
        marker.className = 'unit-marker unit-marker-archer-tower';
        marker.dataset.type = 'ARCHER_TOWER';
        marker.dataset.tier = '1';
        marker.dataset.tiers = '1';
        marker.dataset.side = side;
        if (at.count <= 0) marker.classList.add('eliminated');

        marker.style.left = `${screenX}%`;
        marker.style.top = `${screenY}%`;
        marker.style.transform = 'translate(calc(-50% + 22px), -50%)';

        const icon = document.createElement('div');
        icon.className = `unit-icon icon-archer-tower`;
        icon.textContent = 'AT';
        marker.appendChild(icon);

        const hpFrac = Math.max(0, Math.min(1, at.count));
        const hpBar = document.createElement('div');
        hpBar.className = 'archer-tower-hp-bar';
        hpBar.innerHTML = `<div class="archer-tower-hp-fill" style="width:${hpFrac * 100}%"></div>`;
        marker.appendChild(hpBar);

        const label = document.createElement('div');
        label.className = 'unit-label';
        label.textContent = info.name;
        marker.appendChild(label);

        marker.addEventListener('mouseenter', (e) => {
            tooltipEl.innerHTML = `
                <div class="tt-title ${info.colorClass}">${info.name} (DEF)</div>
                <div class="tt-row">ATK: ${Math.round(at.atk).toLocaleString()} · HP: ${Math.round(at.hp).toLocaleString()} · Range: ${Math.round(at.range).toLocaleString()}</div>
                <div class="tt-row">HP fraction: ${Math.round(hpFrac * 100)}%${at.phantomFire ? ' · phantom-fire ON' : ''}</div>
            `;
            tooltipEl.style.display = 'block';
            moveTooltip(e);
        });
        marker.addEventListener('mousemove', (e) => moveTooltip(e));
        marker.addEventListener('mouseleave', () => hideTooltip());

        container.appendChild(marker);
    }

    // --- Detail Panel ---

    function showDetailPanel(markerEl, layers, startLayers, type, buffs, side) {
        const info = TroopData.TYPES[type];
        const sideLabel = side === 'ATT' ? 'Attacker' : 'Defender';

        const tierData = [];
        startLayers.forEach((sl) => {
            let current = 0;
            for (let i = 0; i < layers.length; i++) {
                if (layers[i].tier === sl.tier) { current = layers[i].count; break; }
            }
            tierData.push({ tier: sl.tier, current: current, start: sl.startCount });
        });
        tierData.sort((a, b) => b.tier - a.tier);

        const tierRows = tierData.map((td) => {
            const lost = td.start - td.current;
            const lostSpan = lost > 0 ? ` <span class="tier-lost">(-${formatNum(lost)})</span>` : '';
            return `
                <div class="detail-tier-row">
                    <span>T${td.tier}</span>
                    <span>${formatNum(td.current)} / ${formatNum(td.start)}${lostSpan}</span>
                </div>
            `;
        }).join('');

        let total = 0, totalStart = 0;
        tierData.forEach((td) => { total += td.current; totalStart += td.start; });

        const chain = TroopData.TARGET_PRIORITY[type].map((t) => TroopData.TYPES[t].name).join(' > ');

        detailPanelEl.innerHTML = `
            <div class="detail-title ${info.colorClass}">${sideLabel} ${info.name}</div>
            <div class="detail-tiers">${tierRows}</div>
            <div class="detail-total">Total: ${formatNum(total)} / ${formatNum(totalStart)}</div>
            <div class="detail-targets">Targets: ${chain}</div>
        `;
        detailPanelEl.style.display = 'block';

        // Position near the marker
        const markerRect = markerEl.getBoundingClientRect();
        const contRect = container.getBoundingClientRect();
        const top = markerRect.top - contRect.top;

        if (side === 'ATT') {
            detailPanelEl.style.left = `${markerRect.right - contRect.left + 8}px`;
            detailPanelEl.style.right = 'auto';
        } else {
            detailPanelEl.style.left = 'auto';
            detailPanelEl.style.right = `${contRect.right - markerRect.left + 8}px`;
        }
        detailPanelEl.style.top = `${Math.max(0, top)}px`;
    }

    // --- Tooltip ---

    function showTooltip(e, type, buffs, side) {
        const info = TroopData.TYPES[type];
        const b = buffs[type] || { atk: 0, def: 0, hp: 0 };
        const chain = TroopData.TARGET_PRIORITY[type].map((t) => TroopData.TYPES[t].name).join(' > ');

        let buffRow = '';
        if (b.atk || b.def || b.hp) {
            const parts = [];
            if (b.atk) parts.push(`ATK +${b.atk}%`);
            if (b.def) parts.push(`DEF +${b.def}%`);
            if (b.hp) parts.push(`HP +${b.hp}%`);
            buffRow = `<div class="tt-row">Buffs: ${parts.join(' ')}</div>`;
        }

        tooltipEl.innerHTML = `
            <div class="tt-title ${info.colorClass}">${info.name} (${side})</div>
            <div class="tt-row">Targets: ${chain}</div>
            ${buffRow}
        `;
        tooltipEl.style.display = 'block';
        moveTooltip(e);
    }

    function moveTooltip(e) {
        tooltipEl.style.left = `${e.pageX + 15}px`;
        tooltipEl.style.top = `${e.pageY + 10}px`;
    }

    function hideTooltip() {
        tooltipEl.style.display = 'none';
    }

    // --- Attack Highlight (SVG Arrow) ---

    function highlightAttack(event) {
        clearHighlights();

        const sourceSide = event.side;
        const targetSide = sourceSide === 'ATT' ? 'DEF' : 'ATT';

        const sourceMarker = findMarker(sourceSide, event.sourceType, event.sourceTier);
        const targetMarker = findMarker(targetSide, event.targetType, event.targetTier);

        if (sourceMarker) sourceMarker.classList.add('highlighted');
        if (targetMarker) targetMarker.classList.add('damaged');

        if (sourceMarker && targetMarker) {
            const contRect = container.getBoundingClientRect();
            const srcRect = sourceMarker.querySelector('.unit-icon').getBoundingClientRect();
            const tgtRect = targetMarker.querySelector('.unit-icon').getBoundingClientRect();

            const cx1 = (srcRect.left + srcRect.right) / 2 - contRect.left;
            const cy1 = (srcRect.top + srcRect.bottom) / 2 - contRect.top;
            const cx2 = (tgtRect.left + tgtRect.right) / 2 - contRect.left;
            const cy2 = (tgtRect.top + tgtRect.bottom) / 2 - contRect.top;

            // Shorten both ends so arrows don't overlap the icons
            const dx = cx2 - cx1;
            const dy = cy2 - cy1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const gap = 32; // square half-width (22) + gap (10)
            let x1, y1, x2, y2;
            if (dist > gap * 2) {
                const ux = dx / dist;
                const uy = dy / dist;
                x1 = cx1 + ux * gap;
                y1 = cy1 + uy * gap;
                x2 = cx2 - ux * gap;
                y2 = cy2 - uy * gap;
            } else {
                x1 = cx1; y1 = cy1;
                x2 = cx2; y2 = cy2;
            }

            svgLine.setAttribute('x1', x1);
            svgLine.setAttribute('y1', y1);
            svgLine.setAttribute('x2', x2);
            svgLine.setAttribute('y2', y2);
            svgLine.style.display = '';

            // Animate dash — duration adapts to playback speed; snap below 100ms
            const len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
            const playSpeed = parseInt(document.getElementById('speed-slider').value, 10) || 200;
            svgLine.style.strokeDasharray = len;
            svgLine.style.strokeDashoffset = len;
            svgLine.getBoundingClientRect();
            if (playSpeed < 200) {
                svgLine.style.transition = '';
                svgLine.style.strokeDashoffset = '0';
            } else {
                const dur = Math.min(200, playSpeed - 40);
                svgLine.style.transition = `stroke-dashoffset ${dur}ms ease-out`;
                svgLine.style.strokeDashoffset = '0';
            }

            // Attack info panel
            const srcName = event.sourceType.charAt(0).toUpperCase() + event.sourceType.slice(1);
            const tgtName = event.targetType.charAt(0).toUpperCase() + event.targetType.slice(1);
            attackInfoEl.innerHTML = `<span class="ai-stage">${srcName} T${event.sourceTier} (${formatNum(event.sourceCount)}) \u2192 ${tgtName} T${event.targetTier} (${formatNum(event.targetCountBefore)}) \u00a0|\u00a0 <span class="ai-dmg">${formatNum(event.damage)} dmg</span> \u00b7 ${formatNum(event.kills)} killed</span>`;
        }
    }

    function highlightCounter(event) {
        if (!attackInfoEl) return;
        const stage = attackInfoEl.querySelector('.ai-stage');
        const html = ` \u00a0\u21a9\u00a0 <span class="ai-counter">${formatNum(event.kills)} counter-kills</span>`;
        if (stage) stage.innerHTML += html;
        else attackInfoEl.innerHTML += html;
    }

    function clearHighlights() {
        container.querySelectorAll('.highlighted').forEach((el) => el.classList.remove('highlighted'));
        container.querySelectorAll('.damaged').forEach((el) => el.classList.remove('damaged'));
        if (svgLine) {
            svgLine.style.display = 'none';
            svgLine.style.transition = '';
        }
        if (attackInfoEl) attackInfoEl.innerHTML = '&nbsp;';
    }

    function findMarker(side, type, tier) {
        if (tier !== undefined) {
            // Try exact match on representative tier first
            const exact = container.querySelector(`.unit-marker[data-side="${side}"][data-type="${type}"][data-tier="${tier}"]`);
            if (exact) return exact;
            // Search grouped markers that contain this tier
            const markers = container.querySelectorAll(`.unit-marker[data-side="${side}"][data-type="${type}"]`);
            for (let i = 0; i < markers.length; i++) {
                const tiers = markers[i].dataset.tiers;
                if (tiers && (',' + tiers + ',').indexOf(',' + tier + ',') >= 0) return markers[i];
            }
            return null;
        }
        return container.querySelector(`.unit-marker[data-side="${side}"][data-type="${type}"]`);
    }

    // --- End State ---

    function showEndState(result) {
        clearHighlights();

        let banner = container.querySelector('.winner-banner');
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
        const label = result.winner === 'ATTACKER' ? '★ ATTACKER WINS ★'
                    : result.winner === 'DEFENDER' ? '★ DEFENDER WINS ★'
                    : '— DRAW —';
        banner.textContent = `${label} (Round ${result.rounds})`;
    }

    function reset() {
        // Remove unit markers, indicators, and axis
        container.querySelectorAll('.unit-marker, .bf-axis-tick, .bf-axis-label').forEach((m) => m.remove());
        clearIndicators();
        // Remove winner banner
        const banner = container.querySelector('.winner-banner');
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
        const bar = document.getElementById('summary-bar');
        if (!bar) return;
        bar.classList.add('visible');

        let attTotal = 0, attStart = 0, defTotal = 0, defStart = 0;
        const attByType = {}, defByType = {};

        TroopData.PHASE_ORDER.forEach((type) => {
            attByType[type] = { current: 0, start: 0 };
            defByType[type] = { current: 0, start: 0 };
        });

        attArmy.layers.forEach((l) => {
            attByType[l.type].current += l.count;
            attByType[l.type].start += l.startCount;
            attTotal += l.count;
            attStart += l.startCount;
        });
        defArmy.layers.forEach((l) => {
            defByType[l.type].current += l.count;
            defByType[l.type].start += l.startCount;
            defTotal += l.count;
            defStart += l.startCount;
        });

        bar.innerHTML = `
            <div class="summary-content">
                ${buildSummaryHtml('Attacker', attByType, attTotal, attStart)}
                ${buildSummaryHtml('Defender', defByType, defTotal, defStart)}
            </div>
        `;
    }

    function buildSummaryHtml(title, byType, total, start) {
        const pct = start > 0 ? Math.round(total / start * 100) : 0;
        const lostPct = start > 0 ? Math.round((1 - total / start) * 100) : 0;

        const typeRows = TroopData.PHASE_ORDER.map((type) => {
            const info = TroopData.TYPES[type];
            const d = byType[type];
            if (d.start === 0) return '';
            const loss = d.start > 0 ? Math.round((1 - d.current / d.start) * 100) : 0;
            return `
                <div class="summary-row">
                    <span class="${info.colorClass}">${info.name}</span>
                    <span>${formatNum(d.start)} \u2192 ${formatNum(d.current)} <span class="loss">(-${loss}%)</span></span>
                </div>
            `;
        }).join('');

        return `
            <div class="summary-side">
                <h4>${title}</h4>
                ${typeRows}
                <div class="summary-row" style="font-weight:700">
                    <span>TOTAL</span>
                    <span>${formatNum(start)} \u2192 ${formatNum(total)} <span class="loss">(-${lostPct}%)</span></span>
                </div>
                <div class="health-bar"><div class="fill" style="width:${pct}%"></div></div>
            </div>
        `;
    }

    function hideSummary() {
        const bar = document.getElementById('summary-bar');
        if (bar) bar.classList.remove('visible');
    }

    // --- Phase Indicator ---

    function setPhase(phase, positions, round) {
        // Update round label
        if (round != null) {
            const roundLabel = document.getElementById('round-label');
            if (roundLabel) roundLabel.textContent = `Round ${round}`;
        }

        // Update phase index
        const idx = TroopData.PHASE_ORDER.indexOf(phase);
        if (idx >= 0) currentPhaseIndex = idx;

        // Update positions from engine
        if (positions) currentPositions = positions;

        // Update phase dots
        const dots = document.querySelectorAll('.phase-dot');
        let found = false;
        dots.forEach((dot) => {
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
        if (hoveredUnit) {
            highlightHoveredIndicators(hoveredUnit.type, hoveredUnit.side, hoveredUnit.repTier);
        }
    }

    function repositionMarkers() {
        const attOffsets = computeVerticalOffsets(startAttacker);
        const defOffsets = computeVerticalOffsets(startDefender);
        container.querySelectorAll('.unit-marker').forEach((m) => {
            const tier = m.dataset.tier;
            const side = m.dataset.side;
            const army = side === 'ATT' ? currentAttackerArmy : currentDefenderArmy;
            const groupTiers = m.dataset.tiers
                ? m.dataset.tiers.split(',').map((t) => parseInt(t, 10))
                : (tier ? [parseInt(tier, 10)] : []);
            const posTier = groupTiers.length > 0
                ? resolvePositionTier(m.dataset.type, groupTiers, army)
                : undefined;
            const pos = tier
                ? calcLayerPosition(m.dataset.type, parseInt(tier, 10), side, posTier)
                : calcPosition(m.dataset.type, side);
            const offsets = side === 'ATT' ? attOffsets : defOffsets;
            const yOffset = offsets[`${m.dataset.type}_${tier}`] || 0;
            m.style.left = `${pos.x}%`;
            m.style.top = `${pos.y + yOffset}%`;
        });
    }

    function resetPhase() {
        currentPhaseIndex = -1;
        const roundLabel = document.getElementById('round-label');
        if (roundLabel) roundLabel.textContent = 'Round 1';
        document.querySelectorAll('.phase-dot').forEach((dot) => {
            dot.className = 'phase-dot';
        });
    }

    // --- Range & Speed Indicators ---

    let hoveredUnit = null; // { type, side } — tracks current hover for re-show on render

    function clearIndicators() {
        container.querySelectorAll(
            '.bf-range-indicator, .bf-range-tip, .bf-range-tip-label, .bf-firefight-zone'
        ).forEach((el) => el.remove());
    }

    function renderAxis() {
        // Minor ticks every 50, major ticks every 100
        for (let val = 0; val <= BATTLEFIELD_LENGTH; val += 50) {
            const screenX = mapToScreen(val);
            const isMajor = val % 100 === 0;

            const tick = document.createElement('div');
            tick.className = `bf-axis-tick ${isMajor ? 'major' : 'minor'}`;
            tick.style.left = `${screenX}%`;
            container.appendChild(tick);

            if (isMajor) {
                const label = document.createElement('div');
                label.className = 'bf-axis-label';
                label.style.left = `${screenX}%`;
                label.textContent = val;
                container.appendChild(label);
            }
        }
    }

    function getLayerEnginePos(type, tier, side) {
        const pos = currentPositions || defaultPositions();
        const key = `${type}_${tier}`;
        if (pos[side][key] !== undefined) return pos[side][key];
        return getTypePosition(pos, side, type);
    }

    // Tip markers + firefight-zone shade for Ranged and Siege rows.
    // One tip per unique buffed range per (type, side); zone uses max reach.
    function renderAllRangeIndicators() {
        // ARCHER_TOWER is defender-only with one user-configured range; the loops
        // below naturally produce zero entries on the attacker side and the
        // firefight-zone branch's early return prevents a zone from rendering.
        const TYPES_WITH_RANGE = ['RANGED', 'SIEGE', 'ARCHER_TOWER'];

        // Per (side, type): list of { range, repTier, unitPos, tipPos } for each unique alive buffed range.
        const reach = { ATT: {}, DEF: {} };
        ['ATT', 'DEF'].forEach((side) => {
            const army = side === 'ATT' ? currentAttackerArmy : currentDefenderArmy;
            if (!army) return;

            TYPES_WITH_RANGE.forEach((type) => {
                const byRange = {};
                army.layers.forEach((l) => {
                    if (l.type !== type || l.count <= 0 || l.range <= 50) return;
                    const key = l.range;
                    if (!byRange[key]) {
                        byRange[key] = { range: l.range, repTier: l.tier, tiers: [l.tier] };
                    } else {
                        byRange[key].tiers.push(l.tier);
                        if (l.tier > byRange[key].repTier) byRange[key].repTier = l.tier;
                    }
                });

                const entries = [];
                for (const k in byRange) {
                    const entry = byRange[k];
                    const unitPos = getLayerEnginePos(type, entry.repTier, side);
                    const tipPos = side === 'ATT'
                        ? Math.min(unitPos + entry.range, BATTLEFIELD_LENGTH)
                        : Math.max(unitPos - entry.range, 0);
                    entry.tiers.sort((a, b) => a - b);
                    entries.push({
                        range: entry.range,
                        repTier: entry.repTier,
                        tiers: entry.tiers,
                        unitPos: unitPos,
                        tipPos: tipPos
                    });
                }
                entries.sort((a, b) => a.range - b.range);
                reach[side][type] = entries;
            });
        });

        // Tip marks + labels — one pair per unique range per side.
        // Vertical layout: a range-based spread across a band centered on the
        // type's Y (for multi-entry rows like Siege) plus a side offset so ATT
        // goes up and DEF goes down — prevents ATT/DEF labels colliding when
        // reaches cross over mid-battle.
        const VERTICAL_BAND = 16; // % of battlefield height for per-range spread
        const SIDE_SPREAD = 3;    // % vertical offset per side
        ['ATT', 'DEF'].forEach((side) => {
            const sideOffset = side === 'ATT' ? -SIDE_SPREAD : SIDE_SPREAD;
            TYPES_WITH_RANGE.forEach((type) => {
                const entries = reach[side][type];
                if (!entries || entries.length === 0) return;
                const color = TroopData.TYPES[type].color;
                const baseY = Y_POSITIONS[type];
                const n = entries.length;
                const step = n > 1 ? VERTICAL_BAND / (n - 1) : 0;

                entries.forEach((r, i) => {
                    const rangeOffset = n > 1 ? -VERTICAL_BAND / 2 + i * step : 0;
                    const y = baseY + rangeOffset + sideOffset;
                    const screenX = mapToScreen(r.tipPos);
                    const showTier = type === 'SIEGE';
                    const tierText = !showTier ? '' : (r.tiers.length === 1
                        ? `T${r.tiers[0]}`
                        : `T${r.tiers[0]}-${r.tiers[r.tiers.length - 1]}`);
                    const arrow = side === 'ATT' ? '→' : '←';
                    const core = `${TYPE_LETTERS[type]}${r.range}`;
                    const labelText = side === 'ATT'
                        ? `${tierText ? tierText + ' ' : ''}${core} ${arrow}`
                        : `${arrow} ${core}${tierText ? ' ' + tierText : ''}`;

                    const tick = document.createElement('div');
                    tick.className = 'bf-range-tip';
                    tick.dataset.indSide = side;
                    tick.dataset.indType = type;
                    tick.style.left = `${screenX}%`;
                    tick.style.top = `${y}%`;
                    tick.style.background = color;
                    container.appendChild(tick);

                    const label = document.createElement('div');
                    label.className = 'bf-range-tip-label';
                    label.dataset.indSide = side;
                    label.dataset.indType = type;
                    label.style.left = `${screenX}%`;
                    label.style.top = `${y}%`;
                    label.style.color = color;
                    label.textContent = labelText;
                    container.appendChild(label);
                });
            });
        });

        // Firefight zone per row — uses max reach on each side.
        TYPES_WITH_RANGE.forEach((type) => {
            const attEntries = reach.ATT[type];
            const defEntries = reach.DEF[type];
            if (!attEntries || !defEntries || !attEntries.length || !defEntries.length) return;

            const att = attEntries[attEntries.length - 1]; // max range on ATT
            const def = defEntries[defEntries.length - 1]; // max range on DEF

            const zoneStart = Math.max(att.unitPos, def.tipPos);
            const zoneEnd = Math.min(def.unitPos, att.tipPos);
            if (zoneEnd <= zoneStart) return;

            const screenStart = mapToScreen(zoneStart);
            const screenEnd = mapToScreen(zoneEnd);
            const y = Y_POSITIONS[type];

            const zone = document.createElement('div');
            zone.className = 'bf-firefight-zone';
            zone.dataset.indType = type;
            zone.style.left = `${screenStart}%`;
            zone.style.width = `${screenEnd - screenStart}%`;
            zone.style.top = `${y}%`;
            container.appendChild(zone);
        });
    }

    function highlightHoveredIndicators(type, side, repTier) {
        const army = side === 'ATT' ? currentAttackerArmy : currentDefenderArmy;
        if (!army) return;

        let layer = null;
        if (repTier != null) {
            layer = army.layers.find((l) => l.type === type && l.tier === repTier && l.count > 0);
        }
        if (!layer) {
            // Fallback: pick the highest buffed range for this (type, side).
            army.layers.forEach((l) => {
                if (l.type === type && l.count > 0 && (!layer || l.range > layer.range)) layer = l;
            });
        }
        if (!layer || !layer.range || layer.range <= 50) return;

        const enginePos = getLayerEnginePos(type, layer.tier, side);
        const extentPos = side === 'ATT'
            ? Math.min(enginePos + layer.range, BATTLEFIELD_LENGTH)
            : Math.max(enginePos - layer.range, 0);

        const screenStart = mapToScreen(Math.min(enginePos, extentPos));
        const screenEnd = mapToScreen(Math.max(enginePos, extentPos));
        const color = TroopData.TYPES[type].color;

        const bar = document.createElement('div');
        bar.className = 'bf-range-indicator bf-range-bar-hover';
        bar.dataset.indSide = side;
        bar.dataset.indType = type;
        bar.style.left = `${screenStart}%`;
        bar.style.width = `${screenEnd - screenStart}%`;
        bar.style.top = `${Y_POSITIONS[type]}%`;
        bar.style.background = color;
        container.appendChild(bar);
    }

    function resetHoveredIndicators(type, side) {
        container.querySelectorAll(`.bf-range-bar-hover[data-ind-side="${side}"][data-ind-type="${type}"]`).forEach((el) => {
            el.remove();
        });
    }

    // --- Helpers ---

    function snapshotArmy(army) {
        return army.layers.map((l) => ({
            type: l.type, tier: l.tier, count: l.count, startCount: l.startCount
        }));
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
