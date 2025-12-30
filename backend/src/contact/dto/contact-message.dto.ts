import { ApiProperty } from '@nestjs/swagger';
import { ContactMessageStatus } from '@prisma/client';

export class ContactMessageDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ nullable: true })
  name?: string | null;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  source!: string;

  @ApiProperty({ nullable: true })
  ipAddress?: string | null;

  @ApiProperty({ nullable: true })
  userAgent?: string | null;

  @ApiProperty({ enum: ['en', 'fa'] })
  language!: string;

  @ApiProperty({ enum: ContactMessageStatus })
  status!: ContactMessageStatus;

  @ApiProperty({ nullable: true })
  processedAt?: Date | null;

  @ApiProperty()
  emailSent!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PaginatedContactMessagesDto {
  @ApiProperty({ type: [ContactMessageDto] })
  items!: ContactMessageDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
