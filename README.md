# AI Research Assistant with Agent Chat

A modern, full-stack AI research assistant application built with Next.js, featuring intelligent agent-based chat functionality, document management, and research workflow automation.

## 🚀 Features

### 🤖 **Intelligent Agent System**
- **Planning Agent**: Creates structured research plans and outlines
- **Research Agent**: Conducts in-depth research and analysis  
- **Writing Agent**: Generates well-structured reports and documents
- **Review Agent**: Reviews and refines final reports

### 💬 **Enhanced Chat Interface**
- **@ File References**: Smart autocompletion for file mentions
- **Keyboard Navigation**: Full keyboard support for accessibility
- **File Type Icons**: Visual indicators for different file types
- **Agent Icons**: Distinct colored icons for each agent type
- **Real-time Search**: Fuzzy matching and intelligent file filtering

### 📁 **Document Management**
- **File Upload & Storage**: Support for multiple file types
- **Generated Files**: Automatic file generation from agent outputs
- **File Context**: Reference files in chat conversations
- **Export Capabilities**: Export research reports in multiple formats

### 🔧 **Technical Stack**
- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS, Lucide React
- **Backend**: FastAPI (Python), Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production ready)
- **Authentication**: NextAuth.js
- **State Management**: Zustand, TanStack Query

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-research-assistant
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # Backend dependencies
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment file
   cp .env.example .env.local
   
   # Edit with your configuration
   nano .env.local
   ```

4. **Initialize database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start development servers**
   ```bash
   # Terminal 1: Frontend
   npm run dev
   
   # Terminal 2: Backend
   cd backend
   python main.py
   ```

6. **Open your browser**
   ```
   Frontend: http://localhost:3000
   Backend API: http://localhost:8000
   ```

## 📖 Usage

### Agent Chat
1. Navigate to the chat interface
2. Select an agent from the left panel
3. Type your research request
4. Use `@` to reference files in your message
5. Send the message and watch the agent work

### File Management
- **Upload Files**: Drag and drop or click to upload
- **Reference Files**: Type `@` followed by filename
- **View Generated Files**: Check the file panel for agent outputs

### Research Workflows
- **Planning**: Create research plans and outlines
- **Research**: Gather and analyze information
- **Writing**: Generate reports and documents
- **Review**: Ensure quality and accuracy

## 🏗️ Project Structure

```
├── src/                    # Frontend source code
│   ├── app/               # Next.js app router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities and services
│   └── types/            # TypeScript type definitions
├── backend/               # Python FastAPI backend
│   ├── api/              # API endpoints
│   ├── core/             # Core business logic
│   └── services/         # External service integrations
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── docs/                 # Documentation
```

## 🔧 Development

### Available Scripts
```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run database migrations
npm run db:reset         # Reset database

# Code Quality
npm run lint             # Run ESLint
```

### Environment Variables
```bash
# Database
DATABASE_URL="file:./dev.db"

# Authentication
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# AI Services (optional)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Database ORM by [Prisma](https://www.prisma.io/)

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for the research community**
