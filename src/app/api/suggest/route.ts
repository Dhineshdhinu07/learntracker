import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ suggestions: [] })

  const { topic, category } = await req.json()

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 200,
    system: `You are a study coach. Given a topic just studied, return exactly 3 specific next topics to study in that area.
Return ONLY a JSON array of 3 short strings (2-5 words each). No explanation, no markdown, no extra text.
Example: ["Two Pointer Pattern", "Sliding Window", "Binary Search on Answer"]`,
    messages: [{
      role: 'user',
      content: `Category: ${category}\nJust studied: ${topic}\n\nSuggest 3 specific next topics. JSON array only.`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
  try {
    const match = text.match(/\[[\s\S]*?\]/)
    const suggestions: string[] = JSON.parse(match?.[0] ?? '[]')
    return NextResponse.json({ suggestions: suggestions.slice(0, 3) })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
