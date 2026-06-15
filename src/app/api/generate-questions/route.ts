import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getQuestionGenerationPrompt } from '@/lib/prompts';
import { InterviewSetup, InterviewQuestion } from '@/lib/types';

const client = new Anthropic();

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

    const questions: InterviewQuestion[] = JSON.parse(content.text);
    return NextResponse.json({ questions });
  } catch (e) {
    console.error('Question generation error:', e);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
