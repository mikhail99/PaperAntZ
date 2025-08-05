/**
 * Enhanced Research Report Types
 * Inspired by Maestro's research draft interface
 */

export interface ResearchReport {
  id: string;
  missionId: string;
  title: string;
  abstract: string;
  sections: ReportSection[];
  citations: Citation[];
  references: Reference[];
  metadata: ReportMetadata;
  keyFindings: string[];
  dataPoints: DataPoint[];
  createdAt: Date;
  updatedAt: Date;
  status: ReportStatus;
}

export enum ReportStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  FINAL = 'FINAL',
  PUBLISHED = 'PUBLISHED'
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  level: number; // 1 = main section, 2 = subsection, 3 = sub-subsection
  order: number;
  subsections?: ReportSection[];
  keyFindings: string[];
  dataPoints?: DataPoint[];
  citations: string[]; // citation IDs
  wordCount: number;
  estimatedReadingTime: number; // in minutes
}

export interface Citation {
  id: string;
  type: CitationType;
  content: string;
  sourceId: string;
  context: string;
  position: number;
  style: CitationStyle;
}

export enum CitationType {
  DIRECT_QUOTE = 'DIRECT_QUOTE',
  PARAPHRASE = 'PARAPHRASE',
  SUMMARY = 'SUMMARY',
  DATA_REFERENCE = 'DATA_REFERENCE'
}

export enum CitationStyle {
  APA = 'APA',
  MLA = 'MLA',
  CHICAGO = 'CHICAGO',
  HARVARD = 'HARVARD'
}

export interface Reference {
  id: string;
  type: ReferenceType;
  title: string;
  authors: string[];
  year: number;
  source: string;
  doi?: string;
  url?: string;
  pages?: string;
  publisher?: string;
  abstract?: string;
  relevanceScore: number;
  tags: string[];
}

export enum ReferenceType {
  JOURNAL_ARTICLE = 'JOURNAL_ARTICLE',
  BOOK = 'BOOK',
  BOOK_CHAPTER = 'BOOK_CHAPTER',
  CONFERENCE_PAPER = 'CONFERENCE_PAPER',
  THESIS = 'THESIS',
  WEB_PAGE = 'WEB_PAGE',
  REPORT = 'REPORT'
}

export interface DataPoint {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  type: DataPointType;
  source: string;
  context: string;
  significance: string;
  visualization?: DataVisualization;
}

export enum DataPointType {
  STATISTIC = 'STATISTIC',
  PERCENTAGE = 'PERCENTAGE',
  COMPARISON = 'COMPARISON',
  TREND = 'TREND',
  METRIC = 'METRIC'
}

export interface DataVisualization {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'table';
  title: string;
  data: any[];
  description: string;
}

export interface ReportMetadata {
  wordCount: number;
  readingTime: number; // in minutes
  fleschKincaidGrade: number;
  automatedReadabilityIndex: number;
  sentimentScore: number;
  objectivityScore: number;
  confidenceScore: number;
  qualityMetrics: QualityMetrics;
}

export interface QualityMetrics {
  coherence: number;
  completeness: number;
  accuracy: number;
  relevance: number;
  clarity: number;
  structure: number;
}

export interface ReportGenerationConfig {
  includeAbstract: boolean;
  includeKeyFindings: boolean;
  includeDataPoints: boolean;
  citationStyle: CitationStyle;
  maxSections: number;
  targetWordCount: number;
  writingStyle: 'academic' | 'business' | 'technical' | 'general';
  detailLevel: 'basic' | 'standard' | 'detailed';
}

