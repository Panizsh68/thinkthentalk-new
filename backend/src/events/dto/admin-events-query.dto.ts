import { ApiPropertyOptional } from '@nestjs/swagger';
import { Allow, IsIn, IsInt, IsOptional, Min, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class AdminEventsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination (default: 1)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page (default: 20)',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: "Sort field (e.g., 'startDateTime' or 'createdAt')",
    example: 'startDateTime',
    enum: ['startDateTime', 'createdAt'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['startDateTime', 'createdAt'])
  sortBy?: 'startDateTime' | 'createdAt';

  @ApiPropertyOptional({
    description: "Sort order ('asc' or 'desc')",
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: "Status filter ('upcoming' | 'past' | 'all')",
    enum: ['upcoming', 'past', 'all'],
  })
  @Allow()
  @IsOptional()
  @IsString()
  @IsIn(['upcoming', 'past', 'all'])
  status?: 'upcoming' | 'past' | 'all';

  @ApiPropertyOptional({
    description: "Event type filter ('ONLINE' | 'OFFLINE')",
    enum: ['ONLINE', 'OFFLINE'],
  })
  @Allow()
  @IsOptional()
  @IsString()
  @IsIn(['ONLINE', 'OFFLINE'])
  type?: 'ONLINE' | 'OFFLINE';

  @ApiPropertyOptional({
    description: "Archived filter ('all' | 'true' | 'false')",
    enum: ['all', 'true', 'false'],
    default: 'false',
  })
  @Allow()
  @IsOptional()
  @IsString()
  @IsIn(['all', 'true', 'false'])
  archived?: 'all' | 'true' | 'false';

  @ApiPropertyOptional({
    description: "Deleted filter ('all' | 'true' | 'false')",
    enum: ['all', 'true', 'false'],
    default: 'false',
  })
  @Allow()
  @IsOptional()
  @IsString()
  @IsIn(['all', 'true', 'false'])
  deleted?: 'all' | 'true' | 'false';
}

// Helper to transform to number for validation
function Type(
  arg0: () => NumberConstructor,
): (target: any, key: string) => void {
  return Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? value : num;
  });
}
