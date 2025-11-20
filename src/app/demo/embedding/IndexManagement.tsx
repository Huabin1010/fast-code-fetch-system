'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Database, Plus, Trash2 } from 'lucide-react'
import { createIndex, deleteIndex } from '../store/action'

interface Index {
    name: string
    dimension?: number
    vectorCount?: number
}

interface IndexManagementProps {
    indexes: Index[]
    loading: boolean
    newIndexName: string
    newIndexDimension: string
    selectedIndex: string
    setNewIndexName: (name: string) => void
    setSelectedIndex: (index: string) => void
    onRefresh: () => Promise<void>
    showMessage: (type: 'success' | 'error', text: string) => void
}

export default function IndexManagement({
    indexes,
    loading,
    newIndexName,
    newIndexDimension,
    selectedIndex,
    setNewIndexName,
    setSelectedIndex,
    onRefresh,
    showMessage
}: IndexManagementProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleCreateIndex = async () => {
        if (!newIndexName.trim()) {
            showMessage('error', 'Index name is required')
            return
        }
        
        setIsLoading(true)
        try {
            const result = await createIndex(newIndexName, parseInt(newIndexDimension))
            if (result.success) {
                showMessage('success', result.message || 'Index created successfully')
                setNewIndexName('')
                await onRefresh()
            } else {
                showMessage('error', result.error || 'Failed to create index')
            }
        } catch (error) {
            showMessage('error', 'Failed to create index')
        }
        setIsLoading(false)
    }

    const handleDeleteIndex = async (indexName: string) => {
        setIsLoading(true)
        try {
            const result = await deleteIndex(indexName)
            if (result.success) {
                showMessage('success', result.message || 'Index deleted successfully')
                await onRefresh()
                if (selectedIndex === indexName) {
                    setSelectedIndex('')
                }
            } else {
                showMessage('error', result.error || 'Failed to delete index')
            }
        } catch (error) {
            showMessage('error', 'Failed to delete index')
        }
        setIsLoading(false)
    }

    return (
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
                    <Button onClick={handleCreateIndex} disabled={isLoading || loading} className="w-full">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
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
                        <Button onClick={onRefresh} disabled={loading || isLoading} variant="outline" className="w-full">
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
    )
}
