// Barcode utility functions for product management

/**
 * Generate a unique barcode for a product
 * Format: Store prefix + timestamp + random digits
 */
export function generateBarcode(storePrefix: string = 'FS'): string {
  const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${storePrefix}${timestamp}${random}`
}

/**
 * Generate EAN-13 compatible barcode
 */
export function generateEAN13Barcode(): string {
  // Generate 12 digits, calculate check digit
  const countryCode = '890' // India country code
  const manufacturerCode = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  const productCode = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  
  const first12 = countryCode + manufacturerCode + productCode
  const checkDigit = calculateEAN13CheckDigit(first12)
  
  return first12 + checkDigit
}

/**
 * Calculate EAN-13 check digit
 */
function calculateEAN13CheckDigit(first12: string): string {
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(first12[i])
    sum += i % 2 === 0 ? digit : digit * 3
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit.toString()
}

/**
 * Validate barcode format
 */
export function validateBarcode(barcode: string): boolean {
  if (!barcode || barcode.length < 3) return false
  
  // Allow alphanumeric and common barcode characters
  const barcodeRegex = /^[A-Za-z0-9\-_]+$/
  return barcodeRegex.test(barcode)
}

/**
 * Format barcode for display
 */
export function formatBarcodeDisplay(barcode: string): string {
  if (!barcode) return 'No Barcode'
  
  // Add spaces for better readability if it's a long barcode
  if (barcode.length >= 12) {
    return barcode.replace(/(.{3})/g, '$1 ').trim()
  }
  
  return barcode
}

/**
 * Check if barcode is EAN-13 format
 */
export function isEAN13(barcode: string): boolean {
  return /^\d{13}$/.test(barcode)
}

/**
 * Generate barcode for printing (returns barcode data for barcode libraries)
 */
export function getBarcodeForPrint(barcode: string) {
  return {
    value: barcode,
    format: isEAN13(barcode) ? 'EAN13' : 'CODE128',
    width: 2,
    height: 50,
    displayValue: true,
    fontSize: 12,
    textAlign: 'center',
    textPosition: 'bottom'
  }
}