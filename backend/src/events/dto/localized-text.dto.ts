import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LocalizedTextDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  fa!: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  en!: string;
}
