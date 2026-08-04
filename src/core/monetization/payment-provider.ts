export interface PaymentProvider {
  createCheckoutSession(userId: string, caseId: string): Promise<string | null>;
}
