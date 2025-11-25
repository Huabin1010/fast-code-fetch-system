'use client'

import { useSession } from "next-auth/react"
import LoginForm from "@/components/auth/LoginForm"
import Dashboard from "@/components/Dashboard"
import { useTranslation } from "@/components/providers/I18nProvider"
import { LanguageSwitcherButton } from "@/components/ui/language-switcher"

export default function Home() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="flex justify-end mb-4">
            <LanguageSwitcherButton />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">{t('auth.title')}</h1>
            <p className="mt-2 text-gray-600">{t('auth.subtitle')}</p>
          </div>
          <LoginForm />
        </div>
      </div>
    )
  }

  return <Dashboard />
}
