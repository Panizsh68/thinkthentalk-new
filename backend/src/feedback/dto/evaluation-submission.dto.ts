import { ApiProperty } from '@nestjs/swagger';

export class EvaluationSubmissionDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  evaluationId!: string;

  @ApiProperty({ type: String })
  userId!: string;

  @ApiProperty({ type: String })
  eventId!: string;

  @ApiProperty({
    description: 'Answers keyed by question ID',
    additionalProperties: {
      oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
    },
  })
  answers!: Record<string, string | number | boolean>;

  @ApiProperty({ type: String, format: 'date-time' })
  submittedAt!: string;
}
