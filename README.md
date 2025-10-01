# RippleFX

A real-time financial event tracking and analysis platform that helps investors stay ahead of market-moving events. Built with modern web technologies and AI-powered event classification.

## 🚀 Features

- **Real-Time Event Tracking**: Monitor critical financial, geopolitical, and economic events as they happen
- **AI-Powered Classification**: Intelligent event severity analysis (High/Critical impact filtering)
- **Market Sentiment Analysis**: Get AI-generated insights on how events may impact specific stocks
- **Personalized Watchlist**: Track events related to your portfolio
- **Broker Integration**: Connect your brokerage account for seamless trading
- **Smart Notifications**: Email and SMS alerts for critical events
- **Subscription Tiers**: Free trial with premium features for serious investors

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for lightning-fast builds
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Query** for data fetching
- **React Router** for navigation
- **Framer Motion** for animations

### Backend
- **Supabase** for authentication and database
- **Supabase Edge Functions** (Deno) for serverless API endpoints
- **Stripe** for payment processing
- **Perplexity API** for AI-powered event analysis
- **NewsAPI & Finnhub** for real-time financial news

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account (for payments)
- API keys for NewsAPI, Finnhub, and Perplexity

## 🔧 Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ripplefx
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_URL=your_supabase_url
```

4. Set up Supabase:
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your_project_id

# Push database migrations
supabase db push

# Deploy edge functions
supabase functions deploy
```

5. Configure secrets for edge functions:
```bash
supabase secrets set NEWS_API_KEY=your_key
supabase secrets set FINNHUB_API_KEY=your_key
supabase secrets set PERPLEXITY_API_KEY=your_key
supabase secrets set STRIPE_SECRET_KEY=your_key
supabase secrets set STRIPE_WEBHOOK_SECRET=your_key
```

6. Start the development server:
```bash
npm run dev
```

## 🏗️ Project Structure

```
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── EventDashboard/  # Dashboard-specific components
│   │   ├── broker/          # Broker integration components
│   │   ├── landing/         # Landing page sections
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Route pages
│   ├── types/               # TypeScript type definitions
│   └── integrations/        # Third-party integrations
├── supabase/
│   ├── functions/           # Edge functions (serverless API)
│   └── migrations/          # Database migrations
└── public/                  # Static assets
```

## 🔑 Key Edge Functions

- **fetch-events**: Aggregates news from multiple sources and classifies events using AI
- **classify-event-ai**: Uses Perplexity AI to determine event severity and type
- **analyze-event**: Provides detailed market analysis for specific events
- **market-sentiment**: Generates stock predictions based on events
- **execute-trade**: Handles broker API integration for automated trading
- **webhook-stripe**: Processes Stripe webhooks for subscription management

## 🎨 Design System

The project uses a custom design system with semantic color tokens defined in `src/index.css` and `tailwind.config.ts`. All components follow a consistent theming approach with support for light/dark modes.

## 🚢 Deployment

### Frontend
```bash
npm run build
```

Deploy the `dist` folder to your preferred hosting service (Netlify, Vercel, etc.).

### Backend
Edge functions are automatically deployed via Supabase CLI:
```bash
supabase functions deploy
```

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `NEWS_API_KEY` | NewsAPI.org API key |
| `FINNHUB_API_KEY` | Finnhub.io API key |
| `PERPLEXITY_API_KEY` | Perplexity AI API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## 📄 License

MIT License - feel free to use this project as inspiration for your own work.

## 🙏 Acknowledgments

- Built with [Cursor](https://cursor.sh) - AI-powered code editor
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Backend powered by [Supabase](https://supabase.com)

---

**Note**: This project is for educational and personal use. Always consult with a financial advisor before making investment decisions.
