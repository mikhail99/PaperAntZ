"""
Utility functions for the AI Research Assistant Backend
"""

import uuid
import time
import asyncio
import random
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
import json

def generate_id(prefix: str = "") -> str:
    """Generate a unique ID with optional prefix"""
    unique_id = str(uuid.uuid4())[:8]
    return f"{prefix}_{unique_id}" if prefix else unique_id

def get_timestamp() -> str:
    """Get current ISO timestamp"""
    return datetime.now().isoformat()

def format_duration(seconds: float) -> str:
    """Format duration in human-readable format"""
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        return f"{seconds/60:.1f}m"
    else:
        return f"{seconds/3600:.1f}h"

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage"""
    import re
    # Remove or replace unsafe characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove leading/trailing whitespace and dots
    filename = filename.strip('. ')
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:255-len(ext)] + ext
    return filename

def calculate_file_size(size_bytes: int) -> str:
    """Convert file size to human-readable format"""
    if size_bytes == 0:
        return "0B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f}{size_names[i]}"

class MockLLMResponse:
    """Mock LLM response generator for testing"""
    
    @staticmethod
    def generate_planning_response(task: str, context: Dict[str, Any] = None) -> str:
        """Generate mock planning agent response"""
        templates = [
            f"""Based on your request "{task}", I've created a comprehensive research plan:

## Research Plan Outline

### Phase 1: Foundation (Week 1-2)
- **Objective Definition**: Clearly define research goals and success criteria
- **Literature Review**: Survey existing research and identify gaps
- **Methodology Design**: Choose appropriate research methods and tools

### Phase 2: Data Collection (Week 3-4)
- **Primary Research**: Conduct surveys, interviews, or experiments
- **Secondary Research**: Gather existing data and reports
- **Data Analysis**: Process and analyze collected information

### Phase 3: Analysis & Synthesis (Week 5-6)
- **Pattern Recognition**: Identify trends and insights in the data
- **Comparative Analysis**: Compare findings with existing research
- **Synthesis**: Integrate findings into coherent conclusions

### Phase 4: Reporting (Week 7-8)
- **Draft Creation**: Write initial research report
- **Review & Revision**: Refine content based on feedback
- **Final Publication**: Prepare and disseminate final report

## Success Metrics
- Comprehensive coverage of research questions
- Data-driven insights and conclusions
- Actionable recommendations
- Clear documentation of methodology

Would you like me to elaborate on any specific phase or aspect of this plan?""",

            f"""I'll help you create a structured approach for "{task}". Here's my recommended research strategy:

## Strategic Research Framework

### 1. Problem Analysis
- **Scope Definition**: Clearly define the boundaries and focus areas
- **Stakeholder Identification**: Identify all relevant stakeholders and their needs
- **Resource Assessment**: Evaluate available resources (time, budget, expertise)

### 2. Research Design
- **Research Questions**: Formulate clear, answerable research questions
- **Hypothesis Development**: Create testable hypotheses where applicable
- **Methodology Selection**: Choose appropriate research methods (qualitative/quantitative)

### 3. Implementation Strategy
- **Timeline Development**: Create realistic project timeline with milestones
- **Team Assignment**: Assign responsibilities to team members
- **Risk Management**: Identify potential risks and mitigation strategies

### 4. Execution & Monitoring
- **Data Collection**: Systematic gathering of research data
- **Progress Tracking**: Regular monitoring of progress against timeline
- **Quality Assurance**: Ensure data quality and research integrity

### 5. Analysis & Reporting
- **Data Analysis**: Statistical and thematic analysis of collected data
- **Insight Generation**: Extract meaningful insights from the analysis
- **Report Preparation**: Create comprehensive research report with recommendations

This structured approach ensures thorough research with clear deliverables and timelines. Which aspect would you like to focus on first?"""
        ]
        
        return random.choice(templates)
    
    @staticmethod
    def generate_research_response(query: str, context: Dict[str, Any] = None) -> str:
        """Generate mock research agent response"""
        templates = [
            f"""I've conducted comprehensive research on "{query}". Here are my key findings:

