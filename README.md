# Project Life Line - Inventory Management Dashboard

A comprehensive inventory management dashboard with AI integration, real-time analytics, and offline support.

## 🚀 Features

- **Dashboard Analytics**: Interactive charts and real-time inventory tracking
- **Product Management**: CRUD operations with CSV import/export
- **Sales Tracking**: Complete sales management with reporting
- **AI Integration**: Chat support, voice transcription, image generation
- **Offline Support**: Works without internet connection with data sync
- **Performance Optimized**: Lite mode for 70% faster loading
- **Authentication**: Secure user authentication with Supabase

## 🛠 Technologies Used

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, ShadCN UI Components
- **Database**: Supabase (PostgreSQL) with offline IndexedDB support
- **Authentication**: Supabase Auth
- **Charts**: Chart.js with react-chartjs-2
- **AI Services**: OpenAI, Anthropic, Deepgram, Replicate
- **Deployment**: Vercel-ready configuration

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd template-2-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials and other API keys

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📦 Deployment to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/your-repo)

### Manual Deployment

1. **Build the project locally**
   ```bash
   npm run build
   ```

2. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **Deploy to Vercel**
   ```bash
   vercel
   ```

4. **Configure Environment Variables in Vercel**
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add all environment variables from `.env.local`
   - Update `NEXTAUTH_URL` to your Vercel domain

### Required Environment Variables for Production

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Next.js Configuration
NEXTAUTH_SECRET=your_secure_random_string
NEXTAUTH_URL=https://your-domain.vercel.app

# Optional API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
REPLICATE_API_TOKEN=your_replicate_api_token
```

## 🏗 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   │   ├── light/         # Lite mode (performance optimized)
│   │   ├── products/      # Product management
│   │   ├── sales/         # Sales management
│   │   └── reports/       # Analytics and reports
│   └── auth/              # Authentication pages
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
│   ├── supabase/         # Supabase client configuration
│   ├── offline/          # Offline database and sync
│   └── utils/            # Helper functions
└── styles/               # Global styles
```

## 🎯 Key Features

### Performance Modes
- **Full Dashboard**: Complete feature set with animations and advanced charts
- **Lite Mode**: 70% faster loading, essential features only
- Access lite mode at `/dashboard/light`

### Offline Support
- Works without internet connection
- Automatic data synchronization when online
- IndexedDB for local data storage

### AI Integration
- Chat assistance with OpenAI/Anthropic
- Voice transcription with Deepgram
- Image generation with Replicate

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Performance Optimization

- Lazy loading for heavy components
- Image optimization with Next.js Image
- Bundle size optimization
- Service worker for offline functionality

## 📊 Database Schema

The application uses Supabase with the following main tables:
- `users` - User authentication and profiles
- `products` - Product inventory
- `sales` - Sales transactions
- Foreign key relationships for data integrity

## 🛡 Security Features

- Row Level Security (RLS) with Supabase
- CSRF protection
- XSS protection headers
- Secure authentication flow
- Environment variable protection

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface
- Accessibility compliant (WCAG 2.1)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

---

**Developed with ❤️ for efficient inventory management**