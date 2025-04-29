import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { Quiz } from '@/types/quiz';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { topic } = await req.json();

  const prompt = `Create a quiz with 3 multiple choice questions about "${topic}". 
    Return a JSON object with an array of questions. Each question should have:
    - A question text
    - One correct answer
    - Three plausible but incorrect answers
    Format: { "questions": [{ "question": "", "correctAnswer": "", "incorrectAnswers": ["","",""] }] }`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano", // This is a valid model, do not change it
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const quiz = JSON.parse(completion.choices[0].message.content!) as Quiz;
    return NextResponse.json(quiz);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
