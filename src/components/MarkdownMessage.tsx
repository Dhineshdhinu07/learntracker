'use client'

import React from 'react'

// ─── Inline formatter ────────────────────────────────────────────────────────
// Handles: **bold**, *italic*, `code`, and bare URLs
function parseInline(text: string, key: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = []
  // Pattern: **bold** | *italic* | `code` | url
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|(https?:\/\/[^\s)]+))/g
  let last = 0, m: RegExpExecArray | null

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push(text.slice(last, m.index))

    if (m[2] !== undefined) {
      tokens.push(<strong key={`${key}-b-${m.index}`} style={{ fontWeight: 700, color: 'var(--ink)' }}>{m[2]}</strong>)
    } else if (m[3] !== undefined) {
      tokens.push(<em key={`${key}-i-${m.index}`} style={{ fontStyle: 'italic', color: 'var(--ink-2)' }}>{m[3]}</em>)
    } else if (m[4] !== undefined) {
      tokens.push(
        <code key={`${key}-c-${m.index}`} style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: '0.85em',
          padding: '1px 5px',
          borderRadius: 4,
          background: 'var(--surface-3)',
          color: '#a78bfa',
          letterSpacing: '-0.01em',
        }}>{m[4]}</code>
      )
    } else if (m[5] !== undefined) {
      const url = m[5]
      tokens.push(
        <a key={`${key}-u-${m.index}`} href={url} target="_blank" rel="noopener noreferrer"
          style={{ color: '#818cf8', textDecoration: 'underline', textUnderlineOffset: 2, wordBreak: 'break-all' }}>
          {url.length > 50 ? url.slice(0, 50) + '…' : url}
        </a>
      )
    }
    last = m.index + m[0].length
  }

  if (last < text.length) tokens.push(text.slice(last))
  return tokens
}

// ─── Block-level renderer ────────────────────────────────────────────────────
interface Props { text: string }

export default function MarkdownMessage({ text }: Props) {
  const nodes: React.ReactNode[] = []
  const lines = text.split('\n')

  // Collect list items into groups so we can render <ul>/<ol> properly
  type Block =
    | { type: 'p';    content: string }
    | { type: 'h1';   content: string }
    | { type: 'h2';   content: string }
    | { type: 'h3';   content: string }
    | { type: 'ul';   items: string[] }
    | { type: 'ol';   items: string[] }
    | { type: 'hr' }
    | { type: 'code'; content: string }
    | { type: 'blank' }

  const blocks: Block[] = []
  let inCodeBlock = false
  let codeLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]

    // Fenced code block
    if (raw.startsWith('```')) {
      if (!inCodeBlock) { inCodeBlock = true; codeLines = []; continue }
      else { blocks.push({ type: 'code', content: codeLines.join('\n') }); inCodeBlock = false; continue }
    }
    if (inCodeBlock) { codeLines.push(raw); continue }

    const line = raw.trimEnd()

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) { blocks.push({ type: 'hr' }); continue }

    // Headings
    if (line.startsWith('### ')) { blocks.push({ type: 'h3', content: line.slice(4) }); continue }
    if (line.startsWith('## '))  { blocks.push({ type: 'h2', content: line.slice(3) }); continue }
    if (line.startsWith('# '))   { blocks.push({ type: 'h1', content: line.slice(2) }); continue }

    // Unordered list
    const ulMatch = line.match(/^[-*•]\s+(.+)/)
    if (ulMatch) {
      const last = blocks[blocks.length - 1]
      if (last?.type === 'ul') { last.items.push(ulMatch[1]) }
      else { blocks.push({ type: 'ul', items: [ulMatch[1]] }) }
      continue
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)/)
    if (olMatch) {
      const last = blocks[blocks.length - 1]
      if (last?.type === 'ol') { last.items.push(olMatch[1]) }
      else { blocks.push({ type: 'ol', items: [olMatch[1]] }) }
      continue
    }

    // Blank line
    if (!line.trim()) { blocks.push({ type: 'blank' }); continue }

    // Paragraph — merge consecutive non-blank text lines
    const last = blocks[blocks.length - 1]
    if (last?.type === 'p') { last.content += ' ' + line }
    else { blocks.push({ type: 'p', content: line }) }
  }

  // ── Render blocks ──────────────────────────────────────────────────────────
  let blankRun = 0

  blocks.forEach((block, idx) => {
    const k = String(idx)

    if (block.type === 'blank') {
      blankRun++
      if (blankRun === 1) nodes.push(<div key={k} style={{ height: 6 }} />)
      return
    }
    blankRun = 0

    switch (block.type) {
      case 'hr':
        nodes.push(<hr key={k} style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '10px 0' }} />)
        break

      case 'h1':
        nodes.push(
          <p key={k} style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: '10px 0 4px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
            {parseInline(block.content, k)}
          </p>
        )
        break

      case 'h2':
        nodes.push(
          <p key={k} style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: '10px 0 3px', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
            {parseInline(block.content, k)}
          </p>
        )
        break

      case 'h3':
        nodes.push(
          <p key={k} style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', margin: '8px 0 2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {parseInline(block.content, k)}
          </p>
        )
        break

      case 'ul':
        nodes.push(
          <ul key={k} style={{ margin: '4px 0', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {block.items.map((item, ii) => (
              <li key={ii} style={{ display: 'flex', gap: 7, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, alignItems: 'flex-start' }}>
                <span style={{ color: '#818cf8', marginTop: 5, flexShrink: 0, fontSize: 8 }}>◆</span>
                <span>{parseInline(item, `${k}-li-${ii}`)}</span>
              </li>
            ))}
          </ul>
        )
        break

      case 'ol':
        nodes.push(
          <ol key={k} style={{ margin: '4px 0', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3, counterReset: 'item' }}>
            {block.items.map((item, ii) => (
              <li key={ii} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, alignItems: 'flex-start' }}>
                <span style={{
                  minWidth: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                  color: '#818cf8', fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 2,
                }}>
                  {ii + 1}
                </span>
                <span>{parseInline(item, `${k}-li-${ii}`)}</span>
              </li>
            ))}
          </ol>
        )
        break

      case 'code':
        nodes.push(
          <pre key={k} style={{
            margin: '6px 0',
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--surface-3)',
            border: '1px solid var(--line-strong)',
            overflow: 'auto',
            fontSize: 12,
            lineHeight: 1.6,
            color: '#a78bfa',
            fontFamily: 'ui-monospace, "SF Mono", "JetBrains Mono", monospace',
            letterSpacing: '-0.01em',
          }}>
            {block.content}
          </pre>
        )
        break

      case 'p':
      default:
        nodes.push(
          <p key={k} style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7, margin: '2px 0' }}>
            {parseInline(block.content, k)}
          </p>
        )
    }
  })

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>{nodes}</div>
}
