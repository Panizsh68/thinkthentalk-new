import { ApiProperty } from '@nestjs/swagger';
import { ContactMessageStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateContactStatusDto {
  @ApiProperty({
    enum: [ContactMessageStatus.SEEN, ContactMessageStatus.ARCHIVED],
  })
  @IsEnum(ContactMessageStatus)
  status!: ContactMessageStatus;
}
