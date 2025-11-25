'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Globe } from 'lucide-react'
import { useTranslation } from '@/components/providers/I18nProvider'
import { locales, localeNames } from '@/lib/i18n/config'

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-500" />
      <Select value={locale} onValueChange={(value) => setLocale(value as 'zh' | 'en')}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {localeNames[loc]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function LanguageSwitcherButton() {
  const { locale, setLocale } = useTranslation()
  const nextLocale = locale === 'zh' ? 'en' : 'zh'
  const nextLocaleName = localeNames[nextLocale]

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLocale(nextLocale)}
      className="gap-2"
    >
      <Globe className="h-4 w-4" />
      <span>{nextLocaleName}</span>
    </Button>
  )
}
