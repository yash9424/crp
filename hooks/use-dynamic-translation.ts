import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/language-context'

export function useDynamicTranslation() {
  const { language } = useLanguage()
  const [translationCache, setTranslationCache] = useState<Record<string, string>>({})

  const translateText = async (text: string): Promise<string> => {
    if (!text || language === 'en') return text
    
    const cacheKey = `${text}_${language}`
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey]
    }

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: language })
      })
      
      if (response.ok) {
        const { translatedText } = await response.json()
        setTranslationCache(prev => ({ ...prev, [cacheKey]: translatedText }))
        return translatedText
      }
    } catch (error) {
      console.error('Translation failed:', error)
    }
    
    return text
  }

  const translateArray = async (items: string[]): Promise<string[]> => {
    const translations = await Promise.all(items.map(item => translateText(item)))
    return translations
  }

  return { translateText, translateArray, language }
}