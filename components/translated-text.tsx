"use client"

import { useState, useEffect } from 'react'
import { useDynamicTranslation } from '@/hooks/use-dynamic-translation'

interface TranslatedTextProps {
  text: string
  className?: string
}

export function TranslatedText({ text, className }: TranslatedTextProps) {
  const [translatedText, setTranslatedText] = useState(text)
  const { translateText, language } = useDynamicTranslation()

  useEffect(() => {
    const translate = async () => {
      const translated = await translateText(text)
      setTranslatedText(translated)
    }
    translate()
  }, [text, language, translateText])

  return <span className={className}>{translatedText}</span>
}