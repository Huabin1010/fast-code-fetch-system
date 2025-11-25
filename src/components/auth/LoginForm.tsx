'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { useTranslation } from '@/components/providers/I18nProvider'

export default function LoginForm() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid credentials. Use admin / 123456qq')
      }
    } catch (error) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {t('auth.username')}
          </label>
          <Input
            id="email"
            type="text"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder={t('auth.usernamePlaceholder')}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            {t('auth.password')}
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
            required
          />
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('auth.signingIn')}
            </>
          ) : (
            t('auth.signIn')
          )}
        </Button>
      </form>
      
      <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
        <strong>{t('auth.defaultCredentials')}:</strong><br />
        {t('auth.username')}: admin<br />
        {t('auth.password')}: 123456qq
      </div>
    </div>
  )
}
