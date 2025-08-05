# AI Research Assistant - Quick Start Guide for Engineers

## Overview

This guide provides a quick overview for engineers taking over the AI Research Assistant project. It covers the essential information needed to understand the codebase, identify missing implementations, and set up a local development environment.

## Project Structure

```
ai-research-assistant/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── chat/              # Chat interface
│   │   ├── dashboard/         # Dashboard page
│   │   ├── documents/         # Document management
│   │   ├── optimization/       # GEPA optimization
│   │   ├── research/          # Research missions
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── chat/             # Chat-related components
│   │   ├── documents/        # Document-related components
│   │   └── layout/           # Layout components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Core libraries and services
│   │   ├── agents/           # AI agent implementations
│   │   ├── services/         # Business logic services
│   │   ├── storage/          # Storage abstractions
│   │   ├── types/            # TypeScript type definitions
│   │   └── dspy-gepa/        # GEPA optimization framework
│   └── utils.ts              # Utility functions
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
├── scripts/                  # Utility scripts
├── components.json           # shadcn/ui configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── package.json              # Dependencies and scripts
└── README.md                 # Project documentation
```

## Technology Stack

### Core Technologies
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: Zustand, TanStack Query
- **Database**: SQLite with Prisma ORM
- **Real-time**: Socket.io for WebSockets

### AI Integration
- **AI SDK**: z-ai-web-dev-sdk for cloud AI models
- **Local Models**: Support for Ollama and other local AI providers
- **Framework**: DSPy-GEPA for prompt optimization

### Key Libraries
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **File Handling**: Built-in File API with custom processing

## Current Implementation Status

### ✅ Fully Implemented

1. **UI Framework**
   - Complete Next.js 15 setup with App Router
   - All shadcn/ui components configured
   - Responsive design with Tailwind CSS
   - Dark/light theme support

2. **Database Schema**
   - Complete Prisma schema with all models
   - Document groups and chunks for RAG
   - Optimization sessions tracking
   - Query logging for analytics

3. **Basic CRUD Operations**
   - Document upload/download
   - Research mission management
   - User session management
   - Basic search functionality

4. **Critical Error Fixes**
   - Fixed Prisma browser environment errors by implementing API routes
   - Fixed SelectItem empty string errors throughout the application
   - Updated all services to use API calls instead of direct Prisma access
   - Enhanced error handling and state management

### ⚠️ Partially Implemented (Mock Code)

1. **AI Agents** (`src/lib/agents/`)
   - Framework is complete but all AI calls are mocked
   - Agents: Planning, Research, Writing, Review
   - Coordination layer exists but no real AI integration

2. **Document Processing** (`src/lib/services/document-service.ts`)
   - Storage works but no actual document parsing
   - No chunking or embedding generation
   - Processing status tracking only

3. **RAG Pipeline** (`src/lib/services/rag-service.ts`)
   - Search interface exists but returns fake results
   - No semantic search implementation
   - No embedding similarity calculations

4. **GEPA Optimization** (`src/lib/services/optimization-service.ts`)
   - UI and configuration are complete
   - No actual genetic algorithm implementation
   - Mock fitness calculations

### ❌ Missing Implementation

1. **Real AI Model Integration**
   - Need to replace all mock AI calls with real implementations
   - Error handling and retry logic for AI services
   - Support for multiple AI providers

2. **Document Processing Pipeline**
   - PDF parsing (need pdf-parse or similar)
   - Document chunking algorithms
   - Embedding generation and storage

3. **Advanced Search Features**
   - Semantic search with vector embeddings
   - Hybrid search (semantic + keyword)
   - Query expansion and refinement

4. **User Authentication**
   - NextAuth.js configuration
   - User registration and login
   - Role-based access control

## Quick Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Initial Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd ai-research-assistant

# 2. Install dependencies
npm install

# 3. Set up local environment
npm run setup:local

# 4. Configure environment variables
# Edit .env.local and set your AI model API key

# 5. Initialize database
npm run init:db
npm run db:push

