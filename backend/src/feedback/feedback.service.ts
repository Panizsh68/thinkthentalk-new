import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EvaluationQuestionType, RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { EvaluationFormDto } from './dto/evaluation-form.dto';
import { EvaluationQuestionDto } from './dto/evaluation-question.dto';
import { EvaluationResponseDto } from './dto/evaluation-response.dto';
import { EvaluationSubmissionDto } from './dto/evaluation-submission.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  status(): { status: 'ok'; module: string; timestamp: string } {
    return { status: 'ok', module: 'feedback', timestamp: new Date().toISOString() };
  }

  async getEvaluationForm(eventId: string, userId: string): Promise<EvaluationFormDto> {
    const registration = await this.prisma.registration.findFirst({
      where: { eventId, userId, status: RegistrationStatus.PAID },
    });
    if (!registration) {
      throw new BadRequestException('User is not eligible for this evaluation.');
    }

    const form = await this.prisma.evaluationForm.findFirst({
      where: { eventId },
      include: { questions: true },
    });
    if (!form) {
      throw new NotFoundException('Evaluation form not found.');
    }

    const submission = await this.prisma.evaluationSubmission.findFirst({
      where: { evaluationFormId: form.id, userId },
    });

    return {
      id: form.id,
      eventId: form.eventId,
      questions: form.questions.map(this.toQuestionDto),
      submitted: Boolean(submission),
    };
  }

  async submitEvaluation(
    evaluationId: string,
    userId: string,
    answers: Record<string, string | number>,
  ): Promise<{ success: boolean }> {
    const form = await this.prisma.evaluationForm.findUnique({
      where: { id: evaluationId },
      include: { questions: true },
    });
    if (!form) {
      throw new NotFoundException('Evaluation form not found.');
    }

    const registration = await this.prisma.registration.findFirst({
      where: { eventId: form.eventId, userId, status: RegistrationStatus.PAID },
    });
    if (!registration) {
      throw new BadRequestException('User is not eligible for this evaluation.');
    }

    const existingSubmission = await this.prisma.evaluationSubmission.findFirst({
      where: { evaluationFormId: evaluationId, userId },
    });
    if (existingSubmission) {
      throw new BadRequestException('Evaluation already submitted.');
    }

    this.validateAnswers(form.questions.map(this.toQuestionDto), answers);

    await this.prisma.evaluationSubmission.create({
      data: {
        evaluationFormId: evaluationId,
        userId,
        eventId: form.eventId,
        answers: answers as any,
      },
    });

    return { success: true };
  }

  async saveEvaluationForm(
    eventId: string,
    questions: EvaluationQuestionDto[],
  ): Promise<EvaluationFormDto> {
    if (!questions || !Array.isArray(questions)) {
      throw new BadRequestException('Invalid data.');
    }

    let form = await this.prisma.evaluationForm.findFirst({ where: { eventId } });

    if (!form) {
      form = await this.prisma.evaluationForm.create({
        data: { eventId },
      });
    }

    await this.prisma.$transaction([
      this.prisma.evaluationQuestion.deleteMany({ where: { formId: form.id } }),
      this.prisma.evaluationQuestion.createMany({
        data: questions.map((q) => ({
          id: q.id,
          formId: form.id,
          type: q.type,
          label: q.label,
          required: q.required,
        })),
      }),
    ]);

    const savedQuestions = questions.map((q) => ({
      id: q.id,
      type: q.type,
      label: q.label,
      required: q.required,
    }));

    return {
      id: form.id,
      eventId: form.eventId,
      questions: savedQuestions,
      submitted: false,
    };
  }

  async getEvaluationResponses(eventId: string): Promise<EvaluationResponseDto[] | null> {
    const form = await this.prisma.evaluationForm.findFirst({
      where: { eventId },
      include: { questions: true },
    });
    if (!form) return null;

    const submissions = await this.prisma.evaluationSubmission.findMany({
      where: { evaluationFormId: form.id },
      include: { user: true },
    });

    const questions = form.questions.map(this.toQuestionDto);

    return submissions.map((s) => ({
      submission: this.toSubmissionDto(s),
      user: {
        id: s.user.id,
        name:
          [s.user.firstNameFa, s.user.lastNameFa].filter(Boolean).join(' ').trim() ||
          s.user.firstNameFa ||
          s.user.mobile,
        mobile: s.user.mobile,
      },
      questions,
    }));
  }

  private validateAnswers(
    questions: EvaluationQuestionDto[],
    answers: Record<string, string | number>,
  ) {
    for (const q of questions) {
      const ans = answers[q.id];
      if (q.required && (ans === undefined || ans === null)) {
        throw new BadRequestException('Invalid answers.');
      }
      if (ans !== undefined && ans !== null) {
        if (q.type === EvaluationQuestionType.RATING && typeof ans !== 'number') {
          throw new BadRequestException('Invalid answers.');
        }
        if (q.type === EvaluationQuestionType.TEXT && typeof ans !== 'string') {
          throw new BadRequestException('Invalid answers.');
        }
      }
    }
  }

  private toQuestionDto = (q: { id: string; type: EvaluationQuestionType; label: string; required: boolean }): EvaluationQuestionDto => ({
    id: q.id,
    type: q.type,
    label: q.label,
    required: q.required,
  });

  private toSubmissionDto = (s: {
    id: string;
    evaluationFormId: string;
    userId: string;
    eventId: string;
    answers: any;
    submittedAt: Date;
  }): EvaluationSubmissionDto => ({
    id: s.id,
    evaluationId: s.evaluationFormId,
    userId: s.userId,
    eventId: s.eventId,
    answers: s.answers as any,
    submittedAt: s.submittedAt.toISOString(),
  });
}
