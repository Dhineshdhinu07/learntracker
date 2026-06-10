'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, BarChart2, Sparkles, Home, Timer, Calendar } from 'lucide-react'

const mobileNav = [
  { href: '/',      icon: Home,     label: 'Today'  },
  { href: '/focus', icon: Timer,    label: 'Focus'  },
  { href: '/log',   icon: BookOpen, label: 'Log'    },
  { href: '/stats', icon: BarChart2,label: 'Stats'  },
  { href: '/coach', icon: Sparkles, label: 'Coach'  },
]

const desktopNav = [
  { href: '/',      icon: Home,     label: 'Today'  },
  { href: '/focus', icon: Timer,    label: 'Focus'  },
  { href: '/log',   icon: BookOpen, label: 'Log'    },
  { href: '/plan',  icon: Calendar, label: 'Plan'   },
  { href: '/stats', icon: BarChart2,label: 'Stats'  },
  { href: '/coach', icon: Sparkles, label: 'Coach'  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const hideMobileNav = pathname === '/focus'

  return (
    <>
      {/* ── Mobile bottom nav — glass panel ─────────────────── */}
      {!hideMobileNav && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50"
          style={{
            /* Glassmorphism */
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            /* Hairline top border with inner glow */
            borderTop: '1px solid rgba(255,255,255,0.07)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 -8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div
            className="flex items-center justify-around"
            style={{
              height: 62,
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {mobileNav.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href))
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
                    position: 'relative',
                    transition: 'opacity 150ms',
                    opacity: active ? 1 : 0.45,
                  }}
                >
                  {/* Active bar — thin white line above icon */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: '50%',
                      transform: `translateX(-50%) scaleX(${active ? 1 : 0})`,
                      width: 18,
                      height: 2,
                      background: '#ffffff',
                      borderRadius: 9999,
                      transition: 'transform 250ms cubic-bezier(0.2,0,0,1)',
                    }}
                  />
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.2 : 1.5}
                    style={{
                      color: active ? '#ffffff' : 'rgba(255,255,255,0.55)',
                      transition: 'color 200ms cubic-bezier(0.2,0,0,1), stroke-width 200ms',
                      marginTop: 6,
                    }}
                  />
                  <span style={{
                    fontSize: 10,
                    fontWeight: active ? 700 : 500,
                    letterSpacing: active ? '0.02em' : '0',
                    color: active ? '#ffffff' : 'rgba(255,255,255,0.4)',
                    transition: 'color 200ms cubic-bezier(0.2,0,0,1), font-weight 200ms',
                  }}>
                    {label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      {/* ── Desktop sidebar — frosted glass ─────────────────── */}
      <nav
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 flex-col z-50"
        style={{
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.03)',
        }}
      >
        {/* Logo */}
        <div
          className="px-5 pt-6 pb-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'linear-gradient(135deg, #ffffff, #666666)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#000', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(255,255,255,0.15)',
              }}
            >
              L
            </div>
            <div>
              <div style={{
                fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)',
              }}>
                LearnTrack
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.01em' }}>
                Job switch prep
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-0.5 p-2.5 flex-1">
          {desktopNav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color:      active ? '#ffffff' : 'rgba(255,255,255,0.4)',
                  border:     active ? '1px solid rgba(255,255,255,0.10)' : '1px solid transparent',
                  letterSpacing: '-0.01em',
                  transition: 'background 180ms cubic-bezier(0.2,0,0,1), color 180ms, border-color 180ms',
                  boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                    ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'
                  }
                }}
              >
                <Icon
                  size={16}
                  strokeWidth={active ? 2.2 : 1.7}
                  style={{ transition: 'stroke-width 200ms' }}
                />
                {label}
                {active && (
                  <span
                    className="ml-auto"
                    style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: '#ffffff',
                      boxShadow: '0 0 6px rgba(255,255,255,0.6)',
                    }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        {/* Focus areas footer */}
        <div
          className="p-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="eyebrow mb-3">Focus areas</div>
          <div className="flex flex-col gap-1.5">
            {[
              { label: 'DSA',                   color: '#6366f1' },
              { label: 'Python',                color: '#0ea5e9' },
              { label: 'System Design',         color: '#10b981' },
              { label: 'Computer Fundamentals', color: '#f59e0b' },
              { label: 'Frontend',              color: '#ec4899' },
              { label: 'Backend',               color: '#8b5cf6' },
            ].map((f, i) => (
              <div
                key={f.label}
                className="flex items-center gap-2 animate-in"
                style={{ '--delay': `${i * 30}ms` } as React.CSSProperties}
              >
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: f.color, flexShrink: 0,
                  boxShadow: `0 0 4px ${f.color}80`,
                }} />
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </>
  )
}