# 6. Start development server
npm run dev
```

### Access the Application
- URL: http://localhost:3000
- The application should load with the dashboard

## Key Files to Understand

### Core Application Files

1. **`src/app/page.tsx`** - Landing page
2. **`src/app/layout.tsx`** - Root layout with providers
3. **`src/components/layout/main-layout.tsx`** - Main application layout
4. **`src/components/layout/sidebar-nav.tsx`** - Navigation sidebar

### Service Files (Business Logic)

1. **`src/lib/services/research-service.ts`** - Research mission management
2. **`src/lib/services/document-service.ts`** - Document operations
3. **`src/lib/services/rag-service.ts`** - Search and retrieval
4. **`src/lib/services/chat-service.ts`** - Chat functionality
5. **`src/lib/services/optimization-service.ts`** - GEPA optimization

### AI Agent Files (Need Real Implementation)

1. **`src/lib/agents/research-agent.ts`** - Research execution (MOCK)
2. **`src/lib/agents/writing-agent.ts`** - Report generation (MOCK)
3. **`src/lib/agents/planning-agent.ts`** - Research planning (MOCK)
4. **`src/lib/agents/reflection-agent.ts`** - Quality assessment (MOCK)
5. **`src/lib/agents/agent-coordinator.ts`** - Agent orchestration (MOCK)

### Database Schema

1. **`prisma/schema.prisma`** - Complete database schema
   - Models: Document, DocumentGroup, DocumentChunk, ResearchMission, etc.
   - Relationships and constraints
   - Enums for status tracking

## Critical Missing Implementations

### 1. AI Model Integration (Highest Priority)

**Location**: `src/lib/agents/` directory

**Current State**: All agents return mock data

**What to Implement**:
```typescript
// Example: Replace mock implementation in research-agent.ts
// Current:
async executeResearch(query: string): Promise<ResearchNote[]> {
  return [{ id: 'mock', content: 'Mock response' }];
}

// Required:
async executeResearch(query: string): Promise<ResearchNote[]> {
  const relevantDocs = await this.ragService.search(query);
  const prompt = this.buildPrompt(query, relevantDocs);
  const aiResponse = await this.aiClient.generate(prompt);
  return this.parseResponse(aiResponse);
}
```

### 2. Document Processing (High Priority)

**Location**: `src/lib/services/document-service.ts`

**Current State**: Only stores files, no processing

**What to Implement**:
- PDF parsing using `pdf-parse`
- Document chunking strategies
- Embedding generation using AI models
- Metadata extraction

### 3. RAG Search Implementation (High Priority)

**Location**: `src/lib/services/rag-service.ts`

**Current State**: Returns fake search results

**What to Implement**:
- Vector similarity calculations
- Hybrid search (semantic + keyword)
- Result ranking and scoring
- Query expansion

### 4. GEPA Optimization (Medium Priority)

**Location**: `src/lib/services/optimization-service.ts`

**Current State**: Mock optimization process

**What to Implement**:
- Genetic algorithm for prompt optimization
- Real fitness evaluation
- Population management
- Convergence detection

## Development Workflow

### 1. Making Changes

```bash
# Start development server
npm run dev

# Make changes to files
# The server will automatically reload

# Run linting
npm run lint

# Test changes in the browser at http://localhost:3000
```

### 2. Database Changes

```bash
# Update schema in prisma/schema.prisma

# Push changes to database
npm run db:push

# Or create formal migration
npm run db:migrate

