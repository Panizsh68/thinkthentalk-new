import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '@prisma/client';
import { LocalizedTextDto } from './localized-text.dto';
import { EventTicketConfigDto } from './event-ticket-config.dto';
import { EventResourceDto } from './event-resource.dto';

export class EventDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  slug!: string;

  @ApiProperty({ type: LocalizedTextDto })
  title!: LocalizedTextDto;

  @ApiProperty({ type: LocalizedTextDto })
  summary!: LocalizedTextDto;

  @ApiProperty({ type: LocalizedTextDto })
  description!: LocalizedTextDto;

  @ApiProperty({ enum: EventType })
  type!: EventType;

  @ApiPropertyOptional({ type: String })
  address?: string | null;

  @ApiPropertyOptional({ type: LocalizedTextDto })
  city?: LocalizedTextDto | null;

  @ApiProperty({ type: String, format: 'date-time' })
  startDateTime!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  endDateTime?: string | null;

  @ApiProperty({ type: Number })
  capacityTotal!: number;

  @ApiProperty({ type: Number })
  capacityRemaining!: number;

  @ApiProperty({ type: Boolean })
  showRemainingCapacity!: boolean;

  @ApiProperty({ type: [String] })
  categories!: string[];

  @ApiProperty({ type: [EventTicketConfigDto] })
  tickets!: EventTicketConfigDto[];

  @ApiProperty({ type: [EventResourceDto] })
  resources!: EventResourceDto[];

  @ApiProperty({ type: [String] })
  publicDiscountIds!: string[];

  @ApiPropertyOptional({ type: String, format: 'uri' })
  posterUrl?: string | null;

  @ApiProperty({ type: Boolean })
  isArchived!: boolean;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  archivedAt?: string | null;

  @ApiPropertyOptional({ type: String })
  archivedById?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  deletedAt?: string | null;

  @ApiPropertyOptional({ type: String })
  deletedById?: string | null;
}
