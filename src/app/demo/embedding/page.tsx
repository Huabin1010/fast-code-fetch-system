'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Database, Search, Plus, Trash2, Upload, CheckCircle, XCircle, FileText, Filter, RotateCcw } from 'lucide-react'
import { 
    listIndexes, 
    createIndex, 
    upsertEmbeddings, 
    queryEmbeddings, 
    deleteIndex,
    getDefaultDimension,
    processWordDocument
} from '../store/action'

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

export default function EmbeddingPage() {
    const [indexes, setIndexes] = useState<Index[]>([])
    const [loading, setLoading] = useState(false)
    const [newIndexName, setNewIndexName] = useState('')
    const [newIndexDimension, setNewIndexDimension] = useState('1536')
    const [selectedIndex, setSelectedIndex] = useState('')
    const [queryText, setQueryText] = useState('artificial intelligence')
    const [queryResults, setQueryResults] = useState<QueryResult[]>([])
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [topK, setTopK] = useState('5')
    const [minScore, setMinScore] = useState('0.0')
    const [categoryFilter, setCategoryFilter] = useState('all-categories')
    const [authorFilter, setAuthorFilter] = useState('all-authors')
    const [useReranking, setUseReranking] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [extractedText, setExtractedText] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 5000)
    }

    // Load default dimension and fetch indexes on page load
    useEffect(() => {
        const initializePage = async () => {
            try {
                // Load default dimension
                const defaultDim = await getDefaultDimension()
                setNewIndexDimension(defaultDim.toString())
                
                // Fetch existing indexes
                await handleListIndexes()
            } catch (error) {
                console.error('Failed to initialize page:', error)
            }
        }
        initializePage()
    }, [])

    const handleListIndexes = async () => {
        setLoading(true)
        try {
            const result = await listIndexes()
            if (result.success) {
                const indexData = result.data || []
                const formattedIndexes = Array.isArray(indexData) 
                    ? indexData.map(index => typeof index === 'string' ? { name: index } : index)
                    : []
                setIndexes(formattedIndexes)
                showMessage('success', 'Indexes loaded successfully')
            } else {
                showMessage('error', result.error || 'Failed to load indexes')
            }
        } catch (error) {
            showMessage('error', 'Failed to load indexes')
        }
        setLoading(false)
    }

    const handleCreateIndex = async () => {
        if (!newIndexName.trim()) {
            showMessage('error', 'Index name is required')
            return
        }
        
        setLoading(true)
        try {
            const result = await createIndex(newIndexName, parseInt(newIndexDimension))
            if (result.success) {
                showMessage('success', result.message || 'Index created successfully')
                setNewIndexName('')
                handleListIndexes()
            } else {
                showMessage('error', result.error || 'Failed to create index')
            }
        } catch (error) {
            showMessage('error', 'Failed to create index')
        }
        setLoading(false)
    }

    const handleUpsertEmbeddings = async () => {
        if (!selectedIndex) {
            showMessage('error', 'Please select an index')
            return
        }
        
        setLoading(true)
        try {
            const result = await upsertEmbeddings(selectedIndex)
            if (result.success) {
                showMessage('success', result.message || 'Embeddings upserted successfully')
            } else {
                showMessage('error', result.error || 'Failed to upsert embeddings')
            }
        } catch (error) {
            showMessage('error', 'Failed to upsert embeddings')
        }
        setLoading(false)
    }

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

    const handleDeleteIndex = async (indexName: string) => {
        setLoading(true)
        try {
            const result = await deleteIndex(indexName)
            if (result.success) {
                showMessage('success', result.message || 'Index deleted successfully')
                handleListIndexes()
                if (selectedIndex === indexName) {
                    setSelectedIndex('')
                    setQueryResults([])
                }
            } else {
                showMessage('error', result.error || 'Failed to delete index')
            }
        } catch (error) {
            showMessage('error', 'Failed to delete index')
        }
        setLoading(false)
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                file.name.endsWith('.docx')) {
                setSelectedFile(file)
                setExtractedText('')
                showMessage('success', 'Word document selected successfully')
            } else {
                showMessage('error', 'Please select a valid Word document (.docx)')
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            }
        }
    }

    const handleWordFileUpload = async () => {
        if (!selectedFile) {
            showMessage('error', 'Please select a Word document')
            return
        }
        if (!selectedIndex) {
            showMessage('error', 'Please select an index')
            return
        }

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('indexName', selectedIndex)

            // Use the new server-side processWordDocument function
            const result = await processWordDocument(formData)
            
            if (result.success) {
                setExtractedText(result.extractedText || '')
                showMessage('success', result.message || 'Document processed and embeddings created successfully')
                setSelectedFile(null)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            } else {
                showMessage('error', result.error || 'Failed to process document')
            }
        } catch (error) {
            console.error('Word document processing error:', error)
            showMessage('error', `Failed to process Word document: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
        setLoading(false)
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <Database className="h-8 w-8 text-blue-600" />
                <div>
                    <h1 className="text-3xl font-bold">Vector Database Demo</h1>
                    <p className="text-gray-600">Explore vector storage and similarity search with LibSQL</p>
                </div>
            </div>

            {message && (
                <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                    {message.type === 'error' ? <XCircle className="h-4 w-4 text-red-600" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
                    <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                        {message.text}
                    </AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="indexes" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="indexes">Index Management</TabsTrigger>
                    <TabsTrigger value="embeddings">Embeddings</TabsTrigger>
                    <TabsTrigger value="search">Vector Search</TabsTrigger>
                </TabsList>

                <TabsContent value="indexes" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Plus className="h-5 w-5" />
                                    Create New Index
                                </CardTitle>
                                <CardDescription>
                                    Create a new vector index with specified dimensions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Index Name</label>
                                    <Input
                                        placeholder="my_collection_123"
                                        value={newIndexName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIndexName(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Use only letters, numbers, and underscores
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Dimensions</label>
                                    <Input
                                        type="number"
                                        value={newIndexDimension}
                                        readOnly
                                        className="bg-gray-50 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Configured from EMBEDDING_DIMENSION environment variable
                                    </p>
                                </div>
                                <Button onClick={handleCreateIndex} disabled={loading} className="w-full">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Create Index
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5" />
                                    Existing Indexes
                                </CardTitle>
                                <CardDescription>
                                    Manage your vector indexes
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <Button onClick={handleListIndexes} disabled={loading} variant="outline" className="w-full">
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Refresh Indexes
                                    </Button>
                                    
                                    {indexes.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">No indexes found</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {indexes.map((index) => (
                                                <div key={index.name} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div>
                                                        <div className="font-medium">{index.name}</div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setSelectedIndex(index.name)}
                                                        >
                                                            Select
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleDeleteIndex(index.name)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="embeddings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Upload Word Document
                            </CardTitle>
                            <CardDescription>
                                Upload a Word document (.docx) to extract text and create embeddings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Selected Index</label>
                                <div className="flex gap-2">
                                    <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                                        <SelectTrigger className="flex-1">
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
                                    <Button variant="outline" onClick={handleListIndexes}>
                                        Refresh
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Word Document</label>
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={handleFileChange}
                                    className="cursor-pointer"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Only .docx files are supported
                                </p>
                            </div>

                            {selectedFile && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium">{selectedFile.name}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Size: {(selectedFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            )}

                            {extractedText && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2">Extracted Text Preview</h4>
                                    <div className="text-sm text-gray-700 max-h-32 overflow-y-auto">
                                        {extractedText}
                                    </div>
                                </div>
                            )}
                            
                            <Button 
                                onClick={handleWordFileUpload} 
                                disabled={loading || !selectedIndex || !selectedFile}
                                className="w-full"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                Process Document & Create Embeddings
                            </Button>

                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">Or Upload Sample Data</h4>
                                <Button 
                                    onClick={handleUpsertEmbeddings} 
                                    disabled={loading || !selectedIndex}
                                    variant="outline"
                                    className="w-full"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                    Upload Sample Embeddings
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="search" className="space-y-6">
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
                </TabsContent>
            </Tabs>
        </div>
    )
}