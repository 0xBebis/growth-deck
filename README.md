# GrowthDeck

AI-powered growth hacking platform for startups. Discover engagement opportunities across social platforms, draft intelligent replies, and scale your outreach with automation.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38bdf8)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748)

## Features

### Discovery Feed
- **Multi-platform monitoring** - Reddit, Twitter/X, LinkedIn, Hacker News
- **AI-powered classification** - Automatic intent detection (questions, complaints, discussions)
- **Relevance scoring** - Prioritize high-value engagement opportunities
- **Keyboard-first navigation** - j/k to navigate, r to reply, d to dismiss

### Reply Queue
- **AI draft generation** - Context-aware replies matching your brand voice
- **Quality scoring** - Real-time feedback on draft quality
- **Platform account management** - Switch between company and personal accounts
- **Scheduling** - Queue replies for optimal posting times

### Analytics Dashboard
- **Engagement metrics** - Track posts discovered, replies sent, response rates
- **Platform performance** - Compare effectiveness across platforms
- **Conversion funnel** - Visualize your discovery-to-engagement pipeline
- **Week-over-week trends** - Monitor growth trajectory

### Leads CRM
- **Automatic lead capture** - Extract leads from engagement interactions
- **Lead scoring** - AI-powered scoring based on engagement signals
- **Status tracking** - New → Engaged → Warm → Hot → Converted
- **Interaction history** - Full timeline of touchpoints

### Competitor Radar
- **Competitor monitoring** - Track mentions of competitors across platforms
- **Sentiment analysis** - Identify negative sentiment as opportunities
- **Share of voice** - Compare your presence vs competitors
- **Opportunity alerts** - Get notified of engagement opportunities

### Influencer Tracking
- **Tier-based organization** - Nano to Mega influencer classification
- **Relationship scoring** - Track engagement and response rates
- **Ambassador program** - Identify and nurture brand advocates
- **Interaction logging** - Full history of influencer touchpoints

### Autopilot Mode
- **Auto-drafting** - Automatically generate replies for high-score posts
- **Rate limiting** - Configurable daily/hourly limits
- **Approval queue** - Review and approve before sending
- **Safety controls** - Platform-specific posting windows

### Playbook System
- **Platform-specific guides** - Tailored best practices per platform
- **Brand voice templates** - Consistent messaging across all replies
- **Do's and Don'ts** - Clear guidelines for your team
- **AI writing rules** - Banned words, phrases, and style enforcement

