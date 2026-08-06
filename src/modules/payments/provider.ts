export type PaymentStatus =
  | "draft"
  | "simulated_authorized"
  | "simulated_captured"
  | "simulated_refunded"
  | "simulated_disputed"
  | "blocked_real_payment";

export type PaymentRequest = {
  serviceCode: string;
  amountCents: number;
  currency: "EUR" | "USD" | "PEN";
  idempotencyKey: string;
  metadata?: Record<string, string>;
};

export type PaymentResult = {
  provider: "polar-simulator";
  providerReference: string;
  status: PaymentStatus;
  amountCents: number;
  currency: PaymentRequest["currency"];
};

export interface PaymentProvider {
  createPayment(input: PaymentRequest): Promise<PaymentResult>;
  refund(providerReference: string, idempotencyKey: string): Promise<PaymentResult>;
}

export class PolarSimulatorPaymentProvider implements PaymentProvider {
  private readonly ledger = new Map<string, PaymentResult>();

  async createPayment(input: PaymentRequest): Promise<PaymentResult> {
    if (input.amountCents <= 0) throw new Error("amount_must_be_positive");

    const existing = this.ledger.get(input.idempotencyKey);
    if (existing) return existing;

    const result: PaymentResult = {
      provider: "polar-simulator",
      providerReference: `polar_sim_${input.idempotencyKey}`,
      status: "simulated_authorized",
      amountCents: input.amountCents,
      currency: input.currency,
    };
    this.ledger.set(input.idempotencyKey, result);
    return result;
  }

  async refund(providerReference: string, idempotencyKey: string): Promise<PaymentResult> {
    const existing = this.ledger.get(idempotencyKey);
    if (existing) return existing;

    const original = [...this.ledger.values()].find(
      (entry) => entry.providerReference === providerReference,
    );
    if (!original) throw new Error("payment_not_found");

    const result: PaymentResult = { ...original, status: "simulated_refunded" };
    this.ledger.set(idempotencyKey, result);
    return result;
  }
}
