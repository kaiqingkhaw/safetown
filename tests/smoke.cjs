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
