import { Router } from "express";
import { getStripeClient } from "../stripeClient";

const router = Router();

router.post("/create-session", async (req, res) => {
  const { listingId, listingTitle, makerName, priceCents, apiBaseUrl } = req.body;

  if (!listingId || !priceCents || !apiBaseUrl) {
    return res.status(400).json({ error: "listingId, priceCents, and apiBaseUrl are required" });
  }

  try {
    const stripe = getStripeClient();

    const successUrl = `${apiBaseUrl}/payment-return?session_id={CHECKOUT_SESSION_ID}&listing_id=${encodeURIComponent(listingId)}&status=success`;
    const cancelUrl = `${apiBaseUrl}/payment-return?listing_id=${encodeURIComponent(listingId)}&status=cancel`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: listingTitle ?? "Drop listing",
              description: `Fresh from ${makerName ?? "a local maker"} via Drop`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { listingId },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error("Stripe create-session error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/verify", async (req, res) => {
  const { session_id } = req.query;
  if (!session_id || typeof session_id !== "string") {
    return res.status(400).json({ error: "session_id is required" });
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(session_id);
    res.json({
      paid: session.payment_status === "paid",
      listingId: session.metadata?.listingId ?? null,
      amountPaid: session.amount_total,
      currency: session.currency,
    });
  } catch (err: any) {
    console.error("Stripe verify error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/payment-return", (req, res) => {
  const { session_id, listing_id, status } = req.query;

  const params = new URLSearchParams();
  if (session_id) params.set("session_id", session_id as string);
  if (listing_id) params.set("listing_id", listing_id as string);
  if (status) params.set("status", status as string);

  const deepLink = `mobile://payment-result?${params.toString()}`;

  res.send(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${status === "success" ? "Payment Successful" : "Payment Cancelled"} — Drop</title>
    <style>
      body { font-family: -apple-system, sans-serif; display: flex; align-items: center;
             justify-content: center; min-height: 100vh; margin: 0; background: #F7F2EA; }
      .card { text-align: center; padding: 32px; background: #fff; border-radius: 20px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.08); max-width: 340px; width: 90%; }
      .icon { font-size: 52px; margin-bottom: 16px; }
      h2 { color: #2D5A27; margin: 0 0 8px; font-size: 22px; }
      p { color: #888; font-size: 15px; line-height: 1.5; margin: 0; }
    </style>
    <script>window.location.href = "${deepLink}";</script>
  </head>
  <body>
    <div class="card">
      <div class="icon">${status === "success" ? "✅" : "↩️"}</div>
      <h2>${status === "success" ? "Payment successful!" : "Payment cancelled"}</h2>
      <p>Returning you to the Drop app…</p>
    </div>
  </body>
</html>`);
});

export default router;
