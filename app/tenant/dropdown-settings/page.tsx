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

interface DropdownData {
  categories: string[]
  sizes: string[]
  colors: string[]
  materials: string[]
  brands: string[]
  suppliers: string[]
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchDropdownData = async () => {
    try {
      const response = await fetch('/api/dropdown-data')
      if (response.ok) {
        const data = await response.json()
        setDropdownData({
          categories: data.categories || [],
          sizes: data.sizes || [],
          colors: data.colors || [],
          materials: data.materials || [],
          brands: data.brands || [],
          suppliers: data.suppliers || []
        })
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
        showToast.success('Dropdown data saved successfully!')
      } else {
        showToast.error('Failed to save dropdown data')
      }
    } catch (error) {
      console.error('Failed to save dropdown data:', error)
      showToast.error('Error saving dropdown data')
    } finally {
      setSaving(false)
    }
  }

  const addItem = (category: keyof DropdownData, value: string) => {
    if (!value.trim()) return
    setDropdownData(prev => ({
      ...prev,
      [category]: [...prev[category], value.trim()]
    }))
  }

  const removeItem = (category: keyof DropdownData, index: number) => {
    setDropdownData(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }))
  }

  useEffect(() => {
    fetchDropdownData()
  }, [])

  if (loading) {
    return (
      <MainLayout title="Dropdown Settings" userRole="tenant-admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dropdown settings...</div>
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
          <CardDescription>Manage {title.toLowerCase()} options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder={`Add new ${title.toLowerCase().slice(0, -1)}`}
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
                Add
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
              <p className="text-sm text-gray-500">No {title.toLowerCase()} added yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <MainLayout title="Dropdown Settings" userRole="tenant-admin">
      <FeatureGuard feature="dropdownSettings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dropdown Settings</h1>
            <p className="text-muted-foreground">Manage dropdown options used throughout the system</p>
          </div>
          <Button onClick={saveDropdownData} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>

        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="sizes">Sizes</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="brands">Brands</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <CategoryManager title="Categories" category="categories" items={dropdownData.categories} />
          </TabsContent>

          <TabsContent value="sizes">
            <CategoryManager title="Sizes" category="sizes" items={dropdownData.sizes} />
          </TabsContent>

          <TabsContent value="colors">
            <CategoryManager title="Colors" category="colors" items={dropdownData.colors} />
          </TabsContent>

          <TabsContent value="materials">
            <CategoryManager title="Materials" category="materials" items={dropdownData.materials} />
          </TabsContent>

          <TabsContent value="brands">
            <CategoryManager title="Brands" category="brands" items={dropdownData.brands} />
          </TabsContent>

          <TabsContent value="suppliers">
            <CategoryManager title="Suppliers" category="suppliers" items={dropdownData.suppliers} />
          </TabsContent>
        </Tabs>
      </div>
      </FeatureGuard>
    </MainLayout>
  )
}