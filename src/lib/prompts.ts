import { InterviewSetup } from './types';

export function getQuestionGenerationPrompt(setup: InterviewSetup) {
  const lang = setup.language === 'zh' ? '中文' : 'English';
  return {
    system: `You are a senior interviewer at ${setup.companyName}. You must generate realistic interview questions that this company would actually ask, based on the candidate's resume and the job description provided.

Your response must be a JSON array and nothing else. No markdown, no explanation.

Each question object must have:
- "id": sequential number starting from 1
- "category": one of "behavioral", "technical", "situational", "company-specific"
- "question": the interview question in ${lang}
- "intent": what this question evaluates, in ${lang}
- "timeLimit": recommended answer time in seconds (90-180)

Generate exactly 8 questions with this distribution:
- 2 behavioral questions (based on the candidate's past experience from resume)
- 3 technical questions (based on JD skill requirements vs resume skills)
- 2 situational/case questions (relevant to the company's domain and role)
- 1 company-specific question (about motivation, culture fit, or company knowledge)

Order them as a real interview would flow: start with an icebreaker behavioral question, then technical, then situational, end with company-specific.

Respond ONLY with the JSON array.`,
    user: `## Candidate Resume:
${setup.resumeText}

## Job Description:
${setup.jobDescription}

## Company: ${setup.companyName}

Generate 8 interview questions in ${lang}.`
  };
}

export function getAnswerEvaluationPrompt(
  question: string,
  intent: string,
  userAnswer: string,
  setup: InterviewSetup
) {
  const lang = setup.language === 'zh' ? '中文' : 'English';
  return {
    system: `You are an expert interview coach evaluating a candidate's verbal answer. The answer was transcribed via speech recognition, so ignore minor transcription errors, filler words, or slight grammatical issues.

Respond ONLY with a JSON object (no markdown, no explanation) with these fields:
- "score": integer 1-10
- "strengths": array of 2-3 specific things the candidate did well (in ${lang})
- "improvements": array of 2-3 specific areas to improve (in ${lang})
- "detailedFeedback": 2-3 sentences of constructive feedback (in ${lang})
- "sampleAnswer": a complete excellent answer (score 9-10) that the candidate could learn from, written in first person as if the candidate is speaking (in ${lang}, 150-250 words)

Scoring guide:
- 9-10: Exceptional, well-structured, specific examples, strong impact
- 7-8: Good answer with room for improvement
- 5-6: Average, lacks specificity or structure
- 3-4: Below average, missing key elements
- 1-2: Poor, off-topic or minimal effort`,
    user: `## Question: ${question}
## What this question evaluates: ${intent}

## Candidate's Answer (speech transcription):
${userAnswer}

## Context - Candidate's Resume:
${setup.resumeText}

## Context - Job Description:
${setup.jobDescription}

## Company: ${setup.companyName}

Evaluate this answer in ${lang}.`
  };
}
