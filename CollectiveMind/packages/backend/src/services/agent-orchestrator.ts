import { MCPManager } from './mcp-manager';
import { SearchService } from './search';
import { AIChatService } from './ai-chat';
import { logger } from '../utils/logger';

export interface Agent {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  mcpTools: string[];
  priority: number;
  active: boolean;
}

export interface Task {
  id: string;
  type: 'search' | 'analysis' | 'collaboration' | 'insight' | 'action';
  priority: 'low' | 'medium' | 'high' | 'critical';
  context: any;
  assignedAgent?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  dependencies?: string[];
}

export class AgentOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private mcpManager: MCPManager;
  private searchService: SearchService;
  private aiChatService: AIChatService;

  constructor() {
    this.mcpManager = new MCPManager();
    this.searchService = new SearchService();
    this.aiChatService = new AIChatService();
    this.initializeAgents();
  }

  private initializeAgents() {
    const agents: Agent[] = [
      {
        id: 'search-agent',
        name: 'SearchMaster',
        role: 'Information Retrieval Specialist',
        capabilities: ['hybrid_search', 'semantic_analysis', 'result_ranking'],
        mcpTools: ['elasticsearch-tools', 'knowledge-graph'],
        priority: 1,
        active: true
      },
      {
        id: 'insight-agent',
        name: 'InsightEngine',
        role: 'Pattern Recognition & Analysis',
        capabilities: ['pattern_detection', 'trend_analysis', 'anomaly_detection'],
        mcpTools: ['analytics-tools', 'serendipity-engine'],
        priority: 2,
        active: true
      },
      {
        id: 'collaboration-agent',
        name: 'CollabConnector',
        role: 'Cross-Team Collaboration Facilitator',
        capabilities: ['team_matching', 'expertise_mapping', 'workflow_optimization'],
        mcpTools: ['collaboration-tools', 'knowledge-graph'],
        priority: 3,
        active: true
      },
      {
        id: 'serendipity-agent',
        name: 'SerendipityScout',
        role: 'Opportunity Discovery Specialist',
        capabilities: ['opportunity_detection', 'connection_discovery', 'innovation_catalyst'],
        mcpTools: ['serendipity-engine', 'analytics-tools'],
        priority: 2,
        active: true
      },
      {
        id: 'action-agent',
        name: 'ActionExecutor',
        role: 'Task Execution & Automation',
        capabilities: ['task_automation', 'workflow_execution', 'integration_management'],
        mcpTools: ['collaboration-tools', 'elasticsearch-tools'],
        priority: 4,
        active: true
      }
    ];

    agents.forEach(agent => this.agents.set(agent.id, agent));
  }

  async processUserRequest(request: any): Promise<any> {
    try {
      // 1. Decompose request into tasks
      const tasks = await this.decomposeRequest(request);
      
      // 2. Create dependency graph
      const taskGraph = this.createTaskGraph(tasks);
      
      // 3. Execute tasks in parallel where possible
      const results = await this.executeTaskGraph(taskGraph);
      
      // 4. Synthesize final response
      return await this.synthesizeResponse(results, request);

    } catch (error) {
      logger.error('Agent orchestration failed:', error);
      throw error;
    }
  }

  private async decomposeRequest(request: any): Promise<Task[]> {
    const tasks: Task[] = [];
    const { query, userContext, intent } = request;

    // Always start with search
    tasks.push({
      id: `search-${Date.now()}`,
      type: 'search',
      priority: 'high',
      context: { query, userContext },
      status: 'pending'
    });

    // Add analysis task if complex query
    if (query.length > 50 || intent?.complexity === 'high') {
      tasks.push({
        id: `analysis-${Date.now()}`,
        type: 'analysis',
        priority: 'medium',
        context: { query, userContext },
        status: 'pending',
        dependencies: [tasks[0].id]
      });
    }

    // Add collaboration task if cross-team potential
    if (intent?.crossTeam || userContext.role === 'manager') {
      tasks.push({
        id: `collaboration-${Date.now()}`,
        type: 'collaboration',
        priority: 'medium',
        context: { query, userContext },
        status: 'pending',
        dependencies: [tasks[0].id]
      });
    }

    // Add serendipity task for discovery
    tasks.push({
      id: `serendipity-${Date.now()}`,
      type: 'insight',
      priority: 'low',
      context: { query, userContext },
      status: 'pending',
      dependencies: [tasks[0].id]
    });

    return tasks;
  }

  private createTaskGraph(tasks: Task[]): Map<string, Task> {
    const graph = new Map<string, Task>();
    tasks.forEach(task => graph.set(task.id, task));
    return graph;
  }

  private async executeTaskGraph(taskGraph: Map<string, Task>): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const completed = new Set<string>();
    
    // Execute tasks in dependency order
    while (completed.size < taskGraph.size) {
      const readyTasks = Array.from(taskGraph.values()).filter(task => 
        task.status === 'pending' && 
        (!task.dependencies || task.dependencies.every(dep => completed.has(dep)))
      );

      if (readyTasks.length === 0) break;

      // Execute ready tasks in parallel
      const taskPromises = readyTasks.map(task => this.executeTask(task));
      const taskResults = await Promise.allSettled(taskPromises);

      taskResults.forEach((result, index) => {
        const task = readyTasks[index];
        if (result.status === 'fulfilled') {
          results.set(task.id, result.value);
          task.status = 'completed';
          completed.add(task.id);
        } else {
          task.status = 'failed';
          logger.error(`Task ${task.id} failed:`, result.reason);
        }
      });
    }

    return results;
  }

  private async executeTask(task: Task): Promise<any> {
    const agent = this.selectAgent(task);
    if (!agent) {
      throw new Error(`No suitable agent found for task ${task.id}`);
    }

    task.assignedAgent = agent.id;
    task.status = 'running';

    logger.info(`Executing task ${task.id} with agent ${agent.name}`);

    switch (task.type) {
      case 'search':
        return await this.executeSearchTask(task, agent);
      case 'analysis':
        return await this.executeAnalysisTask(task, agent);
      case 'collaboration':
        return await this.executeCollaborationTask(task, agent);
      case 'insight':
        return await this.executeInsightTask(task, agent);
      case 'action':
        return await this.executeActionTask(task, agent);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private selectAgent(task: Task): Agent | null {
    const suitableAgents = Array.from(this.agents.values()).filter(agent => 
      agent.active && this.canHandleTask(agent, task)
    );

    // Select agent with highest priority and matching capabilities
    return suitableAgents.sort((a, b) => a.priority - b.priority)[0] || null;
  }

  private canHandleTask(agent: Agent, task: Task): boolean {
    const taskCapabilityMap = {
      'search': ['hybrid_search', 'semantic_analysis'],
      'analysis': ['pattern_detection', 'trend_analysis'],
      'collaboration': ['team_matching', 'expertise_mapping'],
      'insight': ['opportunity_detection', 'connection_discovery'],
      'action': ['task_automation', 'workflow_execution']
    };

    const requiredCapabilities = taskCapabilityMap[task.type] || [];
    return requiredCapabilities.some(cap => agent.capabilities.includes(cap));
  }

  private async executeSearchTask(task: Task, agent: Agent): Promise<any> {
    const { query, userContext } = task.context;
    
    // Use MCP tools for enhanced search
    const mcpResults = await Promise.allSettled([
      this.mcpManager.callTool('search_documents', { 
        query, 
        userContext,
        includeSemanticSimilarity: true 
      }),
      this.mcpManager.callTool('find_connections', { 
        query, 
        userContext 
      })
    ]);

    // Combine with native search
    const searchResults = await this.searchService.hybridSearch({
      query,
      userContext,
      pagination: { page: 1, size: 20 }
    });

    return {
      searchResults,
      mcpEnhancements: mcpResults.map(r => r.status === 'fulfilled' ? r.value : null),
      agent: agent.name,
      performance: {
        executionTime: Date.now() - task.context.startTime,
        resultsCount: searchResults.total
      }
    };
  }

  private async executeAnalysisTask(task: Task, agent: Agent): Promise<any> {
    const { query, userContext } = task.context;
    
    const analysisResults = await Promise.allSettled([
      this.mcpManager.callTool('analyze_search_patterns', { 
        query, 
        userContext 
      }),
      this.mcpManager.callTool('detect_cross_team_opportunities', { 
        query, 
        userContext 
      }),
      this.mcpManager.callTool('generate_insights_report', { 
        query, 
        userContext 
      })
    ]);

    return {
      patterns: analysisResults[0].status === 'fulfilled' ? analysisResults[0].value : null,
      opportunities: analysisResults[1].status === 'fulfilled' ? analysisResults[1].value : null,
      insights: analysisResults[2].status === 'fulfilled' ? analysisResults[2].value : null,
      agent: agent.name
    };
  }

  private async executeCollaborationTask(task: Task, agent: Agent): Promise<any> {
    const { query, userContext } = task.context;
    
    const collaborationResults = await Promise.allSettled([
      this.mcpManager.callTool('find_available_experts', { 
        topic: query, 
        userContext 
      }),
      this.mcpManager.callTool('get_team_relationships', { 
        userTeam: userContext.team 
      }),
      this.mcpManager.callTool('suggest_collaborations', { 
        query, 
        userContext 
      })
    ]);

    return {
      experts: collaborationResults[0].status === 'fulfilled' ? collaborationResults[0].value : null,
      teamRelationships: collaborationResults[1].status === 'fulfilled' ? collaborationResults[1].value : null,
      suggestions: collaborationResults[2].status === 'fulfilled' ? collaborationResults[2].value : null,
      agent: agent.name
    };
  }

  private async executeInsightTask(task: Task, agent: Agent): Promise<any> {
    const { query, userContext } = task.context;
    
    const insightResults = await Promise.allSettled([
      this.mcpManager.callTool('analyze_topic_overlaps', { 
        query, 
        userContext 
      }),
      this.mcpManager.callTool('find_knowledge_gaps', { 
        query, 
        userContext 
      })
    ]);

    return {
      topicOverlaps: insightResults[0].status === 'fulfilled' ? insightResults[0].value : null,
      knowledgeGaps: insightResults[1].status === 'fulfilled' ? insightResults[1].value : null,
      agent: agent.name
    };
  }

  private async executeActionTask(task: Task, agent: Agent): Promise<any> {
    const { actions, userContext } = task.context;
    
    const actionResults = [];
    for (const action of actions || []) {
      try {
        const result = await this.mcpManager.callTool(action.tool, {
          ...action.params,
          userContext
        });
        actionResults.push({ action: action.name, result, success: true });
      } catch (error) {
        actionResults.push({ action: action.name, error: error.message, success: false });
      }
    }

    return {
      actionResults,
      agent: agent.name
    };
  }

  private async synthesizeResponse(results: Map<string, any>, originalRequest: any): Promise<any> {
    const synthesis = {
      searchResults: null,
      insights: [],
      collaborationOpportunities: [],
      actionableRecommendations: [],
      performance: {
        totalExecutionTime: 0,
        agentsUsed: [],
        mcpToolsUsed: []
      }
    };

    // Combine results from all agents
    for (const [taskId, result] of results.entries()) {
      if (result.searchResults) {
        synthesis.searchResults = result.searchResults;
      }
      
      if (result.opportunities) {
        synthesis.collaborationOpportunities.push(...(result.opportunities || []));
      }
      
      if (result.insights) {
        synthesis.insights.push(result.insights);
      }
      
      if (result.suggestions) {
        synthesis.actionableRecommendations.push(...(result.suggestions || []));
      }

      if (result.agent) {
        synthesis.performance.agentsUsed.push(result.agent);
      }
    }

    // Generate final AI-powered synthesis
    const finalResponse = await this.aiChatService.processMessage(
      `Synthesize these multi-agent results into a cohesive response: ${JSON.stringify(synthesis)}`,
      {
        conversationId: originalRequest.conversationId || 'synthesis',
        userId: originalRequest.userContext.userId,
        userTeam: originalRequest.userContext.team,
        userRole: originalRequest.userContext.role,
        messages: []
      }
    );

    return {
      ...synthesis,
      aiSynthesis: finalResponse.message.content,
      metadata: {
        agentOrchestration: true,
        tasksExecuted: results.size,
        ...synthesis.performance
      }
    };
  }

  // Performance monitoring
  getAgentPerformance(): any {
    return {
      activeAgents: Array.from(this.agents.values()).filter(a => a.active).length,
      totalAgents: this.agents.size,
      mcpServersConnected: this.mcpManager.getConnectedServers().length,
      averageTaskExecutionTime: 0 // Calculate from task history
    };
  }
}