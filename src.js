import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://rjsdlavdjvbruvqzgbjg.supabase.co",
  "sb_publishable_GwRUdRMkX-pP3uIEESljdQ_FUZKVfbq",
);
const ADMIN_EMAIL = "knutesteel@gmail.com";
const ADMIN_URL = "https://www.retherapy.com/admin";
const ADMIN_PATHS = new Set(["/admin", "/clients"]);

// Supabase may return an email confirmation session in the URL. If the
// provider falls back to the public homepage, recover the callback and open
// the private Clients screen without requiring the administrator to navigate
// there manually.
const isAuthCallback =
  location.hash.includes("access_token=") ||
  new URLSearchParams(location.search).has("code");
if (isAuthCallback && !ADMIN_PATHS.has(location.pathname)) {
  history.replaceState(
    {},
    "",
    `/admin${location.search}${location.hash}`,
  );
}
const treatments = [
  {
    title: "Swedish Massage",
    summary:
      "Flowing, restorative bodywork for relaxation, flexibility, and renewed energy.",
    process:
      "Colleen uses long, flowing strokes, gentle kneading, and rhythmic movements to warm the muscles, improve circulation, and help the body settle into a deeply relaxed state. Pressure and pacing are adjusted throughout the session based on your comfort and feedback.",
    benefits: [
      "Releases everyday muscle tension",
      "Supports stress relief and better sleep",
      "Encourages circulation and flexibility",
      "Creates an overall sense of calm and well-being",
    ],
    best: "Stress, general tension, relaxation, flexibility, and recharging.",
  },
  {
    title: "Myofascial Release",
    summary:
      "Gentle, sustained work that helps restricted connective tissue move more naturally.",
    process:
      "Using slow, sustained pressure and gentle stretching, Colleen works with the fascial system rather than forcing it. As restrictions begin to soften, the body can regain space and movement.",
    benefits: [
      "Releases fascial restrictions",
      "Improves range of motion",
      "Reduces chronic discomfort",
      "Helps restore natural movement patterns",
    ],
    best: "Restricted movement, persistent tightness, postural strain, and chronic discomfort.",
  },
  {
    title: "Neuromuscular Therapy",
    summary:
      "Focused therapeutic work for trigger points, pain patterns, and muscle imbalance.",
    process:
      "Colleen identifies areas where muscles, soft tissue, and nerves may be contributing to pain or restricted movement. Sustained, specific pressure is applied with ongoing feedback.",
    benefits: [
      "Addresses trigger points and referred pain",
      "Reduces muscle and soft-tissue tension",
      "Supports improved function and mobility",
      "Provides focused relief",
    ],
    best: "Trigger points, recurring pain, muscle imbalance, and focused therapeutic goals.",
  },
  {
    title: "Deep Tissue Massage",
    summary:
      "Intentional, deeper pressure that targets long-standing tension without rushing the body.",
    process:
      "After warming the tissue, Colleen gradually works into deeper muscle layers using slow strokes and focused pressure. Intensity is continually adjusted to your goals and tolerance.",
    benefits: [
      "Eases long-standing muscle tension",
      "Targets deeper layers of muscle and fascia",
      "Supports recovery and active lifestyles",
      "Can improve mobility",
    ],
    best: "Chronic tension, physically demanding routines, recovery, and stubborn tightness.",
  },
];

document.querySelector("#treatmentCards").innerHTML = treatments
  .map(
    (t, i) =>
      `<article class="treatment"><button aria-expanded="false" aria-controls="treatment-${i}"><span><small>0${i + 1}</small><h3>${t.title}</h3><p>${t.summary}</p></span><b>+</b></button><div class="detail" id="treatment-${i}"><h4>The Process</h4><p>${t.process}</p><h4>Benefits</h4><ul>${t.benefits.map((x) => `<li>${x}</li>`).join("")}</ul><p><strong>Best for:</strong> ${t.best}</p></div></article>`,
  )
  .join("");
document.querySelectorAll(".treatment button").forEach((button) =>
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    document
      .querySelectorAll(".treatment button")
      .forEach((item) => item.setAttribute("aria-expanded", "false"));
    button.setAttribute("aria-expanded", String(!open));
  }),
);

const dialog = document.querySelector("#requestDialog");
document
  .querySelectorAll(".invite")
  .forEach((button) =>
    button.addEventListener("click", () => dialog.showModal()),
  );
document
  .querySelector(".close")
  .addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
