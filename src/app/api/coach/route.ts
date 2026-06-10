import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a focused, no-nonsense tech career coach helping a software engineer prep for job switching. They are targeting product companies and want roles as a Backend Engineer or Full-Stack Engineer.

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
- Keep responses concise — use bullet points and markdown formatting
- If they've neglected a topic for >3 days, flag it
- Recommend resources only when asked
- You have memory of the full conversation — reference it when relevant`

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'NO_KEY' }, { status: 503 })
  }

  const { messages, context } = await req.json() as {
    messages: { role: 'user' | 'assistant'; text: string }[]
    context:  string
  }

  if (!messages?.length) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
  }

  // Study log context is injected into the system prompt — not repeated in every user message.
  // This keeps per-turn token cost low while still giving Claude full context.
  const systemWithContext = `${SYSTEM_PROMPT}\n\n---\nCurrent study log (reference this for all advice):\n${context}`

  // Send the last 30 messages max to Claude to cap token usage while preserving
  // enough conversational context (~15 back-and-forth exchanges).
  const history = messages.slice(-30)

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemWithContext,
    messages: history.map(m => ({
      role:    m.role,
      content: m.text,
    })),
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ response: text })
}
