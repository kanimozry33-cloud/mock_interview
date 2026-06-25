import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAnswerEvaluationPrompt } from '@/lib/prompts';
import { InterviewSetup } from '@/lib/types';

const client = new Anthropic();

function extractJSON(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) return text.substring(start, end + 1);
  return text.trim();
}

export async function POST(request: NextRequest) {
  try {
    const { question, intent, userAnswer, setup } = (await request.json()) as {
      question: string;
      intent: string;
      userAnswer: string;
      setup: InterviewSetup;
    };

    const prompt = getAnswerEvaluationPrompt(question, intent, userAnswer, setup);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response format' }, { status: 500 });
    }

    const raw = extractJSON(content.text);
    let evaluation;
    try {
      evaluation = JSON.parse(raw);
    } catch {
      console.error('Raw Claude response:', content.text);
      return NextResponse.json({ error: 'Invalid JSON from AI response' }, { status: 500 });
    }
    return NextResponse.json(evaluation);
  } catch (e) {
    console.error('Evaluation error:', e);
    return NextResponse.json({ error: 'Failed to evaluate answer' }, { status: 500 });
  }
}
