import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TeamMemberDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  firstNameFa!: string;

  @ApiProperty({ type: String })
  lastNameFa!: string;

  @ApiProperty({ type: String })
  roleFa!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  firstNameEn!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  lastNameEn!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  roleEn!: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Absolute URL or canonical uploaded media path.',
  })
  avatarUrl!: string | null;

  @ApiProperty({ type: Number })
  displayOrder!: number;

  @ApiProperty({ type: Boolean })
  isActive!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}
