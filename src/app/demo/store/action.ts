'use server'

import { LibSQLVector } from "@mastra/libsql";
import { MDocument } from "@mastra/rag";
import mammoth from 'mammoth';
import { embedMany } from 'ai';
import { getEmbeddingLLMModel } from "../model/action";

const vectorStore = new LibSQLVector({
    connectionUrl: process.env.VECTOR_DATABASE_URL || "file:./vector.db",
})

// Get dimension from environment variable
const EMBEDDING_DIMENSION = Number(process.env.EMBEDDING_DIMENSION) || 1536;

// Sample embeddings for demo purposes
const sampleEmbeddings = [
    Array.from({ length: EMBEDDING_DIMENSION }, () => Math.random()),
    Array.from({ length: EMBEDDING_DIMENSION }, () => Math.random()),
    Array.from({ length: EMBEDDING_DIMENSION }, () => Math.random()),
];

const sampleTexts = [
    "Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn from data.",
    "Vector databases are specialized databases designed to store and query high-dimensional vectors efficiently.",
    "Embeddings are dense vector representations of data that capture semantic meaning in a continuous space."
];

// Chunk document using Mastra's MDocument with recursive strategy
async function chunkDocument(text: string) {
    const doc = MDocument.fromText(text);
    
    const chunks = await doc.chunk({
        strategy: "recursive",
        maxSize: 512,
        overlap: 50,
        separators: ["\n\n", "\n", ". ", " "],
    });
    
    return chunks;
}

// Batch size for embedding generation (adjust based on API limits)
const BATCH_SIZE = 100;

// Generate embeddings for a single text
async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const embeddingModel = await getEmbeddingLLMModel();
        
        const { embeddings } = await embedMany({
            model: embeddingModel,
            values: [text],
        });

        return embeddings[0];
    } catch (error) {
        console.error('Failed to generate embedding, falling back to deterministic placeholder:', error);

        let seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        return Array.from({ length: EMBEDDING_DIMENSION }, () => (random() - 0.5) * 2);
    }
}

