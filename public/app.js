const KEY = "safetown-v2";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const locations = [
  "Lakeside Walk",
  "Jalan Rimba 3",
  "Community Garden",
  "Market Square",
  "Park Entrance",
];
const icons = {
  "Poor lighting": "☼",
  "Damaged walkway": "▧",
  Obstruction: "♧",
  Other: "◇",
};
const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();
function seed() {
  return [
    {
      id: "ST-1042",
      title: "Pathway light not working",
      category: "Poor lighting",
      location: "Lakeside Walk",
      description:
        "The light beside the lakeside junction is not turning on in the evening. The walkway is difficult to see.",
      priority: "High",
      barrier: "Passable",
      affected: "People walking after dark",
      status: "In progress",
      created: hoursAgo(52),
      votes: 7,
      confirmed: false,
      assignee: "Electrical team",
      events: [
        { text: "Resident reported a lighting hazard", at: hoursAgo(52) },
        { text: "Assigned to Electrical team", at: hoursAgo(30) },
      ],
    },
    {
      id: "ST-1043",
      title: "Uneven paving near the playground",
      category: "Damaged walkway",
      location: "Jalan Rimba 3",
      description:
        "Several paving blocks are raised along the approach to the playground, making access difficult for strollers and wheelchair users.",
      priority: "High",
      barrier: "Passable",
      affected: "Wheelchair and mobility-aid users",
      status: "Reported",
      created: hoursAgo(28),
      votes: 4,
      events: [{ text: "Resident submitted a report", at: hoursAgo(28) }],
    },
    {
      id: "ST-1044",
      title: "Fallen branch across the footpath",
      category: "Obstruction",
      location: "Community Garden",
      description:
        "A fallen branch blocks part of the footpath beside the garden entrance.",
      priority: "Medium",
      barrier: "Passable",
      affected: "Everyone using this path",
      status: "Reported",
      created: hoursAgo(4),
      votes: 2,
      events: [{ text: "Resident submitted a report", at: hoursAgo(4) }],
    },
    {
      id: "ST-1040",
      title: "Loose drain cover secured",
      category: "Damaged walkway",
      location: "Market Square",
      description:
        "The loose drain cover has been secured. A resident confirmed the repair during a follow-up visit.",
      priority: "Medium",
      status: "Resolved",
      created: hoursAgo(96),
      votes: 5,
      events: [
        { text: "Hazard reported", at: hoursAgo(96) },
        {
          text: "Maintenance completed a repair (sample record)",
          at: hoursAgo(50),
        },
        {
          text: "Resident verified the repair (sample record)",
          at: hoursAgo(46),
        },
      ],
    },
  ];
}
let reports;
try {
  reports = JSON.parse(localStorage.getItem(KEY)) || seed();
  if (!Array.isArray(reports)) reports = seed();
} catch {
  reports = seed();
}
reports.forEach((r) => {
  if (r.sample === undefined) r.sample = true;
});
let routeChoice = "avoid";
let routePreference = "standard";
const app = document.querySelector("#app"),
  modal = document.querySelector("#modal");
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(reports));
    return true;
  } catch {
    toast(
      "Browser storage is full. Use a smaller photo or export your reports.",
    );
    return false;
  }
}
function toast(t) {
  const el = document.querySelector("#toast");
  if (modal.open) {
    let message = modal.querySelector(".dialog-notice");
    if (!message) {
      message = document.createElement("div");
      message.className = "dialog-notice";
      message.setAttribute("role", "status");
      modal.querySelector(".modal-body").append(message);
    }
    message.textContent = t;
  }
  el.textContent = t;
  el.style.display = "block";
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => (el.style.display = "none"), 4000);
}
const stamp = (d) =>
  new Date(d).toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const overdue = (r) =>
  r.status !== "Resolved" &&
  r.status !== "Awaiting verification" &&
  (Date.now() -
    new Date(r.lastManagementUpdate || r.cycleOpened || r.created)) /
    3600000 >
    (r.priority === "High" ? 24 : 48);
const badge = (r) =>
  `<span class="badge ${r.status === "Resolved" ? "green" : r.status === "In progress" ? "blue" : r.status === "Awaiting verification" ? "green" : ""}">${esc(r.status)}</span>`;
const locationPoints = {
  "Lakeside Walk": [230, 214],
  "Jalan Rimba 3": [175, 85],
  "Community Garden": [145, 230],
  "Market Square": [70, 260],
  "Park Entrance": [250, 115],
};
const active = (r) => r.status !== "Resolved";
const elapsed = (d) => Math.max(0, (Date.now() - new Date(d)) / 3600000);
const age = (d) =>
  elapsed(d) < 1
    ? "Just now"
    : elapsed(d) < 24
      ? `${Math.floor(elapsed(d))}h ago`
      : `${Math.floor(elapsed(d) / 24)}d ago`;