// Mock data for development
export const createMockResearchReport = (missionId: string): ResearchReport => {
  const now = new Date();
  
  return {
    id: `report-${missionId}`,
    missionId,
    title: 'AI Ethics in Healthcare: A Comprehensive Analysis',
    abstract: `This research report provides a comprehensive analysis of the ethical implications of artificial intelligence in healthcare settings. 
    The study examines current applications, potential benefits, ethical challenges, and regulatory frameworks governing AI implementation 
    in medical environments. Through systematic analysis of academic literature, case studies, and expert opinions, this report identifies 
    key ethical considerations and proposes guidelines for responsible AI deployment in healthcare.`,
    sections: [
      {
        id: 'section-1',
        title: 'Introduction',
        content: `Artificial Intelligence (AI) is rapidly transforming healthcare delivery, offering unprecedented opportunities 
        for improving patient outcomes, streamlining operations, and advancing medical research. From diagnostic imaging to 
        personalized treatment plans, AI technologies are being integrated across various healthcare domains. However, this 
        technological revolution brings forth complex ethical challenges that require careful consideration and proactive management.`,
        level: 1,
        order: 1,
        keyFindings: [
          'AI adoption in healthcare is accelerating rapidly',
          'Ethical frameworks are struggling to keep pace with technological advancement',
          'Stakeholder engagement is crucial for responsible implementation'
        ],
        citations: ['cit-1', 'cit-2'],
        wordCount: 156,
        estimatedReadingTime: 1,
        subsections: [
          {
            id: 'section-1-1',
            title: 'Background and Context',
            content: `The integration of AI in healthcare represents one of the most significant technological shifts in modern medicine. 
            Machine learning algorithms, natural language processing, and computer vision are being deployed in clinical settings, 
            promising to enhance diagnostic accuracy, predict patient outcomes, and optimize treatment protocols.`,
            level: 2,
            order: 1,
            keyFindings: [
              'AI applications span diagnostics, treatment, and administrative functions',
              'Early adopters report significant improvements in efficiency and accuracy'
            ],
            citations: ['cit-3'],
            wordCount: 89,
            estimatedReadingTime: 1
          },
          {
            id: 'section-1-2',
            title: 'Research Objectives',
            content: `This research aims to: (1) Identify key ethical challenges in AI healthcare applications, 
            (2) Analyze existing regulatory frameworks, (3) Evaluate stakeholder perspectives, and (4) Propose guidelines 
            for ethical AI implementation in healthcare settings.`,
            level: 2,
            order: 2,
            keyFindings: [],
            citations: [],
            wordCount: 67,
            estimatedReadingTime: 1
          }
        ]
      },
      {
        id: 'section-2',
        title: 'Current AI Applications in Healthcare',
        content: `AI technologies are being deployed across multiple healthcare domains, each presenting unique opportunities 
        and challenges. Diagnostic imaging, drug discovery, patient monitoring, and administrative automation represent 
        the most mature application areas.`,
        level: 1,
        order: 2,
        keyFindings: [
          'Diagnostic AI shows accuracy rates exceeding human experts in some areas',
          'Drug discovery timelines are being reduced by up to 60%',
          'Patient monitoring systems enable proactive intervention strategies'
        ],
        citations: ['cit-4', 'cit-5', 'cit-6'],
        wordCount: 98,
        estimatedReadingTime: 1,
        subsections: [
          {
            id: 'section-2-1',
            title: 'Diagnostic Imaging',
            content: `AI algorithms for medical imaging analysis have demonstrated remarkable accuracy in detecting 
            various conditions, including cancers, cardiovascular diseases, and neurological disorders. These systems 
            can analyze radiological images up to 30 times faster than human radiologists while maintaining or improving 
            diagnostic accuracy.`,
            level: 2,
            order: 1,
            keyFindings: [
              'AI diagnostic accuracy reaches 94-99% in certain applications',
              'Processing time reduced from hours to minutes in many cases'
            ],
            citations: ['cit-7'],
            wordCount: 87,
            estimatedReadingTime: 1
          },
          {
            id: 'section-2-2',
            title: 'Drug Discovery and Development',
            content: `Machine learning models are revolutionizing pharmaceutical research by predicting molecular 
            interactions, identifying potential drug candidates, and optimizing clinical trial designs. This has led to 
            significant reductions in both development time and costs.`,
            level: 2,
            order: 2,
            keyFindings: [
              'AI reduces drug discovery timeline by an average of 4-6 years',
              'Cost savings of approximately $2.6 billion per successful drug'
            ],
            citations: ['cit-8'],
            wordCount: 76,
            estimatedReadingTime: 1
          }
        ]
      },
      {
        id: 'section-3',
        title: 'Ethical Considerations and Challenges',
        content: `The deployment of AI in healthcare raises significant ethical concerns that must be addressed to ensure 
        responsible implementation. These issues span privacy, bias, accountability, transparency, and the fundamental 
        nature of the doctor-patient relationship.`,
        level: 1,
        order: 3,
        keyFindings: [
          'Data privacy concerns are the primary barrier to AI adoption',
          'Algorithmic bias can exacerbate existing healthcare disparities',
          'Transparency in AI decision-making remains a significant challenge'
        ],
        citations: ['cit-9', 'cit-10'],
        wordCount: 102,
        estimatedReadingTime: 1
      },
      {
        id: 'section-4',
        title: 'Regulatory Frameworks and Guidelines',
        content: `Current regulatory frameworks are evolving to address the unique challenges posed by AI in healthcare. 
        Various national and international bodies have developed guidelines, but significant harmonization is still needed.`,
        level: 1,
        order: 4,
        keyFindings: [
          'FDA has approved over 520 AI/ML medical devices to date',
          'EU AI Act represents the most comprehensive regulatory framework',
          'International cooperation is essential for effective governance'
        ],
        citations: ['cit-11', 'cit-12'],
        wordCount: 91,
        estimatedReadingTime: 1
      },
      {
        id: 'section-5',
        title: 'Recommendations and Future Directions',
        content: `Based on the analysis of current applications, ethical challenges, and regulatory frameworks, 
        this report proposes a set of recommendations for stakeholders involved in AI healthcare implementation.`,
        level: 1,
        order: 5,
        keyFindings: [
          'Develop comprehensive ethical guidelines specific to healthcare AI',
          'Establish independent oversight committees for AI validation',
          'Invest in diversity and bias mitigation strategies',
          'Create transparent reporting standards for AI systems'
        ],
        citations: ['cit-13'],
        wordCount: 88,
        estimatedReadingTime: 1
      }
    ],
    citations: [
      {
        id: 'cit-1',
        type: CitationType.SUMMARY,
        content: 'Topol (2019) highlights the transformative potential of AI in healthcare while emphasizing the need for ethical frameworks.',
        sourceId: 'ref-1',
        context: 'Introduction to AI in healthcare',
        position: 1,
        style: CitationStyle.APA
      },
      {
        id: 'cit-2',
        type: CitationType.PARAPHRASE,
        content: 'According to Davenport and Kalakota (2019), AI applications in healthcare are expected to create $150 billion in annual savings by 2026.',
        sourceId: 'ref-2',
        context: 'Economic impact of healthcare AI',
        position: 2,
        style: CitationStyle.APA
      },
      {
        id: 'cit-3',
        type: CitationType.DIRECT_QUOTE,
        content: 'The integration of AI in healthcare represents a paradigm shift in how we approach diagnosis, treatment, and patient care.',
        sourceId: 'ref-3',
        context: 'Background and context',
        position: 3,
        style: CitationStyle.APA
      }
    ],
    references: [
      {
        id: 'ref-1',
        type: ReferenceType.BOOK,
        title: 'Deep Medicine: How Artificial Intelligence Can Make Healthcare Human Again',
        authors: ['Eric J. Topol'],
        year: 2019,
        source: 'Basic Books',
        publisher: 'Basic Books',
        relevanceScore: 0.95,
        tags: ['AI', 'healthcare', 'ethics']
      },
      {
        id: 'ref-2',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'The potential for artificial intelligence in healthcare',
        authors: ['Thomas H. Davenport', 'Ravi Kalakota'],
        year: 2019,
        source: 'Future Healthcare Journal',
        publisher: 'Royal College of Physicians',
        relevanceScore: 0.88,
        tags: ['AI', 'healthcare', 'economics']
      },
      {
        id: 'ref-3',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Artificial Intelligence in Healthcare: The Promise, Challenges, and Ethical Considerations',
        authors: ['Sarah Johnson', 'Michael Chen', 'Elena Rodriguez'],
        year: 2023,
        source: 'Journal of Medical Ethics',
        publisher: 'BMJ Publishing Group',
        relevanceScore: 0.92,
        tags: ['AI', 'healthcare', 'ethics']
      }
    ],
    metadata: {
      wordCount: 2844,
      readingTime: 14,
      fleschKincaidGrade: 12.5,
      automatedReadabilityIndex: 14.2,
      sentimentScore: 0.15,
      objectivityScore: 0.82,
      confidenceScore: 0.89,
      qualityMetrics: {
        coherence: 0.88,
        completeness: 0.92,
        accuracy: 0.85,
        relevance: 0.94,
        clarity: 0.90,
        structure: 0.87
      }
    },
    keyFindings: [
      'AI diagnostic accuracy reaches 94-99% in certain medical imaging applications',
      'Drug discovery timelines reduced by 4-6 years through AI implementation',
      'Data privacy concerns remain the primary barrier to AI adoption in healthcare',
      'Algorithmic bias can exacerbate existing healthcare disparities if not properly addressed',
      'Current regulatory frameworks are evolving but lack harmonization across jurisdictions'
    ],
    dataPoints: [
      {
        id: 'dp-1',
        label: 'AI Diagnostic Accuracy',
        value: 97,
        unit: '%',
        type: DataPointType.PERCENTAGE,
        source: 'Journal of Medical AI, 2023',
        context: 'Accuracy rates for AI in medical imaging analysis',
        significance: 'Represents significant improvement over traditional methods'
      },
      {
        id: 'dp-2',
        label: 'Drug Discovery Time Reduction',
        value: 5,
        unit: 'years',
        type: DataPointType.COMPARISON,
        source: 'Pharmaceutical Technology Report, 2023',
        context: 'Average reduction in drug development timeline',
        significance: 'Major cost savings and faster patient access to treatments'
      },
      {
        id: 'dp-3',
        label: 'Healthcare AI Market Size',
        value: 150,
        unit: 'billion USD',
        type: DataPointType.STATISTIC,
        source: 'Market Analysis Report, 2023',
        context: 'Projected market size by 2026',
        significance: 'Indicates rapid growth and adoption of AI technologies'
      }
    ],
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    status: ReportStatus.FINAL
  };
};