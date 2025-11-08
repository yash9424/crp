"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, Save, RefreshCw, Package, Lock } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { showToast } from "@/lib/toast"
import { BusinessTypeInitializer } from "@/components/business-type-initializer"

interface Field {
  name: string
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'barcode' | 'email' | 'phone' | 'url'
  required: boolean
  enabled: boolean
  options?: string[]
}

interface BusinessType {
  id: string
  name: string
  description: string
  fields: Field[]
}

export default function FieldSettingsPage() {
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([])
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('')
  const [customFields, setCustomFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(false)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [requestForm, setRequestForm] = useState({ fieldName: '', fieldType: 'text', description: '' })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const fetchBusinessTypes = async () => {
    try {
      const response = await fetch('/api/business-types')
      if (response.ok) {
        const data = await response.json()
        setBusinessTypes(data)
      }
    } catch (error) {
      console.error('Failed to fetch business types:', error)
    }
  }

  const handleBusinessTypeChange = async (businessTypeId: string) => {
    const businessType = businessTypes.find(bt => bt.id === businessTypeId)
    if (businessType) {
      setSelectedBusinessType(businessTypeId)
      const newFields = businessType.fields.map(field => ({
        ...field,
        enabled: true
      }))
      setCustomFields(newFields)
      
      try {
        await saveFieldsToDatabase(businessTypeId, newFields)
        showToast.success('Business type fields loaded and saved!')
      } catch (error) {
        showToast.error('Failed to save business type fields')
      }
    }
  }

  const fetchTenantFields = async () => {
    try {
      const [tenantFieldsResponse, tenantFeaturesResponse] = await Promise.all([
        fetch('/api/tenant-fields'),
        fetch('/api/tenant-features')
      ])
      
      let loadedFields = []
      let businessTypeId = ''
      
      if (tenantFeaturesResponse.ok) {
        const tenantData = await tenantFeaturesResponse.json()
        if (tenantData.businessType && tenantData.businessType !== 'none') {
          businessTypeId = tenantData.businessType
          setSelectedBusinessType(businessTypeId)
        }
      }
      
      if (tenantFieldsResponse.ok) {
        const data = await tenantFieldsResponse.json()
        if (data.fields && data.fields.length > 0) {
          loadedFields = data.fields
        }
      }
      
      if (loadedFields.length === 0 && businessTypeId && businessTypes.length > 0) {
        const businessType = businessTypes.find(bt => bt.id === businessTypeId)
        if (businessType && businessType.fields) {
          loadedFields = businessType.fields.map(field => ({ ...field, enabled: true }))
          await saveFieldsToDatabase(businessTypeId, loadedFields)
        }
      }
      
      setCustomFields(loadedFields)
    } catch (error) {
      console.error('Failed to fetch tenant fields:', error)
    }
  }

  const refreshFromTemplate = async () => {
    const businessType = businessTypes.find(bt => bt.id === selectedBusinessType)
    if (businessType) {
      const existingFieldNames = customFields.map(f => f.name)
      const newFields = businessType.fields.filter(f => !existingFieldNames.includes(f.name))
      
      const updatedFields = [
        ...customFields,
        ...newFields.map(field => ({ ...field, enabled: true }))
      ]
      
      setCustomFields(updatedFields)
      
      try {
        await saveFieldsToDatabase(selectedBusinessType, updatedFields)
        showToast.success('Template refreshed and saved! New fields added.')
      } catch (error) {
        showToast.error('Template refreshed but failed to save')
      }
    }
  }

  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      { name: '', type: 'text', required: false, enabled: true }
    ])
  }

  const addDefaultFields = async () => {
    const defaultFields = [
      { name: 'Name', type: 'text', required: true, enabled: true },
      { name: 'SKU', type: 'text', required: true, enabled: true },
      { name: 'Barcode', type: 'barcode', required: false, enabled: true },
      { name: 'Category', type: 'select', required: true, enabled: true, options: ['Shirts', 'Pants', 'Dresses', 'Accessories'] },
      { name: 'Price', type: 'number', required: true, enabled: true },
      { name: 'Cost Price', type: 'number', required: false, enabled: true },
      { name: 'Stock', type: 'number', required: true, enabled: true },
      { name: 'Min Stock', type: 'number', required: false, enabled: true },
      { name: 'Sizes', type: 'text', required: false, enabled: true },
      { name: 'Colors', type: 'text', required: false, enabled: true },
      { name: 'Brand', type: 'text', required: false, enabled: true },
      { name: 'Material', type: 'text', required: false, enabled: true },
      { name: 'Description', type: 'textarea', required: false, enabled: true }
    ]
    
    setCustomFields(defaultFields as Field[])
    
    try {
      await saveFieldsToDatabase(selectedBusinessType || 'default', defaultFields as Field[])
      showToast.success('Default fields added and saved!')
    } catch (error) {
      showToast.error('Default fields added but failed to save')
    }
  }

  const updateField = (index: number, field: Partial<Field>) => {
    const updatedFields = [...customFields]
    updatedFields[index] = { ...updatedFields[index], ...field }
    setCustomFields(updatedFields)
  }

  const removeField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  const saveFieldsToDatabase = async (businessType: string, fields: Field[]) => {
    const response = await fetch('/api/tenant-fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessType,
        fields
      })
    })
    return response.ok
  }

  const saveConfiguration = async () => {
    setLoading(true)
    try {
      const success = await saveFieldsToDatabase(selectedBusinessType, customFields)
      
      if (success) {
        showToast.success('Field configuration saved successfully!')
      } else {
        showToast.error('Failed to save configuration')
      }
    } catch (error) {
      showToast.error('Error saving configuration')
    } finally {
      setLoading(false)
    }
  }

















  const verifyPassword = async () => {
    setAuthLoading(true)
    try {
      const response = await fetch('/api/field-settings-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      
      if (response.ok) {
        setIsAuthenticated(true)
        showToast.success('Access granted')
      } else {
        showToast.error('Invalid password')
      }
    } catch (error) {
      showToast.error('Authentication failed')
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    fetchBusinessTypes()
  }, [])
  
  useEffect(() => {
    if (businessTypes.length > 0 && isAuthenticated) {
      fetchTenantFields()
    }
  }, [businessTypes, isAuthenticated])

  if (!isAuthenticated) {
    return (
      <MainLayout title="Field Configuration">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Protected Settings</CardTitle>
              <p className="text-sm text-gray-600">Enter password to access field configuration</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
                />
              </div>
              <Button 
                onClick={verifyPassword} 
                disabled={authLoading || !password}
                className="w-full"
              >
                {authLoading ? 'Verifying...' : 'Access Settings'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (businessTypes.length === 0) {
    return (
      <MainLayout title="Field Configuration">
        <div className="space-y-6">
          <BusinessTypeInitializer />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Field Configuration">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configure Your Inventory Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedBusinessType && selectedBusinessType !== 'none' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
                <h3 className="font-medium text-blue-900">
                  Currently Assigned Business Type: {businessTypes.find(bt => bt.id === selectedBusinessType)?.name || 'Unknown'}
                </h3>
              </div>
            )}



            {/* Field Configuration */}
            {selectedBusinessType && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label className="pb-2">Inventory Fields</Label>
                  <div className="flex space-x-2">
                    
                    {customFields.length === 0 && (
                      <Button variant="outline" onClick={addDefaultFields}>
                        <Package className="w-4 h-4 mr-2" />
                        Add Default Fields
                      </Button>
                    )}
                    <Button variant="outline" onClick={refreshFromTemplate}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Template
                    </Button>
                    <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Request New Field
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request New Field</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label className="pb-2">Field Name</Label>
                            <Input
                              value={requestForm.fieldName}
                              onChange={(e) => setRequestForm({...requestForm, fieldName: e.target.value})}
                              placeholder="e.g., Brand, Material, Season"
                            />
                          </div>
                          <div>
                            <Label className="pb-2">Field Type</Label>
                            <Select value={requestForm.fieldType} onValueChange={(value) => setRequestForm({...requestForm, fieldType: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="select">Dropdown</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="textarea">Description/Notes</SelectItem>
                                <SelectItem value="barcode">Barcode</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="phone">Phone</SelectItem>
                                <SelectItem value="url">Website/URL</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="pb-2">Description (Optional)</Label>
                            <Input
                              value={requestForm.description}
                              onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                              placeholder="Why do you need this field?"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>Cancel</Button>
                          <Button onClick={async () => {
                            if (!requestForm.fieldName.trim()) {
                              showToast.error('Field name is required')
                              return
                            }
                            try {
                              await fetch('/api/field-requests', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  fieldName: requestForm.fieldName,
                                  fieldType: requestForm.fieldType,
                                  description: requestForm.description,
                                  businessType: selectedBusinessType
                                })
                              })
                              showToast.success('Field request sent to admin!')
                              setIsRequestDialogOpen(false)
                              setRequestForm({ fieldName: '', fieldType: 'text', description: '' })
                            } catch (error) {
                              showToast.error('Failed to send request')
                            }
                          }}>Send Request</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {customFields.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Fields Configured</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Add fields to customize your inventory form. Start with default fields or create your own.
                    </p>
                    <div className="flex justify-center space-x-2">
                      <Button onClick={addDefaultFields}>
                        <Package className="w-4 h-4 mr-2" />
                        Add Default Fields
                      </Button>
                      <Button variant="outline" onClick={addCustomField}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Custom Field
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customFields.map((field, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-5 gap-4 items-center">
                            <div>
                              <Label className="pb-2">Field Name</Label>
                              <Input
                                value={field.name}
                                onChange={(e) => updateField(index, { name: e.target.value })}
                                placeholder="Field name"
                              />
                            </div>
                            <div>
                              <Label className="pb-2">Type</Label>
                              <Select value={field.type} onValueChange={(value: any) => updateField(index, { type: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="select">Dropdown</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                  <SelectItem value="textarea">Description/Notes</SelectItem>
                                  <SelectItem value="barcode">Barcode</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="phone">Phone</SelectItem>
                                  <SelectItem value="url">Website/URL</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={field.required}
                                onCheckedChange={(checked) => updateField(index, { required: checked })}
                              />
                              <Label className="pb-2">Required</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={field.enabled}
                                onCheckedChange={(checked) => updateField(index, { enabled: checked })}
                              />
                              <Label className="pb-2">Enabled</Label>
                            </div>
                            <div>
                              <Button variant="ghost" size="sm" onClick={() => removeField(index)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {field.type === 'select' && (
                            <div className="mt-3">
                              <Label className="pb-2">Options (comma separated)</Label>
                              <Input
                                value={field.options?.join(', ') || ''}
                                onChange={(e) => updateField(index, { 
                                  options: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                })}
                                placeholder="Option 1, Option 2, Option 3"
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Preview Section */}
                {customFields.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Form Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {customFields.filter(f => f.enabled).map((field, index) => (
                          <div key={index} className="space-y-2">
                            <Label>
                              {field.name}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            <div className="p-2 border rounded bg-gray-50 text-sm text-gray-600">
                              {field.type === 'select' ? `Dropdown: ${field.options?.join(', ') || 'No options'}` : 
                               field.type === 'textarea' ? 'Multi-line text input' :
                               field.type === 'date' ? 'Date picker' :
                               field.type === 'number' ? 'Number input' :
                               field.type === 'barcode' ? 'Barcode with generator' :
                               field.type === 'email' ? 'Email input' :
                               field.type === 'phone' ? 'Phone input' :
                               field.type === 'url' ? 'URL input' :
                               'Text input'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-600">
                    {customFields.length} field{customFields.length !== 1 ? 's' : ''} configured • {customFields.filter(f => f.enabled).length} enabled
                  </div>
                  <Button onClick={saveConfiguration} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
