# 📚 Learning Tracker

A modern, intelligent learning management system built with Next.js and Supabase. Track your study sessions, analyze learning patterns, set weekly goals, and get AI-powered coaching recommendations.

## ✨ Features

### 🎯 **Today's Dashboard**
- Real-time view of today's study sessions
- Quick stats: total time studied, top category, current streak
- Add new learning sessions with an intuitive form
- Visual category breakdown with progress indicators
- Clean, responsive UI with Stripe-inspired design

### 📝 **Session Logging**
- Create study logs with:
  - **Category selection** (DSA, Java, System Design, AI Engineering, Other)
  - **Date & Time picker** with smart defaults
  - **Duration calculation** (cross-midnight support)
  - **Topic description** and optional notes
- Auto-calculated session duration with visual feedback
- Delete sessions with confirmation
- Timezone-aware timestamps

### 📊 **Statistics & Analytics**
- **60-day learning history** with comprehensive analytics
- **Streak tracking** - see your consecutive study days
- **Weekly breakdown** - compare this week vs. long-term averages
- **Category-wise distribution** - understand your learning focus
- **Average daily study time** - 7-day rolling average
- Visual charts and progress indicators

### 🎓 **Weekly Planning**
- **Goal setting** for each category (DSA, Java, System Design, AI Engineering, Other)
- **Smart defaults** based on interview prep recommendations
- **Weekly progress tracking** - see how you're doing against targets
- **Edit goals anytime** - adjust plans as needed
- Built-in recommendations guide (5h/week DSA, 3h/week Java, etc.)
- Real-time actual vs. target progress bars

### 🤖 **AI Coach** (Claude API Powered)
- **Smart conversation interface** with your learning coach
- **Quick prompts** for common queries:
  - "What should I study today?"
  - "What topics have I been neglecting?"
  - "Build me a 2-week study plan"
  - "How's my prep looking? Be honest."
  - "What's the highest ROI topic this week?"
  - "I have 2 hours tonight — what should I do?"
- **Context-aware** - coach sees your entire learning history
- **30-day summary** with totals by category
- Real-time response streaming
- Error handling and loading states

