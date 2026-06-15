'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { InterviewState, InterviewAction } from '@/lib/types';

const initialState: InterviewState = {
  setup: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  status: 'setup',
};

function interviewReducer(state: InterviewState, action: InterviewAction): InterviewState {
  switch (action.type) {
    case 'SET_SETUP':
      return { ...state, setup: action.payload };
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'ADD_ANSWER':
      return { ...state, answers: [...state.answers, action.payload] };
    case 'NEXT_QUESTION':
      return { ...state, currentQuestionIndex: state.currentQuestionIndex + 1 };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const InterviewContext = createContext<{
  state: InterviewState;
  dispatch: React.Dispatch<InterviewAction>;
} | null>(null);

export function InterviewProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(interviewReducer, initialState);
  return (
    <InterviewContext.Provider value={{ state, dispatch }}>
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) throw new Error('useInterview must be used within InterviewProvider');
  return context;
}
