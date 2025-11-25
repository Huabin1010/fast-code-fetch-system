'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getMessages, defaultLocale, type Locale } from '@/lib/i18n'
import type { TranslationMessages } from '@/lib/i18n/config'

interface I18nContextType {
  locale: Locale
  messages: TranslationMessages
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const STORAGE_KEY = 'i18n_locale'

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path
}

interface I18nProviderProps {
  children: React.ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [messages, setMessages] = useState<TranslationMessages>(() => getMessages(defaultLocale))

  // Load locale from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null
      if (savedLocale && (savedLocale === 'zh' || savedLocale === 'en')) {
        setLocaleState(savedLocale)
        setMessages(getMessages(savedLocale))
      }
    }
  }, [])

  // Update document language attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
    }
  }, [locale])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    setMessages(getMessages(newLocale))
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLocale)
    }
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let translation = getNestedValue(messages, key) || key
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue))
        })
      }
      return translation
    },
    [messages]
  )

  return (
    <I18nContext.Provider value={{ locale, messages, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Helper hook for type-safe translations
export function useTranslation() {
  const { t, locale, setLocale, messages } = useI18n()
  return { t, locale, setLocale, messages }
}
