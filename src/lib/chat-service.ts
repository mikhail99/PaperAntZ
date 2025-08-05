import { 
  ChatMessage, 
  ChatSession, 
  DocumentContext, 
  AgentCapability,
  ChatInterfaceConfig 
} from '@/lib/types/chat';
import { ResearchMission, Document as ResearchDocument } from '@/lib/types/research';

export interface ChatServiceConfig {
  agents: AgentCapability[];
  documents: DocumentContext[];
  config: ChatInterfaceConfig;
}

export class ChatService {
  private config: ChatServiceConfig;
  private activeSessions: Map<string, ChatSession> = new Map();
  private messageHandlers: Map<string, (message: ChatMessage) => void> = new Map();

  constructor(config: ChatServiceConfig) {
    this.config = config;
  }

  // Session Management
  async createSession(agentId?: string): Promise<ChatSession> {
    const agent = this.config.agents.find(a => a.id === agentId);
    const session: ChatSession = {
      id: `session_${Date.now()}`,
      title: agent ? `Chat with ${agent.name}` : 'New Chat',
      agentId: agent?.id,
      agentName: agent?.name,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      documentContexts: []
    };

    this.activeSessions.set(session.id, session);
    return session;
  }

  async loadSession(sessionId: string): Promise<ChatSession | null> {
    const session = this.activeSessions.get(sessionId);
    return session || null;
  }

  async saveSession(session: ChatSession): Promise<void> {
    this.activeSessions.set(session.id, session);
  }

  async getAllSessions(): Promise<ChatSession[]> {
    return Array.from(this.activeSessions.values());
  }

