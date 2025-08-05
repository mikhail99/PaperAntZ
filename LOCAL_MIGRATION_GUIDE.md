# Local Machine Migration Guide

## Overview

This guide provides detailed instructions for migrating the AI Research Assistant from a cloud-oriented deployment to a local machine deployment. The migration focuses on document storage, AI model access, and configuration adjustments required for local development and operation.

## Migration Requirements

### Prerequisites

- Node.js 18+ and npm
- Local storage space for documents (recommended: 10GB+)
- Optional: Local AI models (Ollama, LM Studio, etc.)
- SQLite (included with Prisma)

### Target Environment

- **Operating System**: macOS, Linux, or Windows
- **Storage**: Local filesystem
- **Database**: SQLite (local file)
- **AI Models**: Either local models or cloud API access
- **Network**: Local development server (localhost:3000)

## Migration Steps

### Step 1: Environment Configuration

#### Create Local Environment File

Create a `.env.local` file in the project root:

```bash
# Database Configuration
DATABASE_URL="file:./dev.db"

# Document Storage Configuration
DOCUMENT_STORAGE_PATH="./documents"
DOCUMENT_STORAGE_TYPE="local"

# AI Model Configuration
# Option 1: Cloud-based AI (default)
AI_MODEL_TYPE="cloud"
AI_MODEL_API_KEY="your-cloud-api-key"
AI_MODEL_ENDPOINT="https://api.example.com"

# Option 2: Local AI Models
# AI_MODEL_TYPE="local"
# AI_MODEL_ENDPOINT="http://localhost:11434"  # Ollama default
# AI_MODEL_API_KEY="not-needed-for-local"

# Application Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Development Configuration
NODE_ENV="development"
LOG_LEVEL="debug"
```

#### Generate Application Secret

Run this command to generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Document Storage Migration

#### Create Local Storage Service

Create `src/lib/storage/local-document-storage.ts`:

```typescript
import { writeFile, readFile, unlink, existsSync, mkdirSync, rename } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

export interface DocumentStorageConfig {
  storagePath?: string;
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

export class LocalDocumentStorage {
  private readonly storagePath: string;
  private readonly maxFileSize: number;
  private readonly allowedFileTypes: string[];

  constructor(config: DocumentStorageConfig = {}) {
    // Default to user's home directory for document storage
    this.storagePath = config.storagePath || 
      join(homedir(), '.ai-research-assistant', 'documents');
    
    this.maxFileSize = config.maxFileSize || 50 * 1024 * 1024; // 50MB default
    this.allowedFileTypes = config.allowedFileTypes || [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    this.ensureStorageDirectory();
  }

  private ensureStorageDirectory(): void {
    if (!existsSync(this.storagePath)) {
      mkdirSync(this.storagePath, { recursive: true });
    }
  }

  async saveDocument(file: File): Promise<string> {
    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = join(this.storagePath, fileName);

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return filePath;
  }

  async getDocument(documentId: string): Promise<{
    path: string;
    buffer: Buffer;
    metadata: any;
  }> {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Handle path migration if needed
    const filePath = await this.migratePathIfNeeded(document);
    const buffer = await readFile(filePath);

    return {
      path: filePath,
      buffer,
      metadata: {
        title: document.title,
        fileType: document.fileType,
        fileSize: document.fileSize,
        processed: document.processed
      }
    };
  }

  async deleteDocument(documentId: string): Promise<void> {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (document) {
      const filePath = await this.migratePathIfNeeded(document);
      
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    }
  }

  async getStorageStats(): Promise<{
    totalDocuments: number;
    totalSize: number;
    storagePath: string;
  }> {
    const documents = await prisma.document.findMany();
    const totalSize = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);

    return {
      totalDocuments: documents.length,
      totalSize,
      storagePath: this.storagePath
    };
  }

  private validateFile(file: File): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${this.maxFileSize} bytes`);
    }

    // Check file type
    if (!this.allowedFileTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }
  }

  private async migratePathIfNeeded(document: any): Promise<string> {
    // If the source path starts with '/uploads/', it's an old cloud path
    if (document.source.startsWith('/uploads/')) {
      const oldPath = document.source;
      const fileName = `${document.id}-${document.title}`;
      const newPath = join(this.storagePath, fileName);

      // Try to migrate the file
      if (existsSync(oldPath)) {
        try {
          await rename(oldPath, newPath);
          
          // Update database with new path
          await prisma.document.update({
            where: { id: document.id },
            data: { source: newPath }
          });
          
          return newPath;
        } catch (error) {
          console.error(`Failed to migrate document ${document.id}:`, error);
          return oldPath;
        }
      } else {
        // File doesn't exist at old path, update database to reflect this
        await prisma.document.update({
          where: { id: document.id },
          data: { 
            source: newPath,
            processed: false,
            metadata: JSON.stringify({
              ...JSON.parse(document.metadata || '{}'),
              migrationError: 'Original file not found',
              migratedAt: new Date().toISOString()
            })
          }
        });
        
        return newPath;
      }
    }

    return document.source;
  }
}

