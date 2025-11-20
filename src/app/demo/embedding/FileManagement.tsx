'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getFilesInIndex, getFileChunks, deleteFile, getIndexStats } from './file-action'
import { FileText, Trash2, ChevronDown, ChevronRight, Database } from 'lucide-react'

interface FileInfo {
    source: string
    fileSize: number
    createdAt: string
    chunkCount: number
}

interface ChunkInfo {
    id: string
    vectorId: string
    text: string
    chunkIndex: number
    totalChunks: number
    [key: string]: any
}

interface Index {
    name: string
    dimension?: number
    vectorCount?: number
}

interface FileManagementProps {
    indexes: Index[]
    selectedIndex: string
    setSelectedIndex: (index: string) => void
    showMessage: (type: 'success' | 'error', text: string) => void
}

export default function FileManagement({
    indexes,
    selectedIndex,
    setSelectedIndex,
    showMessage
}: FileManagementProps) {
    const [files, setFiles] = useState<FileInfo[]>([])
    const [expandedFile, setExpandedFile] = useState<string | null>(null)
    const [chunks, setChunks] = useState<Record<string, ChunkInfo[]>>({})
    const [stats, setStats] = useState<{ totalChunks: number; totalFiles: number } | null>(null)
    const [loading, setLoading] = useState(false)

    // 当选择 index 时加载文件列表
    useEffect(() => {
        if (selectedIndex) {
            loadFiles()
            loadStats()
        }
    }, [selectedIndex])

    const loadFiles = async () => {
        if (!selectedIndex) return
        
        setLoading(true)
        const result = await getFilesInIndex(selectedIndex)
        setLoading(false)

        if (result.success && result.data) {
            setFiles(result.data)
        } else {
            showMessage('error', result.error || 'Failed to load files')
        }
    }

    const loadStats = async () => {
        if (!selectedIndex) return
        
        const result = await getIndexStats(selectedIndex)
        if (result.success && result.data) {
            setStats(result.data)
        }
    }

    const loadChunks = async (fileName: string) => {
        if (chunks[fileName]) {
            // 已经加载过，直接展开/收起
            setExpandedFile(expandedFile === fileName ? null : fileName)
            return
        }

        const result = await getFileChunks(selectedIndex, fileName)
        if (result.success && result.data) {
            setChunks(prev => ({ ...prev, [fileName]: result.data }))
            setExpandedFile(fileName)
        } else {
            showMessage('error', result.error || 'Failed to load chunks')
        }
    }

    const handleDeleteFile = async (fileName: string) => {
        if (!confirm(`确定要删除文件 "${fileName}" 及其所有 chunks 吗？`)) {
            return
        }

        const result = await deleteFile(selectedIndex, fileName)
        if (result.success) {
            showMessage('success', result.message || 'File deleted successfully')
            loadFiles()
            loadStats()
            // 清除缓存的 chunks
            setChunks(prev => {
                const newChunks = { ...prev }
                delete newChunks[fileName]
                return newChunks
            })
            if (expandedFile === fileName) {
                setExpandedFile(null)
            }
        } else {
            showMessage('error', result.error || 'Failed to delete file')
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('zh-CN')
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="w-6 h-6" />
                    File Management
                </CardTitle>
                <CardDescription>
                    View and manage files stored in vector indexes
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Index 选择器 */}
                <div className="flex items-center gap-4">
                    <label className="font-medium">Select Index:</label>
                    <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                        <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select an index" />
                        </SelectTrigger>
                        <SelectContent>
                            {indexes.length === 0 ? (
                                <SelectItem value="no-indexes" disabled>
                                    No indexes available
                                </SelectItem>
                            ) : (
                                indexes.map(index => (
                                    <SelectItem key={index.name} value={index.name}>
                                        {index.name}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* 统计信息 */}
                {stats && (
                    <div className="flex gap-6 p-4 bg-muted rounded-lg">
                        <div>
                            <div className="text-sm text-muted-foreground">Total Files</div>
                            <div className="text-2xl font-bold">{stats.totalFiles}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Total Chunks</div>
                            <div className="text-2xl font-bold">{stats.totalChunks}</div>
                        </div>
                    </div>
                )}

                {/* 文件列表 */}
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Loading...
                    </div>
                ) : files.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {selectedIndex ? 'No files in this index' : 'Please select an index'}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {files.map(file => (
                            <Card key={file.source} className="overflow-hidden">
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => loadChunks(file.source)}
                                            >
                                                {expandedFile === file.source ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <FileText className="w-5 h-5 text-blue-500" />
                                            <div className="flex-1">
                                                <div className="font-medium">{file.source}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {formatFileSize(file.fileSize)} · {file.chunkCount} chunks · {formatDate(file.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteFile(file.source)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Chunks 列表 */}
                                    {expandedFile === file.source && chunks[file.source] && (
                                        <div className="mt-4 space-y-2 pl-12">
                                            {(() => {
                                                const allChunks = chunks[file.source]
                                                const totalChunks = allChunks.length
                                                
                                                // 如果总数小于等于4个，全部显示
                                                if (totalChunks <= 4) {
                                                    return allChunks.map((chunk, idx) => (
                                                        <Card key={`${file.source}-${chunk.vectorId || chunk.id}-${idx}`} className="bg-muted/50">
                                                            <CardContent className="p-4">
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <div className="text-sm font-medium">
                                                                        Chunk {chunk.chunkIndex + 1} / {chunk.totalChunks}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        ID: {chunk.id}
                                                                    </div>
                                                                </div>
                                                                <div id={`chunk-text-${file.source}-${idx}`} className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                                                                    {chunk.text}
                                                                </div>
                                                                <Button
                                                                    variant="link"
                                                                    size="sm"
                                                                    className="mt-2 p-0 h-auto"
                                                                    onClick={() => {
                                                                        const element = document.getElementById(`chunk-text-${file.source}-${idx}`)
                                                                        if (element) {
                                                                            element.classList.toggle('line-clamp-3')
                                                                        }
                                                                    }}
                                                                >
                                                                    Expand/Collapse
                                                                </Button>
                                                            </CardContent>
                                                        </Card>
                                                    ))
                                                }
                                                
                                                // 显示前2个
                                                const firstTwo = allChunks.slice(0, 2)
                                                const lastTwo = allChunks.slice(-2)
                                                const hiddenCount = totalChunks - 4
                                                
                                                return (
                                                    <>
                                                        {firstTwo.map((chunk, idx) => (
                                                            <Card key={`${file.source}-${chunk.vectorId || chunk.id}-${idx}`} className="bg-muted/50">
                                                                <CardContent className="p-4">
                                                                    <div className="flex items-start justify-between mb-2">
                                                                        <div className="text-sm font-medium">
                                                                            Chunk {chunk.chunkIndex + 1} / {chunk.totalChunks}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            ID: {chunk.id}
                                                                        </div>
                                                                    </div>
                                                                    <div id={`chunk-text-${file.source}-${idx}`} className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                                                                        {chunk.text}
                                                                    </div>
                                                                    <Button
                                                                        variant="link"
                                                                        size="sm"
                                                                        className="mt-2 p-0 h-auto"
                                                                        onClick={() => {
                                                                            const element = document.getElementById(`chunk-text-${file.source}-${idx}`)
                                                                            if (element) {
                                                                                element.classList.toggle('line-clamp-3')
                                                                            }
                                                                        }}
                                                                    >
                                                                        Expand/Collapse
                                                                    </Button>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                        
                                                        {/* 省略号提示 */}
                                                        <div className="flex items-center justify-center py-4 text-muted-foreground">
                                                            <div className="text-sm">
                                                                ··· {hiddenCount} more chunks hidden ···
                                                            </div>
                                                        </div>
                                                        
                                                        {/* 显示后2个 */}
                                                        {lastTwo.map((chunk, idx) => {
                                                            const actualIdx = totalChunks - 2 + idx
                                                            return (
                                                                <Card key={`${file.source}-${chunk.vectorId || chunk.id}-${actualIdx}`} className="bg-muted/50">
                                                                    <CardContent className="p-4">
                                                                        <div className="flex items-start justify-between mb-2">
                                                                            <div className="text-sm font-medium">
                                                                                Chunk {chunk.chunkIndex + 1} / {chunk.totalChunks}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground">
                                                                                ID: {chunk.id}
                                                                            </div>
                                                                        </div>
                                                                        <div id={`chunk-text-${file.source}-${actualIdx}`} className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                                                                            {chunk.text}
                                                                        </div>
                                                                        <Button
                                                                            variant="link"
                                                                            size="sm"
                                                                            className="mt-2 p-0 h-auto"
                                                                            onClick={() => {
                                                                                const element = document.getElementById(`chunk-text-${file.source}-${actualIdx}`)
                                                                                if (element) {
                                                                                    element.classList.toggle('line-clamp-3')
                                                                                }
                                                                            }}
                                                                        >
                                                                            Expand/Collapse
                                                                        </Button>
                                                                    </CardContent>
                                                                </Card>
                                                            )
                                                        })}
                                                    </>
                                                )
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
