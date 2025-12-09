import { ApiProperty } from '@nestjs/swagger';
import { EvaluationQuestionDto } from './evaluation-question.dto';
import { EvaluationSubmissionDto } from './evaluation-submission.dto';

export class EvaluationResponseDto {
  @ApiProperty({ type: EvaluationSubmissionDto })
  submission!: EvaluationSubmissionDto;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      mobile: { type: 'string' },
    },
  })
  user!: { id: string; name: string; mobile: string };

  @ApiProperty({ type: [EvaluationQuestionDto] })
  questions!: EvaluationQuestionDto[];
}
