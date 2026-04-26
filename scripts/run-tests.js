// Dev harness: runs tests.html's test suite in Node via vm.
// Not part of the shipped app; used for CI-style verification.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');

const context = {
    console: console,
    Math: Math,
    JSON: JSON,
    Infinity: Infinity,
    isNaN: isNaN,
    isFinite: isFinite,
    parseInt: parseInt,
    parseFloat: parseFloat,
    Error: Error,
    Object: Object,
    Array: Array,
    Number: Number,
    String: String,
    Boolean: Boolean,
    Date: Date,
    Promise: Promise
};
context.globalThis = context;
vm.createContext(context);

const files = [
    'js/troop-data.js',
    'js/battle-engine.js',
    'js/generals-data.js',
    'js/covenants-data.js',
    'js/setup-persistence.js',
    'js/tests/test-runner.js',
    'js/tests/test-damage-formula.js',
    'js/tests/test-counter-formula.js',
    'js/tests/test-multipliers.js',
    'js/tests/test-phase-order.js',
    'js/tests/test-movement.js',
    'js/tests/test-engagement-lock.js',
    'js/tests/test-battle-end.js',
    'js/tests/test-spec-anomalies.js',
    'js/tests/test-archer-tower.js',
    'js/tests/test-generals-data.js',
    'js/tests/test-covenants-data.js',
    'js/tests/test-setup-persistence-codec.js'
];

for (const f of files) {
    const code = fs.readFileSync(path.join(repoRoot, f), 'utf-8');
    vm.runInContext(code, context, { filename: f });
}

const result = context.TestRunner.run(null);
process.exit(result.failed > 0 ? 1 : 0);
