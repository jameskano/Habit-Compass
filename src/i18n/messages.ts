import en from './en.json'
import es from './es.json'

export const messages = {
  en,
  es,
} as const

export type AppLocale = keyof typeof messages

export const getMessages = (locale: string) => {
  return messages[locale as AppLocale] ?? messages.en
}
