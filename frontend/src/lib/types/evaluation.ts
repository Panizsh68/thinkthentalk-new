

export type EvaluationQuestionType = 'RATING' | 'TEXT';

export interface EvaluationQuestion {
  id: string; // Now guaranteed by the builder
  type: EvaluationQuestionType;
  label: string;
  required: boolean;
}

export interface EvaluationForm {
  id: string;
  eventId: string;
  questions: EvaluationQuestion[];
  submitted: boolean; // Indicates if the current user has already submitted this form
}

export type EvaluationAnswers = Record<string, string | number>;

export interface EvaluationSubmission {
  id: string;
  evaluationId: string;
  userId: string;
  eventId: string;
  answers: EvaluationAnswers;
  submittedAt: string;
}

// New type for displaying responses in the admin panel
export type EvaluationResponse = {
    submission: EvaluationSubmission;
    user: {
        id: string;
        name: string;
        mobile: string;
    };
    questions: EvaluationQuestion[];
}
