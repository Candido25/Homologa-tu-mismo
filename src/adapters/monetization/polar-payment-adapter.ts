import { Polar } from "@polar-sh/sdk";
import type { PaymentProvider } from "@/core/monetization/payment-provider";

export class PolarPaymentAdapter implements PaymentProvider {
  private polar: Polar;

  constructor() {
    this.polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN || "",
    });
  }

  async createCheckoutSession(userId: string, caseId: string): Promise<string | null> {
    try {
      const checkout = await this.polar.checkouts.custom.create({
        productPriceId: process.env.POLAR_PREMIUM_PRODUCT_PRICE_ID || "",
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/panel/expedientes/${caseId}?payment=success`,
        metadata: {
          caseId,
          userId,
        },
      });

      return checkout.url;
    } catch (error) {
      console.error("polar_checkout_failed", error);
      return null;
    }
  }
}
