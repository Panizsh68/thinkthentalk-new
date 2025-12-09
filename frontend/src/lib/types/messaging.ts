
export interface SendBulkMessageDto {
  registrationIds: string[];
  subject: string;
  body: string;
  channels: Array<'sms' | 'email'>;
}
