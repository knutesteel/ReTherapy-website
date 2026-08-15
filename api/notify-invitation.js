const RECIPIENTS = ["knutesteel@gmail.com", "colleen@retherapy.com"];
const FROM = "ReTherapy <notifications@retherapy.com>";

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        char
      ],
  );
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured.");
    return response.status(503).json({ error: "Email service unavailable" });
  }

  const { name, email, phone, message } = request.body ?? {};
  const cleanName = String(name ?? "").trim().slice(0, 120);
  const cleanEmail = String(email ?? "").trim().slice(0, 254);
  const cleanPhone = String(phone ?? "").trim().slice(0, 50);
  const cleanMessage = String(message ?? "").trim().slice(0, 3000);

  if (!cleanName || !/^\S+@\S+\.\S+$/.test(cleanEmail) || !cleanMessage) {
    return response.status(400).json({ error: "Invalid request" });
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: RECIPIENTS,
      reply_to: cleanEmail,
      subject: `New ReTherapy Invitation Request — ${cleanName}`,
      html: `
        <h2>New Invitation Request</h2>
        <p>A new request was submitted at retherapy.com.</p>
        <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
          <tr><td><strong>Name</strong></td><td>${escapeHtml(cleanName)}</td></tr>
          <tr><td><strong>Email</strong></td><td><a href="mailto:${escapeHtml(cleanEmail)}">${escapeHtml(cleanEmail)}</a></td></tr>
          <tr><td><strong>Phone</strong></td><td>${escapeHtml(cleanPhone || "Not provided")}</td></tr>
        </table>
        <h3>What they would like help with</h3>
        <p style="white-space:pre-wrap">${escapeHtml(cleanMessage)}</p>
        <p><a href="https://www.retherapy.com/admin">Open ReTherapy Admin</a></p>
      `,
    }),
  });

  if (!resendResponse.ok) {
    console.error("Resend error:", resendResponse.status, await resendResponse.text());
    return response.status(502).json({ error: "Email could not be sent" });
  }

  const result = await resendResponse.json();
  return response.status(200).json({ sent: true, id: result.id });
}
