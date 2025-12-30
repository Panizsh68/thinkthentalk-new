import { randomInt } from 'crypto';

export const generateOtp = (digits = 6): string => {
  if (digits < 4 || digits > 10) {
    throw new Error('OTP digits must be between 4 and 10');
  }

  const max = 10 ** digits;
  const min = 10 ** (digits - 1);
  const value = randomInt(min, max);
  return value.toString().padStart(digits, '0');
};
