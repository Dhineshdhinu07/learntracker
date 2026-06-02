'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, BarChart2, Calendar, Sparkles, Home } from 'lucide-react'

const navItems = [
  { href: '/',       icon: Home,     label: 'Today'  },
  { href: '/log',    icon: BookOpen, label: 'Log'    },
  { href: '/plan',   icon: Calendar, label: 'Plan'   },
  { href: '/stats',  icon: BarChart2,label: 'Stats'  },
  { href: '/coach',  icon: Sparkles, label: 'Coach'  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <>
      {/* ── Mobile bottom nav ──────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(9,9,14,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--line)',
        }}
      >
        <div
          className="flex items-center justify-around"
          style={{
            height: 60,
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  minWidth: 56,
                  minHeight: 56,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  color: active ? '#818cf8' : 'var(--ink-4)',
                  position: 'relative',
                }}
              >
                {/* Stripe-style pill indicator above active icon */}
                {active && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 20,
                      height: 3,
                      background: '#6366f1',
                      borderRadius: 9999,
                    }}
                  />
                )}
                <Icon
                  size={20}
                  strokeWidth={active ? 2.2 : 1.6}
                  style={{ marginTop: active ? 6 : 2 }}
                />
                <span style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  letterSpacing: active ? 0.01 : 0,
                }}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ── Desktop sidebar ────────────────────────────────── */}
      <nav
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 flex-col z-50"
        style={{
          background: 'var(--surface-1)',
          borderRight: '1px solid var(--line)',
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              L
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                LearnTrack
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>Job switch prep</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-0.5 p-3 flex-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: active ? '#818cf8' : 'var(--ink-3)',
                  border: active ? '1px solid rgba(99,102,241,0.18)' : '1px solid transparent',
                  letterSpacing: '-0.01em',
                }}
              >
                <Icon size={16} strokeWidth={active ? 2.2 : 1.7} />
                {label}
                {/* Stripe-style active dot */}
                {active && (
                  <span
                    className="ml-auto"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#6366f1',
                    }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        {/* Focus areas footer */}
        <div className="p-4" style={{ borderTop: '1px solid var(--line)' }}>
          <div className="eyebrow mb-3">Focus areas</div>
          <div className="flex flex-col gap-1.5">
            {[
              { label: 'DSA', color: '#6366f1' },
              { label: 'Java', color: '#f59e0b' },
              { label: 'System Design', color: '#10b981' },
              { label: 'AI Engineering', color: '#8b5cf6' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </>
  )
}
