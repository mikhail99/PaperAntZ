# AI Research Assistant - Engineer Handoff Documentation

## Recent Updates
- **Added**: Comprehensive Workflows and Usage Guide (Section 5) covering DSPy-GEPA framework implementation
- **Added**: Detailed examples of BasePromptModule, GEPA optimization, and parameter management
- **Added**: Research mission workflows, document processing pipelines, and optimization best practices
- **Added**: Performance monitoring and analytics patterns

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Current Implementation Status](#current-implementation-status)
4. [Missing Implementation & Mock Code](#missing-implementation--mock-code)
5. [Workflows and Usage Guide](#workflows-and-usage-guide)
6. [Local Machine Migration Guide](#local-machine-migration-guide)
7. [Development Setup](#development-setup)
8. [Key Technical Decisions](#key-technical-decisions)
9. [Known Issues & Limitations](#known-issues--limitations)
10. [Future Development Roadmap](#future-development-roadmap)

---

## Project Overview

The AI Research Assistant is a Next.js-based web application that provides intelligent research capabilities through a multi-agent system. The application allows users to:

- Create and manage research missions
- Upload and organize documents with RAG (Retrieval-Augmented Generation) capabilities
- Chat with AI agents specialized in different research tasks
- Generate comprehensive research reports
- Optimize prompts using GEPA (Genetic-Evolutionary Prompt Architecture)

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes, Prisma ORM, SQLite
- **AI Integration**: z-ai-web-dev-sdk for AI model access
- **State Management**: Zustand, TanStack Query
- **Database**: SQLite with Prisma ORM
- **Real-time**: WebSockets via Socket.io

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Dashboard     │  │   Research      │  │   Documents     │  │
│  │   Page          │  │   Missions      │  │   Management    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Optimization  │  │   Chat          │  │   Mission       │  │
│  │   Page          │  │   Interface     │  │   Details       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (Next.js API)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Research      │  │   Document      │  │   Chat          │  │
│  │   Service       │  │   Service       │  │   Service       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   RAG           │  │   Optimization  │  │   Agent         │  │
│  │   Service       │  │   Service       │  │   Coordinator   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Database (SQLite)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Research      │  │   Documents     │  │   Document      │  │
│  │   Missions      │  │   Table         │  │   Groups        │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Document      │  │   RAG Query     │  │   Optimization  │  │
│  │   Chunks        │  │   Log           │  │   Sessions      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Services

1. **Research Service**: Manages research missions and coordinates AI agents
2. **Document Service**: Handles document upload, processing, and storage
3. **RAG Service**: Implements document chunking, embedding, and semantic search
4. **Chat Service**: Manages real-time communication with AI agents
5. **Optimization Service**: Implements GEPA for prompt optimization

---

## Current Implementation Status

### ✅ Fully Implemented Features

1. **Core UI Framework**
   - Next.js 15 with App Router
   - Complete shadcn/ui component library
   - Responsive design with Tailwind CSS
   - Dark/light theme support

2. **Database Schema**
   - Complete Prisma schema with all necessary models
   - Relationships between documents, groups, and research missions
   - RAG pipeline support with document chunks and query logging

3. **Document Management**
   - Document upload and storage
   - Document groups with categorization and tagging
   - Document processing status tracking

4. **Research Mission Interface**
   - Mission creation and management
   - Mission details page with progress tracking
   - Agent status monitoring

5. **Chat Interface**
   - Real-time chat with AI agents
   - Agent selection (Planning, Research, Writing, Review)
   - Document context integration
   - Session management

6. **RAG Pipeline Framework**
   - Document chunking structure
   - Embedding storage (placeholder)
   - Semantic search interface
   - Query logging and analytics

7. **Critical Error Fixes**
   - Fixed Prisma browser environment errors by implementing API routes
   - Fixed SelectItem empty string errors throughout the application
   - Updated all services to use API calls instead of direct Prisma access
   - Enhanced error handling and state management
   - Implemented proper client-server architecture

### ⚠️ Partially Implemented Features

1. **AI Agent Integration**
   - Agent framework is in place
   - Basic agent coordination implemented
   - **Missing**: Actual AI model integration for agent execution

2. **Research Report Generation**
   - Report structure and UI implemented
   - Export functionality framework
   - **Missing**: Actual report content generation by AI agents

3. **GEPA Optimization**
   - Framework and UI components implemented
   - Configuration management
   - **Missing**: Actual genetic algorithm execution and prompt optimization

4. **Document Processing**
   - Upload and storage implemented
   - **Missing**: Actual document parsing, chunking, and embedding generation

---

## Missing Implementation & Mock Code

### 1. AI Model Integration (Critical)

**Current Status**: Mock implementations throughout

**Location**: `src/lib/agents/` directory

**Missing Implementation**:
```typescript
// Current mock implementation in src/lib/agents/research-agent.ts
export class ResearchAgent {
  async executeResearch(query: string, documents: Document[]): Promise<ResearchNote[]> {
    // MOCK: Returns fake research notes
    return [
      {
        id: 'mock-note-1',
        content: 'This is a mock research note',
        sources: ['mock-document-1'],
        relevance: 0.85,
        timestamp: new Date()
      }
    ];
  }
}

// Required implementation:
export class ResearchAgent {
  constructor(private aiModel: AIModel) {}
  
  async executeResearch(query: string, documents: Document[]): Promise<ResearchNote[]> {
    // 1. Use RAG service to find relevant document chunks
    const relevantChunks = await this.ragService.search(query, documents);
    
    // 2. Generate research notes using AI model
    const prompt = this.buildResearchPrompt(query, relevantChunks);
    const response = await this.aiModel.generate(prompt);
    
    // 3. Parse and structure the response
    return this.parseResearchNotes(response, relevantChunks);
  }
}
```

### 2. Document Processing Pipeline (Critical)

**Current Status**: Only stores documents, no processing

**Location**: `src/lib/services/document-service.ts`

**Missing Implementation**:
```typescript
// Current implementation only stores documents
async processDocument(documentId: string): Promise<void> {
  // MOCK: Just marks as processed
  await prisma.document.update({
    where: { id: documentId },
    data: { processed: true }
  });
}

// Required implementation:
async processDocument(documentId: string): Promise<void> {
  const document = await prisma.document.findUnique({
    where: { id: documentId }
  });
  
  if (!document) throw new Error('Document not found');
  
  // 1. Parse document content based on file type
  const parsedContent = await this.parseDocument(document);
  
  // 2. Split into chunks
  const chunks = await this.chunkDocument(parsedContent);
  
  // 3. Generate embeddings for each chunk
  for (const chunk of chunks) {
    const embedding = await this.aiModel.generateEmbedding(chunk.content);
    
    // Store chunk with embedding
    await prisma.documentChunk.create({
      data: {
        documentId: document.id,
        content: chunk.content,
        chunkIndex: chunk.index,
        embedding: JSON.stringify(embedding)
      }
    });
  }
  
  // 4. Mark document as processed
  await prisma.document.update({
    where: { id: documentId },
    data: { processed: true }
  });
}
```

### 3. RAG Service Implementation (Critical)

**Current Status**: Framework only, no actual search functionality

**Location**: `src/lib/services/rag-service.ts`

**Missing Implementation**:
```typescript
// Current mock implementation
async search(query: string, options?: RAGSearchOptions): Promise<RAGSearchResult[]> {
  // MOCK: Returns fake results
  return [
    {
      chunkId: 'mock-chunk-1',
      documentId: 'mock-doc-1',
      content: 'Mock search result',
      relevanceScore: 0.9,
      metadata: {}
    }
  ];
}

// Required implementation:
async search(query: string, options?: RAGSearchOptions): Promise<RAGSearchResult[]> {
  // 1. Generate query embedding
  const queryEmbedding = await this.aiModel.generateEmbedding(query);
  
  // 2. Build search query based on options
  let whereClause: any = {};
  if (options?.documentGroupId) {
    whereClause.document = {
      documentGroups: {
        some: {
          documentGroupId: options.documentGroupId
        }
      }
    };
  }
  
  // 3. Get all relevant chunks
  const chunks = await prisma.documentChunk.findMany({
    where: whereClause,
    include: {
      document: true
    }
  });
  
  // 4. Calculate similarity scores
  const results = chunks.map(chunk => {
    const chunkEmbedding = JSON.parse(chunk.embedding || '[]');
    const similarity = this.calculateCosineSimilarity(queryEmbedding, chunkEmbedding);
    
    return {
      chunkId: chunk.id,
      documentId: chunk.documentId,
      content: chunk.content,
      relevanceScore: similarity,
      metadata: {
        documentTitle: chunk.document.title,
        chunkIndex: chunk.chunkIndex
      }
    };
  });
  
  // 5. Sort by relevance and return top results
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, options?.limit || 10);
}
```

### 4. GEPA Optimization Implementation (High Priority)

**Current Status**: UI and framework only, no actual optimization

**Location**: `src/lib/services/optimization-service.ts` and `src/lib/dspy-gepa/`

**Missing Implementation**:
```typescript
// Current mock implementation
async runOptimization(sessionId: string): Promise<void> {
  // MOCK: Just updates session status
  await prisma.optimizationSession.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED',
      bestFitness: 0.85,
      generationsCompleted: 5
    }
  });
}

// Required implementation:
async runOptimization(sessionId: string): Promise<void> {
  const session = await prisma.optimizationSession.findUnique({
    where: { id: sessionId }
  });
  
  if (!session) throw new Error('Session not found');
  
  // 1. Initialize GEPA optimizer
  const optimizer = new GEPAOptimizer(JSON.parse(session.config || '{}'));
  
  // 2. Get target module with prompts
  const module = await this.getModuleForOptimization(session.moduleId);
  
  // 3. Define evaluation function
  const evaluationFn = async (module: BasePromptModule) => {
    return await this.evaluateModulePerformance(module);
  };
  
  // 4. Run optimization
  const optimizedModule = await optimizer.optimizeModule(module, evaluationFn);
  
  // 5. Update session with results
  await prisma.optimizationSession.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED',
      bestFitness: optimizer.get_optimization_stats().best_fitness,
      generationsCompleted: optimizer.get_optimization_stats().generations_completed,
      completedAt: new Date()
    }
  });
  
  // 6. Apply optimized prompts to the module
  await this.applyOptimizedPrompts(optimizedModule);
}
```

### 5. Real-time Agent Coordination (Medium Priority)

**Current Status**: Basic WebSocket setup, no actual agent coordination

**Location**: `src/lib/agents/agent-coordinator.ts`

**Missing Implementation**:
```typescript
// Current mock implementation
export class AgentCoordinator {
  async executeMission(missionId: string): Promise<void> {
    // MOCK: Just updates mission status
    await this.updateMissionStatus(missionId, 'COMPLETED');
  }
}

// Required implementation:
export class AgentCoordinator {
  constructor(
    private planningAgent: PlanningAgent,
    private researchAgent: ResearchAgent,
    private writingAgent: WritingAgent,
    private reflectionAgent: ReflectionAgent
  ) {}
  
  async executeMission(missionId: string): Promise<void> {
    const mission = await this.getMission(missionId);
    
    // Phase 1: Planning
    await this.updateMissionStatus(missionId, 'PLANNING');
    const researchPlan = await this.planningAgent.createPlan(mission.description);
    
    // Phase 2: Research with reflection loop
    await this.updateMissionStatus(missionId, 'RESEARCHING');
    let researchNotes = [];
    let planRevisionCount = 0;
    
    do {
      // Execute research
      const newNotes = await this.researchAgent.executeResearch(researchPlan, mission.documents);
      researchNotes = [...researchNotes, ...newNotes];
      
      // Reflect on research
      const reflection = await this.reflectionAgent.reflectOnResearch(researchNotes, researchPlan);
      
      if (reflection.needsMoreResearch) {
        // Update research plan based on reflection
        researchPlan = await this.planningAgent.revisePlan(researchPlan, reflection.gaps);
        planRevisionCount++;
      }
      
    } while (reflection.needsMoreResearch && planRevisionCount < 3);
    
    // Phase 3: Writing with reflection loop
    await this.updateMissionStatus(missionId, 'WRITING');
    let reportDraft = await this.writingAgent.generateReport(researchNotes, researchPlan);
    
    let writingRevisionCount = 0;
    do {
      const reflection = await this.reflectionAgent.reflectOnWriting(reportDraft);
      
      if (reflection.needsRevision) {
        reportDraft = await this.writingAgent.reviseReport(reportDraft, reflection.feedback);
        writingRevisionCount++;
      }
    } while (reflection.needsRevision && writingRevisionCount < 3);
    
    // Phase 4: Finalization
    await this.updateMissionStatus(missionId, 'COMPLETED');
    await this.saveFinalReport(missionId, reportDraft);
  }
}
```

---

## Workflows and Usage Guide

### Overview of Workflows

The AI Research Assistant implements several key workflows that leverage the DSPy-GEPA (Genetic-Evolutionary Prompt Architecture) framework. These workflows are designed to optimize AI agent performance through systematic prompt engineering and parameter management.

### Core Workflow Components

#### 1. Base Module System (`src/lib/dspy-gepa/base_module.py`)

The `BasePromptModule` class provides the foundation for all AI agents in the system. It implements:

**Key Features:**
- **Prompt Parameter Management**: Register, update, and track prompt parameters
- **Learning Control**: Enable/disable learning and set learning modes
- **Performance Tracking**: Record execution metrics and optimization history
- **PyTorch-like API**: Familiar `parameters()`, `named_parameters()`, and `modules()` methods

**Basic Usage:**
```python
class MyAgent(BasePromptModule):
    def __init__(self):
        super().__init__()
        
        # Register DSPy modules
        self.analyzer = dspy.Predict("text -> analysis")
        self.summarizer = dspy.Predict("analysis -> summary")
        
        # Register prompts for optimization
        self.register_prompt("analysis_prompt", 
            "Analyze the following text in detail.")
        self.register_prompt("summary_prompt",
            "Summarize the analysis concisely.")
        
        # Apply prompts to modules
        self._apply_prompts()
    
    def forward(self, text: str) -> dspy.Prediction:
        analysis = self.analyzer(text=text)
        summary = self.summarizer(analysis=analysis.analysis)
        return dspy.Prediction(analysis=analysis.analysis, summary=summary.summary)
```

**Parameter Management:**
```python
# Access parameters
for name, param in agent.named_parameters():
    print(f"{name}: {param.value}")

# Update prompts
agent.update_prompt("analysis_prompt", 
    "Analyze the following text with focus on key insights.")

# Export/import prompts
prompts = agent.get_prompt_dict()
agent.load_prompt_dict(prompts)

# Learning control
agent.enable_learning(True)
agent.set_learning_mode(LearningMode.HYBRID)
agent.freeze_prompt("summary_prompt")  # Prevent optimization
```

#### 2. GEPA Optimization Workflow (`src/lib/dspy-gepa/gepa_optimizer.py`)

The GEPA (Genetic-Evolutionary Prompt Architecture) optimizer implements a sophisticated prompt optimization system using genetic algorithms and natural language reflection.

**Key Features:**
- **Population-based Optimization**: Maintains multiple prompt variations
- **Genetic Operations**: Crossover, mutation, and selection
- **Natural Language Reflection**: Uses LLM to analyze and improve prompts
- **Adaptive Learning**: Adjusts optimization strategy based on performance

**Optimization Workflow:**
```python
# Create optimizer configuration
config = GEPAConfig(
    population_size=15,
    generations=8,
    mutation_rate=0.4,
    crossover_rate=0.7,
    reflection_model="gemini-1.5-flash"
)

optimizer = GEPAOptimizer(config)

# Define evaluation function
async def evaluate_module(module: BasePromptModule) -> float:
    # Run test tasks and measure performance
    results = await run_test_tasks(module)
    return calculate_performance_score(results)

# Run optimization
optimized_module = await optimizer.optimize_module(
    my_module,
    evaluation_fn=evaluate_module
)
```

**Optimization Process:**
1. **Initial Population Creation**: Generate variations of initial prompts
2. **Fitness Evaluation**: Test each variation on benchmark tasks
3. **Selection**: Choose best performers using tournament selection
4. **Crossover**: Combine successful prompts to create offspring
5. **Mutation**: Introduce controlled variations
6. **Reflection**: Use LLM to analyze performance and suggest improvements
7. **Iteration**: Repeat for specified generations or until convergence

#### 3. Parameter Management Workflow (`src/lib/dspy-gepa/parameter.py`)

The `PromptParameter` class tracks the lifecycle of each prompt parameter through optimization cycles.

**Key Features:**
- **State Management**: ACTIVE, FROZEN, ARCHIVED states
- **Optimization History**: Complete record of all changes and performance impacts
- **Performance Metrics**: Track accuracy, relevance, efficiency, etc.
- **Metadata Support**: Custom annotations and documentation

**Parameter Lifecycle:**
```python
# Create parameter
param = PromptParameter(
    name="research_prompt",
    value="Conduct thorough research on the topic",
    path="ResearchAgent.research_prompt",
    module=research_agent
)

# Record optimization
param.record_optimization(
    old_prompt="Conduct thorough research on the topic",
    new_prompt="Conduct comprehensive research focusing on key insights and evidence",
    performance_change=0.15,  # 15% improvement
    method="GEPA",
    metadata={"generation": 3, "population_size": 15}
)

# Update metrics
param.update_metrics({
    'accuracy': 0.92,
    'relevance': 0.88,
    'efficiency': 0.85
})

# Freeze parameter (prevent further optimization)
param.freeze()
```

### Research Mission Workflow

#### 1. Mission Creation and Planning

```python
async def create_research_mission(question: str, documents: List[str]) -> ResearchMission:
    # Create mission instance
    mission = ResearchMission(
        question=ResearchQuestion(text=question),
        documents=documents,
        status="PLANNING"
    )
    
    # Initialize planning agent
    planning_agent = PlanningAgent()
    
    # Generate research plan
    research_plan = await planning_agent.create_plan(question)
    
    # Optimize planning prompts using GEPA
    optimized_planner = await optimize_prompt_with_gepa(
        planning_agent,
        evaluate_planning_performance,
        config=create_gepa_config(generations=5)
    )
    
    mission.plan = research_plan
    return mission
```

#### 2. Research Execution Workflow

```python
async def execute_research_mission(mission: ResearchMission) -> ResearchReport:
    # Phase 1: Research with iterative refinement
    research_agent = ResearchAgent()
    reflection_agent = ReflectionAgent()
    
    research_notes = []
    plan_revision_count = 0
    
    while plan_revision_count < 3:
        # Execute research
        notes = await research_agent.executeResearch(
            mission.plan, 
            mission.documents
        )
        research_notes.extend(notes)
        
        # Reflect on research quality
        reflection = await reflection_agent.reflectOnResearch(
            research_notes, 
            mission.plan
        )
        
        if not reflection.needsMoreResearch:
            break
            
        # Revise plan based on reflection
        mission.plan = await planning_agent.revisePlan(
            mission.plan, 
            reflection.gaps
        )
        plan_revision_count += 1
    
    # Phase 2: Report generation
    writing_agent = WritingAgent()
    report_draft = await writing_agent.generateReport(
        research_notes, 
        mission.plan
    )
    
    # Phase 3: Report refinement
    for _ in range(2):  # Max 2 revisions
        reflection = await reflection_agent.reflectOnWriting(report_draft)
        if reflection.needsRevision:
            report_draft = await writing_agent.reviseReport(
                report_draft, 
                reflection.feedback
            )
        else:
            break
    
    return ResearchReport(
        question=mission.question,
        plan=mission.plan,
        findings=research_notes,
        synthesis=report_draft.synthesis,
        conclusion=report_draft.conclusion
    )
```

### Document Processing Workflow

#### 1. Document Upload and Processing

```python
async def process_document_pipeline(document_id: str) -> None:
    # Get document from database
    document = await prisma.document.findUnique(
        where={"id": document_id}
    )
    
    # Parse document content
    parsed_content = await document_parser.parse(document)
    
    # Chunk document
    chunks = await chunker.chunk(parsed_content)
    
    # Generate embeddings
    for chunk in chunks:
        embedding = await ai_model.generateEmbedding(chunk.content)
        
        # Store chunk with embedding
        await prisma.documentChunk.create({
            "documentId": document_id,
            "content": chunk.content,
            "chunkIndex": chunk.index,
            "embedding": JSON.stringify(embedding)
        })
    
    # Mark as processed
    await prisma.document.update({
        "where": {"id": document_id},
        "data": {"processed": True}
    })
```

#### 2. RAG Search Workflow

```python
async def rag_search_workflow(query: str, document_group_id: str) -> List[RAGResult]:
    # Generate query embedding
    query_embedding = await ai_model.generateEmbedding(query)
    
    # Search for relevant chunks
    chunks = await prisma.documentChunk.findMany({
        "where": {
            "document": {
                "documentGroups": {
                    "some": {
                        "documentGroupId": document_group_id
                    }
                }
            }
        },
        "include": {"document": True}
    })
    
    # Calculate similarity scores
    results = []
    for chunk in chunks:
        chunk_embedding = JSON.parse(chunk.embedding or "[]")
        similarity = calculate_cosine_similarity(query_embedding, chunk_embedding)
        
        results.append({
            "chunkId": chunk.id,
            "documentId": chunk.documentId,
            "content": chunk.content,
            "relevanceScore": similarity,
            "metadata": {
                "documentTitle": chunk.document.title,
                "chunkIndex": chunk.chunkIndex
            }
        })
    
    # Sort by relevance and return top results
    return sorted(results, key=lambda x: x["relevanceScore"], reverse=True)[:10]
```

### Optimization Workflow Best Practices

#### 1. Setting Up Optimization Sessions

```python
async def setup_optimization_session(
    target_module: BasePromptModule,
    evaluation_fn: AsyncEvaluationFunction,
    config: Optional[GEPAConfig] = None
) -> str:
    # Create default config if not provided
    if config is None:
        config = create_gepa_config(
            population_size=10,
            generations=5,
            mutation_rate=0.3
        )
    
    # Create optimization session
    session = await prisma.optimizationSession.create({
        "data": {
            "moduleId": target_module.__class__.__name__,
            "config": JSON.stringify(config.to_dict()),
            "status": "PENDING",
            "createdAt": datetime.now()
        }
    })
    
    # Start optimization in background
    asyncio.create_task(run_optimization_background(session.id, target_module, evaluation_fn))
    
    return session.id
```

#### 2. Monitoring Optimization Progress

```python
async def monitor_optimization(session_id: str) -> Dict[str, Any]:
    session = await prisma.optimizationSession.findUnique({
        "where": {"id": session_id}
    })
    
    if not session:
        raise ValueError("Session not found")
    
    # Parse optimization history
    history = JSON.parse(session.history or "[]")
    
    return {
        "sessionId": session_id,
        "status": session.status,
        "currentGeneration": session.generationsCompleted,
        "bestFitness": session.bestFitness,
        "progress": session.generationsCompleted / config.generations,
        "history": history,
        "estimatedTimeRemaining": calculate_estimated_time(session)
    }
```

#### 3. Applying Optimized Prompts

```python
async def apply_optimized_prompts(
    session_id: str,
    target_module: BasePromptModule
) -> None:
    # Get optimization results
    session = await prisma.optimizationSession.findUnique({
        "where": {"id": session_id},
        "include": {
            "optimizationRecords": {
                "orderBy": {"timestamp": "desc"}
            }
        }
    })
    
    # Apply best performing prompts
    for record in session.optimizationRecords:
        if record.performance_change > 0:  # Only apply improvements
            target_module.update_prompt(
                record.parameterName,
                record.newPrompt,
                record_optimization=False  # Don't re-record
            )
    
    # Mark session as applied
    await prisma.optimizationSession.update({
        "where": {"id": session_id},
        "data": {"status": "APPLIED"}
    })
```

### Workflow Integration Patterns

#### 1. Sequential Workflow

```python
async def sequential_research_workflow(question: str, documents: List[str]) -> ResearchReport:
    # Step 1: Create mission
    mission = await create_research_mission(question, documents)
    
    # Step 2: Execute research
    report = await execute_research_mission(mission)
    
    # Step 3: Optimize agents based on performance
    await optimize_agents_performance(mission.agents, report)
    
    return report
```

#### 2. Parallel Workflow

```python
async def parallel_research_workflow(questions: List[str]) -> List[ResearchReport]:
    # Execute multiple research missions in parallel
    tasks = []
    for question in questions:
        task = asyncio.create_task(
            sequential_research_workflow(question, get_relevant_documents(question))
        )
        tasks.append(task)
    
    # Wait for all to complete
    reports = await asyncio.gather(*tasks)
    return reports
```

#### 3. Event-Driven Workflow

```python
async def event_driven_optimization():
    # Listen for performance events
    async for event in performance_event_stream:
        if event.type == "performance_drop":
            # Trigger optimization when performance drops
            await setup_optimization_session(
                event.module,
                create_evaluation_function(event.task_type),
                config=create_gepa_config(generations=3)  # Quick optimization
            )
        elif event.type == "mission_completed":
            # Analyze performance and schedule deep optimization
            await schedule_deep_optimization(event.mission_id)
```

### Performance Monitoring and Analytics

#### 1. Tracking Workflow Performance

```python
async def track_workflow_performance(workflow_id: str) -> Dict[str, Any]:
    # Get workflow execution data
    executions = await prisma.workflowExecution.findMany({
        "where": {"workflowId": workflow_id},
        "orderBy": {"startTime": "desc"},
        "take": 100
    })
    
    # Calculate metrics
    total_executions = len(executions)
    successful_executions = len([e for e in executions if e.status == "COMPLETED"])
    average_duration = sum(e.duration for e in executions) / total_executions
    
    return {
        "workflowId": workflow_id,
        "totalExecutions": total_executions,
        "successRate": successful_executions / total_executions,
        "averageDuration": average_duration,
        "recentPerformance": executions[:10]  # Last 10 executions
    }
```

#### 2. Optimization Impact Analysis

```python
async def analyze_optimization_impact(session_id: str) -> Dict[str, Any]:
    session = await prisma.optimizationSession.findUnique({
        "where": {"id": session_id},
        "include": {"optimizationRecords": True}
    })
    
    # Calculate performance improvements
    total_improvement = sum(
        record.performanceChange 
        for record in session.optimizationRecords
        if record.performanceChange > 0
    )
    
    # Analyze by parameter
    parameter_impacts = {}
    for record in session.optimizationRecords:
        if record.parameterName not in parameter_impacts:
            parameter_impacts[record.parameterName] = []
        parameter_impacts[record.parameterName].append(record.performanceChange)
    
    return {
        "sessionId": session_id,
        "totalImprovement": total_improvement,
        "generationsCompleted": session.generationsCompleted,
        "parameterImpacts": {
            param: {
                "averageImprovement": sum(improvements) / len(improvements),
                "optimizationCount": len(improvements)
            }
            for param, improvements in parameter_impacts.items()
        }
    }
```

This workflow system provides a comprehensive framework for AI agent optimization, research execution, and performance monitoring. The key innovation is the integration of genetic-evolutionary optimization with natural language reflection, allowing for systematic improvement of AI agent performance through automated prompt engineering.

---

## Local Machine Migration Guide

### Current Cloud-Dependent Components

The current implementation has several components that assume cloud deployment:

1. **Document Storage**: Currently stores files in the filesystem without proper local management
2. **AI Model Access**: Uses z-ai-web-dev-sdk which may require cloud API access
3. **Database**: Uses SQLite which is suitable for local, but needs configuration adjustments
4. **File Upload Handling**: Assumes cloud storage paths

### Migration Steps

### 1. Document Storage Migration

**Current Implementation**:
```typescript
// Current cloud-oriented implementation
async uploadDocument(file: File): Promise<Document> {
  const filePath = `/uploads/${file.name}`;
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  
  return prisma.document.create({
    data: {
      title: file.name,
      content: '', // Will be processed later
      source: filePath,
      fileType: file.type,
      fileSize: file.size
    }
  });
}
```

**Local Machine Implementation**:
```typescript
// Local machine implementation
import { join } from 'path';
import { homedir } from 'os';

class LocalDocumentStorage {
  private readonly storagePath: string;
  
  constructor() {
    // Use user's home directory for document storage
    this.storagePath = join(homedir(), '.ai-research-assistant', 'documents');
    this.ensureStorageDirectory();
  }
  
  private ensureStorageDirectory(): void {
    if (!existsSync(this.storagePath)) {
      mkdirSync(this.storagePath, { recursive: true });
    }
  }
  
  async saveDocument(file: File): Promise<string> {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = join(this.storagePath, fileName);
    
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
    
    return filePath;
  }
  
  async getDocumentPath(documentId: string): Promise<string> {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Handle both old cloud paths and new local paths
    if (document.source.startsWith('/uploads/')) {
      // Migrate to local storage
      const oldPath = document.source;
      const fileName = document.source.split('/').pop() || `${documentId}.pdf`;
      const newPath = join(this.storagePath, fileName);
      
      if (existsSync(oldPath)) {
        await rename(oldPath, newPath);
      }
      
      // Update database with new path
      await prisma.document.update({
        where: { id: documentId },
        data: { source: newPath }
      });
      
      return newPath;
    }
    
    return document.source;
  }
  
  async deleteDocument(documentId: string): Promise<void> {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (document && existsSync(document.source)) {
      await unlink(document.source);
    }
  }
}
```

### 2. Database Configuration for Local Development

**Create `.env.local` file**:
```bash
# Database Configuration
DATABASE_URL="file:./dev.db"

# Local Document Storage
DOCUMENT_STORAGE_PATH="./documents"

# AI Model Configuration (if using local models)
AI_MODEL_TYPE="local"
AI_MODEL_ENDPOINT="http://localhost:8000"
AI_MODEL_API_KEY="your-local-api-key"

# Application Configuration
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

**Update `prisma/schema.prisma` for local development**:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
  
  // Add for better local development performance
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

### 3. AI Model Access Configuration

**Option 1: Local AI Models (Recommended for full local deployment)**

Create `src/lib/ai/local-model-client.ts`:
```typescript
export class LocalModelClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }
  
  async generate(prompt: string, options?: ModelOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_MODEL_API_KEY}`
      },
      body: JSON.stringify({
        model: options?.model || 'local-model',
        prompt: prompt,
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7
      })
    });
    
    const data = await response.json();
    return data.choices[0].text;
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_MODEL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'embedding-model',
        input: text
      })
    });
    
    const data = await response.json();
    return data.data[0].embedding;
  }
}
```

**Option 2: Hybrid Approach (Cloud AI + Local Storage)**

Update `src/lib/ai/ai-client.ts`:
```typescript
export class AIClient {
  private useLocalModels: boolean;
  private localClient: LocalModelClient;
  private cloudClient: ZAIClient;
  
  constructor() {
    this.useLocalModels = process.env.AI_MODEL_TYPE === 'local';
    this.localClient = new LocalModelClient();
    this.cloudClient = new ZAIClient(); // Existing z-ai-web-dev-sdk
  }
  
  async generate(prompt: string, options?: ModelOptions): Promise<string> {
    if (this.useLocalModels) {
      return this.localClient.generate(prompt, options);
    } else {
      return this.cloudClient.generate(prompt, options);
    }
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    if (this.useLocalModels) {
      return this.localClient.generateEmbedding(text);
    } else {
      // Fallback to cloud service for embeddings
      return this.cloudClient.generateEmbedding(text);
    }
  }
}
```

### 4. File Upload Handler Migration

Update `src/app/api/documents/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { LocalDocumentStorage } from '@/lib/storage/local-document-storage';

const documentStorage = new LocalDocumentStorage();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Save document to local storage
    const filePath = await documentStorage.saveDocument(file);
    
    // Create document record in database
    const document = await prisma.document.create({
      data: {
        title: file.name,
        content: '', // Will be processed later
        source: filePath,
        fileType: file.type,
        fileSize: file.size,
        processed: false
      }
    });
    
    // Trigger document processing (async)
    processDocument(document.id).catch(console.error);
    
    return NextResponse.json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
```

### 5. Environment Configuration Script

Create `scripts/setup-local-env.js`:
```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');

const setupLocalEnvironment = () => {
  console.log('Setting up local environment for AI Research Assistant...');
  
  // Create .env.local if it doesn't exist
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    const envContent = `# Local Development Configuration
DATABASE_URL="file:./dev.db"
DOCUMENT_STORAGE_PATH="./documents"
AI_MODEL_TYPE="cloud" # Change to "local" if you have local models
AI_MODEL_ENDPOINT="http://localhost:8000"
NEXTAUTH_SECRET="${require('crypto').randomBytes(32).toString('hex')}"
NEXTAUTH_URL="http://localhost:3000"
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('Created .env.local file');
  }
  
  // Create documents directory
  const documentsPath = path.join(process.cwd(), 'documents');
  if (!fs.existsSync(documentsPath)) {
    fs.mkdirSync(documentsPath, { recursive: true });
    console.log('Created documents directory');
  }
  
  // Create user's home directory storage
  const homeStoragePath = path.join(os.homedir(), '.ai-research-assistant', 'documents');
  if (!fs.existsSync(homeStoragePath)) {
    fs.mkdirSync(homeStoragePath, { recursive: true });
    console.log('Created home storage directory');
  }
  
  console.log('Local environment setup complete!');
  console.log('Run "npm run db:push" to initialize the database');
};

setupLocalEnvironment();
```

### 6. Migration Script for Existing Data

Create `scripts/migrate-to-local.js`:
```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');
const { PrismaClient } = require('@prisma/client');

const migrateToLocalStorage = async () => {
  const prisma = new PrismaClient();
  const localStoragePath = path.join(os.homedir(), '.ai-research-assistant', 'documents');
  
  try {
    console.log('Starting migration to local storage...');
    
    // Get all documents
    const documents = await prisma.document.findMany();
    
    for (const document of documents) {
      const oldPath = document.source;
      const fileName = `${document.id}-${document.title}`;
      const newPath = path.join(localStoragePath, fileName);
      
      // Check if file exists at old path
      if (fs.existsSync(oldPath)) {
        // Copy file to new location
        fs.copyFileSync(oldPath, newPath);
        
        // Update database with new path
        await prisma.document.update({
          where: { id: document.id },
          data: { source: newPath }
        });
        
        console.log(`Migrated document: ${document.title}`);
      } else {
        console.log(`File not found for document: ${document.title}`);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
};

migrateToLocalStorage();
```

### 7. Development Scripts Update

Update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "nodemon --exec \"npx tsx server.ts\" --watch server.ts --watch src --ext ts,tsx,js,jsx 2>&1 | tee dev.log",
    "build": "next build",
    "start": "NODE_ENV=production tsx server.ts 2>&1 | tee server.log",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "setup:local": "node scripts/setup-local-env.js",
    "migrate:local": "node scripts/migrate-to-local.js",
    "cleanup:local": "node scripts/cleanup-local-storage.js"
  }
}
```

---

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- SQLite (included with Prisma)
- Optional: Local AI models (Ollama, etc.)

### Quick Start

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd ai-research-assistant
npm install
```

2. **Set up local environment**:
```bash
npm run setup:local
```

3. **Initialize database**:
```bash
npm run db:push
npm run db:generate
```

4. **Start development server**:
```bash
npm run dev
```

5. **Access the application**:
   - Open http://localhost:3000
   - The application will be ready for local development

### Local AI Models Setup (Optional)

If you want to run AI models locally:

1. **Install Ollama**:
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

2. **Start Ollama service**:
```bash
ollama serve
```

3. **Download models**:
```bash
ollama pull llama2
ollama pull nomic-embed-text
```

4. **Update `.env.local`**:
```bash
AI_MODEL_TYPE="local"
AI_MODEL_ENDPOINT="http://localhost:11434"
```

---

## Key Technical Decisions

### 1. Next.js with App Router
- **Decision**: Used Next.js 15 with App Router for modern React development
- **Rationale**: Provides excellent developer experience, built-in API routes, and great performance
- **Impact**: Simplified routing, better code organization, and improved SEO

### 2. SQLite with Prisma
- **Decision**: Chose SQLite for local development with Prisma ORM
- **Rationale**: Zero configuration, file-based storage perfect for local development
- **Impact**: Easy setup, but may need to migrate to PostgreSQL for production

### 3. shadcn/ui Components
- **Decision**: Used shadcn/ui for UI components
- **Rationale**: Provides accessible, customizable components with excellent TypeScript support
- **Impact**: Consistent design system and reduced development time

### 4. Zustand for State Management
- **Decision**: Used Zustand instead of Redux or Context API
- **Rationale**: Simple, lightweight, and excellent TypeScript integration
- **Impact**: Reduced boilerplate and better performance

### 5. Real-time Communication
- **Decision**: Implemented WebSockets via Socket.io
- **Rationale**: Needed real-time updates for mission progress and chat
- **Impact**: Better user experience for long-running operations

---

## Known Issues & Limitations

### Recently Resolved Issues ✅

1. **Prisma Browser Environment Errors**
   - **Issue**: Prisma client was being used directly in React components, causing browser environment errors
   - **Impact**: Application would crash when trying to access database from client-side
   - **Solution**: Created API routes for all database operations and updated services to use API calls
   - **Status**: **RESOLVED** - All database operations now properly separated between client and server

2. **SelectItem Empty String Errors**
   - **Issue**: SelectItem components were using empty string values, violating component rules
   - **Impact**: UI components would fail and cause application errors
   - **Solution**: Replaced all empty string values with "all" and updated state management logic
   - **Status**: **RESOLVED** - All SelectItem components now use proper values

3. **Button Functionality Issues**
   - **Issue**: Various buttons throughout the application were missing onClick handlers
   - **Impact**: User interactions would not work as expected
   - **Solution**: Systematically added missing event handlers and navigation logic
   - **Status**: **RESOLVED** - All major buttons now have proper functionality

### Remaining Known Issues ⚠️

1. **Mock AI Implementations**
   - **Issue**: Most AI functionality is mocked
   - **Impact**: Application looks functional but doesn't provide actual AI capabilities
   - **Solution**: Implement real AI model integration (see Missing Implementation section)

2. **Document Processing Not Implemented**
   - **Issue**: Documents are stored but not processed for RAG
   - **Impact**: Search and retrieval functionality won't work
   - **Solution**: Implement document parsing, chunking, and embedding generation

3. **No Error Handling for AI Services**
   - **Issue**: AI service calls don't handle failures gracefully
   - **Impact**: Application may crash if AI services are unavailable
   - **Solution**: Add proper error handling and fallback mechanisms

4. **Limited File Type Support**
   - **Issue**: Only basic file upload is implemented
   - **Impact**: Limited to text-based documents
   - **Solution**: Add support for PDF, Word, and other document formats

5. **No User Authentication**
   - **Issue**: Authentication system is not implemented
   - **Impact**: No user management or security
   - **Solution**: Implement NextAuth.js with proper user management

6. **Performance Issues with Large Documents**
   - **Issue**: No optimization for handling large document sets
   - **Impact**: Application may slow down with many documents
   - **Solution**: Implement pagination, lazy loading, and performance optimizations

---

## Future Development Roadmap

### Phase 1: Core Functionality (Immediate)

1. **AI Model Integration**
   - Implement real AI model calls
   - Add error handling and retry logic
   - Support multiple model providers

2. **Document Processing Pipeline**
   - Implement PDF parsing
   - Add document chunking
   - Generate embeddings

3. **RAG Search Implementation**
   - Implement semantic search
   - Add relevance scoring
   - Support document group filtering

### Phase 2: Enhanced Features (Medium Term)

1. **User Authentication**
   - Implement NextAuth.js
   - Add user management
   - Role-based access control

2. **Advanced Research Features**
   - Multi-agent coordination
   - Research plan generation
   - Report writing automation

3. **Performance Optimization**
   - Database query optimization
   - Frontend performance improvements
   - Caching strategies

### Phase 3: Production Features (Long Term)

1. **Scalability**
   - Database migration to PostgreSQL
   - Horizontal scaling support
   - Load balancing

2. **Advanced Analytics**
   - Usage analytics
   - Performance monitoring
   - User behavior tracking

3. **Integration Features**
   - API for third-party integrations
   - Webhook support
   - Export/import functionality

---

## Conclusion

This AI Research Assistant project provides a solid foundation with a modern tech stack and comprehensive UI framework. However, significant implementation work is needed, particularly in the AI integration and document processing areas. The migration to local machine deployment is straightforward with the provided guidelines, and the architecture supports both local and cloud deployment models.

The engineer should focus on:
1. Implementing real AI model integration
2. Completing the document processing pipeline
3. Setting up proper local development environment
4. Adding error handling and testing
5. Implementing user authentication and security

With these improvements, the application can become a fully functional AI research assistant suitable for local deployment and development.