## Research Findings

### Key Insights
1. **Current State**: The field is rapidly evolving with significant technological advancements
2. **Major Trends**: Increased adoption of AI/ML, focus on automation, and data-driven decision making
3. **Challenges**: Integration complexity, data privacy concerns, and skill gaps remain significant barriers

### Data Analysis
- **Market Growth**: The sector has shown 25% year-over-year growth over the past 3 years
- **Adoption Rates**: Enterprise adoption has reached 65%, while SMB adoption is at 35%
- **Investment Trends**: Venture capital investment has increased by 180% since 2020

### Expert Perspectives
Industry experts emphasize the importance of:
- **Strategic Implementation**: Moving beyond pilot projects to full-scale deployment
- **Change Management**: Addressing organizational resistance and skill development
- **Ethical Considerations**: Ensuring responsible and fair use of technology

### Future Outlook
The next 2-3 years are expected to see:
- Widespread integration with existing systems
- Emergence of industry-specific solutions
- Increased focus on ROI and measurable outcomes
- Development of new regulatory frameworks

### Recommendations
1. **Start with pilot projects** to build expertise and demonstrate value
2. **Invest in training** to develop internal capabilities
3. **Focus on high-impact use cases** that align with business objectives
4. **Establish governance frameworks** to ensure responsible deployment

This research provides a solid foundation for decision-making and strategic planning in this area.""",

            f"""After thorough investigation of "{query}", I present the following research synthesis:

## Comprehensive Research Analysis

### Background Context
The topic represents a significant area of development with implications across multiple sectors. Current research indicates accelerated growth and transformation driven by technological innovation and changing market demands.

### Literature Review Summary
**Academic Research**: Over 2,500 peer-reviewed papers published in the last 24 months, showing increased academic interest and validation of core concepts.

**Industry Reports**: Major consulting firms and research organizations have published extensive analyses, with consensus on growth trajectory and key success factors.

**Government Initiatives**: Public sector investment and policy development indicate strategic importance and regulatory attention.

### Quantitative Findings
- **Market Size**: $45.2 billion globally, projected to reach $127.8 billion by 2028
- **Growth Rate**: 23.1% CAGR (Compound Annual Growth Rate)
- **Regional Distribution**: North America (42%), Asia-Pacific (35%), Europe (18%), Other (5%)
- **Adoption Timeline**: 18-24 months for enterprise-wide implementation

### Qualitative Insights
**Success Factors**:
- Leadership commitment and strategic alignment
- Cross-functional collaboration and stakeholder engagement
- Focus on user experience and change management
- Robust data infrastructure and analytics capabilities

**Common Challenges**:
- Integration with legacy systems
- Data quality and availability issues
- Skills gap and workforce readiness
- Privacy and security concerns

### Case Study Highlights
1. **Fortune 500 Company**: Achieved 40% efficiency improvement through strategic implementation
2. **Healthcare Provider**: Reduced operational costs by 35% while improving patient outcomes
3. **Financial Institution**: Enhanced risk assessment accuracy by 60% with automated systems

### Emerging Trends
1. **AI/ML Integration**: Advanced analytics and predictive capabilities
2. **Edge Computing**: Distributed processing and real-time insights
3. **Sustainability Focus**: Environmentally conscious implementation strategies
4. **Regulatory Evolution**: Developing frameworks for governance and compliance

### Strategic Implications
Organizations should consider:
- **Short-term**: Pilot programs and capability building
- **Medium-term**: Scaling successful implementations and process optimization
- **Long-term**: Full integration and transformation of business models

This research provides actionable insights for strategic planning and investment decisions in this rapidly evolving field."""
        ]
        
        return random.choice(templates)
    
    @staticmethod
    def generate_writing_response(topic: str, context: Dict[str, Any] = None) -> str:
        """Generate mock writing agent response"""
        templates = [
            f"""I've created a comprehensive report on "{topic}". Here's the complete document:

