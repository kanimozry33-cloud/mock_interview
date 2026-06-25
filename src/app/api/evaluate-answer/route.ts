import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAnswerEvaluationPrompt } from '@/lib/prompts';
import { InterviewSetup } from '@/lib/types';

const client = new Anthropic();

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  if (fenced) return fenced[1].trim();

  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0];

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
