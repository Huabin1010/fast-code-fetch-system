'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database, CheckCircle, XCircle } from 'lucide-react'
import { listIndexes, getDefaultDimension } from '../store/action'
import IndexManagement from './IndexManagement'
import EmbeddingsUpload from './EmbeddingsUpload'
import VectorSearch from './VectorSearch'
import FileManagement from './FileManagement'

interface Index {
    name: string
    dimension?: number
    vectorCount?: number
}

export default function EmbeddingPage() {
    const [indexes, setIndexes] = useState<Index[]>([])
    const [loading, setLoading] = useState(false)
    const [newIndexName, setNewIndexName] = useState('')
    const [newIndexDimension, setNewIndexDimension] = useState('1536')
    const [selectedIndex, setSelectedIndex] = useState('')
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 5000)
    }

    useEffect(() => {
        const initializePage = async () => {
            try {
                const defaultDim = await getDefaultDimension()
                setNewIndexDimension(defaultDim.toString())
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
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="indexes">Index Management</TabsTrigger>
                    <TabsTrigger value="embeddings">Embeddings</TabsTrigger>
                    <TabsTrigger value="search">Vector Search</TabsTrigger>
                    <TabsTrigger value="files">File Management</TabsTrigger>
                </TabsList>

                <TabsContent value="indexes" className="space-y-6">
                    <IndexManagement
                        indexes={indexes}
                        loading={loading}
                        newIndexName={newIndexName}
                        newIndexDimension={newIndexDimension}
                        selectedIndex={selectedIndex}
                        setNewIndexName={setNewIndexName}
                        setSelectedIndex={setSelectedIndex}
                        onRefresh={handleListIndexes}
                        showMessage={showMessage}
                    />
                </TabsContent>

                <TabsContent value="embeddings" className="space-y-6">
                    <EmbeddingsUpload
                        indexes={indexes}
                        selectedIndex={selectedIndex}
                        setSelectedIndex={setSelectedIndex}
                        onRefresh={handleListIndexes}
                        showMessage={showMessage}
                    />
                </TabsContent>

                <TabsContent value="search" className="space-y-6">
                    <VectorSearch
                        indexes={indexes}
                        selectedIndex={selectedIndex}
                        setSelectedIndex={setSelectedIndex}
                        showMessage={showMessage}
                    />
                </TabsContent>

                <TabsContent value="files" className="space-y-6">
                    <FileManagement
                        indexes={indexes}
                        selectedIndex={selectedIndex}
                        setSelectedIndex={setSelectedIndex}
                        showMessage={showMessage}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}