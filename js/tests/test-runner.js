var TestRunner = (function () {
    'use strict';

    const suites = [];
    let current = null;

    function describe(name, fn) {
        const suite = { name: name, tests: [] };
        suites.push(suite);
        current = suite;
        try {
            fn();
        } finally {
            current = null;
        }
    }

    function it(name, fn) {
        if (!current) throw new Error('it() called outside describe()');
        current.tests.push({ name: name, fn: fn });
    }

    const assert = {
        equal: function (actual, expected, msg) {
            if (actual !== expected) {
                throw new Error((msg ? msg + ': ' : '') + 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
            }
        },
        approx: function (actual, expected, tol, msg) {
            if (typeof actual !== 'number' || isNaN(actual)) {
                throw new Error((msg ? msg + ': ' : '') + 'expected number near ' + expected + ', got ' + actual);
            }
            if (Math.abs(actual - expected) > tol) {
                throw new Error((msg ? msg + ': ' : '') + 'expected ' + expected + ' +/- ' + tol + ', got ' + actual);
            }
        },
        truthy: function (actual, msg) {
            if (!actual) throw new Error((msg ? msg + ': ' : '') + 'expected truthy, got ' + actual);
        },
        falsy: function (actual, msg) {
            if (actual) throw new Error((msg ? msg + ': ' : '') + 'expected falsy, got ' + actual);
        },
        greaterThan: function (actual, bound, msg) {
            if (!(actual > bound)) throw new Error((msg ? msg + ': ' : '') + 'expected ' + actual + ' > ' + bound);
        },
        lessThan: function (actual, bound, msg) {
            if (!(actual < bound)) throw new Error((msg ? msg + ': ' : '') + 'expected ' + actual + ' < ' + bound);
        }
    };

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function run(containerEl) {
        let total = 0, passed = 0, failed = 0;
        const parts = [];
        const failures = [];
        parts.push('<div class="summary" id="summary"></div>');
        suites.forEach(function (suite) {
            parts.push('<div class="suite"><h2>' + esc(suite.name) + '</h2>');
            suite.tests.forEach(function (test) {
                total++;
                try {
                    test.fn();
                    passed++;
                    parts.push('<div class="row pass">&#10003; ' + esc(test.name) + '</div>');
                } catch (err) {
                    failed++;
                    failures.push({ suite: suite.name, test: test.name, msg: err.message });
                    parts.push('<div class="row fail">&#10007; ' + esc(test.name) + '<div class="err">' + esc(err.message) + '</div></div>');
                }
            });
            parts.push('</div>');
        });
        if (containerEl) {
            containerEl.innerHTML = parts.join('');
            const cls = failed === 0 ? 'ok' : 'bad';
            const summaryEl = containerEl.querySelector && containerEl.querySelector('#summary');
            if (summaryEl) {
                summaryEl.className = 'summary ' + cls;
                summaryEl.textContent = 'Tests: ' + total + '   Passed: ' + passed + '   Failed: ' + failed;
            }
        }
        const header = 'Tests: ' + total + '   Passed: ' + passed + '   Failed: ' + failed;
        if (typeof console !== 'undefined') {
            failures.forEach(function (f) {
                console.log('FAIL [' + f.suite + '] ' + f.test + ': ' + f.msg);
            });
            console.log(header);
        }
        return { total: total, passed: passed, failed: failed, failures: failures };
    }

    return { describe: describe, it: it, assert: assert, run: run };
})();

var describe = TestRunner.describe;
var it = TestRunner.it;
var assert = TestRunner.assert;