# Research Report: {topic}

## Executive Summary
This report presents a comprehensive analysis of {topic}, examining current trends, challenges, opportunities, and future outlook. The research synthesizes data from multiple sources including academic literature, industry reports, and case studies to provide actionable insights for stakeholders.

## Introduction
{topic} has emerged as a critical area of focus for organizations seeking to enhance operational efficiency, improve decision-making, and maintain competitive advantage. This report aims to provide a thorough examination of the current landscape and strategic implications.

## Background and Context
### Historical Development
The evolution of {topic} can be traced through several key phases, from early conceptual frameworks to current advanced implementations. Understanding this development provides essential context for current applications and future potential.

### Current State
Today, {topic} represents a mature field with established methodologies, tools, and best practices. Organizations across various sectors are leveraging these approaches to address complex challenges and create value.

## Methodology
This research employed a mixed-methods approach combining:
- **Literature Review**: Analysis of over 500 academic papers and industry reports
- **Case Study Analysis**: Examination of 25 implementation examples across different sectors
- **Expert Interviews**: Conversations with 15 industry practitioners and academics
- **Data Analysis**: Statistical analysis of market trends and performance metrics

## Key Findings

### Market Landscape
The global market for {topic} is experiencing robust growth, driven by technological advancement, increasing demand for efficiency, and competitive pressures. Key market characteristics include:

- **Market Size**: $67.8 billion in 2023, projected to reach $189.4 billion by 2028
- **Growth Drivers**: Digital transformation, data availability, computational power
- **Regional Variations**: North America leads in adoption, Asia-Pacific shows fastest growth

### Implementation Patterns
Successful implementations of {topic} share common characteristics:
- **Strategic Alignment**: Clear connection to business objectives and strategy
- **Executive Sponsorship**: Strong leadership support and resource commitment
- **Cross-functional Collaboration**: Engagement across organizational boundaries
- **Iterative Approach**: Phased implementation with continuous improvement

### Performance Outcomes
Organizations implementing {topic} report significant benefits:
- **Efficiency Gains**: 25-40% improvement in operational efficiency
- **Cost Reduction**: 20-35% decrease in operational costs
- **Quality Improvement**: 30-50% enhancement in output quality
- **Decision Speed**: 60-80% faster decision-making processes

## Challenges and Barriers
Despite the benefits, organizations face several challenges in implementing {topic}:

### Technical Challenges
- **Integration Complexity**: Compatibility with existing systems and infrastructure
- **Data Quality**: Availability and reliability of required data
- **Scalability**: Performance considerations at scale

### Organizational Challenges
- **Change Resistance**: Cultural and behavioral barriers to adoption
- **Skills Gap**: Shortage of qualified personnel and expertise
- **Resource Constraints**: Budget limitations and competing priorities

### External Challenges
- **Regulatory Environment**: Compliance requirements and legal considerations
- **Market Dynamics**: Competitive pressures and evolving customer expectations
- **Technology Evolution**: Rapid changes requiring continuous adaptation

## Best Practices and Recommendations

### Strategic Recommendations
1. **Develop Clear Vision**: Establish strategic objectives and success metrics
2. **Build Internal Capabilities**: Invest in training and skill development
3. **Start with Pilot Projects**: Test approaches with controlled implementations
4. **Focus on Value**: Prioritize high-impact use cases with clear ROI
5. **Establish Governance**: Create frameworks for oversight and compliance

### Implementation Framework
1. **Assessment Phase**: Evaluate current state and identify opportunities
2. **Planning Phase**: Develop detailed implementation roadmap
3. **Execution Phase**: Implement solutions with proper change management
4. **Optimization Phase**: Continuously improve and expand capabilities

### Success Factors
- **Leadership Commitment**: Executive sponsorship and strategic alignment
- **Stakeholder Engagement**: Involvement of all affected parties
- **Data Strategy**: Robust data management and analytics capabilities
- **Change Management**: Proactive approach to organizational transition
- **Performance Measurement**: Clear metrics and continuous monitoring

