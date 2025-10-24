import { PrismaClient } from '@prisma/client';
import { embeddingService } from '../services/embeddings';

const prisma = new PrismaClient();

const demoKnowledgeItems = [
  {
    title: "Introduction to Collective Intelligence",
    content: "Collective intelligence refers to the enhanced capacity that results from collaboration, collective efforts, and competition among many individuals. It represents the ability of a group to solve problems that individual members cannot solve alone.",
    tags: ["collective-intelligence", "collaboration", "problem-solving"],
    author: "Demo User",
    category: "Theory"
  },
  {
    title: "AI and Machine Learning Fundamentals",
    content: "Artificial Intelligence (AI) is the simulation of human intelligence in machines. Machine Learning is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed.",
    tags: ["ai", "machine-learning", "technology"],
    author: "Demo User",
    category: "Technology"
  },
  {
    title: "Semantic Search Technologies",
    content: "Semantic search uses natural language processing and machine learning to understand the intent and contextual meaning of search queries, providing more relevant results than traditional keyword-based search.",
    tags: ["semantic-search", "nlp", "search-technology"],
    author: "Demo User",
    category: "Technology"
  },
  {
    title: "Knowledge Management Systems",
    content: "Knowledge management systems help organizations capture, store, share, and effectively use knowledge. They facilitate the creation of organizational memory and enable better decision-making through collective wisdom.",
    tags: ["knowledge-management", "organizational-learning", "systems"],
    author: "Demo User",
    category: "Systems"
  },
  {
    title: "Hackathon Best Practices",
    content: "Successful hackathons require clear problem definition, diverse team collaboration, rapid prototyping, and effective presentation of solutions. Focus on solving real problems with innovative approaches.",
    tags: ["hackathon", "innovation", "collaboration", "prototyping"],
    author: "Demo User",
    category: "Methodology"
  },
  {
    title: "Natural Language Processing in AI",
    content: "Natural Language Processing (NLP) enables computers to understand, interpret, and generate human language. It combines computational linguistics with machine learning to bridge the gap between human communication and computer understanding.",
    tags: ["nlp", "ai", "language-processing", "computational-linguistics"],
    author: "Demo User",
    category: "Technology"
  },
  {
    title: "Collaborative Problem Solving",
    content: "Collaborative problem solving leverages diverse perspectives and expertise to tackle complex challenges. It involves structured approaches to combine individual knowledge into collective solutions that exceed what any single person could achieve.",
    tags: ["collaboration", "problem-solving", "teamwork", "collective-intelligence"],
    author: "Demo User",
    category: "Methodology"
  }
];

async function seedDemoData() {
  console.log('🌱 Seeding demo data...');
  
  try {
    // Clear existing demo data
    await prisma.knowledgeItem.deleteMany({
      where: { author: 'Demo User' }
    });
    
    console.log('🧹 Cleared existing demo data');
    
    // Create demo knowledge items with embeddings
    for (const item of demoKnowledgeItems) {
      console.log(`📝 Creating: ${item.title}`);
      
      // Generate embedding for the content
      const embedding = await embeddingService.generateEmbedding(
        `${item.title} ${item.content}`
      );
      
      await prisma.knowledgeItem.create({
        data: {
          title: item.title,
          content: item.content,
          summary: item.content.substring(0, 150) + '...',
          tags: JSON.stringify(item.tags), // Store as JSON string for SQLite
          category: item.category,
          author: item.author,
          embedding: JSON.stringify(embedding), // Store as JSON string for SQLite
          keywords: JSON.stringify(item.tags.slice(0, 3)), // First 3 tags as keywords
          confidence: 0.95,
          views: Math.floor(Math.random() * 100),
          upvotes: Math.floor(Math.random() * 20),
          downvotes: Math.floor(Math.random() * 5),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    console.log('✅ Demo data seeded successfully');
    
    // Show service status
    const status = embeddingService.getServiceStatus();
    console.log(`🤖 AI Service: ${status.type} (${status.ready ? 'ready' : 'not ready'})`);
    
    // Show summary
    const count = await prisma.knowledgeItem.count();
    console.log(`📊 Total knowledge items: ${count}`);
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedDemoData().catch(console.error);
}

export { seedDemoData };
