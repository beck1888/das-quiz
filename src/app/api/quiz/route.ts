import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { Quiz } from '@/types/quiz';
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

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin !== allowedOrigin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { topic, numQuestions, difficulty } = await req.json();
    const configs = getConfigs();

    const promptTemplate = configs.prompts.quiz;
    const prompt = promptTemplate
      .replace('{numQuestions}', numQuestions)
      .replace('{topic}', topic)
      .replace(/{difficulty}/g, difficulty);

    const completion = await openai.chat.completions.create({
      model: configs.models.quiz,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const quiz = JSON.parse(completion.choices[0].message.content!) as Quiz;
    return NextResponse.json({
      quiz,
      stats: {
        totalQuestions: quiz.questions.length,
        grade: 0, // Initial grade, will be updated on the frontend
        missedQuestions: [], // Will be populated on the frontend
        correctQuestions: [] // Will be populated on the frontend
      }
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate quiz',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