### 📱 **Responsive Design**
- Mobile-first approach with bottom navigation
- Works seamlessly on desktop, tablet, and mobile
- Optimized for touch interactions
- Accessible UI components with proper contrast and sizing

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16.2](https://nextjs.org/) (React 19, TypeScript)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **UI Components**: 
  - `@base-ui/react` - Headless UI components
  - `lucide-react` - Beautiful icons
  - `react-day-picker` - Calendar picker
- **Date Handling**: `date-fns` for parsing and formatting
- **Utilities**: `clsx`, `tailwind-merge` for className management

### Backend & Database
- **Backend as a Service**: [Supabase](https://supabase.com/)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Open policy (personal use - no auth required)
- **Client**: `@supabase/supabase-js`

### AI Integration
- **LLM**: [Claude API](https://anthropic.com/) via `@anthropic-ai/sdk`
- **Features**: Context-aware coaching and recommendations

### Development Tools
- **Linting**: ESLint 9
- **Package Manager**: npm
- **Build Tool**: Tailwind CSS PostCSS plugin

## 📋 Project Structure

```
learning_tracker/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Today's dashboard
│   │   ├── coach/page.tsx        # AI coach interface
│   │   ├── stats/page.tsx        # Analytics & history
│   │   ├── plan/page.tsx         # Weekly goal planning
│   │   ├── log/page.tsx          # Session browser
│   │   ├── api/coach/route.ts    # Claude API endpoint
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   ├── LogEntryForm.tsx      # Session creation form
│   │   ├── SessionCard.tsx       # Session display card
│   │   ├── DatePicker.tsx        # Date selection
│   │   ├── TimePicker.tsx        # Time selection
│   │   ├── BottomNav.tsx         # Mobile navigation
│   │   └── ui/                   # shadcn/ui components
│   └── lib/
│       ├── db.ts                 # Database functions
│       ├── supabase.ts           # Supabase client & types
│       └── utils.ts              # Utility functions
├── public/                        # Static assets
├── supabase-schema.sql           # Database schema
├── package.json
├── tsconfig.json
└── next.config.ts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (or use `nvm`)
- npm or yarn
- Supabase account (free tier works great)
- Anthropic API key (for Claude AI coach)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/learning_tracker.git
   cd learning_tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and paste the contents of `supabase-schema.sql`
   - This creates `log_entries` and `weekly_goals` tables with proper indexes

4. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

   Get these from:
   - **Supabase URL & Anon Key**: Project Settings → API
   - **Anthropic API Key**: [console.anthropic.com](https://console.anthropic.com)

5. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

### 🎯 Logging a Study Session

1. Go to the **Today** page (home)
2. Click the **+ Log Session** button
3. Fill in:
   - **Category**: Choose from DSA, Java, System Design, AI Engineering, Other
   - **Topic**: What you studied (e.g., "Binary Search Trees")
   - **Date**: When you studied
   - **Start Time** & **End Time**: Duration (supports cross-midnight sessions)
   - **Notes** (optional): Additional context
4. Click **Save** - your session is logged!

### 📊 Tracking Progress

1. Go to **Stats** page to see:
   - Your current streak
   - Total hours logged (60-day window)
   - Weekly average
   - Category breakdown
   - All-time totals

2. Go to **Plan** page to:
   - Set weekly goals for each category
   - Compare actual vs. planned time
   - Adjust targets based on progress
   - See recommendations by category

### 🤖 Getting AI Coaching

1. Go to **Coach** page
2. Choose a quick prompt or type a custom question
3. Read Claude's response with insights from your learning history
4. Continue the conversation for deeper guidance

### 📋 Browsing Session History

- Go to **Log** page to see all logged sessions
- Filter and browse your complete learning history
- Delete sessions if needed

## 🗄️ Database Schema

### `log_entries` table
```sql
- id (UUID, PK)
- user_id (text, default: 'default')
- category (text) - DSA | Java | System Design | AI Engineering | Other
- topic (text) - What you studied
- start_time (text) - HH:MM format
- end_time (text) - HH:MM format
- duration_minutes (integer) - Calculated duration
- notes (text, nullable)
- date (date) - Study date
- created_at (timestamptz, auto)
```

**Indexes**: `date`, `user_id`, `category` for fast queries

### `weekly_goals` table
```sql
- id (UUID, PK)
- user_id (text, default: 'default')
- category (text)
- target_minutes (integer, default: 120)
- week_start (date) - Start of week
- unique(user_id, category, week_start)
```

## 🔧 API Routes

### `POST /api/coach`
Endpoint for AI coaching powered by Claude.

**Request Body**:
```json
{
  "message": "What should I study today?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "context": "Your learning history..."
}
```

**Response**:
```json
{
  "response": "Here's my recommendation..."
}
```

## 🎨 Design System

- **Colors**: Custom category colors + semantic palette
- **Typography**: Clean, readable sans-serif
- **Component Library**: shadcn/ui (built on Radix UI)
- **Icons**: Lucide React for consistency
- **Animations**: Smooth transitions with Tailwind CSS
- **Spacing**: 4px grid system (Tailwind defaults)

### Category Colors
- 🧩 **DSA**: Indigo (#6366f1)
- ☕ **Java**: Amber (#f59e0b)
- 🏗️ **System Design**: Emerald (#10b981)
- 🤖 **AI Engineering**: Violet (#8b5cf6)
- 📚 **Other**: Gray (#6b7280)

## 🧪 Testing

Run ESLint to check for code quality issues:
```bash
npm run lint
```

## 🏗️ Building for Production

```bash
npm run build
npm start
```

This creates an optimized production build and starts the Next.js server.

## 🐛 Troubleshooting

### "SUPABASE_NOT_CONFIGURED" error
- Ensure `.env.local` exists with valid Supabase credentials
- Check that environment variables are properly formatted

### AI Coach not responding
- Verify `ANTHROPIC_API_KEY` is set and valid
- Check your Anthropic API quota/billing
- Look at server logs for error details

### Sessions not saving
- Verify Supabase connection in browser DevTools (Network tab)
- Check browser console for error messages
- Ensure database schema is properly initialized

### Styling issues
- Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
- Rebuild Tailwind CSS: `npm run build`
- Check for conflicting CSS in DevTools

## 📚 Key Concepts

### Streak Logic
Calculates consecutive days with at least 1 minute logged. Resets if you miss a day.

### Cross-Midnight Sessions
If end time < start time, the session is assumed to cross midnight. Duration = (1440 - start) + end.

### Weekly Goals
Reset every Monday. Defaults are based on typical interview prep schedules.

### Coach Context
Last 30 days of logged sessions formatted into a readable summary for Claude.

## 🤝 Contributing

Improvements welcome! Feel free to:
- Report bugs via GitHub issues
- Suggest features
- Submit PRs for enhancements

## 📝 License

This project is personal use - feel free to fork and modify for your own learning journey!

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/), [Supabase](https://supabase.com/), and [Claude AI](https://anthropic.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Inspired by modern learning platforms like Obsidian, Notion, and Stripe

---

**Happy Learning! 🚀**

Track your growth, stay consistent, and crush your goals. 💪

