import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const getConfigs = () => {
  const configPath = path.join(process.cwd(), 'public/data/configs.json');
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return configData;
};

const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (origin !== allowedOrigin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { question, correctAnswer, answerChoices } = await req.json();
    const configs = getConfigs();

    const answerChoicesString = answerChoices.join(', ');
    const prompt = configs.prompts.hint
      .replace('{question}', question)
      .replace('{correctAnswer}', correctAnswer)
      .replace('{answerChoicesString}', answerChoicesString);

    const stream = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: configs.models.hint,
      stream: true,
    });

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Hint error:', error);
    return NextResponse.json({ error: 'Failed to generate hint' }, { status: 500 });
  }
}
