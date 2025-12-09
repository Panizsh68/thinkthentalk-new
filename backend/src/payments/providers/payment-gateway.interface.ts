export interface RequestPaymentInput {
  amount: number;
  description: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface RequestPaymentResult {
  authority: string;
  url: string;
}

export interface VerifyPaymentInput {
  authority: string;
  amount: number;
}

export interface VerifyPaymentResult {
  success: boolean;
  referenceId?: string;
}

export interface PaymentGateway {
  requestPayment(input: RequestPaymentInput): Promise<RequestPaymentResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
}
