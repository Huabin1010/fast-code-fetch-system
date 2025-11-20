'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, FileText, Database, CheckCircle, XCircle } from 'lucide-react'
import { uploadWordFile, getAvailableVectorStores } from './action'

interface VectorStore {
    id: string
    name: string
    description: string
}

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null)
    const [selectedVectorStore, setSelectedVectorStore] = useState('')
    const [indexName, setIndexName] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [extractedText, setExtractedText] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const vectorStores: VectorStore[] = [
        { id: 'libsql', name: 'LibSQL', description: 'Local SQLite-based vector storage' },
        { id: 'mongodb', name: 'MongoDB', description: 'MongoDB Atlas Vector Search' },
        { id: 'pg', name: 'PostgreSQL', description: 'PostgreSQL with pgvector extension' },
        { id: 'pinecone', name: 'Pinecone', description: 'Managed vector database' },
        { id: 'qdrant', name: 'Qdrant', description: 'Open-source vector database' },
        { id: 'chroma', name: 'Chroma', description: 'AI-native open-source embedding database' },
        { id: 'astra', name: 'Astra DB', description: 'DataStax Astra vector database' },
        { id: 'upstash', name: 'Upstash', description: 'Serverless vector database' },
        { id: 'cloudflare', name: 'Cloudflare Vectorize', description: 'Cloudflare vector database' },
        { id: 'opensearch', name: 'OpenSearch', description: 'OpenSearch vector search' },
        { id: 'couchbase', name: 'Couchbase', description: 'Couchbase vector search' },
        { id: 'lance', name: 'LanceDB', description: 'Embedded vector database' },
        { id: 's3vectors', name: 'S3 Vectors', description: 'AWS S3-based vector storage' }
    ]

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 5000)
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0]
        if (selectedFile) {
            if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                selectedFile.name.endsWith('.docx')) {
                setFile(selectedFile)
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

    const handleUpload = async () => {
        if (!file) {
            showMessage('error', 'Please select a Word document')
            return
        }
        if (!selectedVectorStore) {
            showMessage('error', 'Please select a vector database')
            return
        }
        if (!indexName.trim()) {
            showMessage('error', 'Please enter an index name')
            return
        }

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('vectorStore', selectedVectorStore)
            formData.append('indexName', indexName)

            const result = await uploadWordFile(formData)
            
            if (result.success) {
                setExtractedText(result.extractedText || '')
                showMessage('success', result.message || 'File uploaded and processed successfully')
                // Reset form
                setFile(null)
                setIndexName('')
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            } else {
                showMessage('error', result.error || 'Failed to process file')
            }
        } catch (error) {
            showMessage('error', 'An error occurred while processing the file')
        }
        setLoading(false)
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <Upload className="h-8 w-8 text-blue-600" />
                <div>
                    <h1 className="text-3xl font-bold">Document Upload & Embedding</h1>
                    <p className="text-gray-600">Upload Word documents and store embeddings in your chosen vector database</p>
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

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Upload Word Document
                        </CardTitle>
                        <CardDescription>
                            Select a Word document (.docx) to extract text and generate embeddings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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

                        {file && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium">{file.name}</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                    Size: {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Vector Database Configuration
                        </CardTitle>
                        <CardDescription>
                            Choose your vector database and configure the index
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Vector Database</label>
                            <Select value={selectedVectorStore} onValueChange={setSelectedVectorStore}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a vector database" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vectorStores.map((store) => (
                                        <SelectItem key={store.id} value={store.id}>
                                            <div>
                                                <div className="font-medium">{store.name}</div>
                                                <div className="text-xs text-gray-500">{store.description}</div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Index Name</label>
                            <Input
                                placeholder="my_document_index"
                                value={indexName}
                                onChange={(e) => setIndexName(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Use only letters, numbers, and underscores
                            </p>
                        </div>

                        <Button 
                            onClick={handleUpload} 
                            disabled={loading || !file || !selectedVectorStore || !indexName.trim()}
                            className="w-full"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            Process Document & Create Embeddings
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {extractedText && (
                <Card>
                    <CardHeader>
                        <CardTitle>Extracted Text Preview</CardTitle>
                        <CardDescription>
                            Text extracted from your Word document
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm">{extractedText}</pre>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            This text has been processed and stored as embeddings in your selected vector database.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
