import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'NO_KEY' }, { status: 503 })

  const { context } = await req.json()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 700,
    system: `You are a strict technical interview readiness evaluator.
Score a candidate's prep based purely on their study log hours and topic coverage.
Be realistic and harsh — low hours = low score.

Return ONLY valid JSON in exactly this shape, no markdown, no explanation:
{
  "overall": <0-100 integer>,
  "breakdown": [
    { "category": "DSA", "score": <0-100>, "gap": "<specific missing topic or skill, max 8 words>" },
    { "category": "Python", "score": <0-100>, "gap": "<gap>" },
    { "category": "System Design", "score": <0-100>, "gap": "<gap>" },
    { "category": "Computer Fundamentals", "score": <0-100>, "gap": "<gap>" },
    { "category": "Frontend", "score": <0-100>, "gap": "<gap>" },
    { "category": "Backend", "score": <0-100>, "gap": "<gap>" }
  ],
  "verdict": "<1 sentence, honest assessment of readiness timeline>",
  "topPriority": "<single category name to focus on>"
}`,
    messages: [{
      role: 'user',
      content: `Study log:\n${context}\n\nScore my interview readiness. Return only valid JSON.`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}'
  try {
    const match = text.match(/\{[\s\S]*\}/)
    const data = JSON.parse(match?.[0] ?? '{}')
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'PARSE_ERROR' }, { status: 500 })
  }
}