document
  .querySelector("#requestForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const submit = form.querySelector("[type=submit]");
    const output = form.querySelector(".form-message");
    submit.disabled = true;
    submit.textContent = "Sending…";
    output.textContent = "";
    const { error } = await supabase
      .from("client_requests")
      .insert({
        name: data.get("name").trim(),
        email: data.get("email").trim(),
        phone: data.get("phone").trim() || null,
        message: data.get("message").trim(),
        source: "Website",
        status: "New",
      });
    if (error) {
      output.textContent =
        "We could not send your request. Please email colleen@retherapy.com or call (813) 399-1538.";
      output.className = "form-message error";
      submit.disabled = false;
      submit.textContent = "Send My Request";
      return;
    }

    // Notify Colleen after the request is safely stored. A notification failure
    // must not discard or duplicate the client's saved request.
    try {
      const response = await fetch("/api/notify-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name").trim(),
          email: data.get("email").trim(),
          phone: data.get("phone").trim() || null,
          message: data.get("message").trim(),
        }),
      });
      if (!response.ok) console.error("Invitation notification could not be sent.");
    } catch (notificationError) {
      console.error("Invitation notification could not be sent.", notificationError);
    }

    form.reset();
    form.innerHTML =
      '<div class="success"><h3>Thank you.</h3><p>Your information has been sent to ReTherapy. Colleen will be in touch within 48 hours.</p><button class="btn secondary close-success" type="button">Close</button></div>';
    form
      .querySelector(".close-success")
      .addEventListener("click", () => dialog.close());
  });

const menu = document.querySelector(".menu"),
  nav = document.querySelector("nav");
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") === "true";
  menu.setAttribute("aria-expanded", String(!open));
  nav.classList.toggle("open", !open);
});
nav.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
  }),
);

function startAnalytics() {
  if (ADMIN_PATHS.has(location.pathname)) return;

  const storageKey = "retherapy_visit_session";
  let sessionId = sessionStorage.getItem(storageKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(storageKey, sessionId);
  }

  const params = new URLSearchParams(location.search);
  const referrer = document.referrer || null;
  const source = getTrafficSource(params, referrer);
  const medium = params.get("utm_medium")?.slice(0, 120) || null;
  const campaign = params.get("utm_campaign")?.slice(0, 200) || null;
  const startedAt = Date.now();
  let lastRecorded = -1;

  const record = (eventType, durationSeconds) =>
    supabase.from("analytics_events").insert({
      session_id: sessionId,
      event_type: eventType,
      path: location.pathname.slice(0, 500) || "/",
      referrer: referrer?.slice(0, 1000) || null,
      source,
      medium,
      campaign,
      duration_seconds: durationSeconds,
    });

  void record("page_view", 0);

  const heartbeat = () => {
    const elapsed = Math.min(86400, Math.round((Date.now() - startedAt) / 1000));
    if (elapsed === lastRecorded) return;
    lastRecorded = elapsed;
    void record("heartbeat", elapsed);
  };

  const timer = setInterval(heartbeat, 15000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") heartbeat();
  });
  window.addEventListener(
    "pagehide",
    () => {
      heartbeat();
      clearInterval(timer);
    },
    { once: true },
  );
}

function getTrafficSource(params, referrer) {
  const taggedSource = params.get("utm_source")?.trim();
  if (taggedSource) return taggedSource.slice(0, 120);
  if (!referrer) return "Direct";

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("google.")) return "Google";
    if (host.includes("facebook.") || host === "fb.com") return "Facebook";
    if (host.includes("instagram.")) return "Instagram";
    if (host.includes("bing.")) return "Bing";
    return host.slice(0, 120);
  } catch {
    return "Referral";
  }
}

async function renderAdmin() {
  const app = document.querySelector("#adminApp");
  if (!app || !ADMIN_PATHS.has(location.pathname)) return;
  document.querySelector("header").hidden = true;
  document.querySelector("main").hidden = true;
  document.querySelector("footer").hidden = true;
  app.hidden = false;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user?.email?.toLowerCase() === ADMIN_EMAIL) showAdmin(app);
  else showLogin(app);
}

