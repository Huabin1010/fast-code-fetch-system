'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Database, Plus, Trash2 } from 'lucide-react'
import { createIndex, deleteIndex } from '../store/action'
import { useTranslation } from '@/components/providers/I18nProvider'

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
    const { t } = useTranslation()
    const [isLoading, setIsLoading] = useState(false)

    const handleCreateIndex = async () => {
        if (!newIndexName.trim()) {
            showMessage('error', t('embedding.messages.indexNameRequired'))
            return
        }
        
        setIsLoading(true)
        try {
            const result = await createIndex(newIndexName, parseInt(newIndexDimension))
            if (result.success) {
                showMessage('success', result.message || t('embedding.messages.indexCreated'))
                setNewIndexName('')
                await onRefresh()
            } else {
                showMessage('error', result.error || t('embedding.messages.createIndexFailed'))
            }
        } catch (error) {
            showMessage('error', t('embedding.messages.createIndexFailed'))
        }
        setIsLoading(false)
    }

    const handleDeleteIndex = async (indexName: string) => {
        setIsLoading(true)
        try {
            const result = await deleteIndex(indexName)
            if (result.success) {
                showMessage('success', result.message || t('embedding.messages.indexDeleted'))
                await onRefresh()
                if (selectedIndex === indexName) {
                    setSelectedIndex('')
                }
            } else {
                showMessage('error', result.error || t('embedding.messages.deleteIndexFailed'))
            }
        } catch (error) {
            showMessage('error', t('embedding.messages.deleteIndexFailed'))
        }
        setIsLoading(false)
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        {t('embedding.indexManagement.createNewIndex')}
                    </CardTitle>
                    <CardDescription>
                        {t('embedding.indexManagement.createIndexDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">{t('embedding.indexManagement.indexName')}</label>
                        <Input
                            placeholder={t('embedding.indexManagement.indexNamePlaceholder')}
                            value={newIndexName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIndexName(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {t('embedding.indexManagement.indexNameHint')}
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium">{t('embedding.indexManagement.dimensions')}</label>
                        <Input
                            type="number"
                            value={newIndexDimension}
                            readOnly
                            className="bg-gray-50 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {t('embedding.indexManagement.dimensionsHint')}
                        </p>
                    </div>
                    <Button onClick={handleCreateIndex} disabled={isLoading || loading} className="w-full">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        {t('embedding.indexManagement.createIndex')}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        {t('embedding.indexManagement.existingIndexes')}
                    </CardTitle>
                    <CardDescription>
                        {t('embedding.indexManagement.manageIndexes')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <Button onClick={onRefresh} disabled={loading || isLoading} variant="outline" className="w-full">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {t('embedding.indexManagement.refreshIndexes')}
                        </Button>
                        
                        {indexes.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">{t('embedding.indexManagement.noIndexes')}</p>
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
                                                {t('embedding.indexManagement.select')}
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