## Case Studies
### Organization A: Financial Services
**Challenge**: Manual processes and data silos limiting decision-making
**Solution**: Implemented comprehensive {topic} solution
**Results**: 35% efficiency improvement, 40% cost reduction, enhanced customer satisfaction

### Organization B: Healthcare
**Challenge**: Fragmented systems and inconsistent patient care
**Solution**: Integrated {topic} approach across care continuum
**Results**: 28% improvement in patient outcomes, 32% reduction in administrative costs

### Organization C: Manufacturing
**Challenge**: Production inefficiencies and quality control issues
**Solution**: {topic}-based optimization of manufacturing processes
**Results**: 45% increase in production efficiency, 60% reduction in defects

## Future Outlook
The future of {topic} will be shaped by several key trends:

### Technology Trends
- **AI/ML Integration**: Advanced analytics and predictive capabilities
- **Edge Computing**: Distributed processing and real-time insights
- **IoT Integration**: Connected devices and sensor networks
- **Blockchain**: Enhanced security and transparency

### Market Trends
- **Industry Specialization**: Vertical-specific solutions and applications
- **Platform Economy**: Ecosystem-based approaches and marketplaces
- **Sustainability Focus**: Environmentally conscious implementations
- **Regulatory Evolution**: Maturing governance frameworks

### Adoption Trends
- **Democratization**: Increased accessibility for smaller organizations
- **Integration**: Convergence with other business technologies
- **Standardization**: Industry-wide best practices and standards
- **Innovation**: Continuous improvement and new applications

## Conclusion
{topic} represents a transformative approach with significant potential for organizations across all sectors. While challenges exist, the benefits are substantial and well-documented. Success requires strategic planning, strong leadership, and commitment to continuous improvement.

Organizations that effectively implement {topic} can expect to achieve enhanced efficiency, improved decision-making, better customer experiences, and sustainable competitive advantage. The future outlook suggests continued growth and evolution, with increasing sophistication and broader adoption across industries.

## Recommendations for Action
1. **Assess Current State**: Evaluate organizational readiness and identify opportunities
2. **Develop Strategy**: Create comprehensive implementation roadmap
3. **Build Capabilities**: Invest in people, processes, and technology
4. **Execute with Discipline**: Implement solutions with proper change management
5. **Measure and Optimize**: Continuously monitor performance and improve results

By following these recommendations and leveraging the insights presented in this report, organizations can successfully navigate the {topic} landscape and achieve meaningful business outcomes.

---

*Report generated on {datetime.now().strftime('%B %d, %Y')}*
*Research period: {datetime.now().strftime('%B %Y')}*
*Sources: Academic literature, industry reports, case studies, expert interviews*""",
            
            f"""# Executive Summary: {topic}

This document provides a comprehensive analysis of {topic}, examining its current state, future prospects, and strategic implications for organizations and stakeholders.

## Overview
{topic} has emerged as a critical driver of innovation and efficiency across multiple industries. This analysis synthesizes current research, market data, and expert insights to provide actionable guidance for decision-makers.

## Key Findings

### Market Dynamics
The {topic} market demonstrates robust growth characteristics:
- **Current Market Value**: $89.3 billion globally
- **Projected Growth**: 22.7% CAGR through 2028
- **Regional Leaders**: North America (38%), Asia-Pacific (32%), Europe (24%)
- **Investment Trends**: Venture capital funding increased by 156% year-over-year

### Technology Landscape
Key technological developments shaping {topic} include:
- **Advanced Analytics**: AI/ML-powered insights and predictions
- **Cloud Infrastructure**: Scalable, flexible deployment options
- **Integration Capabilities**: Seamless connectivity with existing systems
- **Security Enhancements**: Robust protection for sensitive data and processes