function showLogin(app) {
  app.innerHTML = `<section class="admin-login"><img src="/retherapy-logo.png" alt="ReTherapy Massage"><p class="eyebrow">Private Administration</p><h1>Admin</h1><p>Sign in with the authorized administrator account.</p><form id="loginForm"><label>Email<input value="${ADMIN_EMAIL}" disabled></label><label>Password<input name="password" type="password" minlength="8" required autocomplete="current-password"></label><button class="btn primary" type="submit">Sign In</button><button class="btn secondary" id="setupAdmin" type="button">First-Time Setup</button><p class="form-message" aria-live="polite"></p></form><a href="/">← Return to ReTherapy</a></section>`;
  const form = app.querySelector("#loginForm");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = new FormData(form).get("password");
    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    });
    const output = form.querySelector(".form-message");
    if (error) {
      output.textContent =
        "Sign-in failed. Check your password or use First-Time Setup.";
      output.className = "form-message error";
    } else showAdmin(app);
  });
  app.querySelector("#setupAdmin").addEventListener("click", async () => {
    const password = new FormData(form).get("password");
    const output = form.querySelector(".form-message");
    if (!password || password.length < 8) {
      output.textContent = "Enter a password of at least 8 characters first.";
      output.className = "form-message error";
      return;
    }
    const { error } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password,
      options: { emailRedirectTo: ADMIN_URL },
    });
    output.textContent = error
      ? "Setup could not be completed. If the account already exists, use Sign In."
      : "Check knutesteel@gmail.com and follow the confirmation link. It will return you to the Admin page.";
    output.className = `form-message ${error ? "error" : "success-text"}`;
  });
}