# View database
npm run db:studio
```

### 3. Adding New Features

1. **Create API Route**: `src/app/api/feature/route.ts`
2. **Create Service**: `src/lib/services/feature-service.ts`
3. **Create Component**: `src/components/FeatureComponent.tsx`
4. **Create Page**: `src/app/feature/page.tsx`
5. **Update Navigation**: Add to sidebar

### 4. Testing AI Features

Since most AI features are mocked, you'll need to:

1. **Replace Mock Implementations**: Start with one agent at a time
2. **Add Error Handling**: AI calls can fail, handle gracefully
3. **Add Logging**: Log AI requests and responses for debugging
4. **Test with Real Data**: Use actual documents and queries

## Common Issues and Solutions

### Issue 1: Buttons Don't Work
**Solution**: Check if onClick handlers are implemented. Many buttons have mock implementations.

### Issue 2: Documents Not Processing
**Solution**: Document processing is not implemented. You need to implement the parsing pipeline.

### Issue 3: Search Returns No Results
**Solution**: RAG search is mocked. Implement real semantic search with embeddings.

### Issue 4: AI Features Don't Work
**Solution**: All AI agents are mocked. Replace with real AI model calls.

### Issue 5: Database Errors
**Solution**: Run `npm run db:push` to ensure schema is up to date. If you encounter Prisma browser environment errors, make sure all database operations are done through API routes, not directly in React components.

### Issue 6: SelectItem Empty String Errors
**Solution**: Ensure all SelectItem components use "all" instead of empty string values. Update state management logic to handle "all" values properly.

### Issue 7: Prisma Browser Environment Errors
**Solution**: Prisma cannot be used directly in React components. All database operations must be done through API routes. Check that services use API calls instead of direct Prisma client access.

## Local Development Tips

### 1. Using Local AI Models

```bash
# Install Ollama
# Visit https://ollama.com/download

# Start Ollama
ollama serve

# Pull models
ollama pull llama2
ollama pull nomic-embed-text

# Update .env.local
AI_MODEL_TYPE="local"
AI_MODEL_ENDPOINT="http://localhost:11434"
```

### 2. Testing with Sample Data

```bash
# Add sample PDF documents to the documents folder
# Test upload functionality
# Verify processing (when implemented)
```

### 3. Debugging AI Features

```typescript
// Add logging to AI calls
console.log('AI Request:', prompt);
const response = await aiClient.generate(prompt);
console.log('AI Response:', response);
```

## Next Steps for the Engineer

### Phase 1: Core AI Integration (1-2 weeks)

1. **Implement Real AI Client**
   - Replace mock AI calls in one agent
   - Add error handling and retry logic
   - Test with real AI model

2. **Document Processing Pipeline**
   - Implement PDF parsing
   - Add document chunking
   - Generate embeddings

3. **Basic RAG Search**
   - Implement semantic search
   - Add relevance scoring
   - Test with sample documents

### Phase 2: Advanced Features (2-3 weeks)

1. **Complete Agent Implementation**
   - Implement all agents with real AI
   - Add agent coordination
   - Test complete research workflow

2. **GEPA Optimization**
   - Implement genetic algorithm
   - Add prompt evaluation
   - Test optimization process

3. **User Authentication**
   - Implement NextAuth.js
   - Add user management
   - Secure API routes

### Phase 3: Production Features (1-2 weeks)

1. **Performance Optimization**
   - Add caching
   - Optimize database queries
   - Improve UI responsiveness

2. **Error Handling**
   - Add comprehensive error handling
   - Implement retry logic
   - Add user-friendly error messages

3. **Testing and Documentation**
   - Add unit tests
   - Update documentation
   - Create deployment guide

## Resources

### Documentation
- `ENGINEER_HANDOFF.md` - Comprehensive project documentation
- `IMPLEMENTATION_STATUS.md` - Detailed missing implementation analysis
- `LOCAL_MIGRATION_GUIDE.md` - Local deployment guide

### Configuration
- `.env.local` - Environment variables (create from setup script)
- `prisma/schema.prisma` - Database schema
- `components.json` - shadcn/ui configuration

### Scripts
- `npm run setup:local` - Set up local environment
- `npm run check:local-models` - Check local AI models
- `npm run test-local-setup` - Test local configuration

## Contact and Support

If you encounter issues or have questions:

1. **Check the logs**: Look at console output and server logs
2. **Review documentation**: Check the markdown files in the project root
3. **Test incrementally**: Implement one feature at a time
4. **Use the mock implementations**: They show the expected interface

The codebase is well-structured and follows modern React/Next.js patterns. The main challenge is replacing the mock AI implementations with real functionality while maintaining the existing UI and user experience.