### Implementation Success Factors
Organizations achieving successful outcomes with {topic} typically demonstrate:
- **Strategic Alignment**: Clear connection to business objectives
- **Executive Support**: Committed leadership and resource allocation
- **Cross-functional Collaboration**: Effective teamwork across departments
- **Change Management**: Proactive approach to organizational transition

## Strategic Implications

### For Business Leaders
- **Competitive Advantage**: Early adopters gain significant market advantages
- **Operational Efficiency**: Potential for 30-50% efficiency improvements
- **Customer Experience**: Enhanced service delivery and satisfaction
- **Innovation Capacity**: Accelerated development of new products and services

### For Technology Teams
- **Skill Development**: Need for new technical capabilities and expertise
- **Infrastructure Investment**: Requirements for modern technology stacks
- **Security Considerations**: Enhanced focus on data protection and compliance
- **Integration Challenges**: Complexity of connecting with legacy systems

### For Policy Makers
- **Regulatory Frameworks**: Need for updated governance structures
- **Economic Impact**: Significant contributions to GDP and employment
- **Social Considerations**: Addressing workforce transition and equity issues
- **International Competition**: Global race for technological leadership

## Recommendations

### Immediate Actions (0-6 months)
1. **Conduct Assessment**: Evaluate current capabilities and identify opportunities
2. **Develop Strategy**: Create comprehensive implementation roadmap
3. **Build Awareness**: Educate stakeholders on benefits and requirements
4. **Secure Resources**: Allocate budget and talent for implementation

### Medium-term Initiatives (6-18 months)
1. **Pilot Programs**: Test approaches with controlled implementations
2. **Capability Building**: Invest in training and skill development
3. **Partner Selection**: Identify and engage with technology providers
4. **Governance Framework**: Establish oversight and compliance structures

### Long-term Strategy (18+ months)
1. **Scale Implementation**: Expand successful pilots across organization
2. **Continuous Innovation**: Establish ongoing improvement processes
3. **Ecosystem Development**: Build partnerships and collaborative networks
4. **Thought Leadership**: Contribute to industry best practices and standards

## Risk Analysis

### Key Risks
- **Implementation Failure**: Poor execution leading to wasted resources
- **Technology Obsolescence**: Rapid changes making investments outdated
- **Security Breaches**: Vulnerabilities in systems and data
- **Regulatory Changes**: New compliance requirements and restrictions

### Mitigation Strategies
- **Phased Approach**: Gradual implementation with clear milestones
- **Vendor Management**: Strategic partnerships with technology providers
- **Security Investment**: Robust protection measures and monitoring
- **Regulatory Monitoring**: Active tracking of policy developments

## Success Metrics
Organizations should measure success through:
- **Business Impact**: Revenue growth, cost reduction, efficiency gains
- **Operational Metrics**: Process improvements, quality enhancements
- **Customer Metrics**: Satisfaction, retention, acquisition rates
- **Employee Metrics**: Engagement, productivity, skill development

## Conclusion
{topic} represents a transformative opportunity for organizations willing to invest strategically and execute effectively. While challenges exist, the potential benefits are substantial and well-documented.

Success requires a balanced approach that combines technological investment with organizational change management. Organizations that navigate this complexity effectively will be well-positioned for sustainable competitive advantage.

The future of {topic} promises continued innovation, broader adoption, and increasing sophistication. Organizations that begin their journey now will be best positioned to capture the value and opportunities that lie ahead.

---

*Analysis prepared by AI Research Assistant*
*Date: {datetime.now().strftime('%B %d, %Y')}*
*Data sources: Market research, academic literature, industry reports*"""
        ]
        
        return random.choice(templates)
    
    @staticmethod
    def generate_review_response(content: str, context: Dict[str, Any] = None) -> str:
        """Generate mock review agent response"""
        return f"""I've thoroughly reviewed the provided content. Here's my comprehensive assessment:

## Content Review Summary

### Overall Assessment
The content demonstrates strong potential with several notable strengths and areas for improvement. The material shows good structure and covers key topics relevant to the subject matter.

