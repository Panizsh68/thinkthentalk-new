import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString, IsIn } from 'class-validator';

export class SendBulkMessageDto {
  @ApiProperty({ type: [String], description: 'Registration IDs to target.' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  registrationIds!: string[];

  @ApiProperty({ type: String })
  @IsString()
  subject!: string;

  @ApiProperty({ type: String })
  @IsString()
  body!: string;

  @ApiProperty({ type: [String], enum: ['sms', 'email'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['sms', 'email'], { each: true })
  channels!: Array<'sms' | 'email'>;
}
