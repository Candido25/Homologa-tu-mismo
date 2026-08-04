import { NextResponse } from "next/server";
import { Webhooks } from "@polar-sh/sdk/webhooks";
import { getCaseRepository } from "@/lib/application-services";

export async function POST(request: Request) {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("Missing POLAR_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
  }

  const signature = request.headers.get("webhook-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  try {
    const rawBody = await request.text();

    // Verify the webhook payload using Polar's SDK
    const event = Webhooks.verify(rawBody, {
      "webhook-signature": signature,
      "webhook-id": request.headers.get("webhook-id") || "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") || "",
    }, webhookSecret);

    // Handle the specific event
    // The type `checkout.created` indicates a successful checkout in Polar
    if (event.type === "checkout.created") {
      const payload = event.data;

      const caseId = payload.metadata?.caseId as string;
      if (caseId) {
        // Upgrade the case to PREMIUM
        await getCaseRepository().updateTier(caseId, "PREMIUM");
        console.log(`Successfully upgraded case ${caseId} to PREMIUM.`);
      }
    } else if (event.type === "order.created") {
      // Sometimes it can be an order.created depending on how Polar webhook is configured
      const payload = event.data;
      const caseId = payload.metadata?.caseId as string;
      if (caseId) {
        await getCaseRepository().updateTier(caseId, "PREMIUM");
        console.log(`Successfully upgraded case ${caseId} to PREMIUM via order.created.`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing failed", error);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }
}
