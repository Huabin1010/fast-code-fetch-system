'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getFilesInIndex, getFileChunks, deleteFile, getIndexStats } from './file-action'
import { FileText, Trash2, ChevronDown, ChevronRight, Database, RefreshCw, Loader2, Calendar, FileType, Hash, Copy, Maximize2, Minimize2 } from 'lucide-react'
import { useTranslation } from '@/components/providers/I18nProvider'
import { Badge } from '@/components/ui/badge'

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
    const { t } = useTranslation()
    const [files, setFiles] = useState<FileInfo[]>([])
    const [expandedFile, setExpandedFile] = useState<string | null>(null)
    const [chunks, setChunks] = useState<Record<string, ChunkInfo[]>>({})
    const [stats, setStats] = useState<{ totalChunks: number; totalFiles: number } | null>(null)
    const [loading, setLoading] = useState(false)
    const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set())

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
            showMessage('error', result.error || t('embedding.messages.loadFilesFailed'))
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
            showMessage('error', result.error || t('embedding.messages.loadFilesFailed'))
        }
    }

    const handleDeleteFile = async (fileName: string) => {
        const confirmMessage = t('embedding.messages.deleteFileConfirm').replace('{fileName}', fileName)
        if (!confirm(confirmMessage)) {
            return
        }

        const result = await deleteFile(selectedIndex, fileName)
        if (result.success) {
            showMessage('success', result.message || t('embedding.messages.fileDeleted'))
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
            showMessage('error', result.error || t('embedding.messages.deleteFileFailed'))
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString()
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            showMessage('success', t('embedding.fileManagement.copied'))
        } catch (error) {
            showMessage('error', t('embedding.fileManagement.copyFailed'))
        }
    }

    const toggleChunkExpand = (chunkId: string) => {
        setExpandedChunks(prev => {
            const newSet = new Set(prev)
            if (newSet.has(chunkId)) {
                newSet.delete(chunkId)
            } else {
                newSet.add(chunkId)
            }
            return newSet
        })
    }

    const ChunkPreview = ({ chunk, fileSource, chunkIdx, totalChunks }: { chunk: ChunkInfo, fileSource: string, chunkIdx: number, totalChunks: number }) => {
        const chunkId = `${fileSource}-${chunk.id}`
        const isExpanded = expandedChunks.has(chunkId)
        const textElementId = `chunk-text-${chunkId}`
        const needsExpandButton = chunk.text && chunk.text.length > 250
        
        return (
            <div className="group relative border rounded-xl bg-white hover:shadow-lg transition-all duration-200 overflow-hidden border-l-4 border-l-indigo-500 shadow-sm">
                {/* 顶部栏 */}
                <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border-b px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-sm shadow-sm">
                            {chunk.chunkIndex + 1}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-700">
                                {t('embedding.vectorSearch.chunk')} {chunk.chunkIndex + 1} / {chunk.totalChunks}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(chunk.text)}
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/80"
                            title={t('embedding.fileManagement.copyText')}
                        >
                            <Copy className="h-3.5 w-3.5 text-gray-600" />
                        </Button>
                        <span className="text-xs text-gray-500 font-mono truncate max-w-[200px] bg-white/60 px-2 py-1 rounded border border-gray-200">
                            {chunk.id.length > 12 ? `${chunk.id.slice(0, 12)}...` : chunk.id}
                        </span>
                    </div>
                </div>

                {/* 文本内容 */}
                <div className="p-5 bg-gradient-to-br from-gray-50/50 to-white">
                    <div 
                        id={textElementId}
                        className={`text-sm text-gray-800 leading-relaxed whitespace-pre-wrap transition-all duration-300 font-[450] ${
                            isExpanded ? '' : 'line-clamp-5'
                        }`}
                    >
                        {chunk.text}
                    </div>
                    
                    {/* 展开/收起按钮 */}
                    {needsExpandButton && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleChunkExpand(chunkId)}
                            className="mt-4 h-9 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200/50"
                        >
                            {isExpanded ? (
                                <>
                                    <Minimize2 className="h-4 w-4 mr-1.5" />
                                    {t('embedding.fileManagement.collapse')}
                                </>
                            ) : (
                                <>
                                    <Maximize2 className="h-4 w-4 mr-1.5" />
                                    {t('embedding.fileManagement.expand')}
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="w-6 h-6" />
                    {t('embedding.fileManagement.title')}
                </CardTitle>
                <CardDescription>
                    {t('embedding.fileManagement.description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Index 选择器和刷新按钮 */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <label className="font-medium text-sm whitespace-nowrap">{t('embedding.fileManagement.selectIndex')}</label>
                        <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder={t('embedding.embeddings.selectIndex')} />
                            </SelectTrigger>
                            <SelectContent>
                                {indexes.length === 0 ? (
                                    <SelectItem value="no-indexes" disabled>
                                        {t('embedding.embeddings.noIndexesAvailable')}
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
                    {selectedIndex && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadFiles}
                            disabled={loading}
                            className="gap-2"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            {t('embedding.embeddings.refresh')}
                        </Button>
                    )}
                </div>

                {/* 统计信息卡片 */}
                {stats && (
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-700 mb-1">{t('embedding.fileManagement.totalFiles')}</p>
                                        <p className="text-3xl font-bold text-blue-900">{stats.totalFiles}</p>
                                    </div>
                                    <FileType className="h-8 w-8 text-blue-500 opacity-60" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-purple-700 mb-1">{t('embedding.fileManagement.totalChunks')}</p>
                                        <p className="text-3xl font-bold text-purple-900">{stats.totalChunks}</p>
                                    </div>
                                    <Hash className="h-8 w-8 text-purple-500 opacity-60" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* 文件列表 */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-500" />
                        <p>{t('embedding.fileManagement.loading')}</p>
                    </div>
                ) : files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                        <p className="text-muted-foreground font-medium">
                            {selectedIndex ? t('embedding.fileManagement.noFiles') : t('embedding.fileManagement.pleaseSelectIndex')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {files.map(file => (
                            <Card key={file.source} className="overflow-hidden border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => loadChunks(file.source)}
                                                className="mt-0.5 shrink-0"
                                            >
                                                {expandedFile === file.source ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <div className="p-2 rounded-lg bg-blue-50 shrink-0">
                                                <FileText className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-base truncate">{file.source}</h3>
                                                    <Badge variant="secondary" className="shrink-0">
                                                        {file.chunkCount} {t('embedding.fileManagement.chunks')}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <FileType className="w-3 h-3" />
                                                        <span>{formatFileSize(file.fileSize)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{formatDate(file.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteFile(file.source)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Chunks 列表 */}
                                    {expandedFile === file.source && chunks[file.source] && (
                                        <div className="mt-5 pt-5 border-t">
                                            <div className="mb-4">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-1">
                                                    {t('embedding.fileManagement.chunksCount')} ({chunks[file.source].length})
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    {t('embedding.fileManagement.chunksHint')}
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                {(() => {
                                                    const allChunks = chunks[file.source]
                                                    const totalChunks = allChunks.length
                                                    
                                                    // 如果总数小于等于6个，全部显示
                                                    if (totalChunks <= 6) {
                                                        return allChunks.map((chunk, idx) => (
                                                            <ChunkPreview
                                                                key={`${file.source}-${chunk.vectorId || chunk.id}-${idx}`}
                                                                chunk={chunk}
                                                                fileSource={file.source}
                                                                chunkIdx={idx}
                                                                totalChunks={totalChunks}
                                                            />
                                                        ))
                                                    }
                                                    
                                                    // 显示前3个和后3个
                                                    const firstThree = allChunks.slice(0, 3)
                                                    const lastThree = allChunks.slice(-3)
                                                    const hiddenCount = totalChunks - 6
                                                    
                                                    return (
                                                        <>
                                                            {firstThree.map((chunk, idx) => (
                                                                <ChunkPreview
                                                                    key={`${file.source}-${chunk.vectorId || chunk.id}-${idx}`}
                                                                    chunk={chunk}
                                                                    fileSource={file.source}
                                                                    chunkIdx={idx}
                                                                    totalChunks={totalChunks}
                                                                />
                                                            ))}
                                                            
                                                            {/* 省略号提示 */}
                                                            <div className="flex items-center justify-center py-5">
                                                                <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg border-2 border-dashed border-gray-300">
                                                                    <div className="w-8 h-px bg-gray-300"></div>
                                                                    <span className="text-xs text-gray-600 font-semibold">
                                                                        {hiddenCount} {t('embedding.fileManagement.moreChunksHidden')}
                                                                    </span>
                                                                    <div className="w-8 h-px bg-gray-300"></div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* 显示后3个 */}
                                                            {lastThree.map((chunk, idx) => {
                                                                const actualIdx = totalChunks - 3 + idx
                                                                return (
                                                                    <ChunkPreview
                                                                        key={`${file.source}-${chunk.vectorId || chunk.id}-${actualIdx}`}
                                                                        chunk={chunk}
                                                                        fileSource={file.source}
                                                                        chunkIdx={actualIdx}
                                                                        totalChunks={totalChunks}
                                                                    />
                                                                )
                                                            })}
                                                        </>
                                                    )
                                                })()}
                                            </div>
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
