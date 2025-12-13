import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdminUsersQueryDto {
  @ApiPropertyOptional({ description: 'Search by name, mobile, or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter users by profile completion status',
    enum: ['complete', 'incomplete'],
  })
  @IsOptional()
  @IsEnum(['complete', 'incomplete'])
  profileStatus?: 'complete' | 'incomplete';

  @ApiPropertyOptional({ description: 'Page number (default: 1)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page (default: 50)', example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
