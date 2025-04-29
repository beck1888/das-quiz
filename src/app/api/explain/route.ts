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

export async function POST(req: Request) {
  try {
    const { question, correctAnswer, userAnswer } = await req.json();
    const configs = getConfigs();

    const prompt = configs.prompts.explanation
      .replace('{question}', question)
      .replace('{correctAnswer}', correctAnswer)
      .replace('{userAnswer}', userAnswer);

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: configs.models.explanation,
    });

    const explanation = completion.choices[0]?.message?.content || "Sorry, couldn't generate an explanation.";

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Explanation error:', error);
    return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 });
  }
}
