// Feature permissions configuration
export const AVAILABLE_FEATURES = {
  // Core Features
  dashboard: { name: 'Dashboard', category: 'Core', required: true },
  
  // Inventory Management
  inventory: { name: 'Inventory Management', category: 'Inventory' },
  purchases: { name: 'Purchase Orders', category: 'Inventory' },
  
  // Sales & POS
  pos: { name: 'Point of Sale (POS)', category: 'Sales' },
  bills: { name: 'Bills & Invoicing', category: 'Sales' },
  
  // Customer Management
  customers: { name: 'Customer Management', category: 'CRM' },
  
  // HR & Staff Management
  hr: { name: 'HR & Staff Management', category: 'HR' },
  commission: { name: 'Commission Management', category: 'HR' },
  leaves: { name: 'Leave Management', category: 'HR' },
  salary: { name: 'Salary Management', category: 'HR' },
  
  // Reports & Analytics
  reports: { name: 'Analytics & Reports', category: 'Analytics', description: 'Daily sales, profit analysis, best sellers, business insights' },
  expenses: { name: 'Expense Management', category: 'Analytics', description: 'Track business expenses, monthly analysis, category-wise breakdown' },
  
  // Settings & Configuration
  settings: { name: 'General Settings', category: 'Settings' },
  dropdownSettings: { name: 'Dropdown Settings', category: 'Settings' },
  
  // Communication
  whatsapp: { name: 'WhatsApp Integration', category: 'Communication' },
  
  // Referrals
  referrals: { name: 'Referral System', category: 'Marketing' }
} as const

export type FeatureKey = keyof typeof AVAILABLE_FEATURES

export const FEATURE_CATEGORIES = [
  'Core',
  'Inventory', 
  'Sales',
  'CRM',
  'HR',
  'Analytics',
  'Settings',
  'Communication',
  'Marketing'
] as const

// Default feature sets for different plan tiers
export const DEFAULT_FEATURE_SETS = {
  basic: ['dashboard', 'inventory', 'pos', 'customers', 'settings'],
  standard: ['dashboard', 'inventory', 'pos', 'customers', 'purchases', 'bills', 'hr', 'commission', 'reports', 'expenses', 'settings', 'dropdownSettings'],
  premium: Object.keys(AVAILABLE_FEATURES) as FeatureKey[]
}