const isSample = (r) => r.sample === true;
function heading(title, sub, button = true) {
  return `<div class="heading"><div><div class="eyebrow">SERI RIMBA / COMMUNITY CARE</div><h1>${title}</h1><div class="subtitle">${sub}</div></div>${button ? '<button class="btn" data-action="report">＋ Report an issue</button>' : ""}</div>`;
}
function triage(category, barrier) {
  if (barrier === "Blocked")
    return {
      priority: "High",
      reason:
        "The path is reported as blocked. Management should review access and an alternative promptly.",
    };
  if (category === "Poor lighting")
    return {
      priority: "High",
      reason:
        "A lighting fault may affect visibility after dark. Management must confirm the conditions.",
    };
  if (category === "Damaged walkway")
    return {
      priority: "High",
      reason:
        "An uneven walking surface can affect mobility. Management should assess severity on site.",
    };
  return {
    priority: "Medium",
    reason: "A passable obstruction or other concern needs management review.",
  };
}
function matches(category, location) {
  return reports.filter(
    (r) => active(r) && r.category === category && r.location === location,
  );
}
function commitChange(mutator) {
  const backup = JSON.stringify(reports);
  mutator();
  if (!save()) {
    reports = JSON.parse(backup);
    return false;
  }
  return true;
}

function map(routes = false) {
  return `<div class="map"><svg viewBox="0 0 650 350" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Illustrative neighbourhood map, not a real navigation map"><defs><pattern id="grid" width="70" height="65" patternUnits="userSpaceOnUse"><rect x="8" y="8" width="46" height="38" rx="7" fill="#dde5d3"/><rect x="12" y="12" width="38" height="30" rx="5" fill="#e8ecdf"/></pattern></defs><rect width="650" height="350" fill="#e9edde"/><rect width="650" height="350" fill="url(#grid)"/><path d="M430 -20 Q350 80 420 145 T410 350 L650 350 L650 0Z" fill="#cbdedb"/><path d="M460 -20 Q375 80 445 150 T440 350" fill="none" stroke="#b6d2cf" stroke-width="3"/><path d="M-20 260L170 260L300 160L400 160 M70 -20L70 350 M-20 85L370 85 M250 -20L250 200L330 350 M0 320L400 320" fill="none" stroke="#fffdf6" stroke-width="22"/><path d="M-20 260L170 260L300 160L400 160 M70 -20L70 350 M-20 85L370 85 M250 -20L250 200L330 350" fill="none" stroke="#d6dccc" stroke-width="1" stroke-dasharray="5 5"/><ellipse cx="150" cy="170" rx="57" ry="39" fill="#c4d6b1"/><g fill="#abc49a"><circle cx="115" cy="162" r="12"/><circle cx="142" cy="184" r="15"/><circle cx="173" cy="157" r="15"/><circle cx="339" cy="50" r="13"/><circle cx="370" cy="229" r="17"/><circle cx="358" cy="266" r="13"/></g><g font-family="sans-serif" font-size="10" fill="#82917b"><text x="111" y="222">COMMUNITY GARDEN</text><text x="440" y="180" fill="#7d9d9a">RIMBA LAKE</text><text x="284" y="110">LAKESIDE WALK</text><text x="82" y="303">MARKET SQUARE</text><text x="98" y="60">JALAN RIMBA 3</text></g>${routes ? `<path d="${routeChoice === "avoid" ? "M70 260 L70 85 L250 85 L250 160 L390 160" : "M70 260 L170 260 L300 160 L390 160"}" fill="none" stroke="${routeChoice === "avoid" ? "#21846a" : "#c48b54"}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="70" cy="260" r="9" fill="#173f34" stroke="white" stroke-width="4"/><circle cx="390" cy="160" r="9" fill="#21846a" stroke="white" stroke-width="4"/>` : ""}</svg>${Object.entries(
    locationPoints,
  )
    .map(([name, [x, y]]) => {
      const local = reports.filter((r) => active(r) && r.location === name);
      return local.length
        ? `<button class="map-pin ${local.some(overdue) ? "urgent" : ""}" style="left:${(x / 650) * 100}%;top:${(y / 350) * 100}%" data-place="${esc(name)}" aria-label="${esc(name)}: ${local.length} active report(s)">${local.length}</button>`
        : "";
    })
    .join(
      "",
    )}<span class="map-caption">Illustrative map · Sample locations</span></div>`;
}
function row(r) {
  return `<div class="report-row" tabindex="0" role="button" data-detail="${r.id}"><div class="report-icon">${icons[r.category] || "◇"}</div><div class="report-info"><h3>${esc(r.title)}</h3><p>${esc(r.location)} · ${r.votes} confirmations</p></div>${badge(r)}</div>`;
}
function overview() {
  const pending = reports.filter((r) => r.status === "Awaiting verification"),
    open = reports.filter(active),
    due = open.filter(overdue);
  return (
    heading(
      "Look after the places we share.",
      "Neighbourhood reports, visible progress, and repairs checked by residents.",
    ) +
    `<section class="feature-grid"><div class="feature-copy"><span class="edition">THE NEIGHBOURHOOD DESK <span>01 / SERI RIMBA</span></span><h2>Reported. <br>Repaired. <br><em>Checked by you.</em></h2><p>A broken light should not disappear into a message thread. Give it a location, an owner, and a clear next step.</p><div class="actions"><button class="btn" data-action="report">Report an issue <span>↗</span></button><a class="text-link" href="#reports">Follow a report →</a></div><div class="feature-foot"><span class="live-dot"></span> Local prototype <span>All starting records are illustrative.</span></div></div><div class="feature-map"><div class="panel-head"><div><span class="eyebrow">NEIGHBOURHOOD SNAPSHOT</span><h2>Where attention is needed</h2></div><span class="badge">Sample map</span></div>${map()}<div class="legend"><span><i class="dot"></i>Open reports by location</span><span><i class="dot red"></i>Overdue attention</span></div></div></section><div class="stats">${[
      [open.length, "Open reports", "Includes repairs awaiting verification"],
      [due.length, "Need a follow-up", "No recent management update"],
      [pending.length, "Ready to check", "Repair evidence submitted"],
      [
        reports.filter((r) => r.status === "Resolved").length,
        "Resident-verified",
        "Closure recorded in this demo",
      ],
    ]
      .map(
        ([n, t, d]) =>
          `<div class="stat"><div class="stat-top">${t}</div><strong>${n}<span class="stat-rule"></span></strong><small>${d}</small></div>`,
      )
      .join(
        "",
      )}</div><div class="columns"><section class="panel"><div class="panel-head"><div><div class="eyebrow">THE FOLLOW-THROUGH</div><h2>Latest neighbourhood reports</h2></div><a href="#reports">All reports ↗</a></div>${[
      ...reports,
    ]
      .sort(
        (a, b) =>
          new Date(b.events.at(-1)?.at || b.created) -
          new Date(a.events.at(-1)?.at || a.created),
      )
      .slice(0, 4)
      .map(row)
      .join(
        "",
      )}</section><section class="panel action-panel"><div class="eyebrow">YOUR NEXT ACTION</div><h2>${pending.length ? "A repair needs a second look." : "Noticed the same issue?"}</h2><p>${pending.length ? "Management has uploaded evidence. Check the location before confirming the work." : "Confirm an existing report to add useful evidence without creating another maintenance ticket."}</p>${pending.length ? `<button class="btn" data-detail="${pending[0].id}">Review repair evidence →</button>` : '<a class="btn secondary" href="#reports">Check existing reports →</a>'}<div class="process-strip"><span>01<br><b>Report</b></span><span>02<br><b>Repair</b></span><span>03<br><b>Verify</b></span></div><small>Management can request closure.<br>The resident completes it.</small></section></div>`
  );
}

function reportPage() {
  return (
    heading(
      "Every report has a next step.",
      "Check an existing issue, add an observation, or review a repair.",
    ) +
    `<div class="toolbar"><input id="search" aria-label="Search reports" placeholder="Search by issue, place, or report ID"><select id="filter" aria-label="Filter by status"><option>All statuses</option>${["Reported", "In progress", "Awaiting verification", "Resolved"].map((s) => `<option>${s}</option>`).join("")}</select><button class="btn secondary" data-action="export">Export records ↓</button></div><div class="cards" id="report-cards"></div>`
  );
}

function cards() {
  const q = (document.querySelector("#search")?.value || "").toLowerCase(),
    f = document.querySelector("#filter")?.value;
  const rs = reports.filter(
    (r) =>
      (!f || f === "All statuses" || r.status === f) &&
      `${r.title} ${r.location} ${r.id}`.toLowerCase().includes(q),
  );
  document.querySelector("#report-cards").innerHTML = rs.length
    ? rs
        .map(
          (r) =>
            `<article class="card issue-card"><div class="issue-card-top"><span class="report-icon">${icons[r.category] || "◇"}</span><small>${r.id} · ${age(r.created)}</small></div>${badge(r)}<h3>${esc(r.title)}</h3><div class="place-label">⌖ ${esc(r.location)}</div><p>${esc(r.description.slice(0, 120))}${r.description.length > 120 ? "…" : ""}</p><div class="issue-meta"><span>${r.votes} confirmations</span><span>${isSample(r) ? "Sample record" : "Your demo report"}</span></div><button class="btn secondary" data-detail="${r.id}">View progress →</button></article>`,
        )
        .join("")
    : '<div class="empty"><h3>No matching reports</h3><p>Try a different location or status.</p></div>';
}

function management() {
  const sorted = [...reports].sort(
    (a, b) =>
      Number(overdue(b)) - Number(overdue(a)) ||
      Number(active(b)) - Number(active(a)) ||
      new Date(a.created) - new Date(b.created),
  );
  return (
    heading(
      "A clear queue. An accountable owner.",
      "Management demo · assignments and changes are visible in the resident timeline.",
      false,
    ) +
    `<div class="desk-summary"><div><b>${reports.filter(overdue).length}</b><span>overdue for a follow-up</span></div><div><b>${reports.filter((r) => active(r) && !r.assignee).length}</b><span>waiting for an owner</span></div><div><b>${reports.filter((r) => r.status === "Awaiting verification").length}</b><span>with residents for verification</span></div></div><div class="notice">Proposed follow-up rule: flag open cases with no management update for 24 hours at high priority, or 48 hours at medium/low priority. These are demo rules, not agreed service commitments. Overdue reports are shown first. Repair completion and resident verification are tracked separately.</div><div class="panel table-wrap"><table><thead><tr><th>ISSUE / LOCATION</th><th>PRIORITY</th><th>STATUS</th><th>NEXT STEP</th><th>OWNER</th><th></th></tr></thead><tbody>${sorted.map((r) => `<tr><td><strong>${esc(r.title)}</strong><small style="display:block;margin-top:7px;color:var(--muted)">${r.id} · ${esc(r.location)}</small></td><td><span class="badge ${r.priority === "High" ? "red" : ""}">${esc(r.priority)}</span></td><td>${badge(r)}</td><td>${overdue(r) ? '<span class="badge red">Follow-up overdue</span>' : r.status === "Resolved" ? "Resident verified" : r.status === "Awaiting verification" ? "Resident to check" : r.assignee ? "Work in progress" : "Assign a team"}</td><td>${esc(r.assignee || "Unassigned")}</td><td><button class="btn secondary" data-manage="${r.id}">Review →</button></td></tr>`).join("")}</tbody></table></div>`
  );
}

function routes() {
  const direct = reports.filter(
      (r) => active(r) && r.location === "Lakeside Walk",
    ),
    garden = reports.filter(
      (r) =>
        active(r) && ["Jalan Rimba 3", "Park Entrance"].includes(r.location),
    );
  const choose = routeChoice === "avoid" ? garden : direct;
  return (
    heading(
      "Know what is on the way.",
      "Compare two illustrative paths using the reports currently open in this demo.",
      false,
    ) +
    `<div class="route-header"><div><span class="eyebrow">FROM</span><strong>Market Square</strong></div><span>→</span><div><span class="eyebrow">TO</span><strong>Lakeside Walk junction</strong></div><label>Walking preference<select id="route-preference"><option value="standard" ${routePreference === "standard" ? "selected" : ""}>Standard</option><option value="stepfree" ${routePreference === "stepfree" ? "selected" : ""}>Step-free access matters</option></select></label></div><div class="columns"><section class="panel">${map(true)}<div class="legend">Fixed route geometry · Illustrative distances · No navigation</div></section><section class="panel"><div class="panel-head"><h2>Compare reported conditions</h2></div><div class="route-options">${[
      ["avoid", "Garden approach", "850 m · ~12 min", garden],
      ["direct", "Direct lakeside path", "570 m · ~8 min", direct],
    ]
      .map(
        ([id, title, distance, items]) =>
          `<button class="route-option ${routeChoice === id ? "selected" : ""}" data-route="${id}" aria-pressed="${routeChoice === id}"><strong>${title}</strong><span class="route-distance">${distance} <small>illustrative</small></span><p>${items.length ? `${items.length} unresolved report(s) on this sample corridor` : "No open reports on this sample corridor"}${routePreference === "stepfree" && items.some((r) => r.category === "Damaged walkway" || r.barrier === "Blocked") ? "<br><b>Accessibility concern reported</b>" : ""}</p></button>`,
      )
      .join(
        "",
      )}<div class="route-explainer"><h3>Why this information matters</h3><p>${choose.length ? choose.map((r) => `${esc(r.title)} — ${esc(r.status.toLowerCase())}; latest update ${age(r.events.at(-1)?.at || r.created)}.`).join("<br>") : "No open reports does not mean the route has been checked or is safe."}</p></div></div></section></div><div class="notice" style="margin-top:20px">This is an explainable routing concept, not turn-by-turn guidance. Routes are not validated for lighting or step-free access. Community reports may be incomplete. Resolving or reopening a report changes the corridor summary.</div>`
  );
}
function insights() {
  const sample = reports.filter(isSample),
    own = reports.filter((r) => !isSample(r));
  const completed = own.filter((r) => r.status === "Resolved" && r.resolvedAt);
  const durations = completed.map(
    (r) => (new Date(r.resolvedAt) - new Date(r.created)) / 3600000,
  );
  const averageHours = durations.length
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : null;
  const mean = averageHours === null ? "—"
    : averageHours < 1 / 60 ? "<1 min"
    : averageHours < 1 ? Math.round(averageHours * 60) + " min"
    : averageHours.toFixed(1) + " h";
  return (
    heading(
      "Measure the follow-through.",
      "Prototype activity is not evidence of real-world impact. Keep those two things separate.",
      false,
    ) +
    `<div class="notice">${sample.length} seeded sample records excluded from the measures below. ${own.length} locally created demo records included. These numbers describe activity in this browser, not a resident pilot.</div><div class="stats">${[
      [own.length, "New demo reports", "Created through this browser"],
      [
        completed.length,
        "Verified in this demo",
        "Currently resolved; timestamp available",
      ],
      [
        mean,
        "Mean time to verification",
        "Original submission → latest verification",
      ],
      [
        own.filter((r) => (r.reopenCount || 0) > 0).length,
        "Reports ever reopened",
        "At least one resident reopen action",
      ],
    ]
      .map(
        ([n, t, d]) =>
          `<div class="stat"><div class="stat-top">${t}</div><strong>${n}</strong><small>${d}</small></div>`,
      )
      .join(
        "",
      )}</div><div class="columns"><section class="panel" style="padding:25px"><div class="eyebrow">PROPOSED PILOT / NOT YET RUN</div><h2>One precinct. Four weeks. Clear measures.</h2><div class="steps">${[
      [
        "Week 1 · Establish the baseline",
        "Interview residents and the maintenance coordinator. Record how issues are currently logged, acknowledged, repaired and closed.",
      ],
      [
        "Week 2 · Test the workflow",
        "Ask residents to report a sample issue and find its status. Observe task completion, errors, accessibility and comprehension.",
      ],
      [
        "Week 3 · Small supervised pilot",
        "With township approval, trial a limited set of non-emergency maintenance issues. Keep existing reporting channels available.",
      ],
      [
        "Week 4 · Review outcomes",
        "Compare acknowledgement and verified-resolution times against the baseline, with case counts and severity mix. Report reopened issues and unresolved cases.",
      ],
    ]
      .map(
        ([h, p]) =>
          `<div class="step"><div><h3>${h}</h3><p>${p}</p></div></div>`,
      )
      .join(
        "",
      )}</div></section><section class="card"><div class="eyebrow">VALUE HYPOTHESES</div><h2>Useful to residents.<br>Practical for operators.</h2><p><b>Residents:</b> a visible owner and a repair they can check.</p><p><b>Management:</b> fewer duplicate tickets, prioritised follow-ups, and an evidence trail.</p><p><b>Township operator:</b> a repeatable service workflow across precincts.</p><h3>What still needs validation</h3><p>Adoption, willingness to verify repairs, operating cost, staff workload, procurement fit and whether this improves on existing channels.</p><button class="btn secondary" data-action="export">Export demo records ↓</button></section></div><section class="panel metric-definitions"><h2>Metric definitions</h2><p><b>Acknowledgement time:</b> first management assignment minus original submission. <b>Verified-resolution time:</b> resident verification minus original submission. <b>Reopened share:</b> previously verified reports subsequently reopened divided by reports ever verified. Use only a defined pilot cohort; do not mix seed records or compare different case types without explanation.</p></section>`
  );
}

function demo() {
  return (
    heading(
      "One report. A complete story.",
      "A repeatable walkthrough for your hackathon demonstration.",
      false,
    ) +
    `<div class="columns"><section class="panel" style="padding:27px"><h2>Your 5-minute demo</h2><div class="steps">${[
      [
        "0:00–0:35 · The problem",
        "Residents may report a hazard but struggle to see what happens next. Introduce this as a hypothesis until interviews support it.",
      ],
      [
        "0:35–1:25 · Report it",
        "Show the duplicate suggestion for a lakeside lighting fault. Then create a distinct issue at Park Entrance, add access context and a photo, and explain the editable triage rule.",
      ],
      [
        "1:25–2:00 · Build shared awareness",
        "Open the new community report and confirm the hazard. Show the status timeline.",
      ],
      [
        "2:00–3:10 · Take accountable action",
        "Switch to Management desk. Assign the report and begin work. Upload a repair photo and submit it for resident verification.",
      ],
      [
        "3:10–3:50 · Close the loop",
        "Return to the resident report. Inspect the repair photo and verify the repair, or reopen it if the problem remains.",
      ],
      [
        "3:50–4:20 · Explore the route concept",
        "Show the two illustrative routes and explain the limits of unverified community reports.",
      ],
      [
        "4:20–5:00 · Pilot and value",
        "Propose a pilot in one precinct. Measure acknowledgement time, verified resolution time, and reopened reports. Do not claim unmeasured improvements.",
      ],
    ]
      .map(
        ([t, p]) =>
          `<div class="step"><div><h3>${t}</h3><p>${p}</p></div></div>`,
      )
      .join(
        "",
      )}</div></section><div><section class="card"><div class="eyebrow">Built for the People track</div><h2>Accountability beyond the report.</h2><p>SafeTown connects resident reporting, management progress, repair evidence, and resident verification in one understandable journey.</p><h3>Working in this prototype</h3><p>Photo uploads · Editable triage rules · Status changes · Community confirmations · Repair evidence · Reopen workflow · Local persistence · JSON export</p><h3>Concepts, not live services</h3><p>AI image classification, real maps and routing, multi-user accounts, cloud storage, automated messaging, and external management integrations.</p><h3>Proposed pilot measures</h3><p>Time to acknowledge · Time to verified repair · Percentage reopened · Resident task completion</p><button class="btn secondary" data-action="export">Download current demo data ↓</button></section></div></div>`
  );
}
function render() {
  const page = location.hash.slice(1) || "overview";
  document
    .querySelectorAll("nav a")
    .forEach((a) => a.classList.toggle("active", a.hash === "#" + page));
  app.innerHTML = (
    {
      overview,
      reports: reportPage,
      manage: management,
      routes,
      insights,
      demo,
    }[page] || overview
  )();
  if (page === "reports") cards();
  document.querySelector(".profile").innerHTML =
    page === "manage"
      ? '<span class="avatar">TM</span><span>Township team<small>Management demo</small></span>'
      : '<span class="avatar">AR</span><span>Aina Rahman<small>Resident demo</small></span>';
}
function show(content) {
  document.querySelector("#modal-content").innerHTML =
    `<div class="modal-body">${content}</div>`;
  if (!modal.open) modal.showModal();
  modal.querySelector(".close")?.focus({ preventScroll: true });
}
const closeHead = (title) =>
  `<div class="modal-head"><h2>${title}</h2><button class="close" data-action="close" aria-label="Close dialog">×</button></div>`;
function reportForm() {
  show(
    closeHead("Report a neighbourhood issue") +
      `<p class="subtitle">Choose the place first. Someone may already have reported it.</p><form id="report-form"><div class="form-grid"><label>Location<select name="location">${locations.map((x) => `<option>${x}</option>`).join("")}</select></label><label>Issue type<select name="category">${Object.keys(
        icons,
      )
        .map((x) => `<option>${x}</option>`)
        .join(
          "",
        )}</select></label></div><div id="duplicate-hint"></div><label>What did you notice?<input name="title" required maxlength="90" placeholder="e.g. Light beside the lake does not turn on"></label><label>Description<textarea name="description" required maxlength="1000" placeholder="Add a landmark and explain the issue."></textarea></label><div class="form-grid"><label>Can people pass?<select name="barrier"><option value="Passable">Yes, with care</option><option value="Blocked">No, the path is blocked</option><option value="Unknown">Not sure</option></select></label><label>People affected<select name="affected"><option>Everyone using this path</option><option>Wheelchair and mobility-aid users</option><option>Parents with strollers</option><option>People walking after dark</option></select></label></div><label>Photo (optional · JPG, PNG or WebP · up to 2 MB)<input name="photo" type="file" accept="image/jpeg,image/png,image/webp"></label><img id="photo-preview" class="evidence" alt="Selected report photo" hidden><div class="notice" id="triage-note"></div><label>Suggested priority · you can change it<select name="priority"><option>High</option><option>Medium</option><option>Low</option></select></label><button class="btn" type="submit">Submit report →</button><p class="muted" style="font-size:11px;margin-top:13px">Not for emergencies. Avoid faces, number plates and personal details in photos. This demo saves locally in your browser.</p></form>`,
  );
  refreshReportHints();
}
function refreshReportHints() {
  const form = document.querySelector("#report-form");
  if (!form) return;
  const data = new FormData(form),
    suggestion = triage(data.get("category"), data.get("barrier"));
  form.elements.priority.value = suggestion.priority;
  document.querySelector("#triage-note").textContent =
    `Triage rule: ${suggestion.reason} This suggestion uses your answers, not image analysis.`;
  const similar = matches(data.get("category"), data.get("location"));
  document.querySelector("#duplicate-hint").innerHTML = similar.length
    ? `<div class="duplicate"><strong>Already reported nearby</strong><p>A similar issue is open at this location. Review it before creating a separate report.</p>${similar.map((r) => `<button type="button" class="text-link" data-existing="${r.id}">${esc(r.title)} · ${r.id} →</button>`).join("")}</div>`
    : "";
}

function detail(id, manage = false) {
  const r = reports.find((x) => x.id === id);
  if (!r) return;
  const steps = [
      "Reported",
      "In progress",
      "Awaiting verification",
      "Resolved",
    ],
    current = steps.indexOf(r.status);
  show(
    closeHead(esc(r.title)) +
      `<div class="detail-summary"><span>${r.id} · ${esc(r.location)}</span><span>${isSample(r) ? "SAMPLE RECORD" : "LOCAL DEMO REPORT"}</span></div><div class="progress-track">${steps.map((x, i) => `<div class="${i <= current ? "done" : ""}"><i>${i < current ? "✓" : i + 1}</i><span>${["Reported", "In progress", "Ready to check", "Verified"][i]}</span></div>`).join("")}</div>${badge(r)} <span class="badge ${r.priority === "High" ? "red" : ""}">${esc(r.priority)} priority</span><p class="detail-desc">${esc(r.description)}</p><dl class="facts"><div><dt>Submitted</dt><dd>${stamp(r.created)}</dd></div><div><dt>Assigned to</dt><dd>${esc(r.assignee || "Awaiting assignment")}</dd></div><div><dt>Reported access</dt><dd>${esc(r.barrier || "Not recorded")}</dd></div><div><dt>People affected</dt><dd>${esc(r.affected || "Not recorded")}</dd></div></dl><div class="evidence-grid">${r.photo ? `<figure><img class="evidence" src="${r.photo}" alt="Photo submitted with the report"><figcaption>Reported condition</figcaption></figure>` : ""}${r.repairPhoto ? `<figure><img class="evidence" src="${r.repairPhoto}" alt="Management repair photo"><figcaption>${r.status === "Reported" ? "Previous repair evidence" : "Management repair evidence"}</figcaption></figure>` : ""}</div>${r.repairNote ? `<p class="detail-desc"><b>Repair notes:</b> ${esc(r.repairNote)}</p>` : ""}${r.previousRepairs?.length ? `<details class="previous-evidence"><summary>${r.previousRepairs.length} previous repair submission(s)</summary>${r.previousRepairs.map((p) => `<figure><img class="evidence" src="${p.photo}" alt="Previous repair submission"><figcaption>${stamp(p.at)} · ${esc(p.note)}</figcaption></figure>`).join("")}</details>` : ""}<h3 class="timeline-title">Activity & accountability</h3><div class="timeline">${r.events.map((e) => `<div class="event">${esc(e.text)}<small>${stamp(e.at)} MYT</small></div>`).join("")}</div>${manage ? managementForm(r) : `<div class="actions">${r.status === "Reported" || r.status === "In progress" ? `<button class="btn secondary" data-confirm="${r.id}" ${r.confirmed ? "disabled" : ""}>${r.confirmed ? "✓ Observation added" : `I also noticed this · ${r.votes}`}</button>` : ""}${r.status === "Awaiting verification" ? `<button class="btn" data-review="${r.id}">Check the repair →</button>` : ""}${r.status === "Resolved" ? `<button class="btn secondary" data-reopen="${r.id}">The issue has returned</button>` : ""}</div>`}`,
  );
}
function verificationForm(id) {
  const r = reports.find((x) => x.id === id);
  show(
    closeHead("Has the repair resolved the issue?") +
      `<p class="subtitle">${esc(r.title)} · ${esc(r.location)}</p>${r.repairPhoto ? `<img class="evidence" src="${r.repairPhoto}" alt="Management repair evidence">` : ""}<p class="detail-desc">${esc(r.repairNote || "")}</p><form id="verify-form" data-id="${r.id}"><label class="check-label"><input type="checkbox" required name="checked"> I checked the location and the reported issue is resolved.</label><label>Observation (optional)<textarea name="note" maxlength="500" placeholder="e.g. The light is working this evening."></textarea></label><div class="actions"><button class="btn" type="submit">Confirm verified repair</button><button type="button" class="btn secondary" data-reopen="${r.id}">The issue remains</button></div><p class="muted">In this prototype, use a simulated observation. Real verification would need authenticated residents and moderation.</p></form>`,
  );
}
function reopenForm(id) {
  show(
    closeHead("Tell management what still needs attention") +
      `<form id="reopen-form" data-id="${id}"><label>Reason for reopening<textarea name="reason" required minlength="10" maxlength="500" placeholder="Describe what remains unresolved or has returned."></textarea></label><button class="btn" type="submit">Reopen report</button><p class="muted">The original submission date and previous evidence remain in the history.</p></form>`,
  );
}

function managementForm(r) {
  if (r.status === "Resolved")
    return '<div class="notice">Resident-verified resolution. Residents can reopen the report if the issue returns.</div>';
  if (r.status === "Awaiting verification")
    return '<div class="notice">Repair evidence submitted. Return to Community reports to verify or reopen as the demo resident.</div>';
  return `<form id="manage-form" data-id="${r.id}"><label>Assigned team<select name="assignee">${["Electrical team", "Grounds maintenance", "Civil works team"].map((x) => `<option ${(r.assignee || { "Poor lighting": "Electrical team", "Damaged walkway": "Civil works team", Obstruction: "Grounds maintenance" }[r.category] || "Grounds maintenance") === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><label>Priority<select name="priority">${["High", "Medium", "Low"].map((x) => `<option ${r.priority === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><label>Public progress update<textarea name="update" maxlength="500" placeholder="e.g. Inspection scheduled for tomorrow morning."></textarea></label><div class="actions"><button class="btn" type="submit">${r.status === "In progress" ? "Update assignment" : "Assign & begin work"}</button></div></form>${r.status === "In progress" ? `<form id="repair-form" data-id="${r.id}"><label>Repair notes<textarea name="note" required maxlength="800" placeholder="Describe what was repaired and checked"></textarea></label><label>Repair photo (required, JPG/PNG/WebP, up to 2 MB)<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required></label><button class="btn secondary" type="submit">Submit repair for verification →</button></form>` : ""}`;
}
async function readPhoto(file) {
  if (!file || !file.size) return null;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw Error("Choose a JPG, PNG or WebP image.");
  if (file.size > 2 * 1024 * 1024)
    throw Error("Choose an image smaller than 2 MB.");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(reader.result);
      img.onerror = () =>
        reject(
          Error(
            "This file could not be decoded as an image. Choose a different photo.",
          ),
        );
      img.src = reader.result;
    };
    reader.onerror = () => reject(Error("Could not read this image."));
    reader.readAsDataURL(file);
  });
}
function event(r, text) {
  r.events.push({ text, at: new Date().toISOString() });
}
function exportData() {
  const a = document.createElement("a");
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          {
            project: "SafeTown",
            type: "Prototype browser data; not verified operational records",
            exportedAt: new Date().toISOString(),
            reports,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  );
  a.href = url;
  a.download = "safetown-demo-reports.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.addEventListener("click", (e) => {
  if (e.target.closest(".skip-link")) {
    e.preventDefault();
    app.focus();
    return;
  }
  const t = e.target.closest("button,[data-detail]");
  if (!t) return;
  if (t.dataset.action === "close") modal.close();
  if (t.dataset.action === "report") reportForm();
  if (t.dataset.action === "export") exportData();
  if (t.dataset.detail) detail(t.dataset.detail);
  if (t.dataset.manage) detail(t.dataset.manage, true);
  if (t.dataset.route) {
    routeChoice = t.dataset.route;
    render();
  }
  if (t.dataset.place) {
    const rs = reports.filter(
      (r) => active(r) && r.location === t.dataset.place,
    );
    show(
      closeHead(esc(t.dataset.place)) +
        `<p class="subtitle">${rs.length} open report(s) at this sample location</p>${rs.map(row).join("")}`,
    );
  }
  if (t.dataset.existing) {
    detail(t.dataset.existing);
    toast(
      "Review the existing report, or start a new report for a different issue.",
    );
  }
  if (t.dataset.review) verificationForm(t.dataset.review);
  if (t.dataset.reopen) reopenForm(t.dataset.reopen);
  if (t.dataset.confirm) {
    const r = reports.find((x) => x.id === t.dataset.confirm);
    if (!r || r.confirmed) return;
    if (
      commitChange(() => {
        r.votes++;
        r.confirmed = true;
        event(r, "Demo resident confirmed the issue is still present");
      })
    ) {
      modal.close();
      render();
      toast(
        "Observation added. One confirmation per demo resident per reporting cycle.",
      );
    }
  }
});
document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches(".report-row")) {
    e.preventDefault();
    detail(e.target.dataset.detail);
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "search") cards();
});
document.addEventListener("change", async (e) => {
  if (e.target.id === "filter") cards();
  if (e.target.id === "route-preference") {
    routePreference = e.target.value;
    render();
  }
  if (
    e.target.closest("#report-form") &&
    ["category", "location", "barrier"].includes(e.target.name)
  )
    refreshReportHints();
  if (e.target.name === "photo" && e.target.closest("#report-form")) {
    try {
      const data = await readPhoto(e.target.files[0]);
      const img = document.querySelector("#photo-preview");
      img.hidden = !data;
      if (data) img.src = data;
    } catch (err) {
      e.target.value = "";
      document.querySelector("#photo-preview").hidden = true;
      toast(err.message);
    }
  }
});
document.addEventListener("submit", async (e) => {
  if (
    ![
      "report-form",
      "manage-form",
      "repair-form",
      "verify-form",
      "reopen-form",
    ].includes(e.target.id)
  )
    return;
  e.preventDefault();
  const form = e.target,
    data = new FormData(form),
    button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  const before = JSON.stringify(reports);
  try {
    let resultId = form.dataset.id;
    const r = reports.find((x) => x.id === resultId),
      now = new Date().toISOString();
    if (form.id === "report-form") {
      const title = data.get("title").trim(),
        description = data.get("description").trim();
      if (!title || !description)
        throw Error("Please enter a title and description.");
      const photo = await readPhoto(data.get("photo"));
      resultId =
        "ST-" +
        (Math.max(1044, ...reports.map((r) => Number(r.id.slice(3)) || 0)) + 1);
      reports.unshift({
        id: resultId,
        title,
        description,
        category: data.get("category"),
        location: data.get("location"),
        priority: data.get("priority"),
        barrier: data.get("barrier"),
        affected: data.get("affected"),
        photo,
        status: "Reported",
        sample: false,
        votes: 0,
        created: now,
        cycleOpened: now,
        events: [{ text: "Resident submitted a report", at: now }],
      });
    }
    if (form.id === "manage-form") {
      if (!r || !["Reported", "In progress"].includes(r.status))
        throw Error("This report is no longer awaiting management action.");
      r.assignee = data.get("assignee");
      r.priority = data.get("priority");
      r.status = "In progress";
      r.acknowledgedAt ||= now;
      r.lastManagementUpdate = now;
      event(
        r,
        `Assigned to ${r.assignee}; ${r.priority.toLowerCase()} priority`,
      );
      const update = data.get("update")?.trim();
      if (update) event(r, `Management update: ${update}`);
    }
    if (form.id === "repair-form") {
      if (!r || r.status !== "In progress")
        throw Error("Assign and begin work before submitting a repair.");
      const note = data.get("note").trim();
      if (!note) throw Error("Describe the repair before submitting.");
      const photo = await readPhoto(data.get("photo"));
      if (!photo) throw Error("A repair photo is required.");
      if (r.repairPhoto) {
        r.previousRepairs ||= [];
        r.previousRepairs.push({
          photo: r.repairPhoto,
          note: r.repairNote,
          at: r.repairedAt || now,
        });
      }
      r.repairPhoto = photo;
      r.repairNote = note;
      r.repairedAt = now;
      r.status = "Awaiting verification";
      event(
        r,
        "Management submitted repair evidence; resident verification requested",
      );
    }
    if (form.id === "verify-form") {
      if (!r || r.status !== "Awaiting verification")
        throw Error("This report is not ready for verification.");
      if (!data.get("checked"))
        throw Error("Confirm the location check before verifying.");
      r.status = "Resolved";
      r.resolvedAt = now;
      r.everVerified = true;
      event(
        r,
        `Resident verified the repair${data.get("note").trim() ? ": " + data.get("note").trim() : ""}`,
      );
    }
    if (form.id === "reopen-form") {
      if (!r || !["Resolved", "Awaiting verification"].includes(r.status))
        throw Error("This report is already open.");
      const reason = data.get("reason").trim();
      if (reason.length < 10)
        throw Error("Please provide a reason of at least 10 characters.");
      r.status = "Reported";
      r.confirmed = false;
      r.cycleOpened = now;
      r.lastManagementUpdate = null;
      r.reopenCount = (r.reopenCount || 0) + 1;
      event(r, `Resident reopened the report: ${reason}`);
    }
    if (!save())
      throw Error(
        "Change was not saved. Export records or use a smaller image.",
      );
    modal.close();
    render();
    if (form.id === "report-form") {
      location.hash = "reports";
      render();
      detail(resultId);
      toast(`Report ${resultId} saved.`);
    } else {
      detail(resultId, ["manage-form", "repair-form"].includes(form.id));
      toast(
        form.id === "verify-form"
          ? "Repair verified by the resident."
          : form.id === "reopen-form"
            ? "Reopened with your reason. Original history preserved."
            : "Update saved to the report timeline.",
      );
    }
  } catch (err) {
    reports = JSON.parse(before);
    toast(err.message);
    button.disabled = false;
  }
});
document.querySelector("#reset").onclick = () => {
  show(
    closeHead("Restore the sample neighbourhood?") +
      '<p class="subtitle">This removes locally created demo reports and photos and restores four illustrative records. Export your records first if needed.</p><div class="actions"><button class="btn secondary" data-action="close">Keep my reports</button><button class="btn" id="confirm-reset">Reset sample data</button></div>',
  );
  document.querySelector("#confirm-reset").onclick = () => {
    if (
      commitChange(() => {
        reports = seed();
        reports.forEach((r) => (r.sample = true));
      })
    ) {
      modal.close();
      render();
      toast("Sample records restored.");
    }
  };
};

window.addEventListener("hashchange", render);
render();