// Export singleton instance
export const localDocumentStorage = new LocalDocumentStorage();
```

#### Update Document Service

Update `src/lib/services/document-service.ts`:

```typescript
import { localDocumentStorage } from '@/lib/storage/local-document-storage';

export class DocumentService {
  async uploadDocument(file: File): Promise<Document> {
    try {
      // Save document to local storage
      const filePath = await localDocumentStorage.saveDocument(file);

      // Create document record in database
      const document = await prisma.document.create({
        data: {
          title: file.name,
          content: '', // Will be processed later
          source: filePath,
          fileType: file.type,
          fileSize: file.size,
          processed: false,
          metadata: JSON.stringify({
            uploadedAt: new Date().toISOString(),
            originalName: file.name
          })
        }
      });

      // Trigger document processing (async)
      this.processDocument(document.id).catch(console.error);

      return document;
    } catch (error) {
      console.error('Document upload failed:', error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }

  async getDocumentContent(documentId: string): Promise<string> {
    try {
      const { buffer } = await localDocumentStorage.getDocument(documentId);
      
      // For text files, return content directly
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      if (document.fileType === 'text/plain') {
        return buffer.toString('utf-8');
      }

      // For other file types, return cached content if available
      if (document.content) {
        return document.content;
      }

      throw new Error('Document content not available. Please process the document first.');
    } catch (error) {
      console.error('Failed to get document content:', error);
      throw error;
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      // Delete from storage
      await localDocumentStorage.deleteDocument(documentId);

      // Delete from database
      await prisma.document.delete({
        where: { id: documentId }
      });

      // Clean up related data
      await prisma.documentChunk.deleteMany({
        where: { documentId }
      });

      await prisma.documentGroupDocument.deleteMany({
        where: { documentId }
      });
    } catch (error) {
      console.error('Document deletion failed:', error);
      throw error;
    }
  }

  async getStorageStats(): Promise<any> {
    return await localDocumentStorage.getStorageStats();
  }
}
```

### Step 3: AI Model Configuration

#### Option 1: Local AI Models (Recommended for Full Local Deployment)

Create `src/lib/ai/local-model-client.ts`:

```typescript
export class LocalModelClient {
  private baseUrl: string;
  private model: string;

  constructor(config: {
    baseUrl?: string;
    model?: string;
  } = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434'; // Ollama default
    this.model = config.model || 'llama2';
  }

  async generate(prompt: string, options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options?.model || this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: options?.temperature || 0.7,
            num_predict: options?.maxTokens || 1000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Local model request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Local model generation failed:', error);
      throw new Error(`Failed to generate with local model: ${error.message}`);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'nomic-embed-text', // Default embedding model
          prompt: text
        })
      });

      if (!response.ok) {
        throw new Error(`Embedding generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.models.map((model: any) => model.name);
    } catch (error) {
      console.error('Failed to get available models:', error);
      return [];
    }
  }
}
```

#### Option 2: Hybrid AI Client (Cloud + Local Fallback)

Create `src/lib/ai/hybrid-ai-client.ts`:

```typescript
import { LocalModelClient } from './local-model-client';
import { ZAIClient } from 'z-ai-web-dev-sdk';

export class HybridAIClient {
  private localClient: LocalModelClient;
  private cloudClient: ZAIClient;
  private useLocalFirst: boolean;

  constructor(config: {
    useLocalFirst?: boolean;
    localConfig?: any;
    cloudConfig?: any;
  } = {}) {
    this.useLocalFirst = config.useLocalFirst || false;
    this.localClient = new LocalModelClient(config.localConfig);
    this.cloudClient = new ZAIClient(config.cloudConfig);
  }

  async generate(prompt: string, options?: any): Promise<string> {
    if (this.useLocalFirst) {
      try {
        // Try local model first
        const isLocalAvailable = await this.localClient.isAvailable();
        if (isLocalAvailable) {
          return await this.localClient.generate(prompt, options);
        }
      } catch (error) {
        console.warn('Local model failed, falling back to cloud:', error);
      }
    }

    // Fall back to cloud model
    try {
      return await this.cloudClient.generate(prompt, options);
    } catch (error) {
      console.error('Both local and cloud models failed:', error);
      throw new Error('All AI models are currently unavailable');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (this.useLocalFirst) {
      try {
        const isLocalAvailable = await this.localClient.isAvailable();
        if (isLocalAvailable) {
          return await this.localClient.generateEmbedding(text);
        }
      } catch (error) {
        console.warn('Local embedding generation failed, falling back to cloud:', error);
      }
    }

    // Fall back to cloud model
    try {
      return await this.cloudClient.generateEmbedding(text);
    } catch (error) {
      console.error('Both local and cloud embedding generation failed:', error);
      throw new Error('Embedding generation is currently unavailable');
    }
  }

  async getModels(): Promise<{
    local: string[];
    cloud: string[];
  }> {
    const [localModels, cloudModels] = await Promise.all([
      this.localClient.getAvailableModels().catch(() => []),
      this.getCloudModels().catch(() => [])
    ]);

    return { local: localModels, cloud: cloudModels };
  }

  private async getCloudModels(): Promise<string[]> {
    // This would depend on your cloud provider's API
    // For z-ai-web-dev-sdk, you might need to implement this
    return ['gpt-3.5-turbo', 'gpt-4', 'claude-3']; // Example models
  }
}
```

### Step 4: Update API Routes

#### Update Document Upload Route

Update `src/app/api/documents/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/services/document-service';

const documentService = new DocumentService();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload document using local storage
    const document = await documentService.uploadDocument(file);

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        fileType: document.fileType,
        fileSize: document.fileSize,
        processed: document.processed,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    console.error('Document upload failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = await documentService.getStorageStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return NextResponse.json(
      { error: 'Failed to get storage statistics' },
      { status: 500 }
    );
  }
}
```

#### Update Document Download Route

Create `src/app/api/documents/[id]/download/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { localDocumentStorage } from '@/lib/storage/local-document-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get document from storage
    const { path, buffer, metadata } = await localDocumentStorage.getDocument(id);

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', metadata.fileType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${metadata.title}"`);
    headers.set('Content-Length', buffer.byteLength.toString());

    return new NextResponse(buffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Document download failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download document' },
      { status: 500 }
    );
  }
}
```

### Step 5: Database Configuration

#### Update Prisma Schema for Local Development

Ensure your `prisma/schema.prisma` is optimized for local development:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
  
  // Optional: Shadow database for better local development
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}

// ... rest of your schema remains the same
```

