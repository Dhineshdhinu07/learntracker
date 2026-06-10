import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'NO_KEY' }, { status: 503 })
  }

  const { prompt, context } = await req.json()

  const systemPrompt = `You are a focused, no-nonsense tech career coach helping a software engineer prep for job switching. They are targeting product companies and want roles as a Backend Engineer or Full-Stack Engineer.

Their learning focus areas (in priority order):
1. DSA (Data Structures & Algorithms) — LeetCode-style problems, patterns, complexity
2. Python — Language depth, stdlib, OOP, common libraries (FastAPI, asyncio, etc.)
3. System Design — HLD (High-Level Design) and LLD (Low-Level Design) fundamentals
4. Computer Fundamentals — OS, networking, databases, compilers, memory
5. Frontend — HTML/CSS, JavaScript, React, browser internals, performance
6. Backend — REST/GraphQL APIs, databases, auth, caching, scalability patterns

You have access to their recent study log showing what they studied and for how long.

Rules:
- Be specific and actionable — no vague advice
- Prioritize based on their actual log gaps
- Suggest next topics with time estimates
- Keep responses concise — bullet points over paragraphs
- If they've neglected a topic for >3 days, flag it
- Recommend resources only when asked`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Here is my recent study log:\n\n${context}\n\n${prompt}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ response: text })
}