### Strengths
1. **Comprehensive Coverage**: The content addresses major aspects of the topic with good breadth
2. **Logical Structure**: Information is organized in a coherent and easy-to-follow manner
3. **Supporting Evidence**: Good use of data and examples to support key points
4. **Clarity of Expression**: Writing is generally clear and accessible to the target audience

### Areas for Improvement
1. **Depth of Analysis**: Some sections could benefit from more detailed examination and critical analysis
2. **Source Integration**: Better integration of diverse perspectives and sources would strengthen arguments
3. **Practical Applications**: More emphasis on real-world applications and implementation considerations
4. **Visual Elements**: Addition of charts, graphs, or other visual aids could enhance comprehension

### Specific Recommendations

#### Content Enhancements
- **Expand Case Studies**: Include more detailed examples with specific outcomes and lessons learned
- **Add Counterarguments**: Present and address opposing viewpoints to strengthen credibility
- **Update Statistics**: Ensure all data points are current and from authoritative sources
- **Improve Flow**: Better transitions between sections to improve readability

#### Structural Improvements
- **Executive Summary**: Add a concise overview highlighting key takeaways
- **Appendix Materials**: Include supplementary materials for readers seeking more detail
- **References**: Expand and formalize the reference section with proper citations
- **Index**: Consider adding an index for easier navigation of longer documents

#### Presentation Enhancements
- **Visual Elements**: Incorporate charts, graphs, or diagrams to illustrate key concepts
- **Formatting**: Improve consistency in headings, subheadings, and text formatting
- **White Space**: Use more white space and shorter paragraphs for better readability
- **Highlighting**: Use emphasis techniques to draw attention to key points

### Quality Metrics
- **Content Accuracy**: 85% - Generally accurate with minor factual inconsistencies
- **Structural Coherence**: 78% - Good overall structure with some organizational issues
- **Writing Quality**: 82% - Clear and engaging with room for refinement
- **Value Proposition**: 80% - Provides good value to target audience
- **Overall Quality Score**: 81% - Solid foundation with improvement potential

### Revision Priority
1. **High Priority**: Address factual accuracy and update statistics
2. **Medium Priority**: Improve structural flow and add visual elements
3. **Low Priority**: Enhance formatting and add supplementary materials

### Final Assessment
The content represents a strong foundation that, with the recommended improvements, has the potential to be excellent. The core ideas are valuable and well-presented, requiring refinement rather than fundamental restructuring.

**Recommendation**: Proceed with revisions focusing on high-priority items first, then address medium and low-priority enhancements in subsequent iterations.

### Next Steps
1. **Immediate**: Correct factual inaccuracies and update outdated information
2. **Short-term**: Restructure sections for better flow and coherence
3. **Medium-term**: Add visual elements and enhance presentation
4. **Long-term**: Expand content with additional case studies and examples

This review provides a roadmap for elevating the content from good to great, ensuring it delivers maximum value to the intended audience."""

class AsyncMockDelay:
    """Utility for simulating async processing delays"""
    
    @staticmethod
    async def delay(seconds: float = None):
        """Simulate processing delay"""
        if seconds is None:
            seconds = random.uniform(0.5, 2.0)
        await asyncio.sleep(seconds)
    
    @staticmethod
    async def weighted_delay(short_prob: float = 0.7):
        """Simulate delay with weighted probability (short vs long)"""
        if random.random() < short_prob:
            await AsyncMockDelay.delay(random.uniform(0.3, 1.0))  # Short delay
        else:
            await AsyncMockDelay.delay(random.uniform(1.5, 3.0))  # Long delay

def create_success_response(data: Any, message: str = "Success") -> Dict[str, Any]:
    """Create a standardized success response"""
    return {
        "success": True,
        "data": data,
        "message": message,
        "timestamp": get_timestamp()
    }

def create_error_response(error: str, status_code: int = 400) -> Dict[str, Any]:
    """Create a standardized error response"""
    return {
        "success": False,
        "error": error,
        "status_code": status_code,
        "timestamp": get_timestamp()
    }