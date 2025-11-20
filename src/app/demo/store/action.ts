'use server'

import { LibSQLVector } from "@mastra/libsql";
import mammoth from 'mammoth';

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

// Simple text chunking function
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.slice(start, end);
        
        // Try to break at sentence boundaries
        if (end < text.length) {
            const lastPeriod = chunk.lastIndexOf('.');
            const lastNewline = chunk.lastIndexOf('\n');
            const breakPoint = Math.max(lastPeriod, lastNewline);
            
            if (breakPoint > start + chunkSize * 0.5) {
                chunks.push(text.slice(start, breakPoint + 1).trim());
                start = breakPoint + 1 - overlap;
            } else {
                chunks.push(chunk.trim());
                start = end - overlap;
            }
        } else {
            chunks.push(chunk.trim());
            break;
        }
        
        // Ensure we don't go backwards
        if (start <= (chunks.length > 1 ? chunks[chunks.length - 2].length : 0)) {
            start = end;
        }
    }
    
    return chunks.filter(chunk => chunk.length > 0);
}

// Simple embedding generation (placeholder - in real implementation, use OpenAI or similar)
function generateEmbedding(text: string): number[] {
    // This is a placeholder - in a real implementation, you would use OpenAI's embedding API
    // For demo purposes, we'll generate deterministic embeddings based on text content
    let seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };
    
    return Array.from({ length: EMBEDDING_DIMENSION }, () => (random() - 0.5) * 2);
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
        const queryVector = generateEmbedding(queryText);
        
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

        // Chunk the text
        const chunks = chunkText(extractedText);
        
        if (chunks.length === 0) {
            return { success: false, error: 'Failed to create text chunks' };
        }

        // Generate embeddings for each chunk
        const embeddings = chunks.map(chunk => generateEmbedding(chunk));

        // Create index if it doesn't exist
        try {
            await vectorStore.createIndex({
                indexName,
                dimension: EMBEDDING_DIMENSION,
            });
        } catch (error) {
            // Index might already exist, continue
            console.log('Index creation note:', error);
        }

        // Upsert embeddings
        await vectorStore.upsert({
            indexName,
            vectors: embeddings,
            metadata: chunks.map((chunk, index) => ({
                id: `${file.name}_chunk_${index + 1}`,
                text: chunk,
                source: file.name,
                chunkIndex: index,
                totalChunks: chunks.length,
                createdAt: new Date().toISOString(),
                fileSize: file.size,
                category: 'User Document',
                author: 'User Upload',
                confidenceScore: 1.0, // Full confidence for user documents
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
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

export async function getDefaultDimension() {
    return EMBEDDING_DIMENSION;
}