  // Message Processing
  async processMessage(
    message: string,
    sessionId: string,
    agentId?: string,
    documentIds?: string[]
  ): Promise<ChatMessage> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      documentContext: documentIds 
        ? documentIds.map(id => this.config.documents.find(d => d.id === id)).filter(Boolean) as DocumentContext[]
        : []
    };

    // Add user message to session
    session.messages.push(userMessage);
    session.updatedAt = new Date();

    // Process message with agent(s)
    let response: ChatMessage;
    
    if (agentId) {
      // Send to specific agent
      response = await this.sendToSpecificAgent(message, agentId, documentIds);
    } else {
      // Send to all agents (coordinated response)
      response = await this.sendToAllAgents(message, documentIds);
    }

    // Add response to session
    session.messages.push(response);
    session.updatedAt = new Date();

    return response;
  }

  private async sendToSpecificAgent(
    message: string,
    agentId: string,
    documentIds?: string[]
  ): Promise<ChatMessage> {
    const agent = this.config.agents.find(a => a.id === agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Get document context
    const documentContext = documentIds 
      ? documentIds.map(id => this.config.documents.find(d => d.id === id)).filter(Boolean) as DocumentContext[]
      : [];

    // Generate agent-specific response
    const response = await this.generateAgentResponse(agent, message, documentContext);

    return {
      id: `msg_${Date.now()}`,
      role: 'agent',
      content: response,
      timestamp: new Date(),
      agentId: agent.id,
      agentName: agent.name,
      documentContext: documentContext
    };
  }

  private async sendToAllAgents(
    message: string,
    documentIds?: string[]
  ): Promise<ChatMessage> {
    const documentContext = documentIds 
      ? documentIds.map(id => this.config.documents.find(d => d.id === id)).filter(Boolean) as DocumentContext[]
      : [];

    // Get responses from all agents
    const agentResponses = await Promise.all(
      this.config.agents.map(async (agent) => {
        const response = await this.generateAgentResponse(agent, message, documentContext);
        return {
          agent,
          response
        };
      })
    );

    // Coordinate responses into a single message
    const coordinatedResponse = this.coordinateAgentResponses(agentResponses, message);

    return {
      id: `msg_${Date.now()}`,
      role: 'agent',
      content: coordinatedResponse,
      timestamp: new Date(),
      documentContext: documentContext
    };
  }

  private async generateAgentResponse(
    agent: AgentCapability,
    message: string,
    documentContext: DocumentContext[]
  ): Promise<string> {
    // Simulate agent processing - in real implementation, this would call the actual agent
    const documentContextText = documentContext.length > 0 
      ? `\n\nDocument Context:\n${documentContext.map(doc => `- ${doc.title}: ${doc.excerpt}`).join('\n')}`
      : '';

    // Generate response based on agent category
    switch (agent.category) {
      case 'planning':
        return this.generatePlanningResponse(message, documentContext);
      case 'research':
        return this.generateResearchResponse(message, documentContext);
      case 'analysis':
        return this.generateAnalysisResponse(message, documentContext);
      case 'writing':
        return this.generateWritingResponse(message, documentContext);
      case 'review':
        return this.generateReviewResponse(message, documentContext);
      default:
        return `I'm ${agent.name}. I understand you said: "${message}". How can I help you with that?${documentContextText}`;
    }
  }

  private generatePlanningResponse(message: string, documentContext: DocumentContext[]): string {
    const planningTemplates = [
      `Based on your request "${message}", I suggest we break this down into the following steps:\n\n1. Define clear objectives\n2. Identify required resources\n3. Establish timeline\n4. Set milestones\n5. Assign responsibilities\n\nWould you like me to elaborate on any of these steps?`,
      `I can help you plan this effectively. For "${message}", I recommend:\n\n• Start with a needs assessment\n• Develop a strategic approach\n• Create an action plan\n• Set up monitoring mechanisms\n• Plan for contingencies\n\nWhat aspect would you like to focus on first?`,
      `Let me create a structured plan for "${message}":\n\n**Phase 1: Preparation**\n- Gather requirements\n- Assess current state\n- Define success criteria\n\n**Phase 2: Execution**\n- Implement core activities\n- Monitor progress\n- Adjust as needed\n\n**Phase 3: Completion**\n- Review outcomes\n- Document lessons learned\n- Plan next steps\n\nWhich phase should we start with?`
    ];

    return planningTemplates[Math.floor(Math.random() * planningTemplates.length)];
  }

  private generateResearchResponse(message: string, documentContext: DocumentContext[]): string {
    const researchTemplates = [
      `I'll help you research "${message}". Based on the available documents, I can see relevant information that might help.\n\nKey research areas to explore:\n• Background and context\n• Current state of knowledge\n• Gaps in existing research\n• Methodological approaches\n• Potential sources\n\nWould you like me to focus on any specific area?`,
      `For your research on "${message}", I recommend the following approach:\n\n1. **Literature Review**: Examine existing studies and findings\n2. **Data Collection**: Identify relevant data sources\n3. **Analysis**: Apply appropriate analytical methods\n4. **Synthesis**: Combine findings into coherent insights\n5. **Validation**: Verify results through multiple sources\n\nWhich step would you like to begin with?`,
      `I can assist with your research on "${message}". Here's my suggested research strategy:\n\n**Primary Research Questions:**\n- What are the key aspects to investigate?\n- What existing knowledge is relevant?\n- What new insights are needed?\n\n**Research Methods:**\n- Qualitative analysis\n- Quantitative data collection\n- Comparative studies\n- Case examinations\n\nHow would you like to proceed?`
    ];

    return researchTemplates[Math.floor(Math.random() * researchTemplates.length)];
  }

  private generateAnalysisResponse(message: string, documentContext: DocumentContext[]): string {
    const analysisTemplates = [
      `I'll analyze "${message}" for you. Let me break this down systematically:\n\n**Key Components:**\n• Identify core elements\n• Examine relationships\n• Assess implications\n• Consider alternatives\n\n**Analytical Framework:**\n1. Contextual analysis\n2. Component breakdown\n3. Pattern recognition\n4. Causal analysis\n5. Predictive assessment\n\nWhat specific aspect would you like me to analyze in detail?`,
      `For analyzing "${message}", I'll use a structured approach:\n\n**Step 1: Deconstruction**\n- Break down into fundamental elements\n- Identify key variables\n- Map relationships\n\n**Step 2: Evaluation**\n- Assess each component\n- Measure impact\n- Identify patterns\n\n**Step 3: Synthesis**\n- Combine insights\n- Draw conclusions\n- Recommend actions\n\nWhere should we focus our analysis?`,
      `I can provide a comprehensive analysis of "${message}". My analytical approach includes:\n\n**Dimensions of Analysis:**\n• Temporal factors\n• Spatial considerations\n• Quantitative metrics\n• Qualitative aspects\n• Stakeholder perspectives\n\n**Analytical Tools:**\n- Comparative analysis\n- Trend analysis\n- Correlation studies\n- Impact assessment\n\nWhich dimension is most important for your needs?`
    ];

    return analysisTemplates[Math.floor(Math.random() * analysisTemplates.length)];
  }

  private generateWritingResponse(message: string, documentContext: DocumentContext[]): string {
    const writingTemplates = [
      `I can help you write about "${message}". Let me suggest a writing structure:\n\n**Recommended Structure:**\n1. **Introduction**: Context and purpose\n2. **Background**: Relevant context and history\n3. **Main Body**: Key points and evidence\n4. **Analysis**: Interpretation and insights\n5. **Conclusion**: Summary and implications\n\n**Writing Approach:**\n- Clear and concise language\n- Logical flow of ideas\n- Supporting evidence\n- Engaging narrative\n\nWhat type of document are you creating?`,
      `For writing about "${message}", I recommend:\n\n**Document Type Options:**\n- Report: Formal, structured, data-driven\n- Article: Engaging, informative, accessible\n- Proposal: Persuasive, solution-oriented\n- Summary: Concise, focused, highlights\n\n**Writing Process:**\n1. Outline and structure\n2. Draft development\n3. Review and revision\n4. Final polish\n\nWhat's your target audience and purpose?`,
      `I'll help you craft content about "${message}". Here's my writing strategy:\n\n**Content Development:**\n- Define key messages\n- Organize information logically\n- Develop compelling narrative\n- Support with evidence\n\n**Style Considerations:**\n- Tone: Professional, academic, casual\n- Format: Report, article, presentation\n- Length: Brief, moderate, comprehensive\n\nWhat style and format works best for your needs?`
    ];

    return writingTemplates[Math.floor(Math.random() * writingTemplates.length)];
  }

  private generateReviewResponse(message: string, documentContext: DocumentContext[]): string {
    const reviewTemplates = [
      `I'll review "${message}" for you. My review process includes:\n\n**Review Criteria:**\n• Accuracy and correctness\n• Clarity and coherence\n• Completeness and coverage\n• Logic and reasoning\n• Quality and effectiveness\n\n**Review Process:**\n1. Initial assessment\n2. Detailed examination\n3. Comparative analysis\n4. Quality evaluation\n5. Recommendation formulation\n\nWhat specific aspects should I focus on?`,
      `For reviewing "${message}", I'll provide a comprehensive assessment:\n\n**Review Dimensions:**\n- Content quality and accuracy\n- Structure and organization\n- Clarity and readability\n- Supporting evidence\n- Overall effectiveness\n\n**Review Output:**\n- Strengths identification\n- Areas for improvement\n- Specific recommendations\n- Priority suggestions\n\nWhat's the primary goal of this review?`,
      `I can conduct a thorough review of "${message}". My review methodology:\n\n**Evaluation Framework:**\n- Objective criteria assessment\n- Subjective quality judgment\n- Comparative benchmarking\n- Stakeholder alignment\n\n**Review Deliverables:**\n- Detailed findings report\n- Improvement recommendations\n- Quality rating/assessment\n- Action plan suggestions\n\nWhat standards or criteria should I use?`
    ];

    return reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
  }

  private coordinateAgentResponses(
    agentResponses: Array<{ agent: AgentCapability; response: string }>,
    originalMessage: string
  ): string {
    // Coordinate multiple agent responses into a cohesive answer
    const responsesByCategory = agentResponses.reduce((acc, { agent, response }) => {
      if (!acc[agent.category]) {
        acc[agent.category] = [];
      }
      acc[agent.category].push({ agent, response });
      return acc;
    }, {} as Record<string, Array<{ agent: AgentCapability; response: string }>>);

    let coordinatedResponse = `I've coordinated a response to your message "${originalMessage}" from all available agents:\n\n`;

    Object.entries(responsesByCategory).forEach(([category, responses]) => {
      coordinatedResponse += `**${category.charAt(0).toUpperCase() + category.slice(1)} Perspective:**\n`;
      responses.forEach(({ agent, response }) => {
        coordinatedResponse += `• ${agent.name}: ${response.split('\n')[0]}\n`;
      });
      coordinatedResponse += '\n';
    });

    coordinatedResponse += `Would you like me to elaborate on any specific agent's perspective or focus on a particular aspect?`;

    return coordinatedResponse;
  }

  // Document Integration
  async addDocumentToSession(sessionId: string, documentId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const document = this.config.documents.find(d => d.id === documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    if (!session.documentContexts.find(d => d.id === documentId)) {
      session.documentContexts.push(document);
      session.updatedAt = new Date();
    }
  }

  async removeDocumentFromSession(sessionId: string, documentId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.documentContexts = session.documentContexts.filter(d => d.id !== documentId);
    session.updatedAt = new Date();
  }

  // Utility Methods
  async exportSession(sessionId: string, format: 'json' | 'markdown' | 'txt'): Promise<string> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    switch (format) {
      case 'json':
        return JSON.stringify(session, null, 2);
      
      case 'markdown':
        return this.exportToMarkdown(session);
      
      case 'txt':
        return this.exportToText(session);
      
      default:
        throw new Error('Unsupported export format');
    }
  }

  private exportToMarkdown(session: ChatSession): string {
    let markdown = `# Chat Session: ${session.title}\n\n`;
    markdown += `**Agent:** ${session.agentName || 'General'}\n`;
    markdown += `**Created:** ${session.createdAt.toISOString()}\n`;
    markdown += `**Last Updated:** ${session.updatedAt.toISOString()}\n\n`;

    if (session.documentContexts.length > 0) {
      markdown += `## Document Context\n\n`;
      session.documentContexts.forEach(doc => {
        markdown += `- **${doc.title}** (Relevance: ${doc.relevanceScore})\n`;
        markdown += `  ${doc.excerpt}\n\n`;
      });
    }

    markdown += `## Messages\n\n`;
    session.messages.forEach(msg => {
      markdown += `### ${msg.role === 'user' ? 'User' : msg.agentName || 'System'} - ${msg.timestamp.toLocaleString()}\n\n`;
      markdown += `${msg.content}\n\n`;
      
      if (msg.documentContext && msg.documentContext.length > 0) {
        markdown += `**Referenced Documents:** `;
        markdown += msg.documentContext.map(doc => doc.title).join(', ');
        markdown += `\n\n`;
      }
    });

    return markdown;
  }

  private exportToText(session: ChatSession): string {
    let text = `Chat Session: ${session.title}\n`;
    text += `Agent: ${session.agentName || 'General'}\n`;
    text += `Created: ${session.createdAt.toLocaleString()}\n`;
    text += `Last Updated: ${session.updatedAt.toLocaleString()}\n\n`;

    session.messages.forEach(msg => {
      text += `${msg.role === 'user' ? 'User' : msg.agentName || 'System'} (${msg.timestamp.toLocaleTimeString()}):\n`;
      text += `${msg.content}\n\n`;
    });

    return text;
  }

  // Search and Filtering
  async searchSessions(query: string): Promise<ChatSession[]> {
    const allSessions = await this.getAllSessions();
    const lowercaseQuery = query.toLowerCase();

    return allSessions.filter(session => {
      // Search in session title
      if (session.title.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }

      // Search in agent name
      if (session.agentName?.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }

      // Search in messages
      return session.messages.some(msg => 
        msg.content.toLowerCase().includes(lowercaseQuery)
      );
    });
  }

  async getSessionsByAgent(agentId: string): Promise<ChatSession[]> {
    const allSessions = await this.getAllSessions();
    return allSessions.filter(session => session.agentId === agentId);
  }

  async getSessionsWithDocuments(): Promise<ChatSession[]> {
    const allSessions = await this.getAllSessions();
    return allSessions.filter(session => session.documentContexts.length > 0);
  }
}