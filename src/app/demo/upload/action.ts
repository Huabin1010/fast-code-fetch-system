'use server'

import { LibSQLVector } from "@mastra/libsql";
import mammoth from 'mammoth';

// Get dimension from environment variable
const EMBEDDING_DIMENSION = Number(process.env.EMBEDDING_DIMENSION) || 1536;

// Vector store configurations
const getVectorStore = (storeType: string) => {
    switch (storeType) {
        case 'libsql':
        default:
            return new LibSQLVector({
                connectionUrl: process.env.VECTOR_DATABASE_URL || "file:./vector.db",
            });
        // Add other vector stores when their packages are installed
        // case 'mongodb':
        //     return new MongoDBVector({
        //         uri: process.env.MONGODB_URI!,
        //         dbName: process.env.MONGODB_DATABASE!,
        //     });
        // case 'pg':
        //     return new PgVector({
        //         connectionString: process.env.POSTGRES_CONNECTION_STRING!,
        //     });
        // Add more cases as needed
    }
};

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
    // For demo purposes, we'll generate random embeddings
    let seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };
    
    return Array.from({ length: EMBEDDING_DIMENSION }, () => (random() - 0.5) * 2);
}

export async function uploadWordFile(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        const vectorStoreType = formData.get('vectorStore') as string;
        const indexName = formData.get('indexName') as string;

        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        if (!vectorStoreType) {
            return { success: false, error: 'No vector store selected' };
        }

        if (!indexName) {
            return { success: false, error: 'No index name provided' };
        }

        // Convert file to buffer
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

        // Get vector store instance
        const vectorStore = getVectorStore(vectorStoreType);

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
                vectorStore: vectorStoreType,
            })),
        });

        return {
            success: true,
            message: `Successfully processed ${chunks.length} chunks from "${file.name}" and stored in ${vectorStoreType} index "${indexName}"`,
            extractedText: extractedText.substring(0, 2000) + (extractedText.length > 2000 ? '...' : ''), // Truncate for preview
            chunksCreated: chunks.length,
        };

    } catch (error) {
        console.error('Upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

export async function getAvailableVectorStores() {
    // Return available vector stores based on environment configuration
    const stores = [
        { id: 'libsql', name: 'LibSQL', available: true }
    ];

    // Check for other vector store configurations
    if (process.env.MONGODB_URI) {
        stores.push({ id: 'mongodb', name: 'MongoDB', available: true });
    }
    
    if (process.env.POSTGRES_CONNECTION_STRING) {
        stores.push({ id: 'pg', name: 'PostgreSQL', available: true });
    }

    if (process.env.PINECONE_API_KEY) {
        stores.push({ id: 'pinecone', name: 'Pinecone', available: true });
    }

    // Add more checks as needed

    return { success: true, data: stores };
}
