'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, FileText } from 'lucide-react'
import { uploadTextDocument } from './files/actions'
import { useTranslation } from '@/components/providers/I18nProvider'

interface UploadTextFormProps {
  indexId: string
  userId: string
  onSuccess: () => void
  showMessage: (type: 'success' | 'error', text: string) => void
}

export default function UploadTextForm({
  indexId,
  userId,
  onSuccess,
  showMessage,
}: UploadTextFormProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      showMessage('error', t('upload.contentRequired'))
      return
    }

    setLoading(true)
    const result = await uploadTextDocument({
      indexId,
      content,
      title: title || undefined,
      userId,
    })
    setLoading(false)

    if (result.success) {
      showMessage('success', result.message || t('upload.uploadSuccess'))
      setTitle('')
      setContent('')
      onSuccess()
    } else {
      showMessage('error', result.error || t('upload.uploadFailed'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t('upload.uploadTextContent')}
        </CardTitle>
        <CardDescription>{t('upload.uploadTextContentDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t('upload.titleOptional')}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('upload.titlePlaceholder')}
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t('upload.textContent')}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('upload.textContentPlaceholder')}
              disabled={loading}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('upload.autoChunking')}
            </p>
          </div>

          <Button type="submit" disabled={loading || !content.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.processing')}
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                {t('upload.uploadAndProcess')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
