import { defaultLocale, locales, type Locale } from './config'
import zhMessages from './locales/zh.json'
import enMessages from './locales/en.json'
import type { TranslationMessages } from './config'

export const messages: Record<Locale, TranslationMessages> = {
  zh: zhMessages as TranslationMessages,
  en: enMessages as TranslationMessages,
}

export function getMessages(locale: Locale): TranslationMessages {
  return messages[locale] || messages[defaultLocale]
}

export { defaultLocale, locales, type Locale }
