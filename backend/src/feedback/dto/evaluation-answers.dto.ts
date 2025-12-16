import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class EvaluationAnswersDto {
  @ApiProperty({
    description: 'A map of question IDs to their answers.',
    additionalProperties: {
      oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
    },
  })
  @IsObject()
  answers!: Record<string, string | number | boolean>;
}
