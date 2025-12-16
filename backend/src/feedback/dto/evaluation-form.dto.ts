import { ApiProperty } from '@nestjs/swagger';
import { EvaluationQuestionDto } from './evaluation-question.dto';

export class EvaluationFormDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  eventId!: string;

  @ApiProperty({ type: [EvaluationQuestionDto] })
  questions!: EvaluationQuestionDto[];

  @ApiProperty({
    type: Boolean,
    description:
      'Indicates if the current user has already submitted this form.',
  })
  submitted!: boolean;
}
