'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, Filter, RotateCcw } from 'lucide-react'
import { queryEmbeddings } from '../store/action'
import { useTranslation } from '@/components/providers/I18nProvider'

interface Index {
    name: string
    dimension?: number
    vectorCount?: number
}

interface QueryResult {
    id?: string
    score?: number
    metadata?: Record<string, any>
}

interface VectorSearchProps {
    indexes: Index[]
    selectedIndex: string
    setSelectedIndex: (index: string) => void
    showMessage: (type: 'success' | 'error', text: string) => void
}

export default function VectorSearch({
    indexes,
    selectedIndex,
    setSelectedIndex,
    showMessage
}: VectorSearchProps) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [queryText, setQueryText] = useState('artificial intelligence')
    const [queryResults, setQueryResults] = useState<QueryResult[]>([])
    const [topK, setTopK] = useState('5')
    const [minScore, setMinScore] = useState('0.0')
    const [categoryFilter, setCategoryFilter] = useState('all-categories')
    const [authorFilter, setAuthorFilter] = useState('all-authors')
    const [useReranking, setUseReranking] = useState(false)

    const handleQueryEmbeddings = async () => {
        if (!selectedIndex) {
            showMessage('error', t('embedding.messages.selectIndex'))
            return
        }
        
        setLoading(true)
        try {
            const result = await queryEmbeddings(
                selectedIndex, 
                queryText, 
                parseInt(topK), 
                parseFloat(minScore),
                categoryFilter === 'all-categories' ? undefined : categoryFilter,
                authorFilter === 'all-authors' ? undefined : authorFilter
            )
            if (result.success) {
                setQueryResults(result.data || [])
                const filterInfo = []
                if (categoryFilter !== 'all-categories') filterInfo.push(`${t('embedding.vectorSearch.category')}: ${categoryFilter}`)
                if (authorFilter !== 'all-authors') filterInfo.push(`${t('embedding.vectorSearch.author')}: ${authorFilter}`)
                if (parseFloat(minScore) > 0) filterInfo.push(`${t('embedding.vectorSearch.minScore')}: ${minScore}`)
                
                const filterText = filterInfo.length > 0 ? ` (${t('embedding.vectorSearch.filteredBy')} ${filterInfo.join(', ')})` : ''
                showMessage('success', t('embedding.messages.foundVectors', { count: result.data?.length || 0 }) + filterText)
            } else {
                showMessage('error', result.error || t('embedding.messages.queryEmbeddingsFailed'))
            }
        } catch (error) {
            showMessage('error', t('embedding.messages.queryEmbeddingsFailed'))
        }
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Search Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            {t('embedding.vectorSearch.semanticSearch')}
                        </CardTitle>
                        <CardDescription>
                            {t('embedding.vectorSearch.semanticSearchDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">{t('embedding.embeddings.selectedIndex')}</label>
                            <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('embedding.embeddings.selectIndex')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {indexes.length === 0 ? (
                                        <SelectItem value="no-indexes" disabled>
                                            {t('embedding.embeddings.noIndexesAvailable')}
                                        </SelectItem>
                                    ) : (
                                        indexes.map((index) => (
                                            <SelectItem key={index.name} value={index.name}>
                                                {index.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium">{t('embedding.vectorSearch.queryText')}</label>
                            <Input
                                placeholder={t('embedding.vectorSearch.queryPlaceholder')}
                                value={queryText}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQueryText(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {t('embedding.vectorSearch.queryHint')}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">{t('embedding.vectorSearch.topKResults')}</label>
                                <Select value={topK} onValueChange={setTopK}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="3">3</SelectItem>
                                        <SelectItem value="5">5</SelectItem>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">{t('embedding.vectorSearch.minScore')}</label>
                                <Select value={minScore} onValueChange={setMinScore}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0.0">{t('embedding.vectorSearch.minScoreAll')}</SelectItem>
                                        <SelectItem value="0.3">{t('embedding.vectorSearch.minScoreLow')}</SelectItem>
                                        <SelectItem value="0.5">{t('embedding.vectorSearch.minScoreMedium')}</SelectItem>
                                        <SelectItem value="0.7">{t('embedding.vectorSearch.minScoreHigh')}</SelectItem>
                                        <SelectItem value="0.9">{t('embedding.vectorSearch.minScoreVeryHigh')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <Button 
                            onClick={handleQueryEmbeddings} 
                            disabled={loading || !selectedIndex}
                            className="w-full"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                            {t('embedding.vectorSearch.searchSimilarVectors')}
                        </Button>
                    </CardContent>
                </Card>

                {/* Advanced Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            {t('embedding.vectorSearch.advancedFilters')}
                        </CardTitle>
                        <CardDescription>
                            {t('embedding.vectorSearch.advancedFiltersDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">{t('embedding.vectorSearch.categoryFilter')}</label>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('embedding.vectorSearch.allCategories')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all-categories">{t('embedding.vectorSearch.allCategories')}</SelectItem>
                                    <SelectItem value="AI/ML">AI/ML</SelectItem>
                                    <SelectItem value="Database">Database</SelectItem>
                                    <SelectItem value="Data Science">Data Science</SelectItem>
                                    <SelectItem value="User Document">User Document</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                {t('embedding.vectorSearch.filterByCategory')}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium">{t('embedding.vectorSearch.authorFilter')}</label>
                            <Select value={authorFilter} onValueChange={setAuthorFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('embedding.vectorSearch.allAuthors')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all-authors">{t('embedding.vectorSearch.allAuthors')}</SelectItem>
                                    <SelectItem value="Demo System">Demo System</SelectItem>
                                    <SelectItem value="User Upload">User Upload</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                {t('embedding.vectorSearch.filterByAuthor')}
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="reranking"
                                checked={useReranking}
                                onChange={(e) => setUseReranking(e.target.checked)}
                                className="rounded border-gray-300"
                            />
                            <label htmlFor="reranking" className="text-sm font-medium">
                                {t('embedding.vectorSearch.enableReranking')}
                            </label>
                        </div>
                        <p className="text-xs text-gray-500">
                            {t('embedding.vectorSearch.rerankingHint')}
                        </p>

                        <Button 
                            onClick={() => {
                                setCategoryFilter('all-categories')
                                setAuthorFilter('all-authors')
                                setUseReranking(false)
                                setTopK('5')
                                setMinScore('0.0')
                            }}
                            variant="outline"
                            className="w-full"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            {t('embedding.vectorSearch.resetFilters')}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Search Results */}
            {queryResults.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>{t('embedding.vectorSearch.searchResults')}</span>
                            <Badge variant="secondary">{queryResults.length}{t('embedding.vectorSearch.results')}</Badge>
                        </CardTitle>
                        <CardDescription>
                            {t('embedding.vectorSearch.semanticSearchDesc')} {useReranking && t('embedding.vectorSearch.reranked')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {queryResults.map((result, index) => (
                                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex gap-2 flex-wrap">
                                            <Badge variant="outline">{result.metadata?.category}</Badge>
                                            <Badge variant="secondary">
                                                {t('embedding.vectorSearch.score')}: {result.score?.toFixed(4) || 'N/A'}
                                            </Badge>
                                            {result.metadata?.source && (
                                                <Badge variant="outline" className="text-xs">
                                                    {result.metadata.source}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            #{index + 1}
                                        </div>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <p className="text-sm leading-relaxed">{result.metadata?.text}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                                        <div>
                                            <span className="font-medium">{t('embedding.vectorSearch.author')}:</span> {result.metadata?.author || 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-medium">{t('embedding.vectorSearch.created')}:</span> {result.metadata?.createdAt ? new Date(result.metadata.createdAt).toLocaleDateString() : 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-medium">{t('embedding.vectorSearch.confidence')}:</span> {result.score ? `${(result.score * 100).toFixed(2)}%` : 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-medium">ID:</span> {result.metadata?.id || 'N/A'}
                                        </div>
                                    </div>
                                    
                                    {result.metadata?.chunkIndex !== undefined && (
                                        <div className="mt-2 text-xs text-gray-500">
                                            <span className="font-medium">{t('embedding.vectorSearch.chunk')}:</span> {result.metadata.chunkIndex + 1} of {result.metadata.totalChunks}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
