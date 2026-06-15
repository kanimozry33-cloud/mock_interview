export interface InterviewSetup {
  resumeText: string;
  companyName: string;
  jobDescription: string;
  language: 'en' | 'zh';
}

export interface InterviewQuestion {
  id: number;
  category: 'behavioral' | 'technical' | 'situational' | 'company-specific';
  question: string;
  intent: string;
  timeLimit: number;
}

export interface AnswerEvaluation {
  questionId: number;
  userAnswer: string;
  score: number;
  strengths: string[];
  improvements: string[];
  sampleAnswer: string;
  detailedFeedback: string;
}

export interface InterviewState {
  setup: InterviewSetup | null;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  answers: AnswerEvaluation[];
  status: 'setup' | 'generating' | 'in-progress' | 'reviewing' | 'complete';
}

export type InterviewAction =
  | { type: 'SET_SETUP'; payload: InterviewSetup }
  | { type: 'SET_QUESTIONS'; payload: InterviewQuestion[] }
  | { type: 'SET_STATUS'; payload: InterviewState['status'] }
  | { type: 'ADD_ANSWER'; payload: AnswerEvaluation }
  | { type: 'NEXT_QUESTION' }
  | { type: 'RESET' };
