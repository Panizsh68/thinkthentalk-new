import { ApiProperty } from '@nestjs/swagger';
import { EvaluationQuestionType } from '@prisma/client';

export class EvaluationQuestionDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ enum: EvaluationQuestionType })
  type!: EvaluationQuestionType;

  @ApiProperty({ type: String })
  label!: string;

  @ApiProperty({ type: Boolean })
  required!: boolean;
}
