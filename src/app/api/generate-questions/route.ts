import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getQuestionGenerationPrompt } from '@/lib/prompts';
import { InterviewSetup, InterviewQuestion } from '@/lib/types';

const client = new Anthropic();

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  if (fenced) return fenced[1].trim();

  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) return arrayMatch[0];

  return text.trim();
}

export async function POST(request: NextRequest) {
  try {
    const setup: InterviewSetup = await request.json();
    const prompt = getQuestionGenerationPrompt(setup);

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
    let questions: InterviewQuestion[];
    try {
      questions = JSON.parse(raw);
    } catch {
      console.error('Raw Claude response:', content.text);
      return NextResponse.json({ error: 'Invalid JSON from AI response' }, { status: 500 });
    }
    return NextResponse.json({ questions });
  } catch (e) {
    console.error('Question generation error:', e);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
