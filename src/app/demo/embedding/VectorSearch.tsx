'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, Filter, RotateCcw } from 'lucide-react'
import { queryEmbeddings } from '../store/action'

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
            showMessage('error', 'Please select an index')
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
                if (categoryFilter !== 'all-categories') filterInfo.push(`category: ${categoryFilter}`)
                if (authorFilter !== 'all-authors') filterInfo.push(`author: ${authorFilter}`)
                if (parseFloat(minScore) > 0) filterInfo.push(`min score: ${minScore}`)
                
                const filterText = filterInfo.length > 0 ? ` (filtered by ${filterInfo.join(', ')})` : ''
                showMessage('success', `Found ${result.data?.length || 0} similar vectors${filterText}`)
            } else {
                showMessage('error', result.error || 'Failed to query embeddings')
            }
        } catch (error) {
            showMessage('error', 'Failed to query embeddings')
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
                            Semantic Search
                        </CardTitle>
                        <CardDescription>
                            Search for similar vectors using semantic similarity
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Selected Index</label>
                            <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an index" />
                                </SelectTrigger>
                                <SelectContent>
                                    {indexes.length === 0 ? (
                                        <SelectItem value="no-indexes" disabled>
                                            No indexes available
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
                            <label className="text-sm font-medium">Query Text</label>
                            <Input
                                placeholder="Enter your search query..."
                                value={queryText}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQueryText(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                This will be converted to a vector for similarity search
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Top K Results</label>
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
                                <label className="text-sm font-medium">Min Score</label>
                                <Select value={minScore} onValueChange={setMinScore}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0.0">0.0 (All)</SelectItem>
                                        <SelectItem value="0.3">0.3 (Low)</SelectItem>
                                        <SelectItem value="0.5">0.5 (Medium)</SelectItem>
                                        <SelectItem value="0.7">0.7 (High)</SelectItem>
                                        <SelectItem value="0.9">0.9 (Very High)</SelectItem>
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
                            Search Similar Vectors
                        </Button>
                    </CardContent>
                </Card>

                {/* Advanced Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Advanced Filters
                        </CardTitle>
                        <CardDescription>
                            Filter results by metadata and apply re-ranking
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Category Filter</label>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all-categories">All categories</SelectItem>
                                    <SelectItem value="AI/ML">AI/ML</SelectItem>
                                    <SelectItem value="Database">Database</SelectItem>
                                    <SelectItem value="Data Science">Data Science</SelectItem>
                                    <SelectItem value="User Document">User Document</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                Filter by document category
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Author Filter</label>
                            <Select value={authorFilter} onValueChange={setAuthorFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All authors" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all-authors">All authors</SelectItem>
                                    <SelectItem value="Demo System">Demo System</SelectItem>
                                    <SelectItem value="User Upload">User Upload</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                Filter by document author
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
                                Enable Re-ranking
                            </label>
                        </div>
                        <p className="text-xs text-gray-500">
                            Apply advanced re-ranking for better relevance (slower but more accurate)
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
                            Reset Filters
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Search Results */}
            {queryResults.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Search Results</span>
                            <Badge variant="secondary">{queryResults.length} results</Badge>
                        </CardTitle>
                        <CardDescription>
                            Semantic similarity search results {useReranking && '(re-ranked)'}
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
                                                Score: {result.score?.toFixed(4) || 'N/A'}
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
                                            <span className="font-medium">Author:</span> {result.metadata?.author || 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-medium">Created:</span> {result.metadata?.createdAt ? new Date(result.metadata.createdAt).toLocaleDateString() : 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-medium">Confidence:</span> {result.metadata?.confidenceScore?.toFixed(2) || 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-medium">ID:</span> {result.metadata?.id || 'N/A'}
                                        </div>
                                    </div>
                                    
                                    {result.metadata?.chunkIndex !== undefined && (
                                        <div className="mt-2 text-xs text-gray-500">
                                            <span className="font-medium">Chunk:</span> {result.metadata.chunkIndex + 1} of {result.metadata.totalChunks}
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