async function showAdmin(app) {
  app.innerHTML = `<header class="admin-header"><a href="/"><img src="/retherapy-header-logo.webp" alt="ReTherapy Massage"></a><div><span>${ADMIN_EMAIL}</span><button class="btn secondary" id="signOut">Sign Out</button></div></header><main class="admin-main"><p class="eyebrow">Private Administration</p><h1>Admin</h1><section class="admin-section"><div class="admin-section-heading"><div><h2>Website Analytics</h2><p>Traffic and engagement for the last 30 days.</p></div></div><div class="analytics-summary" id="analyticsSummary"><p>Loading analytics…</p></div><div class="analytics-grid"><div class="analytics-panel"><h3>Traffic Sources</h3><div id="sourceAnalytics"></div></div><div class="analytics-panel"><h3>Recent Visits</h3><div id="recentAnalytics"></div></div></div></section><section class="admin-section"><div class="admin-section-heading"><div><h2>Client Requests</h2><p id="clientCount">Loading client requests…</p></div></div><div class="client-list" id="clientList"></div></section></main>`;
  app.querySelector("#signOut").addEventListener("click", async () => {
    await supabase.auth.signOut();
    showLogin(app);
  });

  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
  const [clientResult, analyticsResult] = await Promise.all([
    supabase
      .from("client_requests")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("analytics_events")
      .select("*")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  renderClientRequests(app, clientResult.data, clientResult.error);
  renderAnalytics(
    app,
    analyticsResult.data,
    analyticsResult.error,
    clientResult.data || [],
    cutoff,
  );
}

function renderClientRequests(app, data, error) {
  const count = app.querySelector("#clientCount");
  const list = app.querySelector("#clientList");

  if (error) {
    count.textContent = "Client requests could not be loaded.";
    return;
  }

  updateClientCount(count, data.length);
  if (!data.length) {
    list.innerHTML =
      '<div class="empty"><h3>No website requests yet.</h3><p>New Get in Touch submissions will appear here.</p></div>';
    return;
  }

  list.innerHTML = `<div class="client-table-wrap"><table class="client-table"><thead><tr><th>Date</th><th>Client</th><th>Contact</th><th>Request</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${data
    .map(
      (client) =>
        `<tr data-client-row="${escapeHtml(client.id)}"><td><time datetime="${escapeHtml(client.created_at)}">${new Date(client.created_at).toLocaleString()}</time></td><td><strong>${escapeHtml(client.name)}</strong><small>${escapeHtml(client.source)}</small></td><td><a href="mailto:${escapeHtml(client.email)}">${escapeHtml(client.email)}</a>${client.phone ? `<a href="tel:${escapeHtml(client.phone)}">${escapeHtml(client.phone)}</a>` : '<small>Phone not provided</small>'}</td><td class="client-message">${escapeHtml(client.message)}</td><td><span class="status">${escapeHtml(client.status)}</span></td><td><button class="delete-client" type="button" data-client-id="${escapeHtml(client.id)}" data-client-name="${escapeHtml(client.name)}" aria-label="Delete request from ${escapeHtml(client.name)}">Delete</button></td></tr>`,
    )
    .join("")}</tbody></table></div>`;

  list.querySelectorAll(".delete-client").forEach((button) => {
    button.addEventListener("click", async () => {
      const clientName = button.dataset.clientName;
      const approved = window.confirm(
        `Delete the request from ${clientName}? This cannot be undone.`,
      );
      if (!approved) return;

      button.disabled = true;
      button.textContent = "Deleting…";
      const { error: deleteError } = await supabase
        .from("client_requests")
        .delete()
        .eq("id", button.dataset.clientId);

      if (deleteError) {
        button.disabled = false;
        button.textContent = "Delete";
        window.alert("The request could not be deleted. Please try again.");
        return;
      }

      button.closest("tr").remove();
      const remaining = list.querySelectorAll("tbody tr").length;
      updateClientCount(count, remaining);
      if (!remaining) {
        list.innerHTML =
          '<div class="empty"><h3>No website requests yet.</h3><p>New Get in Touch submissions will appear here.</p></div>';
      }
    });
  });
}

function updateClientCount(element, total) {
  element.textContent = `${total} website ${total === 1 ? "request" : "requests"}`;
}

function renderAnalytics(app, events, error, clients, cutoff) {
  const summary = app.querySelector("#analyticsSummary");
  const sources = app.querySelector("#sourceAnalytics");
  const recent = app.querySelector("#recentAnalytics");

  if (error) {
    summary.innerHTML = '<p class="analytics-error">Analytics could not be loaded.</p>';
    sources.innerHTML = "";
    recent.innerHTML = "";
    return;
  }

  const sessions = new Map();
  for (const event of events || []) {
    const existing = sessions.get(event.session_id) || {
      source: event.source || "Direct",
      medium: event.medium,
      campaign: event.campaign,
      referrer: event.referrer,
      path: event.path,
      startedAt: event.created_at,
      lastAt: event.created_at,
      duration: 0,
      pageViews: 0,
    };
    if (event.event_type === "page_view") existing.pageViews += 1;
    existing.duration = Math.max(existing.duration, event.duration_seconds || 0);
    if (new Date(event.created_at) < new Date(existing.startedAt)) {
      existing.startedAt = event.created_at;
      existing.path = event.path;
    }
    if (new Date(event.created_at) > new Date(existing.lastAt)) {
      existing.lastAt = event.created_at;
    }
    sessions.set(event.session_id, existing);
  }

  const visits = [...sessions.values()];
  const pageViews = visits.reduce((sum, visit) => sum + visit.pageViews, 0);
  const averageSeconds = visits.length
    ? Math.round(visits.reduce((sum, visit) => sum + visit.duration, 0) / visits.length)
    : 0;
  const recentRequests = clients.filter(
    (client) => new Date(client.created_at) >= new Date(cutoff),
  ).length;

  summary.innerHTML = [
    ["Visits", visits.length],
    ["Page Views", pageViews],
    ["Average Time", formatDuration(averageSeconds)],
    ["Requests", recentRequests],
  ]
    .map(
      ([label, value]) =>
        `<article class="metric-card"><span>${label}</span><strong>${value}</strong></article>`,
    )
    .join("");

  const sourceMap = new Map();
  for (const visit of visits) {
    const item = sourceMap.get(visit.source) || { visits: 0, seconds: 0 };
    item.visits += 1;
    item.seconds += visit.duration;
    sourceMap.set(visit.source, item);
  }
  const sourceRows = [...sourceMap.entries()].sort(
    (a, b) => b[1].visits - a[1].visits,
  );
  sources.innerHTML = sourceRows.length
    ? `<div class="analytics-table"><div class="analytics-row analytics-row-head"><span>Source</span><span>Visits</span><span>Avg. Time</span></div>${sourceRows
        .map(
          ([source, values]) =>
            `<div class="analytics-row"><span>${escapeHtml(source)}</span><span>${values.visits}</span><span>${formatDuration(Math.round(values.seconds / values.visits))}</span></div>`,
        )
        .join("")}</div>`
    : '<p>No visits recorded yet.</p>';

  const recentVisits = visits
    .sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt))
    .slice(0, 10);
  recent.innerHTML = recentVisits.length
    ? `<div class="recent-visits">${recentVisits
        .map(
          (visit) =>
            `<article><div><strong>${escapeHtml(visit.source)}</strong><span>${escapeHtml(visit.path)}</span></div><div><span>${new Date(visit.startedAt).toLocaleString()}</span><strong>${formatDuration(visit.duration)}</strong></div>${visit.campaign ? `<small>Campaign: ${escapeHtml(visit.campaign)}</small>` : ""}${visit.referrer ? `<small>Referrer: ${escapeHtml(visit.referrer)}</small>` : ""}</article>`,
        )
        .join("")}</div>`
    : '<p>No visits recorded yet.</p>';
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  if (safeSeconds < 60) return `${safeSeconds}s`;
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${minutes}m ${remaining}s`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        char
      ],
  );
}
startAnalytics();
renderAdmin();