// Batch embedding generation - splits large requests into smaller batches
export async function generateBatchEmbeddings(texts: string[], batchSize: number = BATCH_SIZE): Promise<number[][]> {
    const results: number[][] = [];
    
    // Process in batches to avoid server rejection
    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        try {
            const embeddingModel = await getEmbeddingLLMModel();
            
            const { embeddings } = await embedMany({
                model: embeddingModel,
                values: batch,
            });
            
            results.push(...embeddings);
            console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);
        } catch (error) {
            console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
            throw new Error(`Failed to generate embeddings for batch ${Math.floor(i / batchSize) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    return results;
}

export async function listIndexes() {
    try {
        const indexes = await vectorStore.listIndexes();
        console.log("indexes", indexes);

        return { success: true, data: indexes };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to list indexes' };
    }
}

export async function createIndex(indexName: string, dimension: number = EMBEDDING_DIMENSION) {
    try {
        await vectorStore.createIndex({
            indexName,
            dimension,
        });
        return { success: true, message: `Index '${indexName}' created successfully` };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create index' };
    }
}

export async function upsertEmbeddings(indexName: string) {
    try {
        await vectorStore.upsert({
            indexName,
            vectors: sampleEmbeddings,
            metadata: sampleTexts.map((text, index) => ({
                id: `doc_${index + 1}`,
                text,
                category: index === 0 ? 'AI/ML' : index === 1 ? 'Database' : 'Data Science',
                createdAt: new Date().toISOString(),
                version: '1.0',
                author: 'Demo System',
                confidenceScore: Math.random() * 0.3 + 0.7, // Random score between 0.7-1.0
            })),
        });
        return { success: true, message: `${sampleEmbeddings.length} embeddings upserted successfully` };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to upsert embeddings' };
    }
}

export async function queryEmbeddings(indexName: string, queryText: string = "artificial intelligence", topK: number = 5, minScore: number = 0.0, categoryFilter?: string, authorFilter?: string) {
    try {
        // Generate embedding for the query text using the same function as document processing
        const queryVector = await generateEmbedding(queryText);

        // Build metadata filter
        const filter: Record<string, any> = {};

        // Add category filter if specified and not "all-categories"
        if (categoryFilter && categoryFilter !== 'all-categories') {
            filter.category = categoryFilter;
        }

        // Add author filter if specified and not "all-authors"
        if (authorFilter && authorFilter !== 'all-authors') {
            filter.author = authorFilter;
        }

        const results = await vectorStore.query({
            indexName,
            queryVector,
            topK,
            // Add filter if we have any conditions
            ...(Object.keys(filter).length > 0 && { filter }),
        });

        // Apply minimum score filtering on the client side
        const filteredResults = results.filter(result =>
            !result.score || result.score >= minScore
        );

        return { success: true, data: filteredResults };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to query embeddings' };
    }
}

export async function deleteIndex(indexName: string) {
    try {
        await vectorStore.deleteIndex({ indexName });
        return { success: true, message: `Index '${indexName}' deleted successfully` };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete index' };
    }
}

export async function processWordDocument(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        const indexName = formData.get('indexName') as string;

        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        if (!indexName) {
            return { success: false, error: 'No index name provided' };
        }

        // Convert file to buffer for mammoth
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract text from Word document
        const result = await mammoth.extractRawText({ buffer });
        const extractedText = result.value;

        if (!extractedText.trim()) {
            return { success: false, error: 'No text found in the document' };
        }

        // Chunk the text using Mastra's MDocument
        const chunks = await chunkDocument(extractedText);

        if (chunks.length === 0) {
            return { success: false, error: 'Failed to create text chunks' };
        }

        // Extract text from chunks
        const chunkTexts = chunks.map((chunk: any) => chunk.text);

        // Generate embeddings for each chunk using batch processing
        const embeddings = await generateBatchEmbeddings(chunkTexts);

        // Upsert embeddings (index should already exist)
        await vectorStore.upsert({
            indexName,
            vectors: embeddings,
            metadata: chunks.map((chunk: any, index: number) => ({
                id: `${file.name}_chunk_${index + 1}`,
                text: chunk.text,
                source: file.name,
                chunkIndex: index,
                totalChunks: chunks.length,
                createdAt: new Date().toISOString(),
                fileSize: file.size,
                category: 'User Document',
                author: 'User Upload',
                confidenceScore: 1.0,
                // Include chunk metadata if available
                ...(chunk.metadata && { chunkMetadata: chunk.metadata }),
            })),
        });

        return {
            success: true,
            message: `Successfully processed ${chunks.length} chunks from "${file.name}" and stored embeddings`,
            extractedText: extractedText.substring(0, 2000) + (extractedText.length > 2000 ? '...' : ''), // Truncate for preview
            chunksCreated: chunks.length,
        };

    } catch (error) {
        console.error('Word document processing error:', error);
        return {
            success: false,
            message: 'Failed to process Word document',
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

export async function getDefaultDimension() {
    return EMBEDDING_DIMENSION;
}

export async function processTestWordDocument(fileName: 'test_word.docx' | 'test_word_1.docx', indexName: string) {
    try {
        if (!indexName) {
            return { success: false, error: 'No index name provided' };
        }

        // Read file from public directory
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const filePath = path.join(process.cwd(), 'public', fileName);
        
        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return { success: false, error: `Test file ${fileName} not found in public directory` };
        }

        // Read file buffer
        const buffer = await fs.readFile(filePath);
        const fileStats = await fs.stat(filePath);

        // Extract text from Word document
        const result = await mammoth.extractRawText({ buffer });
        const extractedText = result.value;

        if (!extractedText.trim()) {
            return { success: false, error: 'No text found in the document' };
        }

        // Chunk the text using Mastra's MDocument
        const chunks = await chunkDocument(extractedText);

        if (chunks.length === 0) {
            return { success: false, error: 'Failed to create text chunks' };
        }

        // Extract text from chunks
        const chunkTexts = chunks.map((chunk: any) => chunk.text);

        // Generate embeddings for each chunk using batch processing
        const embeddings = await generateBatchEmbeddings(chunkTexts);

        // Upsert embeddings (index should already exist)
        await vectorStore.upsert({
            indexName,
            vectors: embeddings,
            metadata: chunks.map((chunk: any, index: number) => ({
                id: `${fileName}_chunk_${index + 1}`,
                text: chunk.text,
                source: fileName,
                chunkIndex: index,
                totalChunks: chunks.length,
                createdAt: new Date().toISOString(),
                fileSize: fileStats.size,
                category: 'User Document',
                author: 'Test Document',
                confidenceScore: 1.0,
                // Include chunk metadata if available
                ...(chunk.metadata && { chunkMetadata: chunk.metadata }),
            })),
        });

        return {
            success: true,
            message: `Successfully processed ${chunks.length} chunks from "${fileName}" and stored embeddings`,
            extractedText: extractedText.substring(0, 2000) + (extractedText.length > 2000 ? '...' : ''), // Truncate for preview
            chunksCreated: chunks.length,
        };

    } catch (error) {
        console.error('Test Word document processing error:', error);
        return {
            success: false,
            message: 'Failed to process test Word document',
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}