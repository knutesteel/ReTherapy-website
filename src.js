import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://rjsdlavdjvbruvqzgbjg.supabase.co",
  "sb_publishable_GwRUdRMkX-pP3uIEESljdQ_FUZKVfbq",
);
const ADMIN_EMAIL = "knutesteel@gmail.com";
const ADMIN_URL = "https://www.retherapy.com/clients";

// Supabase may return an email confirmation session in the URL. If the
// provider falls back to the public homepage, recover the callback and open
// the private Clients screen without requiring the administrator to navigate
// there manually.
const isAuthCallback =
  location.hash.includes("access_token=") ||
  new URLSearchParams(location.search).has("code");
if (isAuthCallback && location.pathname !== "/clients") {
  history.replaceState(
    {},
    "",
    `/clients${location.search}${location.hash}`,
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

async function renderClients() {
  const app = document.querySelector("#clientsApp");
  if (!app || location.pathname != "/clients") return;
  document.querySelector("header").hidden = true;
  document.querySelector("main").hidden = true;
  document.querySelector("footer").hidden = true;
  app.hidden = false;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user?.email?.toLowerCase() === ADMIN_EMAIL) showClients(app);
  else showLogin(app);
}

function showLogin(app) {
  app.innerHTML = `<section class="admin-login"><img src="/retherapy-logo.png" alt="ReTherapy Massage"><p class="eyebrow">Private Administration</p><h1>Clients</h1><p>Sign in with the authorized administrator account.</p><form id="loginForm"><label>Email<input value="${ADMIN_EMAIL}" disabled></label><label>Password<input name="password" type="password" minlength="8" required autocomplete="current-password"></label><button class="btn primary" type="submit">Sign In</button><button class="btn secondary" id="setupAdmin" type="button">First-Time Setup</button><p class="form-message" aria-live="polite"></p></form><a href="/">← Return to ReTherapy</a></section>`;
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
    } else showClients(app);
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
      : "Check knutesteel@gmail.com and follow the confirmation link. It will return you to this Clients page.";
    output.className = `form-message ${error ? "error" : "success-text"}`;
  });
}

async function showClients(app) {
  app.innerHTML = `<header class="admin-header"><a href="/"><img src="/retherapy-logo.png" alt="ReTherapy Massage"></a><div><span>${ADMIN_EMAIL}</span><button class="btn secondary" id="signOut">Sign Out</button></div></header><main class="admin-main"><p class="eyebrow">Private Administration</p><h1>Clients</h1><p id="clientCount">Loading client requests…</p><div class="client-list" id="clientList"></div></main>`;
  app.querySelector("#signOut").addEventListener("click", async () => {
    await supabase.auth.signOut();
    showLogin(app);
  });
  const { data, error } = await supabase
    .from("client_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    app.querySelector("#clientCount").textContent =
      "Client records could not be loaded.";
    return;
  }
  app.querySelector("#clientCount").textContent =
    `${data.length} website ${data.length === 1 ? "request" : "requests"}`;
  app.querySelector("#clientList").innerHTML = data.length
    ? data
        .map(
          (client) =>
            `<article class="client-card"><div class="client-card-head"><div><p class="eyebrow">${new Date(client.created_at).toLocaleString()}</p><h3>${escapeHtml(client.name)}</h3></div><span class="status">${escapeHtml(client.status)}</span></div><dl><div><dt>Email</dt><dd><a href="mailto:${escapeHtml(client.email)}">${escapeHtml(client.email)}</a></dd></div><div><dt>Phone</dt><dd>${client.phone ? `<a href="tel:${escapeHtml(client.phone)}">${escapeHtml(client.phone)}</a>` : "Not provided"}</dd></div><div><dt>Source</dt><dd>${escapeHtml(client.source)}</dd></div></dl><h4>What they would like help with</h4><p>${escapeHtml(client.message)}</p></article>`,
        )
        .join("")
    : '<div class="empty"><h3>No website requests yet.</h3><p>New Get in Touch submissions will appear here.</p></div>';
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
renderClients();
