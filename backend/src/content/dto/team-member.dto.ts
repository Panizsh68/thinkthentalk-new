import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TeamMemberDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: String })
  role!: string;

  @ApiProperty({ type: String, format: 'uri' })
  photoUrl!: string;
}
