'use server'

import { createClient } from "@libsql/client";

const turso = createClient({
    url: process.env.VECTOR_DATABASE_URL || "file:./vector.db",
});

// 获取某个 index 下的所有文件列表
export async function getFilesInIndex(indexName: string) {
    try {
        const tableName = `${indexName}`;
        
        // 查询所有文件及其 chunk 数量
        const result = await turso.execute({
            sql: `
                SELECT 
                    json_extract(metadata, '$.source') as source,
                    json_extract(metadata, '$.fileSize') as fileSize,
                    json_extract(metadata, '$.createdAt') as createdAt,
                    COUNT(*) as chunkCount
                FROM ${tableName}
                WHERE json_extract(metadata, '$.source') IS NOT NULL
                GROUP BY json_extract(metadata, '$.source')
                ORDER BY json_extract(metadata, '$.createdAt') DESC
            `,
            args: []
        });

        const files = result.rows.map((row: any) => ({
            source: row.source as string,
            fileSize: row.fileSize ? Number(row.fileSize) : 0,
            createdAt: row.createdAt as string,
            chunkCount: Number(row.chunkCount),
        }));

        return { success: true, data: files };
    } catch (error) {
        console.error('Failed to get files:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to get files' 
        };
    }
}

// 获取某个文件的所有 chunks
export async function getFileChunks(indexName: string, fileName: string) {
    try {
        const tableName = `${indexName}`;
        
        const result = await turso.execute({
            sql: `
                SELECT 
                    id,
                    vector_id,
                    metadata
                FROM ${tableName}
                WHERE json_extract(metadata, '$.source') = ?
                ORDER BY json_extract(metadata, '$.chunkIndex') ASC
            `,
            args: [fileName]
        });

        const chunks = result.rows.map((row: any) => {
            const metadata = typeof row.metadata === 'string' 
                ? JSON.parse(row.metadata) 
                : row.metadata;
            
            return {
                id: row.id as string,
                vectorId: row.vector_id as string,
                ...metadata,
            };
        });

        return { success: true, data: chunks };
    } catch (error) {
        console.error('Failed to get file chunks:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to get file chunks' 
        };
    }
}

// 删除某个文件的所有 chunks
export async function deleteFile(indexName: string, fileName: string) {
    try {
        const tableName = `${indexName}`;
        
        await turso.execute({
            sql: `
                DELETE FROM ${tableName}
                WHERE json_extract(metadata, '$.source') = ?
            `,
            args: [fileName]
        });

        return { 
            success: true, 
            message: `Successfully deleted file "${fileName}" and all its chunks` 
        };
    } catch (error) {
        console.error('Failed to delete file:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to delete file' 
        };
    }
}

// 获取 index 的统计信息
export async function getIndexStats(indexName: string) {
    try {
        const tableName = `${indexName}`;
        
        const result = await turso.execute({
            sql: `
                SELECT 
                    COUNT(*) as totalChunks,
                    COUNT(DISTINCT json_extract(metadata, '$.source')) as totalFiles
                FROM ${tableName}
            `,
            args: []
        });

        const stats = result.rows[0];

        return { 
            success: true, 
            data: {
                totalChunks: Number(stats.totalChunks),
                totalFiles: Number(stats.totalFiles),
            }
        };
    } catch (error) {
        console.error('Failed to get index stats:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to get index stats' 
        };
    }
}