#### Create Database Initialization Script

Create `scripts/init-database.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const initializeDatabase = async () => {
  const prisma = new PrismaClient();
  
  try {
    console.log('Initializing database...');
    
    // Check if database exists, create if it doesn't
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './dev.db';
    
    if (!fs.existsSync(dbPath)) {
      console.log('Creating new database...');
      // Prisma will create the database automatically
    }
    
    // Run migrations
    console.log('Running database migrations...');
    await prisma.$executeRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    
    console.log('Database initialized successfully!');
    console.log(`Database location: ${path.resolve(dbPath)}`);
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

initializeDatabase();
```

### Step 6: Development Scripts

#### Update Package.json Scripts

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
    "db:studio": "prisma studio",
    "setup:local": "node scripts/setup-local-env.js",
    "init:db": "node scripts/init-database.js",
    "migrate:local": "node scripts/migrate-to-local.js",
    "cleanup:local": "node scripts/cleanup-local-storage.js",
    "check:local-models": "node scripts/check-local-models.js"
  }
}
```

#### Create Setup Script

Create `scripts/setup-local-env.js`:

```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const setupLocalEnvironment = () => {
  console.log('🚀 Setting up local environment for AI Research Assistant...\n');
  
  // Create .env.local if it doesn't exist
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    const envContent = `# Local Development Configuration
# ======================================

# Database Configuration
DATABASE_URL="file:./dev.db"

# Document Storage Configuration
DOCUMENT_STORAGE_PATH="./documents"
DOCUMENT_STORAGE_TYPE="local"

# AI Model Configuration
# Choose ONE of the following options:

# Option 1: Cloud-based AI (default)
AI_MODEL_TYPE="cloud"
AI_MODEL_API_KEY="your-cloud-api-key-here"
AI_MODEL_ENDPOINT="https://api.example.com"

# Option 2: Local AI Models (uncomment to use)
# AI_MODEL_TYPE="local"
# AI_MODEL_ENDPOINT="http://localhost:11434"
# AI_MODEL_API_KEY="not-needed-for-local"

# Application Configuration
NEXTAUTH_SECRET="${crypto.randomBytes(32).toString('hex')}"
NEXTAUTH_URL="http://localhost:3000"

# Development Configuration
NODE_ENV="development"
LOG_LEVEL="debug"

# Optional: Shadow database for better migration experience
# SHADOW_DATABASE_URL="file:./shadow.db"
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file');
    console.log('⚠️  Please update AI_MODEL_API_KEY in .env.local with your actual API key');
  } else {
    console.log('ℹ️  .env.local file already exists');
  }
  
  // Create documents directory
  const documentsPath = path.join(process.cwd(), 'documents');
  if (!fs.existsSync(documentsPath)) {
    fs.mkdirSync(documentsPath, { recursive: true });
    console.log('✅ Created documents directory');
  } else {
    console.log('ℹ️  Documents directory already exists');
  }
  
  // Create user's home directory storage
  const homeStoragePath = path.join(os.homedir(), '.ai-research-assistant', 'documents');
  if (!fs.existsSync(homeStoragePath)) {
    fs.mkdirSync(homeStoragePath, { recursive: true });
    console.log('✅ Created home storage directory:', homeStoragePath);
  } else {
    console.log('ℹ️  Home storage directory already exists:', homeStoragePath);
  }
  
  console.log('\n🎉 Local environment setup complete!');
  console.log('\nNext steps:');
  console.log('1. Run "npm run init:db" to initialize the database');
  console.log('2. Run "npm run db:push" to push schema changes');
  console.log('3. Run "npm run dev" to start the development server');
  console.log('4. Open http://localhost:3000 to access the application');
};

setupLocalEnvironment();
```

#### Create Local Model Check Script

Create `scripts/check-local-models.js`:

```javascript
const fetch = require('node-fetch');

const checkLocalModels = async () => {
  console.log('🔍 Checking local AI model availability...\n');
  
  try {
    // Check Ollama
    console.log('📋 Checking Ollama...');
    const ollamaResponse = await fetch('http://localhost:11434/api/tags');
    
    if (ollamaResponse.ok) {
      const data = await ollamaResponse.json();
      console.log('✅ Ollama is running');
      console.log('📦 Available models:');
      data.models.forEach(model => {
        console.log(`   - ${model.name}`);
      });
    } else {
      console.log('❌ Ollama is not running or not accessible');
      console.log('   To install Ollama: https://ollama.com/download');
      console.log('   To start Ollama: ollama serve');
    }
  } catch (error) {
    console.log('❌ Could not connect to Ollama');
    console.log('   Make sure Ollama is installed and running');
  }
  
  console.log('\n📝 Recommended setup:');
  console.log('1. Install Ollama from https://ollama.com/download');
  console.log('2. Start Ollama: ollama serve');
  console.log('3. Pull models:');
  console.log('   ollama pull llama2');
  console.log('   ollama pull nomic-embed-text');
  console.log('4. Update .env.local with AI_MODEL_TYPE="local"');
};

checkLocalModels().catch(console.error);
```

### Step 7: Migration Script for Existing Data

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
    console.log('🔄 Starting migration to local storage...\n');
    
    // Ensure local storage directory exists
    if (!fs.existsSync(localStoragePath)) {
      fs.mkdirSync(localStoragePath, { recursive: true });
      console.log('✅ Created local storage directory');
    }
    
    // Get all documents
    const documents = await prisma.document.findMany();
    console.log(`📄 Found ${documents.length} documents to migrate\n`);
    
    let migratedCount = 0;
    let failedCount = 0;
    
    for (const document of documents) {
      try {
        const oldPath = document.source;
        const fileName = `${document.id}-${document.title.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const newPath = path.join(localStoragePath, fileName);
        
        // Check if file exists at old path
        if (fs.existsSync(oldPath)) {
          // Copy file to new location
          fs.copyFileSync(oldPath, newPath);
          
          // Update database with new path
          await prisma.document.update({
            where: { id: document.id },
            data: { 
              source: newPath,
              metadata: JSON.stringify({
                ...JSON.parse(document.metadata || '{}'),
                migratedAt: new Date().toISOString(),
                oldPath: oldPath
              })
            }
          });
          
          console.log(`✅ Migrated: ${document.title}`);
          migratedCount++;
        } else {
          console.log(`⚠️  File not found: ${document.title} (${oldPath})`);
          
          // Update database to reflect missing file
          await prisma.document.update({
            where: { id: document.id },
            data: { 
              metadata: JSON.stringify({
                ...JSON.parse(document.metadata || '{}'),
                migrationError: 'Original file not found',
                oldPath: oldPath,
                migratedAt: new Date().toISOString()
              })
            }
          });
          
          failedCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to migrate ${document.title}:`, error.message);
        failedCount++;
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${migratedCount} documents`);
    console.log(`❌ Failed to migrate: ${failedCount} documents`);
    console.log(`📁 Local storage path: ${localStoragePath}`);
    
    if (migratedCount > 0) {
      console.log('\n💡 Next steps:');
      console.log('1. Verify that all migrated files are accessible');
      console.log('2. Test document upload and download functionality');
      console.log('3. Remove old cloud storage files after verification');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

migrateToLocalStorage();
```

### Step 8: Testing the Migration

#### Create Test Script

Create `scripts/test-local-setup.js`:

```javascript
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const testLocalSetup = async () => {
  console.log('🧪 Testing local setup...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Test 1: Database Connection
    console.log('📊 Testing database connection...');
    await prisma.$executeRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    
    // Test 2: Document Storage
    console.log('\n📁 Testing document storage...');
    const storagePath = path.join(process.cwd(), 'documents');
    if (fs.existsSync(storagePath)) {
      console.log('✅ Documents directory exists');
      
      const stats = fs.statSync(storagePath);
      console.log(`📦 Directory permissions: ${stats.mode.toString(8)}`);
    } else {
      console.log('❌ Documents directory does not exist');
    }
    
    // Test 3: Home Directory Storage
    console.log('\n🏠 Testing home directory storage...');
    const homeStoragePath = path.join(require('os').homedir(), '.ai-research-assistant', 'documents');
    if (fs.existsSync(homeStoragePath)) {
      console.log('✅ Home storage directory exists');
    } else {
      console.log('❌ Home storage directory does not exist');
    }
    
    // Test 4: Environment Variables
    console.log('\n🔧 Testing environment configuration...');
    const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length === 0) {
      console.log('✅ All required environment variables are set');
    } else {
      console.log('❌ Missing environment variables:', missingEnvVars.join(', '));
    }
    
    // Test 5: AI Model Configuration
    console.log('\n🤖 Testing AI model configuration...');
    const aiModelType = process.env.AI_MODEL_TYPE;
    
    if (aiModelType === 'local') {
      console.log('📍 Using local AI models');
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (response.ok) {
          console.log('✅ Local AI models are accessible');
        } else {
          console.log('⚠️  Local AI models configured but not accessible');
        }
      } catch {
        console.log('⚠️  Local AI models configured but not accessible');
      }
    } else if (aiModelType === 'cloud') {
      console.log('☁️  Using cloud AI models');
      if (process.env.AI_MODEL_API_KEY) {
        console.log('✅ Cloud AI API key is configured');
      } else {
        console.log('❌ Cloud AI API key is missing');
      }
    } else {
      console.log('❌ AI model type not configured');
    }
    
    console.log('\n🎉 Local setup test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

testLocalSetup();
```

## Running the Migration

### Step-by-Step Migration Process

1. **Backup Existing Data**
```bash
# Create a backup of your current data
cp -r ./uploads ./uploads-backup
cp ./dev.db ./dev.db-backup
```

2. **Set Up Local Environment**
```bash
npm run setup:local
```

3. **Update Environment Configuration**
```bash
# Edit .env.local and configure your AI model settings
nano .env.local
```

4. **Initialize Database**
```bash
npm run init:db
npm run db:push
```

5. **Check Local AI Models (if using local models)**
```bash
npm run check:local-models
```

6. **Run Migration (if you have existing data)**
```bash
npm run migrate:local
```

7. **Test Local Setup**
```bash
npm run test-local-setup
```

8. **Start Development Server**
```bash
npm run dev
```

9. **Verify Functionality**
- Open http://localhost:3000
- Test document upload
- Test document download
- Verify AI model functionality
- Check that all features work as expected

## Troubleshooting Common Issues

### Issue 1: Database Connection Errors

**Symptoms**: Application fails to start with database connection errors

**Solution**:
```bash
# Check database file permissions
ls -la dev.db

# Reset database if needed
npm run db:reset

# Check environment variables
cat .env.local | grep DATABASE_URL
```

### Issue 2: Document Upload Fails

**Symptoms**: Document upload returns errors or files are not saved

**Solution**:
```bash
# Check documents directory permissions
ls -la documents/

# Check disk space
df -h

# Verify storage path configuration
cat .env.local | grep DOCUMENT_STORAGE_PATH
```

### Issue 3: Local AI Models Not Accessible

**Symptoms**: AI functionality fails with connection errors

**Solution**:
```bash
# Check if Ollama is running
ps aux | grep ollama

# Start Ollama
ollama serve

# Pull required models
ollama pull llama2
ollama pull nomic-embed-text

# Test Ollama connection
curl http://localhost:11434/api/tags
```

### Issue 4: Permission Errors

**Symptoms**: Application fails with permission denied errors

**Solution**:
```bash
# Fix directory permissions
chmod 755 documents
chmod 755 ~/.ai-research-assistant
chmod 755 ~/.ai-research-assistant/documents

# Check file ownership
ls -la documents/
ls -la ~/.ai-research-assistant/
```

### Issue 5: Port Already in Use

**Symptoms**: Application fails to start because port 3000 is already in use

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

## Post-Migration Verification

### Functional Testing Checklist

- [ ] Application starts successfully
- [ ] Database connection works
- [ ] Document upload works
- [ ] Document download works
- [ ] Document processing starts
- [ ] AI model integration works
- [ ] Search functionality works
- [ ] User interface loads correctly
- [ ] Real-time features work
- [ ] Export functionality works

### Performance Testing

1. **Document Upload Test**
```bash
# Test with various file sizes
curl -X POST -F "file=@test.pdf" http://localhost:3000/api/documents
```

2. **Database Query Test**
```bash
# Monitor database performance
npm run db:studio
```

3. **Memory Usage Test**
```bash
# Monitor memory usage
top -p $(pgrep -f "node.*next")
```

### Security Verification

1. **Environment Variables**
```bash
# Ensure no sensitive data is exposed
grep -r "API_KEY\|SECRET" src/
```

2. **File Permissions**
```bash
# Verify secure file permissions
ls -la documents/
ls -la ~/.ai-research-assistant/
```

3. **Network Security**
```bash
# Check for open ports
netstat -an | grep LISTEN
```

## Maintenance and Monitoring

### Regular Maintenance Tasks

1. **Database Maintenance**
```bash
# Weekly database backup
cp dev.db backups/dev-$(date +%Y%m%d).db

# Database optimization
npm run db:push
```

2. **Storage Cleanup**
```bash
# Clean up temporary files
find ~/.ai-research-assistant -name "*.tmp" -type f -delete

# Check storage usage
du -sh ~/.ai-research-assistant/documents/
```

3. **Log Rotation**
```bash
# Rotate application logs
mv dev.log logs/dev-$(date +%Y%m%d).log
touch dev.log
```

### Monitoring Setup

1. **Application Health Check**
```bash
# Create health check endpoint
curl http://localhost:3000/api/health
```

2. **Resource Monitoring**
```bash
# Monitor CPU and memory usage
htop

# Monitor disk usage
df -h
```

3. **Log Monitoring**
```bash
# Monitor application logs
tail -f dev.log

# Monitor system logs
journalctl -f
```

## Conclusion

This migration guide provides a comprehensive approach to moving the AI Research Assistant from a cloud-oriented deployment to a local machine deployment. The migration focuses on:

1. **Document Storage**: Moving from cloud storage to local filesystem
2. **AI Model Access**: Supporting both local and cloud AI models
3. **Database Configuration**: Optimizing SQLite for local development
4. **Environment Setup**: Proper configuration for local development
5. **Testing and Verification**: Ensuring all functionality works correctly

Following this guide will result in a fully functional local deployment of the AI Research Assistant that can operate independently of cloud services while maintaining all core functionality.

---

## Recent Critical Fixes

### Prisma Browser Environment Errors ✅

**Issue**: Prisma client was being used directly in React components, causing browser environment errors.

**Solution Implemented**: 
- Created API routes for all database operations
- Updated services to use API calls instead of direct Prisma access
- Added proper server-side database handling

**Key Files Updated**:
- `src/app/api/documents/route.ts` - Document CRUD operations
- `src/app/api/document-groups/route.ts` - Document group management
- `src/app/api/rag-search/route.ts` - RAG search functionality
- `src/lib/services/document-service.ts` - Updated to use API calls
- `src/lib/services/rag-service.ts` - Updated to use API calls
- `src/lib/services/rag-chat-service.ts` - Updated to use API calls

### SelectItem Empty String Errors ✅

**Issue**: SelectItem components were using empty string values, violating component rules.

**Solution Implemented**:
- Replaced all empty string values with "all" throughout the application
- Updated state management logic to handle "all" values properly
- Added proper filtering logic for document groups and search options

**Components Updated**:
- Documents page filter dropdowns
- RAG search page option selectors
- Any component using SelectItem with empty string values

### Button Functionality Issues ✅

**Issue**: Various buttons throughout the application were missing onClick handlers.

**Solution Implemented**:
- Systematically added missing event handlers
- Implemented proper navigation logic
- Added debugging tools for future troubleshooting

**Pages Updated**:
- Dashboard quick action buttons
- Research mission management buttons
- Optimization session controls
- Document management buttons

These fixes ensure that the application is stable and functional for local development, with proper separation between client-side and server-side operations.