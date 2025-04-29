import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { question, correctAnswer, userAnswer } = await req.json();

    const prompt = `
      Question: ${question}
      Correct Answer: ${correctAnswer}
      User's Answer: ${userAnswer}
      
      Please explain in simple, easy to understand language:
      1. Why the correct answer is right
      2. If the user's answer was different, explain why it wasn't correct
      Keep the explanation brief and use everyday language.
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    const explanation = completion.choices[0]?.message?.content || "Sorry, couldn't generate an explanation.";

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Explanation error:', error);
    return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 });
  }
}
