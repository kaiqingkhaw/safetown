// Focused regression tests for the prototype's triage, follow-up, and storage rules.
// Run: npm test
const fs = require("fs"),
  vm = require("vm"),
  assert = require("assert");
const node = () => ({
  innerHTML: "",
  style: {},
  classList: { toggle() {} },
  open: false,
  focus() {},
  querySelector() {
    return null;
  },
});
const nodes = new Map();
const stored = new Map();
let storageFails = false;
const sandbox = {
  console,
  Date,
  JSON,
  String,
  Number,
  Math,
  Array,
  Object,
  Set,
  Promise,
  URL,
  Blob,
  setTimeout: () => 0,
  clearTimeout() {},
  location: { hash: "" },
  window: { addEventListener() {} },
  localStorage: {
    getItem: (k) => stored.get(k) || null,
    setItem: (k, v) => {
      if (storageFails) throw Error("Quota exceeded");
      stored.set(k, v);
    },
  },
  document: {
    querySelector: (s) => {
      if (!nodes.has(s)) nodes.set(s, node());
      return nodes.get(s);
    },
    querySelectorAll: () => [],
    addEventListener() {},
    createElement: node,
  },
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(__dirname + "/../public/app.js", "utf8"), sandbox);
const run = (code) => vm.runInContext(code, sandbox);
assert.equal(run("triage('Obstruction','Blocked').priority"), "High");
assert.equal(run("triage('Obstruction','Passable').priority"), "Medium");
assert.equal(run("matches('Poor lighting','Lakeside Walk').length"), 1);
assert.equal(
  run(
    "overdue({status:'In progress',priority:'High',created:hoursAgo(30),lastManagementUpdate:hoursAgo(1)})",
  ),
  false,
  "A recent management update restarts follow-up timing",
);
assert.equal(
  run("overdue({status:'In progress',priority:'High',created:hoursAgo(30)})"),
  true,
);
assert.equal(
  run(
    "overdue({status:'Awaiting verification',priority:'High',created:hoursAgo(100)})",
  ),
  false,
  "Resident review is not in the management follow-up queue",
);
assert.equal(
  run(
    "overdue({status:'Reported',priority:'High',created:hoursAgo(100),cycleOpened:hoursAgo(1)})",
  ),
  false,
  "Reopening starts a new follow-up window without rewriting creation",
);
assert.equal(run("reports.filter(isSample).length"), 4);
const before = run("JSON.stringify(reports)");
storageFails = true;
assert.equal(run("commitChange(()=>{reports[0].votes+=1})"), false);
assert.equal(
  run("JSON.stringify(reports)"),
  before,
  "Failed storage must roll back in-memory state",
);
storageFails = false;
assert.equal(run("commitChange(()=>{reports[0].votes+=1})"), true);
assert.equal(JSON.parse(stored.get("safetown-v2"))[0].votes, 8);
assert.equal(
  run("esc('<img onerror=alert(1)>')"),
  "&lt;img onerror=alert(1)&gt;",
);
for (const hash of ["", "#missing", "#__proto__", "#constructor", "#toString"]) {
  assert.equal(run(`pageName(${JSON.stringify(hash)})`), "overview");
  sandbox.location.hash = hash;
  assert.doesNotThrow(() => run("render()"));
}
assert.equal(run("pageName('#reports')"), "reports");
assert.equal(run("decodeReports(null).length"), 4);
assert.equal(run("decodeReports('[]').length"), 0);
assert.equal(run("decodeReports(JSON.stringify(seed())).length"), 4);
for (const raw of ['{', 'null', '{}', '[null]', '[{}]']) {
  assert.throws(() => run(`decodeReports(${JSON.stringify(raw)})`));
}
assert.throws(() => run("decodeReports(JSON.stringify([seed()[0], seed()[0]]))"));
assert.equal(run("validReport({...seed()[0], photo: 'bad-image'})"), false);
assert.equal(run("validReport({...seed()[0], events: null})"), false);
run("unreadableRecords = 'broken data'");
const savedBeforeRecovery = stored.get("safetown-v2");
assert.equal(run("commitChange(()=>reports[0].votes++)"), false);
assert.equal(stored.get("safetown-v2"), savedBeforeRecovery);
run("unreadableRecords = null");
console.log("PASS: reporting, persistence, invalid routes and saved-data recovery regression checks.");

// Backups accept legacy exports and version 1 without overwriting current records.
const backup = (reports, extra = {}) => JSON.stringify({ project: 'SafeTown', reports, ...extra });
const original = JSON.parse(run('JSON.stringify(seed())'));
const decoded = raw => run(`decodeBackup(${JSON.stringify(raw)})`);
assert.equal(decoded(backup(original)).length, 4);
assert.equal(decoded(backup(original, { schemaVersion: 1 })).length, 4);
assert.equal(decoded(backup([])).length, 0);
for (const raw of ['{', 'null', '{}', backup(original, {schemaVersion: 99}), backup([original[0], original[0]]), backup([{...original[0], priority:'Urgent'}]), backup([{...original[0], sample:'false'}]), backup([{...original[0], id:'ST-99999999999999999999'}]), backup([{...original[0], resolvedAt:'invalid'}]), backup([{...original[0], photo:'javascript:alert(1)'}]), backup(Array(1001).fill(original[0]))]) {
  assert.throws(() => decoded(raw));
}
assert.throws(() => decoded(' '.repeat(10 * 1024 * 1024 + 1)));
run('reports = decodeBackup(JSON.stringify({project:"SafeTown", reports:seed()}))');
assert.equal(run('planImport(reports, reports).duplicates'), 4);
assert.equal(run('planImport(reports, [{...reports[0], title:"Changed"}]).conflicts.length'), 1);
assert.equal(run('planImport(reports, [{...reports[0], id:"ST-2000"}]).additions.length'), 1);
assert.equal(run('planImport(reports, [Object.fromEntries(Object.entries(reports[0]).reverse())]).duplicates'), 1);
run('pendingImport = [{...reports[0], id:"ST-2000"}]');
const beforeImport = run('JSON.stringify(reports)');
storageFails = true;
run('applyImport()');
assert.equal(run('JSON.stringify(reports)'), beforeImport, 'Quota failure rolls back the whole import');
assert.equal(run('pendingImport.length'), 1, 'Failed import remains available for retry');
storageFails = false;
run('modal.close = () => {}; applyImport()');
assert.equal(run('reports.length'), 5);
assert.equal(JSON.parse(stored.get('safetown-v2')).length, 5);
assert.equal(run('pendingImport'), null);
run('pendingImport = [{...reports[0], title:"Conflict"}]; applyImport()');
assert.equal(run('reports.length'), 5, 'Conflicts do not change stored reports');
console.log('PASS: backup compatibility, validation, conflict detection, idempotency and atomic import.');
