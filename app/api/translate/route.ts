import { NextRequest, NextResponse } from 'next/server'

// Simple translation mapping for common database values
const translations = {
  // Categories
  'Shirts': { gu: 'શર્ટ', hi: 'शर्ट' },
  'Pants': { gu: 'પેન્ટ', hi: 'पैंट' },
  'Dresses': { gu: 'ડ્રેસ', hi: 'ड्रेस' },
  'Accessories': { gu: 'એક્સેસરીઝ', hi: 'सहायक उपकरण' },
  'Shoes': { gu: 'જૂતા', hi: 'जूते' },
  'Bags': { gu: 'બેગ', hi: 'बैग' },
  'Jewelry': { gu: 'આભૂષણ', hi: 'आभूषण' },
  
  // Sizes
  'Small': { gu: 'નાનું', hi: 'छोटा' },
  'Medium': { gu: 'મધ્યમ', hi: 'मध्यम' },
  'Large': { gu: 'મોટું', hi: 'बड़ा' },
  'XL': { gu: 'એક્સ-લાર્જ', hi: 'एक्स-लार्ज' },
  'XXL': { gu: 'ડબલ એક્સ-લાર્જ', hi: 'डबल एक्स-लार्ज' },
  
  // Colors
  'Red': { gu: 'લાલ', hi: 'लाल' },
  'Blue': { gu: 'વાદળી', hi: 'नीला' },
  'Green': { gu: 'લીલો', hi: 'हरा' },
  'Yellow': { gu: 'પીળો', hi: 'पीला' },
  'Black': { gu: 'કાળો', hi: 'काला' },
  'White': { gu: 'સફેદ', hi: 'सफेद' },
  'Pink': { gu: 'ગુલાબી', hi: 'गुलाबी' },
  'Orange': { gu: 'નારંગી', hi: 'नारंगी' },
  'Purple': { gu: 'જાંબુડિયો', hi: 'बैंगनी' },
  'Brown': { gu: 'ભૂરો', hi: 'भूरा' },
  'Grey': { gu: 'ગ્રે', hi: 'स्लेटी' },
  
  // Materials
  'Cotton': { gu: 'કપાસ', hi: 'कपास' },
  'Silk': { gu: 'રેશમ', hi: 'रेशम' },
  'Wool': { gu: 'ઊન', hi: 'ऊन' },
  'Polyester': { gu: 'પોલિએસ્ટર', hi: 'पॉलिएस्टर' },
  'Leather': { gu: 'ચામડું', hi: 'चमड़ा' },
  'Denim': { gu: 'ડેનિમ', hi: 'डेनिम' },
  'Linen': { gu: 'લિનન', hi: 'लिनन' },
  
  // Brands (common ones)
  'Nike': { gu: 'નાઇકી', hi: 'नाइकी' },
  'Adidas': { gu: 'એડિડાસ', hi: 'एडिडास' },
  'Puma': { gu: 'પ્યુમા', hi: 'प्यूमा' },
  'Zara': { gu: 'ઝારા', hi: 'जारा' },
  'H&M': { gu: 'એચ એન્ડ એમ', hi: 'एच एंड एम' },
  
  // Payment methods
  'Cash': { gu: 'રોકડ', hi: 'नकद' },
  'Card': { gu: 'કાર્ડ', hi: 'कार्ड' },
  'UPI': { gu: 'યુપીઆઈ', hi: 'यूपीआई' },
  'Credit Card': { gu: 'ક્રેડિટ કાર્ડ', hi: 'क्रेडिट कार्ड' },
  'Debit Card': { gu: 'ડેબિટ કાર્ડ', hi: 'डेबिट कार्ड' },
  
  // Status
  'Active': { gu: 'સક્રિય', hi: 'सक्रिय' },
  'Inactive': { gu: 'નિષ્ક્રિય', hi: 'निष्क्रिय' },
  'Pending': { gu: 'બાકી', hi: 'लंबित' },
  'Completed': { gu: 'પૂર્ણ', hi: 'पूर्ण' },
  'Cancelled': { gu: 'રદ', hi: 'रद्द' },
}

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage } = await request.json()
    
    if (!text || !targetLanguage) {
      return NextResponse.json({ error: 'Text and target language are required' }, { status: 400 })
    }
    
    if (targetLanguage === 'en') {
      return NextResponse.json({ translatedText: text })
    }
    
    // Check if we have a translation for this text
    const translation = translations[text as keyof typeof translations]
    if (translation && translation[targetLanguage as keyof typeof translation]) {
      return NextResponse.json({ 
        translatedText: translation[targetLanguage as keyof typeof translation] 
      })
    }
    
    // If no translation found, return original text
    return NextResponse.json({ translatedText: text })
    
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
  }
}