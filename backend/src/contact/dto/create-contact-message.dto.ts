import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateContactMessageDto {
  @ApiPropertyOptional({ description: 'Full name of the sender.', maxLength: 191 })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  name?: string;

  @ApiProperty({ description: 'Reply email address.', example: 'hello@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Message body', minLength: 10, maxLength: 5000 })
  @IsString()
  @Length(10, 5000)
  message!: string;

  @ApiPropertyOptional({ description: 'Optional language override (e.g. en or fa).', example: 'fa' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  language?: string;

  @ApiPropertyOptional({ description: 'Honeypot field used to catch bots. Must stay empty.', default: '' })
  @IsOptional()
  honeypot?: string;

  @ApiPropertyOptional({ description: 'Alternate honeypot field (frontend uses "website").', default: '' })
  @IsOptional()
  website?: string;
}
