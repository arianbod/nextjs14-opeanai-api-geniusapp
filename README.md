# BabaGPT - Next-Generation AI Assistant Platform

BabaGPT is a modern, multilingual AI chat platform built with Next.js 15, offering seamless integration with multiple AI providers including OpenAI, Anthropic, Gemini, and Perplexity. The platform supports real-time conversations, file analysis, and complex mathematical expressions with LaTeX rendering.

## 🌟 Features

### Multiple AI Providers Integration

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google (Gemini)
- Perplexity
- Deepseek
- X (Grok)

### Advanced Chat Capabilities

- Real-time streaming responses
- File upload and analysis
- Code syntax highlighting
- LaTeX math rendering
- SVG generation
- Markdown support

### Multilingual Support

- RTL languages (Arabic, Persian, Hebrew)
- Customizable language preferences
- Automatic language detection
- Font optimization for different scripts

### Modern UI/UX

- Responsive design
- Dark/Light themes
- Customizable sidebar
- Interactive chat interface
- Real-time typing indicators

### Authentication & Security

- Token-based authentication
- Email verification
- Session management
- Rate limiting
- Payment integration with Stripe

## 🚀 Tech Stack

### Frontend

- Next.js 15
- React 19
- TailwindCSS
- Framer Motion
- ShadcnUI Components

### Backend

- PostgreSQL with Prisma ORM
- REST APIs
- Server-Side Rendering
- API Route Handlers

### AI Integration

- Multiple AI Provider SDKs
- Streaming Response Handling
- File Processing
- Custom Provider Management

## 📋 Prerequisites

- Node.js 18.x or higher
- PostgreSQL 13 or higher
- NPM or Yarn
- API keys for desired AI providers

## ⚙️ Environment Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/babagpt.git
cd babagpt
```

2. Install dependencies:

```bash
npm install --legacy-peer-deps --force --production=false
```

3. Create a `.env` file with the following variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/babagpt"
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
GOOGLE_API_KEY="your-google-key"
PERPLEXITY_API_KEY="your-perplexity-key"
DEEPSEEK_API_KEY="your-deepseek-key"
X_API_KEY="your-x-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-public-key"
```

4. Initialize the database:

```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:

```bash
npm run dev
```

## 🏗️ Project Structure

```
babagpt/
├── app/                    # Next.js app directory
├── components/            # React components
├── context/              # React context providers
├── lib/                  # Utility functions and configurations
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── server/               # Server-side code and API handlers
```

## 🔧 Configuration

### AI Providers

Configure AI providers in `lib/ai-providers/`:

- Set API keys in environment variables
- Adjust model parameters in provider configurations
- Customize response formatting

### Database

Manage database schema in `prisma/schema.prisma`:

- Define models and relationships
- Configure indexes and constraints
- Handle migrations

### Authentication

Configure auth settings in `context/AuthContext.js`:

- Adjust session duration
- Configure token validation
- Set up email verification

## 📦 Deployment

1. Build the project:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

### Vercel Deployment

```bash
vercel deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- All AI providers for their amazing APIs

## 📞 Support

For support, email arian@babaai.ca or join our Discord server.
