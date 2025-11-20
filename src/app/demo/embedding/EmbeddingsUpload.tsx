'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Upload, FileText } from 'lucide-react'
import { upsertEmbeddings, processWordDocument } from '../store/action'

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

    return (
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
                        <Button variant="outline" onClick={onRefresh}>
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
    )
}
