import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { EventRatingDto } from './dto/event-rating.dto';

@ApiTags('Feedback')
@Controller({ path: '', version: '1' })
export class PublicFeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get('events/:eventId/evaluation/rating')
  @ApiOperation({
    summary: 'Get event rating',
    description:
      'Returns average rating for an event based on evaluation submissions.',
  })
  @ApiParam({ name: 'eventId', type: String, required: true })
  @ApiOkResponse({
    description: 'Average rating and count',
    type: EventRatingDto,
  })
  async getEventRating(
    @Param('eventId') eventId: string,
  ): Promise<EventRatingDto> {
    const result = await this.feedbackService.getEventRating(eventId);
    return result;
  }
}
