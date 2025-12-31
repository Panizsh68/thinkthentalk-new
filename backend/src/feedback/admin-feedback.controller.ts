import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { FeedbackService } from './feedback.service';
import { EvaluationQuestionDto } from './dto/evaluation-question.dto';
import { EvaluationFormDto } from './dto/evaluation-form.dto';
import { EvaluationResponseDto } from './dto/evaluation-response.dto';

@ApiTags('Feedback')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.EVENT_MANAGER, AdminRole.FINANCE)
@Controller({ path: 'admin', version: '1' })
export class AdminFeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Patch('events/:eventId/evaluation')
  @ApiOperation({
    summary: 'Save Evaluation Form (Admin)',
    description:
      "Creates or updates the questions for an event's evaluation form.",
  })
  @ApiParam({ name: 'eventId', type: String, required: true })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: { $ref: '#/components/schemas/EvaluationQuestion' },
        },
      },
      required: ['questions'],
    },
  })
  @ApiOkResponse({
    description: 'Evaluation form saved.',
    type: EvaluationFormDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async saveEvaluationForm(
    @Param('eventId') eventId: string,
    @Body('questions') questions: EvaluationQuestionDto[],
  ): Promise<EvaluationFormDto> {
    return this.feedbackService.saveEvaluationForm(eventId, questions);
  }

  @Get('events/:eventId/evaluation')
  @ApiOperation({
    summary: 'Get Evaluation Form (Admin)',
    description:
      'Fetches or initializes the evaluation form for an event so admins can edit questions.',
  })
  @ApiParam({ name: 'eventId', type: String, required: true })
  @ApiOkResponse({ description: 'Evaluation form.', type: EvaluationFormDto })
  @ApiNotFoundResponse({
    description: 'Event not found.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async getEvaluationForm(
    @Param('eventId') eventId: string,
  ): Promise<EvaluationFormDto> {
    return this.feedbackService.getEvaluationFormForAdmin(eventId);
  }

  @Get('events/:eventId/evaluation/responses')
  @ApiOperation({
    summary: 'Get Evaluation Responses (Admin)',
    description: 'Retrieves submitted evaluation responses for an event.',
  })
  @ApiParam({ name: 'eventId', type: String, required: true })
  @ApiOkResponse({
    description: 'Evaluation responses.',
    type: EvaluationResponseDto,
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: 'Event or form not found.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async getEvaluationResponses(
    @Param('eventId') eventId: string,
  ): Promise<EvaluationResponseDto[]> {
    const responses =
      await this.feedbackService.getEvaluationResponses(eventId);
    if (!responses) {
      throw new NotFoundException('Evaluation form not found.');
    }
    return responses;
  }
}
