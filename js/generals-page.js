var GeneralsPage = (function () {
    'use strict';

    const TROOP_TYPE_OPTIONS = [
        { value: 'All',      label: 'Troop Type', hidden: true },
        { value: 'GROUND',   label: 'Ground',   cls: 'color-ground' },
        { value: 'RANGED',   label: 'Ranged',   cls: 'color-ranged' },
        { value: 'MOUNTED',  label: 'Mounted',  cls: 'color-mounted' },
        { value: 'SIEGE',    label: 'Siege',    cls: 'color-siege' },
        { value: 'SUB_CITY', label: 'Sub City', cls: 'color-sub-city' },
        { value: 'DUTY',     label: 'Duty',     cls: 'color-duty' }
    ];
    const TAVERN_OPTIONS = [
        { value: 'All', label: 'Tavern', hidden: true },
        { value: 'yes', label: 'Yes' },
        { value: 'no',  label: 'No' }
    ];
    const TYPE_OPTIONS = [
        { value: 'All',  label: 'Type', hidden: true },
        { value: 'A',    label: 'A (Attack)' },
        { value: 'U',    label: 'U (Universal)' },
        { value: 'none', label: '—' }
    ];
    const DISCOUNT_OPTIONS = [
        { value: 'All',              label: 'Cost Reduction', hidden: true },
        { value: 'runestone_blood',  label: 'Runestone + Blood' },
        { value: 'runestone',        label: 'Runestones' }
    ];
    const TROOP_TYPE_CLASS_MAP = {
        'GROUND':   'color-ground',
        'RANGED':   'color-ranged',
        'MOUNTED':  'color-mounted',
        'SIEGE':    'color-siege',
        'SUB_CITY': 'color-sub-city',
        'DUTY':     'color-duty'
    };
    const TROOP_TYPE_CLASSES = ['color-ground', 'color-ranged', 'color-mounted', 'color-siege', 'color-sub-city', 'color-duty'];

    function renderOption(o) {
        const attrs = ['value="' + escapeHtml(o.value) + '"'];
        if (o.hidden) attrs.push('hidden');
        if (o.cls) attrs.push('class="' + escapeHtml(o.cls) + '"');
        return '<option ' + attrs.join(' ') + '>' + escapeHtml(o.label) + '</option>';
    }
    function renderSelectWithClear(id, options, extraClass) {
        const clsAttr = extraClass ? ' class="' + escapeHtml(extraClass) + '"' : '';
        return '<span class="generals-select-wrap">' +
            '<select id="' + escapeHtml(id) + '"' + clsAttr + '>' +
                options.map(renderOption).join('') +
            '</select>' +
            '<button type="button" class="generals-select-clear" tabindex="-1" title="Clear filter" aria-label="Clear filter">✕</button>' +
        '</span>';
    }
    const DISCOUNT_LABELS = {
        'runestone':       'Runestones',
        'runestone_blood': 'Runestone + Blood'
    };

    let cache = null;
    let mounted = false;
    let sortBy = 'name';
    let sortDir = 'asc';

    const COLUMNS = [
        { key: 'name',                  label: 'Name',           numeric: false },
        { key: 'troop_type',            label: 'Troop Type',     numeric: false },
        { key: 'tavern',                label: 'Tavern',         numeric: false },
        { key: 'type',                  label: 'Type',           numeric: false },
        { key: 'main_skill_atk_pct',         label: 'ATK %',          numeric: true  },
        { key: 'main_skill_def_pct',         label: 'DEF %',          numeric: true  },
        { key: 'main_skill_hp_pct',          label: 'HP %',           numeric: true  },
        { key: 'main_skill_march_size_pct',  label: 'March Size %',   numeric: true  }
    ];

    function escapeHtml(s) {
        if (s === null || s === undefined) return '';
        return String(s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function fmtNumber(v) {
        if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) return '—';
        if (typeof v === 'number') {
            return Number.isInteger(v) ? String(v) : v.toFixed(2);
        }
        return String(v);
    }

    function fmtPct(v) {
        if (v === null || v === undefined) return '—';
        if (typeof v === 'number') return v.toFixed(1) + '%';
        return String(v);
    }

    function fmtValue(v) {
        if (v === null || v === undefined || v === '') return '—';
        if (typeof v === 'boolean') return v ? 'yes' : 'no';
        if (typeof v === 'number') return fmtNumber(v);
        return String(v);
    }

    const TROOP_TYPE_ABBR = {
        GROUND:   { abbr: 'G',  cls: 'color-ground' },
        RANGED:   { abbr: 'R',  cls: 'color-ranged' },
        MOUNTED:  { abbr: 'M',  cls: 'color-mounted' },
        SIEGE:    { abbr: 'S',  cls: 'color-siege' },
        SUB_CITY: { abbr: 'SC', cls: 'color-sub-city' },
        DUTY:     { abbr: 'D',  cls: 'color-duty' }
    };
    function fmtTroopTypeCell(t) {
        const info = TROOP_TYPE_ABBR[t];
        if (!info) return '<td>—</td>';
        return '<td class="' + info.cls + '" title="' + escapeHtml(t) + '">' + info.abbr + '</td>';
    }

    function getContainer() {
        return document.getElementById('view-generals');
    }

    function mountSkeleton() {
        const root = getContainer();
        if (!root) return;
        root.innerHTML =
            '<section class="info-content">' +
              '<div class="generals-topbar">' +
                '<a href="#" class="back-link" id="generals-back-link" data-view="simulator">&#8592; Back to Setup</a>' +
                '<button type="button" id="generals-download-btn" class="generals-download-btn" title="Download the generals dataset as JSON">&#8681; Download JSON</button>' +
              '</div>' +
              '<h2>Generals</h2>' +
              '<p class="info-lead">' +
                'Reference lookup for Evony generals. Search by name; filter by troop type, tavern source, and ascending type. ' +
                'Click a row to see every field.' +
              '</p>' +
              '<div class="generals-filters">' +
                '<input type="search" id="generals-search" placeholder="Search by name…" autocomplete="off" />' +
                renderSelectWithClear('generals-type-filter', TROOP_TYPE_OPTIONS, 'generals-troop-type-filter') +
                renderSelectWithClear('generals-tavern-filter', TAVERN_OPTIONS) +
                renderSelectWithClear('generals-asc-filter', TYPE_OPTIONS) +
                renderSelectWithClear('generals-discount-filter', DISCOUNT_OPTIONS) +
                '<span class="generals-count" id="generals-count"></span>' +
              '</div>' +
              '<div class="generals-table-wrap" id="generals-table-wrap"></div>' +
              '<div class="generals-detail-wrap" id="generals-detail-wrap" style="display:none"></div>' +
              '<div class="generals-status" id="generals-status"></div>' +
            '</section>';

        const search = document.getElementById('generals-search');
        const typeFilter = document.getElementById('generals-type-filter');
        const tavernFilter = document.getElementById('generals-tavern-filter');
        const ascFilter = document.getElementById('generals-asc-filter');
        const discountFilter = document.getElementById('generals-discount-filter');
        const placeholderSelects = [typeFilter, tavernFilter, ascFilter, discountFilter];
        function syncPlaceholderState(sel) {
            if (!sel) return;
            sel.classList.toggle('is-placeholder', sel.value === 'All');
        }
        function syncTroopTypeColor(sel) {
            if (!sel) return;
            TROOP_TYPE_CLASSES.forEach(function (c) { sel.classList.remove(c); });
            const cls = TROOP_TYPE_CLASS_MAP[sel.value];
            if (cls) sel.classList.add(cls);
        }
        function syncClearVisibility(sel) {
            if (!sel) return;
            const wrap = sel.closest('.generals-select-wrap');
            if (wrap) wrap.classList.toggle('has-value', sel.value !== 'All');
        }
        placeholderSelects.forEach(syncPlaceholderState);
        placeholderSelects.forEach(syncClearVisibility);
        syncTroopTypeColor(typeFilter);

        if (search) search.addEventListener('input', rerender);
        placeholderSelects.forEach(function (sel) {
            if (!sel) return;
            sel.addEventListener('change', function () {
                syncPlaceholderState(sel);
                syncClearVisibility(sel);
                if (sel === typeFilter) syncTroopTypeColor(sel);
                rerender();
            });
            const wrap = sel.closest('.generals-select-wrap');
            const clearBtn = wrap && wrap.querySelector('.generals-select-clear');
            if (clearBtn) {
                clearBtn.addEventListener('click', function () {
                    sel.value = 'All';
                    syncPlaceholderState(sel);
                    syncClearVisibility(sel);
                    if (sel === typeFilter) syncTroopTypeColor(sel);
                    rerender();
                });
            }
        });

        const downloadBtn = document.getElementById('generals-download-btn');
        if (downloadBtn) downloadBtn.addEventListener('click', downloadJson);

        const backLink = document.getElementById('generals-back-link');
        if (backLink) {
            backLink.addEventListener('click', function (e) {
                e.preventDefault();
                if (typeof InfoPages !== 'undefined' && InfoPages.switchView) {
                    InfoPages.switchView('simulator');
                    window.scrollTo(0, 0);
                }
            });
        }

        mounted = true;
    }

    function setStatus(msg, isError) {
        const el = document.getElementById('generals-status');
        if (!el) return;
        el.textContent = msg || '';
        el.classList.toggle('error', !!isError);
    }

    function compareValues(a, b, numeric) {
        const aNull = a === null || a === undefined;
        const bNull = b === null || b === undefined;
        if (numeric) {
            const an = aNull ? -1 : Number(a);
            const bn = bNull ? -1 : Number(b);
            if (an < bn) return -1;
            if (an > bn) return 1;
            return 0;
        }
        if (aNull && bNull) return 0;
        if (aNull) return 1;   // nulls sort to end for non-numeric
        if (bNull) return -1;
        if (typeof a === 'boolean' || typeof b === 'boolean') {
            const an = a === true ? 1 : 0;
            const bn = b === true ? 1 : 0;
            return an - bn;
        }
        return String(a).toLowerCase().localeCompare(String(b).toLowerCase());
    }

    function sortRows(rows) {
        const col = COLUMNS.find(function (c) { return c.key === sortBy; }) || COLUMNS[0];
        const dir = sortDir === 'desc' ? -1 : 1;
        const out = rows.slice();
        out.sort(function (a, b) {
            const cmp = compareValues(a[col.key], b[col.key], col.numeric);
            if (cmp !== 0) return cmp * dir;
            // Stable secondary sort by name (asc) so equal-key rows have a deterministic order
            return compareValues(a.name, b.name, false);
        });
        return out;
    }

    function matchesFilters(entry, nameQuery, typeFilter, tavernFilter, ascFilter, discountFilter) {
        if (typeFilter !== 'All' && entry.troop_type !== typeFilter) return false;
        if (tavernFilter === 'yes' && entry.tavern !== true) return false;
        if (tavernFilter === 'no' && entry.tavern !== false) return false;
        if (ascFilter === 'A' && entry.type !== 'A') return false;
        if (ascFilter === 'U' && entry.type !== 'U') return false;
        if (ascFilter === 'none' && entry.type != null) return false;
        if (discountFilter === 'runestone' && entry.runestone_discount !== 'runestone') return false;
        if (discountFilter === 'runestone_blood' && entry.runestone_discount !== 'runestone_blood') return false;
        if (nameQuery && String(entry.name || '').toLowerCase().indexOf(nameQuery) === -1) return false;
        return true;
    }

    function renderTable(rows) {
        const wrap = document.getElementById('generals-table-wrap');
        if (!wrap) return;
        if (rows.length === 0) {
            wrap.innerHTML = '<p class="generals-empty">No generals match the current filters.</p>';
            return;
        }
        const parts = [];
        const headerCells = COLUMNS.map(function (c) {
            const arrow = c.key === sortBy ? (sortDir === 'desc' ? ' ▼' : ' ▲') : '';
            const cls = (c.numeric ? 'num ' : '') + 'sortable' + (c.key === sortBy ? ' active' : '');
            return '<th class="' + cls + '" data-sort-key="' + escapeHtml(c.key) + '">' +
                escapeHtml(c.label) + escapeHtml(arrow) +
            '</th>';
        }).join('');
        parts.push('<table class="generals-table info-table"><thead><tr>' + headerCells + '</tr></thead><tbody>');
        for (let i = 0; i < rows.length; i++) {
            const e = rows[i];
            parts.push(
                '<tr class="generals-row" data-name="' + escapeHtml(e.name) + '">' +
                  '<td>' + escapeHtml(e.name) + '</td>' +
                  fmtTroopTypeCell(e.troop_type) +
                  '<td>' + (e.tavern === true ? 'Yes' : (e.tavern === false ? 'No' : '—')) + '</td>' +
                  '<td>' + (e.type ? escapeHtml(e.type) : '—') + '</td>' +
                  '<td class="num">' + fmtPct(e.main_skill_atk_pct) + '</td>' +
                  '<td class="num">' + fmtPct(e.main_skill_def_pct) + '</td>' +
                  '<td class="num">' + fmtPct(e.main_skill_hp_pct) + '</td>' +
                  '<td class="num">' + fmtPct(e.main_skill_march_size_pct) + '</td>' +
                '</tr>'
            );
        }
        parts.push('</tbody></table>');
        wrap.innerHTML = parts.join('');

        wrap.querySelectorAll('.generals-row').forEach(function (row) {
            row.addEventListener('click', function () {
                const name = row.getAttribute('data-name');
                openDetail(name);
            });
        });
        wrap.querySelectorAll('th.sortable').forEach(function (th) {
            th.addEventListener('click', function () {
                const key = th.getAttribute('data-sort-key');
                if (key === sortBy) {
                    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    sortBy = key;
                    sortDir = 'asc';
                }
                rerender();
            });
        });
    }

    function rerender() {
        if (!cache) return;
        const search = document.getElementById('generals-search');
        const typeFilter = document.getElementById('generals-type-filter');
        const tavernFilter = document.getElementById('generals-tavern-filter');
        const ascFilter = document.getElementById('generals-asc-filter');
        const countEl = document.getElementById('generals-count');
        const q = search ? search.value.trim().toLowerCase() : '';
        const t = typeFilter ? typeFilter.value : 'All';
        const tav = tavernFilter ? tavernFilter.value : 'All';
        const asc = ascFilter ? ascFilter.value : 'All';
        const discountFilter = document.getElementById('generals-discount-filter');
        const disc = discountFilter ? discountFilter.value : 'All';
        const filtered = cache.filter(function (e) { return matchesFilters(e, q, t, tav, asc, disc); });
        const rows = sortRows(filtered);
        renderTable(rows);
        if (countEl) {
            countEl.textContent = rows.length + ' / ' + cache.length + ' generals';
        }
    }

    function renderDetailGroup(title, pairs) {
        const rows = pairs.map(function (p) {
            return '<tr><th>' + escapeHtml(p[0]) + '</th><td>' + escapeHtml(fmtValue(p[1])) + '</td></tr>';
        }).join('');
        return '<h3>' + escapeHtml(title) + '</h3><table class="generals-detail-table">' + rows + '</table>';
    }

    function openDetail(name) {
        if (!cache) return;
        const entry = cache.find(function (e) { return e.name === name; });
        if (!entry) return;
        const tableWrap = document.getElementById('generals-table-wrap');
        const detailWrap = document.getElementById('generals-detail-wrap');
        const filters = document.querySelector('.generals-filters');
        const downloadBtn = document.getElementById('generals-download-btn');
        if (!tableWrap || !detailWrap) return;

        const expectedHash = '#generals/' + encodeURIComponent(name);
        if (location.hash !== expectedHash) {
            if (typeof InfoPages !== 'undefined' && InfoPages.setHashSilently) {
                InfoPages.setHashSilently(expectedHash);
            } else {
                location.hash = expectedHash;
            }
        }

        const parts = [];
        parts.push('<button type="button" class="generals-back-btn">&#8592; Back</button>');
        parts.push('<h2 class="generals-detail-name">' + escapeHtml(entry.name) + '</h2>');
        parts.push(renderDetailGroup('Identity', [
            ['Name', entry.name],
            ['Troop Type', entry.troop_type],
            ['Type', entry.type],
            ['Role', entry.role],
            ['Tavern', entry.tavern],
            ['Runestone Cost', DISCOUNT_LABELS[entry.runestone_discount] || '—']
        ]));
        parts.push(renderDetailGroup('Main Skill Buffs', [
            ['Main Skill ATK %', fmtPct(entry.main_skill_atk_pct)],
            ['Main Skill DEF %', fmtPct(entry.main_skill_def_pct)],
            ['Main Skill HP %', fmtPct(entry.main_skill_hp_pct)],
            ['Main Skill March Size %', fmtPct(entry.main_skill_march_size_pct)]
        ]));
        parts.push(renderDetailGroup('Stat Totals', [
            ['Total ATK', entry.total_atk],
            ['Total DEF', entry.total_def],
            ['Total HP', entry.total_hp],
            ['Total March Size', entry.total_march_size],
            ['Total ATK with attrs', entry.total_atk_with_attrs],
            ['Total DEF with attrs', entry.total_def_with_attrs],
            ['Total LDR with attrs', entry.total_ldr_with_attrs]
        ]));
        parts.push(renderDetailGroup('Base / Max / Growth', [
            ['Base ATK', entry.base_atk],
            ['Base DEF', entry.base_def],
            ['Base LDR', entry.base_ldr],
            ['Max ATK', entry.max_atk],
            ['Max DEF', entry.max_def],
            ['Max LDR', entry.max_ldr],
            ['Growth ATK', entry.growth_atk],
            ['Growth DEF', entry.growth_def],
            ['Growth LDR', entry.growth_ldr]
        ]));

        detailWrap.innerHTML = parts.join('');
        tableWrap.style.display = 'none';
        if (filters) filters.style.display = 'none';
        if (downloadBtn) downloadBtn.style.display = 'none';
        detailWrap.style.display = '';

        const back = detailWrap.querySelector('.generals-back-btn');
        if (back) back.addEventListener('click', closeDetail);
        window.scrollTo(0, 0);
    }

    function closeDetail() {
        const tableWrap = document.getElementById('generals-table-wrap');
        const detailWrap = document.getElementById('generals-detail-wrap');
        const filters = document.querySelector('.generals-filters');
        const downloadBtn = document.getElementById('generals-download-btn');
        if (detailWrap) {
            detailWrap.style.display = 'none';
            detailWrap.innerHTML = '';
        }
        if (tableWrap) tableWrap.style.display = '';
        if (filters) filters.style.display = '';
        if (downloadBtn) downloadBtn.style.display = '';

        if (location.hash.indexOf('#generals/') === 0) {
            if (typeof InfoPages !== 'undefined' && InfoPages.setHashSilently) {
                InfoPages.setHashSilently('#generals');
            } else {
                location.hash = '#generals';
            }
        }
    }

    function loadData() {
        if (cache) return;
        if (typeof GENERALS_DATA === 'undefined' || !Array.isArray(GENERALS_DATA)) {
            setStatus('Failed to load generals: data module missing.', true);
            return;
        }
        cache = GENERALS_DATA;
        setStatus('', false);
    }

    function downloadJson() {
        const payload = cache || (typeof GENERALS_DATA !== 'undefined' ? GENERALS_DATA : null);
        if (!payload) return;
        const blob = new Blob([JSON.stringify(payload, null, 2) + '\n'], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generals.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    }

    function openDetailByName(name) {
        if (!cache) return false;
        const match = cache.find(function (e) { return e.name === name; });
        if (!match) return false;
        openDetail(name);
        return true;
    }

    function activate(opts) {
        if (!mounted) mountSkeleton();
        loadData();
        if (!cache) return;
        const detailName = opts && opts.detailName;
        if (detailName) {
            if (!openDetailByName(detailName)) rerender();
        } else {
            if (document.getElementById('generals-detail-wrap') &&
                document.getElementById('generals-detail-wrap').style.display !== 'none' &&
                document.getElementById('generals-detail-wrap').innerHTML !== '') {
                // already in detail view — close it when activated without a detail name
                closeDetail();
            }
            rerender();
        }
    }

    return { activate: activate, openDetailByName: openDetailByName };
})();
