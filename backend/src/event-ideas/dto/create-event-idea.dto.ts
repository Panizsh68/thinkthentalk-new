import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdeaType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateEventIdeaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((o) => o.email !== '' && o.email !== undefined && o.email !== null)
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ enum: EventIdeaType })
  @IsEnum(EventIdeaType)
  type!: EventIdeaType;
}
