"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, Settings } from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"
import { showToast } from "@/lib/toast"
import { useLanguage } from "@/lib/language-context"

interface DropdownData {
  categories: string[]
  sizes: string[]
  colors: string[]
  materials: string[]
  brands: string[]
  suppliers: string[]
  [key: string]: string[]
}

interface BusinessType {
  id: string
  name: string
  fields: Array<{
    name: string
    type: string
    options?: string[]
  }>
}

export default function DropdownSettingsPage() {
  const [dropdownData, setDropdownData] = useState<DropdownData>({
    categories: [],
    sizes: [],
    colors: [],
    materials: [],
    brands: [],
    suppliers: []
  })
  const [assignedBusinessType, setAssignedBusinessType] = useState<BusinessType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { t } = useLanguage()

  const fetchDropdownData = async () => {
    try {
      // Get tenant info including business type
      const tenantResponse = await fetch('/api/tenant-features')
      
      if (tenantResponse.ok) {
        const tenantData = await tenantResponse.json()
        console.log('Tenant data:', tenantData)
        
        // Check if tenant has a business type assigned
        if (tenantData.businessType && tenantData.businessType !== 'none') {
          // Fetch the specific business type details
          const businessTypeResponse = await fetch(`/api/business-types/${tenantData.businessType}`)
          
          if (businessTypeResponse.ok) {
            const businessType = await businessTypeResponse.json()
            setAssignedBusinessType(businessType)
            
            // Fetch existing dropdown data
            const dropdownResponse = await fetch('/api/dropdown-data')
            const existingData = dropdownResponse.ok ? await dropdownResponse.json() : {}
            
            // Initialize dropdown data for business type fields
            const dynamicData: DropdownData = {
              categories: [],
              sizes: [],
              colors: [],
              materials: [],
              brands: [],
              suppliers: []
            }
            
            businessType.fields.forEach((field: any) => {
              if (field.type === 'select') {
                const fieldKey = field.name.toLowerCase().replace(/\s+/g, '_')
                // Merge existing data with default options from business type
                const existingOptions = (existingData as any)[fieldKey] || []
                const defaultOptions = field.options || []
                // Combine and deduplicate
                const combinedOptions = [...new Set([...existingOptions, ...defaultOptions])]
                dynamicData[fieldKey] = combinedOptions
              }
            })
            
            setDropdownData(dynamicData)
          } else {
            console.error('Failed to fetch business type details')
          }
        } else {
          console.log('No business type assigned to tenant')
          // Still fetch existing dropdown data if no business type
          const dropdownResponse = await fetch('/api/dropdown-data')
          if (dropdownResponse.ok) {
            const data = await dropdownResponse.json()
            setDropdownData(data)
          }
        }
      } else {
        console.error('Failed to fetch tenant data')
      }
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveDropdownData = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/dropdown-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dropdownData)
      })
      
      if (response.ok) {
        showToast.success(t('dropdownDataSaved'))
      } else {
        showToast.error(t('failedToSaveDropdownData'))
      }
    } catch (error) {
      console.error('Failed to save dropdown data:', error)
      showToast.error(t('errorSavingDropdownData'))
    } finally {
      setSaving(false)
    }
  }

  const addItem = (category: keyof DropdownData, value: string) => {
    if (!value.trim()) return
    setDropdownData(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), value.trim()]
    }))
  }

  const removeItem = (category: keyof DropdownData, index: number) => {
    setDropdownData(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter((_, i) => i !== index)
    }))
  }

  useEffect(() => {
    fetchDropdownData()
  }, [])

  if (loading) {
    return (
      <MainLayout title={t('dropdownSettings')}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('loadingDropdownSettings')}</div>
        </div>
      </MainLayout>
    )
  }

  const CategoryManager = ({ title, category, items }: { title: string; category: keyof DropdownData; items: string[] }) => {
    const [newItem, setNewItem] = useState('')

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>{title}</span>
          </CardTitle>
          <CardDescription>{t('manageOptions').replace('{0}', title.toLowerCase())}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder={t('addNew').replace('{0}', title.endsWith('s') ? title.slice(0, -1) : title)}
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addItem(category, newItem)
                    setNewItem('')
                  }
                }}
              />
              <button 
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => {
                  addItem(category, newItem)
                  setNewItem('')
                }}
              >
                {t('add')}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <div key={index} className="bg-gray-200 px-3 py-1 rounded-full flex items-center space-x-2">
                  <span>{item}</span>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => {
                      setDropdownData(prev => ({
                        ...prev,
                        [category]: prev[category].filter((_, i) => i !== index)
                      }))
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            {items.length === 0 && (
              <p className="text-sm text-gray-500">{t('noItemsAdded').replace('{0}', title.toLowerCase())}</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <MainLayout title={t('dropdownSettings')}>
      <FeatureGuard feature="dropdownSettings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('dropdownSettings')}</h1>
            <p className="text-muted-foreground">{t('manageDropdownOptions')}</p>
          </div>
          <Button onClick={saveDropdownData} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? t('saving') : t('saveAllChanges')}
          </Button>
        </div>

        {assignedBusinessType ? (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900">{t('assignedBusinessType')}: {assignedBusinessType.name}</h3>
              <p className="text-sm text-blue-700 mt-1">{t('manageDropdownForBusinessType')}</p>
            </div>
            
            {assignedBusinessType.fields.map(field => {
              if (field.type === 'select') {
                const fieldKey = field.name.toLowerCase().replace(/\s+/g, '_')
                return (
                  <CategoryManager 
                    key={fieldKey}
                    title={field.name} 
                    category={fieldKey} 
                    items={dropdownData[fieldKey] || []} 
                  />
                )
              }
              return null
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">{t('noBusinessTypeAssigned')}</h3>
            <p className="text-muted-foreground">{t('contactAdminForBusinessType')}</p>
          </div>
        )}
      </div>
      </FeatureGuard>
    </MainLayout>
  )
}