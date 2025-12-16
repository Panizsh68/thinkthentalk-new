import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EvaluationFormDto } from './dto/evaluation-form.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { EvaluationAnswersDto } from './dto/evaluation-answers.dto';
import { ModuleStatusDto } from '../common/dto/module-status.dto';

@ApiTags('Feedback')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller({ path: '', version: '1' })
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get('events/:eventId/evaluation')
  @ApiOperation({
    summary: 'Get Evaluation Form',
    description:
      'Retrieves the evaluation form for a specific event, for the current authenticated user.',
  })
  @ApiParam({ name: 'eventId', type: String, required: true })
  @ApiOkResponse({
    description: 'The evaluation form structure.',
    type: EvaluationFormDto,
  })
  @ApiNotFoundResponse({
    description: 'Event or form not found.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'User is not eligible to submit feedback for this event.',
    type: ErrorResponseDto,
  })
  async getEvaluationForm(
    @Param('eventId') eventId: string,
    @CurrentUser() user: { sub: string },
  ): Promise<EvaluationFormDto> {
    return this.feedbackService.getEvaluationForm(eventId, user.sub);
  }

  @Post('evaluations/:evaluationId/submit')
  @ApiOperation({
    summary: 'Submit Evaluation',
    description: "Submits the user's answers for an evaluation form.",
  })
  @ApiParam({ name: 'evaluationId', type: String, required: true })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        answers: { $ref: '#/components/schemas/EvaluationAnswers' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Submission successful.',
    schema: {
      type: 'object',
      properties: { success: { type: 'boolean' }, eventId: { type: 'string' } },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid answers or form already submitted.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Event or form not found.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  async submitEvaluation(
    @Param('evaluationId') evaluationId: string,
    @CurrentUser() user: { sub: string },
    @Body() body: EvaluationAnswersDto,
  ): Promise<{ success: boolean }> {
    return this.feedbackService.submitEvaluation(
      evaluationId,
      user.sub,
      body.answers,
    );
  }

  @Get('feedback/status')
  @ApiOperation({
    summary: 'Module status',
    description: 'Health/status check for the feedback subsystem.',
  })
  @ApiOkResponse({ description: 'Feedback status.', type: ModuleStatusDto })
  status(): ModuleStatusDto {
    return this.feedbackService.status();
  }
}
