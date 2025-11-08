// Dynamic name translation utility
export const nameTranslations: Record<string, Record<string, string>> = {
  // Common customer names
  'राम': { en: 'Ram', gu: 'રામ', hi: 'राम' },
  'Ram': { en: 'Ram', gu: 'રામ', hi: 'राम' },
  'રામ': { en: 'Ram', gu: 'રામ', hi: 'राम' },
  
  'श्याम': { en: 'Shyam', gu: 'શ્યામ', hi: 'श्याम' },
  'Shyam': { en: 'Shyam', gu: 'શ્યામ', hi: 'श्याम' },
  'શ્યામ': { en: 'Shyam', gu: 'શ્યામ', hi: 'श्याम' },
  
  'गीता': { en: 'Geeta', gu: 'ગીતા', hi: 'गीता' },
  'Geeta': { en: 'Geeta', gu: 'ગીતા', hi: 'गीता' },
  'ગીતા': { en: 'Geeta', gu: 'ગીતા', hi: 'गीता' },
  
  'सीता': { en: 'Seeta', gu: 'સીતા', hi: 'सीता' },
  'Seeta': { en: 'Seeta', gu: 'સીતા', hi: 'सीता' },
  'સીતા': { en: 'Seeta', gu: 'સીતા', hi: 'सीता' },
  
  'राज': { en: 'Raj', gu: 'રાજ', hi: 'राज' },
  'Raj': { en: 'Raj', gu: 'રાજ', hi: 'राज' },
  'રાજ': { en: 'Raj', gu: 'રાજ', hi: 'राज' },
  
  'प्रिया': { en: 'Priya', gu: 'પ્રિયા', hi: 'प्रिया' },
  'Priya': { en: 'Priya', gu: 'પ્રિયા', hi: 'प्रिया' },
  'પ્રિયા': { en: 'Priya', gu: 'પ્રિયા', hi: 'प्रिया' },
  
  'अमित': { en: 'Amit', gu: 'અમિત', hi: 'अमित' },
  'Amit': { en: 'Amit', gu: 'અમિત', hi: 'अमित' },
  'અમિત': { en: 'Amit', gu: 'અમિત', hi: 'अमित' },
  
  // More common names
  'John': { en: 'John', gu: 'જોન', hi: 'जॉन' },
  'જોન': { en: 'John', gu: 'જોન', hi: 'जॉन' },
  'जॉन': { en: 'John', gu: 'જોન', hi: 'जॉन' },
  
  'Ravi': { en: 'Ravi', gu: 'રવિ', hi: 'रवि' },
  'રવિ': { en: 'Ravi', gu: 'રવિ', hi: 'रवि' },
  'रवि': { en: 'Ravi', gu: 'રવિ', hi: 'रवि' },
  
  'Kiran': { en: 'Kiran', gu: 'કિરણ', hi: 'किरण' },
  'કિરણ': { en: 'Kiran', gu: 'કિરણ', hi: 'किरण' },
  'किरण': { en: 'Kiran', gu: 'કિરણ', hi: 'किरण' },
  
  // Additional common Indian names
  'Rahul': { en: 'Rahul', gu: 'રાહુલ', hi: 'राहुल' },
  'રાહુલ': { en: 'Rahul', gu: 'રાહુલ', hi: 'राहुल' },
  'राहुल': { en: 'Rahul', gu: 'રાહુલ', hi: 'राहुल' },
  
  'Neha': { en: 'Neha', gu: 'નેહા', hi: 'नेहा' },
  'નેહા': { en: 'Neha', gu: 'નેહા', hi: 'नेहा' },
  'नेहा': { en: 'Neha', gu: 'નેહા', hi: 'नेहा' },
  
  'Vikash': { en: 'Vikash', gu: 'વિકાશ', hi: 'विकाश' },
  'વિકાશ': { en: 'Vikash', gu: 'વિકાશ', hi: 'विकाश' },
  'विकाश': { en: 'Vikash', gu: 'વિકાશ', hi: 'विकाश' },
  
  'Pooja': { en: 'Pooja', gu: 'પૂજા', hi: 'पूजा' },
  'પૂજા': { en: 'Pooja', gu: 'પૂજા', hi: 'पूजा' },
  'पूजा': { en: 'Pooja', gu: 'પૂજા', hi: 'पूजा' },
  
  'Suresh': { en: 'Suresh', gu: 'સુરેશ', hi: 'सुरेश' },
  'સુરેશ': { en: 'Suresh', gu: 'સુરેશ', hi: 'सुरेश' },
  'सुरेश': { en: 'Suresh', gu: 'સુરેશ', hi: 'सुरेश' },
  
  'Anjali': { en: 'Anjali', gu: 'અંજલિ', hi: 'अंजलि' },
  'અંજલિ': { en: 'Anjali', gu: 'અંજલિ', hi: 'अंजलि' },
  'अंजलि': { en: 'Anjali', gu: 'અંજલિ', hi: 'अंजलि' },
  
  'Deepak': { en: 'Deepak', gu: 'દીપક', hi: 'दीपक' },
  'દીપક': { en: 'Deepak', gu: 'દીપક', hi: 'दीपक' },
  'दीपक': { en: 'Deepak', gu: 'દીપક', hi: 'दीपक' },
  
  'Kavita': { en: 'Kavita', gu: 'કવિતા', hi: 'कविता' },
  'કવિતા': { en: 'Kavita', gu: 'કવિતા', hi: 'कविता' },
  'कविता': { en: 'Kavita', gu: 'કવિતા', hi: 'कविता' },
  
  'सुनीता': { en: 'Sunita', gu: 'સુનીતા', hi: 'सुनीता' },
  'Sunita': { en: 'Sunita', gu: 'સુનીતા', hi: 'सुनीता' },
  'સુનીતા': { en: 'Sunita', gu: 'સુનીતા', hi: 'सुनीता' },
}

export const translateName = (name: string, targetLanguage: 'en' | 'gu' | 'hi'): string => {
  if (!name) return name
  

  
  // Clean the name (remove extra spaces, handle case)
  const cleanName = name.trim()
  
  // Direct match
  const directTranslation = nameTranslations[cleanName]
  if (directTranslation && directTranslation[targetLanguage]) {

    return directTranslation[targetLanguage]
  }
  
  // Try case-insensitive match for English names
  const lowerName = cleanName.toLowerCase()
  for (const [key, translation] of Object.entries(nameTranslations)) {
    if (key.toLowerCase() === lowerName && translation[targetLanguage]) {

      return translation[targetLanguage]
    }
  }
  
  // Try partial match (first word)
  const firstName = cleanName.split(' ')[0]
  if (firstName !== cleanName) {
    const firstNameTranslation = nameTranslations[firstName]
    if (firstNameTranslation && firstNameTranslation[targetLanguage]) {

      return firstNameTranslation[targetLanguage] + cleanName.substring(firstName.length)
    }
  }
  

  // Return original name if no translation found
  return name
}

// Add new name translation dynamically
export const addNameTranslation = (translations: Record<string, string>) => {
  const baseKey = translations.en || translations.gu || translations.hi || Object.values(translations)[0]
  if (baseKey) {
    nameTranslations[baseKey] = translations
    // Add all variants as keys
    Object.values(translations).forEach(variant => {
      nameTranslations[variant] = translations
    })
  }
}

// Get all available names for translation
export const getAvailableNames = (): string[] => {
  return Object.keys(nameTranslations).filter(key => 
    nameTranslations[key].en && nameTranslations[key].gu && nameTranslations[key].hi
  )
}