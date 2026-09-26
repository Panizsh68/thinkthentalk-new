import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartnershipStatus, SponsorshipPlan } from '@prisma/client';

export class SafeUserSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiPropertyOptional() email?: string | null;
  @ApiProperty() mobile!: string;
}

export class CollaborationStatusHistoryDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ enum: PartnershipStatus, nullable: true })
  fromStatus?: PartnershipStatus | null;
  @ApiProperty({ enum: PartnershipStatus }) toStatus!: PartnershipStatus;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Status message visible to the request submitter.',
  })
  note!: string | null;
  @ApiProperty() createdAt!: Date;
}

export class CollaborationAdminStatusHistoryDto extends CollaborationStatusHistoryDto {
  @ApiPropertyOptional({ nullable: true }) changedByAdminId?: string | null;
}

export class CollaborationUserResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() email!: string;
  @ApiProperty() mobile!: string;
  @ApiProperty() fieldOfExpertise!: string;
  @ApiPropertyOptional({ nullable: true }) experience?: string | null;
  @ApiProperty() whyJoin!: string;
  @ApiPropertyOptional({ nullable: true }) availability?: string | null;
  @ApiProperty() acceptedTerms!: boolean;
  @ApiPropertyOptional({ nullable: true }) acceptedTermsAt?: Date | null;
  @ApiProperty({ enum: PartnershipStatus }) status!: PartnershipStatus;
  @ApiPropertyOptional({ nullable: true }) processedAt?: Date | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: CollaborationStatusHistoryDto, isArray: true })
  history!: CollaborationStatusHistoryDto[];
}

export class CollaborationAdminResponseDto extends CollaborationUserResponseDto {
  @ApiPropertyOptional({ type: SafeUserSummaryDto, nullable: true })
  user?: SafeUserSummaryDto | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Private administrator note.',
  })
  adminNote?: string | null;
  @ApiProperty({ type: CollaborationAdminStatusHistoryDto, isArray: true })
  declare history: CollaborationAdminStatusHistoryDto[];
}

export class SponsorshipUserResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() companyName!: string;
  @ApiProperty() representativeName!: string;
  @ApiProperty() email!: string;
  @ApiProperty() mobile!: string;
  @ApiProperty({ enum: SponsorshipPlan }) plan!: SponsorshipPlan;
  @ApiPropertyOptional({ nullable: true }) description?: string | null;
  @ApiProperty({ enum: PartnershipStatus }) status!: PartnershipStatus;
  @ApiPropertyOptional({ nullable: true }) processedAt?: Date | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class SponsorshipAdminResponseDto extends SponsorshipUserResponseDto {
  @ApiPropertyOptional({ type: SafeUserSummaryDto, nullable: true })
  user?: SafeUserSummaryDto | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Private administrator note.',
  })
  adminNote?: string | null;
}

export class CollaborationAdminPageDto {
  @ApiProperty({ type: CollaborationAdminResponseDto, isArray: true })
  items!: CollaborationAdminResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
}

export class SponsorshipAdminPageDto {
  @ApiProperty({ type: SponsorshipAdminResponseDto, isArray: true })
  items!: SponsorshipAdminResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
}
