import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { question, correctAnswer } = await req.json();

    const prompt = `
      For this question: "${question}"
      With the correct answer: "${correctAnswer}"
      
      Give a very subtle hint that helps point in the right direction without giving away the answer.
      The hint should be vague but helpful.
      Keep it to one short sentence.
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    const hint = completion.choices[0]?.message?.content || "Sorry, couldn't generate a hint.";

    return NextResponse.json({ hint });
  } catch (error) {
    console.error('Hint error:', error);
    return NextResponse.json({ error: 'Failed to generate hint' }, { status: 500 });
  }
}
