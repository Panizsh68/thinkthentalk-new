export type OtpContext = 'LOGIN';

export interface OtpResult {
  code: string;
  expiresInSeconds: number;
}
