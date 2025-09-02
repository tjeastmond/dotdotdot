# ✨ DotDotDot

**DotDotDot** is a minimal, fast, and professional tool that transforms walls of text into clean, concise bullet points using AI. Designed for clarity, cost-efficiency, and elegance — not gimmicks.

## ✨ Features

- **AI-Powered Text Processing**: Transform long text into clear, concise bullet points
- **Theme Toggle**: Switch between light, dark, and system themes
- **Real-time Streaming**: Watch bullets appear with smooth animations
- **Smart Caching**: Local memory cache for faster responses and cost savings
- **CSRF Protection**: Secure API endpoints with token validation
- **Responsive Design**: Modern UI that works on all devices
- **TypeScript**: Full type safety and modern development experience

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd dotdotdot.dev
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Add your API keys and configuration
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Theme System

DotDotDot includes a comprehensive theme system with three options:

- **Light Theme**: Clean, bright interface
- **Dark Theme**: Easy-on-the-eyes dark mode
- **System Theme**: Automatically follows your OS preference

The theme toggle is located in the top-right corner of the header and persists your choice across sessions.

## 🔧 Environment Configuration

```bash
# AI API Configuration
GROQ_API_KEY=your_groq_api_key_here

# Cache Configuration
ENABLE_CACHE=true                    # Enable/disable cache (default: false)
CACHE_TTL=3600000                   # Cache TTL in milliseconds (default: 1 hour)
CACHE_MAX_SIZE=1000                 # Maximum cache entries (default: 1000)

# CSRF Protection
CSRF_SECRET=your_secret_here        # Change in production
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check
```

## 🏗️ Project Structure

```
src/
├── app/                           # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── bullets/             # Bullet generation endpoint
│   │   └── csrf-token/          # CSRF token endpoint
│   ├── globals.css              # Global styles and theme variables
│   ├── layout.tsx               # Root layout with theme provider
│   └── page.tsx                 # Main page component
├── components/                   # React components
│   ├── TextToBulletsForm.tsx    # Main form component
│   ├── ThemeToggle.tsx          # Theme switching component
│   ├── ThemeProvider.tsx        # Theme context provider
│   ├── ClientOnly.tsx           # Hydration-safe wrapper
│   └── ui/                      # Reusable UI components
│       ├── button.tsx           # Button component
│       └── index.ts             # Component exports
├── lib/                         # Utility libraries
│   ├── cache.ts                 # Memory cache implementation
│   ├── callAI.ts                # AI API integration
│   ├── csrf.ts                  # CSRF token management
│   ├── processUserInput.ts      # Input processing
│   ├── rateLimit.ts             # Rate limiting
│   └── utils.ts                 # Utility functions
└── types/                       # TypeScript definitions
    └── index.ts                 # Type interfaces
```

## 🔄 Cache Implementation

### Features

- **Local Memory Storage**: Fast in-memory Map for caching
- **TTL Support**: Automatic expiration of cached entries
- **Size Management**: Automatic cleanup when cache reaches max size
- **Feature Flag**: Can be completely disabled via environment variable
- **Hash-based Keys**: Efficient key generation using simple hash function

### Usage

The cache automatically stores AI responses to avoid duplicate API calls:

```typescript
// Cache is automatically used in the API
// No manual configuration needed
```

### Cache Statistics

In development mode, the API returns cache statistics:

```json
{
  "bullets": ["bullet 1", "bullet 2"],
  "truncated": false,
  "originalLength": 150,
  "processedLength": 150,
  "cacheStats": {
    "size": 5,
    "maxSize": 1000,
    "enabled": true
  }
}
```

## 🎯 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

### Adding New Features

1. **Create components** in `src/components/`
2. **Add utilities** in `src/lib/`
3. **Update types** in `src/types/`
4. **Write tests** alongside your code
5. **Follow the existing patterns** for consistency

### Code Quality

- **TypeScript**: Full type safety throughout
- **ESLint**: Code linting and best practices
- **Prettier**: Consistent code formatting
- **Jest**: Comprehensive testing framework
- **React Testing Library**: Component testing utilities

## 🚀 Performance Features

- **Streaming Animations**: Smooth bullet point animations
- **Smart Caching**: Reduces API calls and improves response times
- **Hydration Safety**: Prevents React hydration mismatches
- **Optimized Builds**: Next.js 15 with Turbopack for fast development
- **Theme Persistence**: Remembers user preferences across sessions

## 🔒 Security Features

- **CSRF Protection**: Prevents cross-site request forgery
- **Rate Limiting**: Protects against abuse
- **Input Validation**: Sanitizes user input
- **Secure Headers**: Next.js security defaults
- **Environment Variables**: Secure configuration management

## 📱 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Responsive**: Works on all device sizes
- **Progressive Enhancement**: Core functionality works without JavaScript

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** for the amazing React framework
- **Tailwind CSS** for the utility-first CSS framework
- **Lucide** for the beautiful icons
- **Groq** for the fast AI capabilities