### Integrations
- **Slack notifications** - Real-time alerts for high-priority posts
- **Daily/weekly summaries** - Automated metric reports
- **Queue alerts** - Notifications for stale drafts
- **OpenRouter AI** - Flexible model selection for generation

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4.1
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma 6.19
- **Auth**: NextAuth.js 5 (Google OAuth)
- **AI**: OpenRouter (multi-model support)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (we recommend [Neon](https://neon.tech))
- Google OAuth credentials (for authentication)
- OpenRouter API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/growthdeck.git
   cd growthdeck
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your credentials:
   ```env
   # Database (Neon)
   DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
   DIRECT_DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

   # Auth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate-a-secret-here"

   # OpenRouter
   OPENROUTER_API_KEY="your-openrouter-key"
   ```

4. **Initialize the database**
   ```bash
   npm run setup
   ```

5. **Start the development server**
   ```bash
   npm run dev:clean
   ```

6. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:clean` | **Recommended** - Clean start (kills zombies, clears cache, verifies Prisma) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run clean` | Kill all dev servers and clear caches |
| `npm run setup` | First-time setup (install, generate, push) |
| `npm run db:push` | Push schema changes to database |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database (destructive) |

## Project Structure

```
growthdeck/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Main app routes
│   │   ├── analytics/     # Analytics dashboard
│   │   ├── autopilot/     # Automation settings
│   │   ├── discover/      # Discovery feed
│   │   ├── influencers/   # Influencer tracking
│   │   ├── leads/         # CRM
│   │   ├── playbook/      # Writing guides
│   │   ├── queue/         # Reply queue
│   │   ├── radar/         # Competitor intelligence
│   │   └── settings/      # App settings
│   └── api/               # API routes
├── components/            # React components
│   ├── analytics/         # Analytics components
│   ├── autopilot/         # Autopilot components
│   ├── discovery/         # Discovery feed components
│   ├── influencers/       # Influencer components
│   ├── layout/            # Layout components
│   ├── leads/             # CRM components
│   ├── playbook/          # Playbook components
│   ├── queue/             # Queue components
│   ├── radar/             # Radar components
│   ├── settings/          # Settings components
│   └── shared/            # Shared components
├── lib/                   # Utilities and services
│   ├── classification/    # Post classification
│   ├── drafting/          # Reply drafting
│   ├── listeners/         # Platform listeners
│   ├── openrouter/        # AI client
│   └── slack/             # Slack integration
├── prisma/                # Database schema
└── scripts/               # Development scripts
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection (pooled) | Yes |
| `DIRECT_DATABASE_URL` | PostgreSQL connection (direct) | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `NEXTAUTH_URL` | App URL for auth callbacks | Yes |
| `NEXTAUTH_SECRET` | NextAuth encryption secret | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key | Yes |
| `AUTH_ALLOWED_DOMAIN` | Restrict auth to email domain | No |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook | No |
| `ENCRYPTION_KEY` | 32-byte hex key for credentials | No |
| `CRON_SECRET` | Secret for cron job auth | No |

## Keyboard Shortcuts

### Discovery Feed
| Key | Action |
|-----|--------|
| `j` / `↓` | Next post |
| `k` / `↑` | Previous post |
| `o` / `Enter` | Open post in new tab |
| `r` | Draft reply |
| `d` | Dismiss post |
| `⌘K` | Open command palette |

### Queue
| Key | Action |
|-----|--------|
| `j` / `↓` | Next reply |
| `k` / `↑` | Previous reply |
| `e` | Edit reply |
| `s` | Send reply |

## Background Jobs (Cron)

GrowthDeck uses cron jobs to monitor platforms and process posts. These are configured in `vercel.json`:

| Endpoint | Schedule | Description |
|----------|----------|-------------|
| `/api/cron/listen-reddit` | Every 15 min | Monitor configured subreddits |
| `/api/cron/listen-hn` | Every 15 min | Monitor Hacker News |
| `/api/cron/listen-twitter` | Every 15 min | Monitor Twitter/X |
| `/api/cron/listen-linkedin` | Every 15 min | Monitor LinkedIn |
| `/api/cron/classify` | Every 10 min | Classify new posts with AI |
| `/api/cron/slack-stale-queue` | Hourly | Alert about stale queue items |

For local development, you can trigger these manually via curl or your browser.

## Database Schema

### Core Models

| Model | Description |
|-------|-------------|
| `User` | User accounts with roles (Admin/Contributor) |
| `DiscoveredPost` | Posts found across platforms |
| `Reply` | Generated/sent replies to posts |
| `PlatformAccount` | Social account connections |
| `Lead` | CRM leads extracted from interactions |
| `Influencer` | Tracked influencers with relationship scores |

### Configuration Models

| Model | Description |
|-------|-------------|
| `CompanyProfile` | Brand info and voice settings |
| `PlaybookEntry` | Platform-specific guidelines |
| `WritingRules` | AI prompt rules (banned words) |
| `LlmConfig` | AI model settings and budget |
| `SlackConfig` | Notification settings |
| `AutopilotConfig` | Automation settings |

### Key Enums

- `Platform`: X, LINKEDIN, REDDIT, HN
- `IntentType`: QUESTION, COMPLAINT, DISCUSSION, SHOWCASE
- `PostStatus`: NEW, QUEUED, REPLIED, DISMISSED
- `ReplyStatus`: DRAFT, SCHEDULED, SENT, FAILED
- `LeadStatus`: NEW, ENGAGED, WARM, HOT, CONVERTED, LOST

## API Endpoints

### Discovery
- `GET /api/discovery` - Fetch discovered posts with filtering
- `POST /api/discovery/dismiss` - Dismiss a post
- `POST /api/discovery/draft` - Generate a reply draft

### Replies
- `GET /api/replies` - List replies
- `PATCH /api/replies/:id` - Update a reply
- `POST /api/replies/:id/send` - Send a reply
- `POST /api/replies/:id/regenerate` - Regenerate draft

### Analytics
- `GET /api/analytics/summary` - Get analytics summary
- `GET /api/analytics/spending` - Get AI spending data

### Autopilot
- `GET /api/autopilot/config` - Get autopilot settings
- `PATCH /api/autopilot/config` - Update autopilot settings
- `GET /api/autopilot/queue` - Get autopilot queue

### OpenRouter
- `POST /api/openrouter/chat` - Chat completion
- `GET /api/openrouter/models` - List available models

## Configuration Guide

### Setting Up Platform Monitoring

1. Go to **Settings** → **Platform Accounts**
2. Add your Reddit, Twitter, LinkedIn credentials
3. Configure keywords and subreddits to monitor in **Settings** → **Monitoring**
4. Set up your company profile and brand voice in **Settings** → **Company**

### Configuring AI Models

1. Get an API key from [OpenRouter](https://openrouter.ai)
2. Go to **Settings** → **AI Model**
3. Select your preferred model (Claude, GPT-4, etc.)
4. Set budget limits (daily/monthly)
5. Configure temperature settings for different tasks:
   - Classification: Lower temperature (0.1-0.3) for consistency
   - Drafting: Medium temperature (0.5-0.7) for creativity
   - Summarization: Low temperature (0.2-0.4) for accuracy

### Setting Up Slack Notifications

1. Create a Slack app and incoming webhook at [api.slack.com](https://api.slack.com)
2. Add `SLACK_WEBHOOK_URL` to your environment variables
3. Configure notification preferences in **Settings** → **Integrations**
4. Options include:
   - High-priority post alerts
   - Daily/weekly metric summaries
   - Stale queue notifications

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Vercel automatically handles:
- Cron jobs from `vercel.json`
- Serverless function deployment
- Edge caching and CDN

### Database Setup (Neon)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy connection strings:
   - Pooled connection → `DATABASE_URL`
   - Direct connection → `DIRECT_DATABASE_URL`
3. Run `npm run db:push` to create tables

### Docker

```bash
# Build the image
docker build -t growthdeck .

# Run with environment variables
docker run -p 3000:3000 --env-file .env.local growthdeck
```

## Development

### Local Development Tips

```bash
# Recommended: Clean start (kills zombie processes, clears cache)
npm run dev:clean

# Open Prisma Studio to browse/edit data
npm run db:studio

# Reset database (destructive - drops all data)
npm run db:reset
```

### Adding a New Platform Listener

1. Create a new file in `lib/listeners/` (e.g., `mastodon.ts`)
2. Extend the base listener class from `lib/listeners/base.ts`
3. Implement the required methods: `fetchPosts()`, `parsePost()`
4. Add the platform to the `Platform` enum in `prisma/schema.prisma`
5. Create a cron endpoint in `app/api/cron/listen-[platform]/route.ts`
6. Add the cron schedule to `vercel.json`

### Modifying AI Prompts

- Classification prompts: `lib/classification/prompts.ts`
- Reply drafting prompts: `lib/drafting/prompts.ts`
- Adjust prompts based on your product/industry for better results

### Testing Cron Jobs Locally

```bash
# Trigger a cron job manually
curl http://localhost:3000/api/cron/listen-reddit

# With authentication (if CRON_SECRET is set)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/classify
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new files
- Follow the existing component structure
- Use Tailwind CSS for styling
- Keep components small and focused

## License

MIT License - feel free to use this project as a starting point for your own growth hacking tool.

## Support

For issues and feature requests, please open an issue on GitHub.
