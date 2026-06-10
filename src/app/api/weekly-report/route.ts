import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'NO_KEY' }, { status: 503 })

  const { context, weekLabel } = await req.json()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 900,
    system: `You are a study coach generating a concise weekly report for a software engineer prepping for a job switch.
Focus areas: DSA, Python, System Design, Computer Fundamentals, Frontend, Backend.

Structure your response with exactly these 4 sections using these exact headers:
✅ This Week
⚠️ Gaps
📅 Next Week Plan
💡 Key Insight

Use bullet points. Be specific (name actual topics). Keep each section to 2-4 bullets max. Total response under 300 words.`,
    messages: [{
      role: 'user',
      content: `Week: ${weekLabel}\n\nStudy log:\n${context}\n\nGenerate my weekly report.`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ report: text })
}
