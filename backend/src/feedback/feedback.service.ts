import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EvaluationQuestion,
  EvaluationQuestionType,
  EvaluationSubmission,
  RegistrationStatus,
} from '@prisma/client';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { EvaluationFormDto } from './dto/evaluation-form.dto';
import { EvaluationQuestionDto } from './dto/evaluation-question.dto';
import { EvaluationResponseDto } from './dto/evaluation-response.dto';
import { EvaluationSubmissionDto } from './dto/evaluation-submission.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  status(): { status: 'ok'; module: string; timestamp: string } {
    return {
      status: 'ok',
      module: 'feedback',
      timestamp: new Date().toISOString(),
    };
  }

  async getEvaluationForm(
    eventId: string,
    userId: string,
  ): Promise<EvaluationFormDto> {
    const registration = await this.prisma.registration.findFirst({
      where: { eventId, userId, status: RegistrationStatus.PAID },
    });
    if (!registration) {
      throw new BadRequestException(
        'User is not eligible for this evaluation.',
      );
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
    answers: Record<string, string | number | boolean>,
  ): Promise<{ success: boolean; eventId: string }> {
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
      throw new BadRequestException(
        'User is not eligible for this evaluation.',
      );
    }

    const existingSubmission = await this.prisma.evaluationSubmission.findFirst(
      {
        where: { evaluationFormId: evaluationId, userId },
      },
    );
    if (existingSubmission) {
      throw new BadRequestException('Evaluation already submitted.');
    }

    this.validateAnswers(form.questions.map(this.toQuestionDto), answers);

    await this.prisma.evaluationSubmission.create({
      data: {
        evaluationFormId: evaluationId,
        userId,
        eventId: form.eventId,
        answers: JSON.stringify(answers),
      },
    });

    return { success: true, eventId: form.eventId };
  }

  async getEvaluationFormForAdmin(eventId: string): Promise<EvaluationFormDto> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    let form = await this.prisma.evaluationForm.findFirst({
      where: { eventId },
      include: { questions: true },
    });

    // Create the form record on first access so admins can start adding questions right away.
    if (!form) {
      form = await this.prisma.evaluationForm.create({
        data: { eventId },
        include: { questions: true },
      });
    }

    return {
      id: form.id,
      eventId: form.eventId,
      submitted: false,
      questions: form.questions.map(this.toQuestionDto),
    };
  }

  async saveEvaluationForm(
    eventId: string,
    questions: EvaluationQuestionDto[],
  ): Promise<EvaluationFormDto> {
    if (!questions || !Array.isArray(questions)) {
      throw new BadRequestException('Invalid data.');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    const normalizedQuestions = questions.map((q, idx) =>
      this.normalizeQuestion(q, idx),
    );

    let form = await this.prisma.evaluationForm.findFirst({
      where: { eventId },
    });

    if (!form) {
      form = await this.prisma.evaluationForm.create({
        data: { eventId },
      });
    }

    await this.prisma.$transaction([
      this.prisma.evaluationQuestion.deleteMany({ where: { formId: form.id } }),
      this.prisma.evaluationQuestion.createMany({
        data: normalizedQuestions.map((q) => ({
          id: q.id,
          formId: form.id,
          type: q.type,
          label: q.label,
          required: q.required,
        })),
      }),
    ]);

    return {
      id: form.id,
      eventId: form.eventId,
      questions: normalizedQuestions,
      submitted: false,
    };
  }

  async getEvaluationResponses(
    eventId: string,
  ): Promise<EvaluationResponseDto[] | null> {
    const form = await this.prisma.evaluationForm.findFirst({
      where: { eventId },
      include: { questions: true },
    });
    if (!form) return null;

    type SubmissionWithUser = EvaluationSubmission & {
      user: {
        id: string;
        firstNameFa: string | null;
        lastNameFa: string | null;
        mobile: string;
      };
    };

    const submissions = (await this.prisma.evaluationSubmission.findMany({
      where: { evaluationFormId: form.id },
      include: { user: true },
    })) as SubmissionWithUser[];

    const questions = form.questions.map(this.toQuestionDto);

    return submissions.map((submission: SubmissionWithUser) => ({
      submission: this.toSubmissionDto(submission),
      user: {
        id: submission.user.id,
        name:
          [submission.user.firstNameFa, submission.user.lastNameFa]
            .filter(Boolean)
            .join(' ')
            .trim() ||
          submission.user.firstNameFa ||
          submission.user.mobile,
        mobile: submission.user.mobile,
      },
      questions,
    }));
  }

  private validateAnswers(
    questions: EvaluationQuestionDto[],
    answers: Record<string, string | number | boolean>,
  ) {
    for (const q of questions) {
      const ans = answers[q.id];
      if (q.required && (ans === undefined || ans === null)) {
        throw new BadRequestException('Invalid answers.');
      }
      if (ans !== undefined && ans !== null) {
        if (
          q.type === EvaluationQuestionType.RATING &&
          typeof ans !== 'number'
        ) {
          throw new BadRequestException('Invalid answers.');
        }
        if (q.type === EvaluationQuestionType.TEXT && typeof ans !== 'string') {
          throw new BadRequestException('Invalid answers.');
        }
        if (
          q.type === EvaluationQuestionType.YES_NO &&
          typeof ans !== 'boolean'
        ) {
          throw new BadRequestException('Invalid answers.');
        }
      }
    }
  }

  private normalizeQuestion(question: EvaluationQuestionDto, index: number) {
    if (!question || typeof question !== 'object') {
      throw new BadRequestException(`Invalid question at index ${index + 1}.`);
    }

    const label =
      typeof question.label === 'string' ? question.label.trim() : '';
    if (!label) {
      throw new BadRequestException(`Question ${index + 1} label is required.`);
    }

    return {
      id: question.id || randomUUID(),
      type: this.normalizeQuestionType(question.type),
      label,
      required:
        typeof question.required === 'boolean'
          ? question.required
          : Boolean(question.required),
    };
  }

  private normalizeQuestionType(type: unknown): EvaluationQuestionType {
    if (typeof type !== 'string') {
      if (
        Object.values(EvaluationQuestionType).includes(
          type as EvaluationQuestionType,
        )
      ) {
        return type as EvaluationQuestionType;
      }
      throw new BadRequestException('Invalid question type.');
    }

    const cleaned = type.trim();

    // Canonical form: drop non-alphanumerics and compare case-insensitively.
    const toCanonical = (val: string) =>
      val.replace(/[^a-zA-Z0-9]+/g, '').toUpperCase();
    const canonical = toCanonical(cleaned);

    const match = Object.values(EvaluationQuestionType).find(
      (val) => toCanonical(val) === canonical,
    );
    if (match) return match;

    throw new BadRequestException(`Invalid question type: ${type}`);
  }

  private toQuestionDto = (q: {
    id: string;
    type: EvaluationQuestionType;
    label: string;
    required: boolean;
  }): EvaluationQuestionDto => ({
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
    answers: unknown;
    submittedAt: Date;
  }): EvaluationSubmissionDto => ({
    id: s.id,
    evaluationId: s.evaluationFormId,
    userId: s.userId,
    eventId: s.eventId,
    answers:
      typeof s.answers === 'string'
        ? (JSON.parse(s.answers) as Record<string, string | number | boolean>)
        : (s.answers as Record<string, string | number | boolean>),
    submittedAt: s.submittedAt.toISOString(),
  });

  async getEventRating(
    eventId: string,
  ): Promise<{ average: number | null; count: number }> {
    const form = await this.prisma.evaluationForm.findFirst({
      where: { eventId },
      include: { questions: true },
    });

    if (!form) {
      return { average: null, count: 0 };
    }

    const ratingQuestionIds = form.questions
      .filter(
        (question: EvaluationQuestion) =>
          question.type === EvaluationQuestionType.RATING,
      )
      .map((question: EvaluationQuestion) => question.id);

    if (ratingQuestionIds.length === 0) {
      return { average: null, count: 0 };
    }

    const submissions = await this.prisma.evaluationSubmission.findMany({
      where: { evaluationFormId: form.id },
      select: { answers: true },
    });

    let total = 0;
    let count = 0;

    for (const sub of submissions) {
      if (!sub.answers) continue;
      try {
        const answers = (
          typeof sub.answers === 'string'
            ? JSON.parse(sub.answers)
            : sub.answers
        ) as Record<string, unknown>;
        ratingQuestionIds.forEach((id: string) => {
          const value = answers[id];
          if (typeof value === 'number') {
            total += value;
            count += 1;
          }
        });
      } catch {
        // ignore submissions with invalid answer formats
      }
    }

    return {
      average: count > 0 ? total / count : null,
      count,
    };
  }
}
