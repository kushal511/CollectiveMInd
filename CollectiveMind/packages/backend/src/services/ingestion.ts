import fs from 'fs/promises';
import path from 'path';
import { elasticsearchClient, INDICES } from '../config/elasticsearch';
import { logger } from '../utils/logger';

export interface IngestionProgress {
  totalFiles: number;
  processedFiles: number;
  totalRecords: number;
  processedRecords: number;
  errors: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export class DataIngestionService {
  private progress: IngestionProgress = {
    totalFiles: 0,
    processedFiles: 0,
    totalRecords: 0,
    processedRecords: 0,
    errors: [],
    status: 'pending'
  };

  async ingestDataset(datasetPath: string): Promise<IngestionProgress> {
    try {
      this.progress.status = 'running';
      logger.info(`Starting data ingestion from: ${datasetPath}`);

      // Get list of data files
      const files = await this.getDataFiles(datasetPath);
      this.progress.totalFiles = files.length;

      // Process each file
      for (const file of files) {
        await this.processFile(file);
        this.progress.processedFiles++;
      }

      this.progress.status = 'completed';
      logger.info('Data ingestion completed successfully');
      return this.progress;

    } catch (error) {
      this.progress.status = 'failed';
      this.progress.errors.push(`Ingestion failed: ${error.message}`);
      logger.error('Data ingestion failed:', error);
      throw error;
    }
  }

  private async getDataFiles(datasetPath: string): Promise<string[]> {
    const files = await fs.readdir(datasetPath);
    return files
      .filter(file => file.endsWith('.jsonl') || file.endsWith('.csv'))
      .map(file => path.join(datasetPath, file));
  }

  private async processFile(filePath: string): Promise<void> {
    const fileName = path.basename(filePath);
    logger.info(`Processing file: ${fileName}`);

    try {
      if (fileName.endsWith('.jsonl')) {
        await this.processJSONLFile(filePath, fileName);
      } else if (fileName.endsWith('.csv')) {
        await this.processCSVFile(filePath, fileName);
      }
    } catch (error) {
      const errorMsg = `Failed to process ${fileName}: ${error.message}`;
      this.progress.errors.push(errorMsg);
      logger.error(errorMsg);
    }
  }

  private async processJSONLFile(filePath: string, fileName: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    this.progress.totalRecords += lines.length;

    const records = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        logger.warn(`Invalid JSON in ${fileName}: ${line}`);
        return null;
      }
    }).filter(record => record !== null);

    // Route to appropriate index based on file name
    if (fileName.includes('documents')) {
      await this.indexDocuments(records);
    } else if (fileName.includes('chat_messages')) {
      await this.indexMessages(records);
    } else if (fileName.includes('people')) {
      await this.indexPeople(records);
    } else if (fileName.includes('topics')) {
      await this.indexTopics(records);
    } else {
      logger.info(`Skipping file ${fileName} - no handler defined`);
    }
  }

  private async processCSVFile(filePath: string, fileName: string): Promise<void> {
    // For now, we'll skip CSV files as they're not part of the main search indices
    // They can be processed later for analytics and reporting
    logger.info(`Skipping CSV file ${fileName} - will be processed for analytics`);
  }

  private async indexDocuments(documents: any[]): Promise<void> {
    const bulkBody = [];

    for (const doc of documents) {
      // Prepare document for indexing
      const indexDoc = {
        ...doc,
        full_text: `${doc.title} ${doc.content}`,
        boost_score: this.calculateDocumentBoost(doc),
        // Vector will be added later by embedding service
        content_vector: null
      };

      bulkBody.push(
        { index: { _index: INDICES.DOCUMENTS, _id: doc.doc_id } },
        indexDoc
      );
    }

    if (bulkBody.length > 0) {
      const response = await elasticsearchClient.bulk({ body: bulkBody });
      
      if (response.errors) {
        const errors = response.items
          .filter(item => item.index?.error)
          .map(item => item.index?.error?.reason);
        logger.warn('Some documents failed to index:', errors);
      }

      this.progress.processedRecords += documents.length;
      logger.info(`Indexed ${documents.length} documents`);
    }
  }

  private async indexMessages(messages: any[]): Promise<void> {
    const bulkBody = [];

    for (const message of messages) {
      // Prepare message for indexing
      const indexMessage = {
        ...message,
        // Vector will be added later by embedding service
        text_vector: null
      };

      bulkBody.push(
        { index: { _index: INDICES.MESSAGES, _id: message.message_id } },
        indexMessage
      );
    }

    if (bulkBody.length > 0) {
      const response = await elasticsearchClient.bulk({ body: bulkBody });
      
      if (response.errors) {
        const errors = response.items
          .filter(item => item.index?.error)
          .map(item => item.index?.error?.reason);
        logger.warn('Some messages failed to index:', errors);
      }

      this.progress.processedRecords += messages.length;
      logger.info(`Indexed ${messages.length} messages`);
    }
  }

  private async indexPeople(people: any[]): Promise<void> {
    const bulkBody = [];

    for (const person of people) {
      // Prepare person for indexing
      const indexPerson = {
        ...person,
        expertise_areas: person.skills?.join(' ') || '',
        // Vector will be added later by embedding service
        expertise_vector: null
      };

      bulkBody.push(
        { index: { _index: INDICES.PEOPLE, _id: person.person_id } },
        indexPerson
      );
    }

    if (bulkBody.length > 0) {
      const response = await elasticsearchClient.bulk({ body: bulkBody });
      
      if (response.errors) {
        const errors = response.items
          .filter(item => item.index?.error)
          .map(item => item.index?.error?.reason);
        logger.warn('Some people failed to index:', errors);
      }

      this.progress.processedRecords += people.length;
      logger.info(`Indexed ${people.length} people`);
    }
  }

  private async indexTopics(topics: any[]): Promise<void> {
    const bulkBody = [];

    for (const topic of topics) {
      // Prepare topic for indexing
      const indexTopic = {
        ...topic,
        // Vector will be added later by embedding service
        topic_vector: null
      };

      bulkBody.push(
        { index: { _index: INDICES.TOPICS, _id: topic.topic_id } },
        indexTopic
      );
    }

    if (bulkBody.length > 0) {
      const response = await elasticsearchClient.bulk({ body: bulkBody });
      
      if (response.errors) {
        const errors = response.items
          .filter(item => item.index?.error)
          .map(item => item.index?.error?.reason);
      }

      this.progress.processedRecords += topics.length;
      logger.info(`Indexed ${topics.length} topics`);
    }
  }

  private calculateDocumentBoost(doc: any): number {
    let boost = 1.0;

    // Boost based on document status
    if (doc.status === 'final') boost += 0.2;
    
    // Boost based on recency (newer documents get higher boost)
    const daysSinceUpdate = (Date.now() - new Date(doc.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) boost += 0.3;
    else if (daysSinceUpdate < 90) boost += 0.1;

    // Boost based on visibility
    if (doc.visibility === 'public') boost += 0.1;

    return Math.round(boost * 100) / 100;
  }

  getProgress(): IngestionProgress {
    return { ...this.progress };
  }

  async validateDataIntegrity(): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check if indices exist and have data
      for (const indexName of Object.values(INDICES)) {
        const exists = await elasticsearchClient.indices.exists({ index: indexName });
        if (!exists) {
          issues.push(`Index ${indexName} does not exist`);
          continue;
        }

        const count = await elasticsearchClient.count({ index: indexName });
        if (count.count === 0) {
          issues.push(`Index ${indexName} is empty`);
        }
      }

      // Check for documents without embeddings (will be handled by embedding service)
      const docsWithoutEmbeddings = await elasticsearchClient.search({
        index: INDICES.DOCUMENTS,
        body: {
          query: {
            bool: {
              must_not: {
                exists: { field: 'content_vector' }
              }
            }
          },
          size: 0
        }
      });

      if (docsWithoutEmbeddings.hits.total.value > 0) {
        issues.push(`${docsWithoutEmbeddings.hits.total.value} documents missing embeddings`);
      }

      return {
        isValid: issues.length === 0,
        issues
      };

    } catch (error) {
      issues.push(`Validation failed: ${error.message}`);
      return { isValid: false, issues };
    }
  }
}