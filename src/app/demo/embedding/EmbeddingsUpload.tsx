'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Upload, FileText } from 'lucide-react'
import { processWordDocument, processTestWordDocument } from '../store/action'
import { useTranslation } from '@/components/providers/I18nProvider'

interface Index {
    name: string
    dimension?: number
    vectorCount?: number
}

interface EmbeddingsUploadProps {
    indexes: Index[]
    selectedIndex: string
    setSelectedIndex: (index: string) => void
    onRefresh: () => Promise<void>
    showMessage: (type: 'success' | 'error', text: string) => void
}

export default function EmbeddingsUpload({
    indexes,
    selectedIndex,
    setSelectedIndex,
    onRefresh,
    showMessage
}: EmbeddingsUploadProps) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [extractedText, setExtractedText] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                file.name.endsWith('.docx')) {
                setSelectedFile(file)
                setExtractedText('')
                showMessage('success', t('embedding.messages.wordDocSelected'))
            } else {
                showMessage('error', t('embedding.messages.selectValidWordDoc'))
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            }
        }
    }

    const handleWordFileUpload = async () => {
        if (!selectedFile) {
            showMessage('error', t('embedding.messages.selectValidWordDoc'))
            return
        }
        if (!selectedIndex) {
            showMessage('error', t('embedding.messages.selectIndex'))
            return
        }

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('indexName', selectedIndex)

            const result = await processWordDocument(formData)
            
            if (result.success) {
                setExtractedText(result.extractedText || '')
                showMessage('success', result.message || t('embedding.messages.documentProcessed'))
                setSelectedFile(null)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            } else {
                showMessage('error', result.error || t('embedding.messages.processDocumentFailed'))
            }
        } catch (error) {
            console.error('Word document processing error:', error)
            showMessage('error', `${t('embedding.messages.processDocumentFailed')}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
        setLoading(false)
    }

    const handleProcessTestFile = async (fileName: 'test_word.docx' | 'test_word_1.docx') => {
        if (!selectedIndex) {
            showMessage('error', t('embedding.messages.selectIndex'))
            return
        }
        
        setLoading(true)
        try {
            const result = await processTestWordDocument(fileName, selectedIndex)
            if (result.success) {
                showMessage('success', result.message || t('embedding.messages.documentProcessed'))
                setExtractedText(result.extractedText || '')
                await onRefresh()
            } else {
                showMessage('error', result.error || t('embedding.messages.processDocumentFailed'))
            }
        } catch (error) {
            console.error('Test document processing error:', error)
            showMessage('error', `${t('embedding.messages.processDocumentFailed')}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
        setLoading(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('embedding.embeddings.uploadWordDoc')}
                </CardTitle>
                <CardDescription>
                    {t('embedding.embeddings.uploadWordDocDesc')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label className="text-sm font-medium">{t('embedding.embeddings.selectedIndex')}</label>
                    <div className="flex gap-2">
                        <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                            <SelectTrigger className="flex-1">
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
                        <Button variant="outline" onClick={onRefresh}>
                            {t('embedding.embeddings.refresh')}
                        </Button>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium">{t('embedding.embeddings.wordDocument')}</label>
                    <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileChange}
                        className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {t('embedding.embeddings.onlyDocxSupported')}
                    </p>
                </div>

                {selectedFile && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">{selectedFile.name}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                            {t('embedding.embeddings.fileSize')}: {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                    </div>
                )}

                {extractedText && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">{t('embedding.embeddings.extractedTextPreview')}</h4>
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
                    {t('embedding.embeddings.processDocument')}
                </Button>

                <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">{t('embedding.embeddings.orUploadSample')}</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <Button 
                            onClick={() => handleProcessTestFile('test_word.docx')} 
                            disabled={loading || !selectedIndex}
                            variant="outline"
                            className="w-full"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                            test_word.docx
                        </Button>
                        <Button 
                            onClick={() => handleProcessTestFile('test_word_1.docx')} 
                            disabled={loading || !selectedIndex}
                            variant="outline"
                            className="w-full"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                            test_word_1.docx
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
