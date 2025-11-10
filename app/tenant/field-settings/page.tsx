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
import { useLanguage } from "@/lib/language-context"

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
  const { t } = useLanguage()

  const fetchBusinessTypes = async () => {
    try {
      const response = await fetch('/api/business-types')
      if (response.ok) {
        const result = await response.json()
        const data = result.data || result || []
        const businessTypesArray = Array.isArray(data) ? data : []
        console.log('Business types fetched:', businessTypesArray)
        setBusinessTypes(businessTypesArray)
      } else {
        console.log('Business types response not ok:', response.status)
        setBusinessTypes([])
      }
    } catch (error) {
      console.error('Failed to fetch business types:', error)
      setBusinessTypes([])
    }
  }

  const handleBusinessTypeChange = async (businessTypeId: string) => {
    const businessType = businessTypes.find(bt => 
      bt.id === businessTypeId || 
      bt._id === businessTypeId ||
      bt.id === businessTypeId.toString() ||
      bt._id?.toString() === businessTypeId
    )
    if (businessType) {
      setSelectedBusinessType(businessTypeId)
      const newFields = businessType.fields?.map(field => ({
        ...field,
        enabled: true
      })) || []
      setCustomFields(newFields)
      
      try {
        await saveFieldsToDatabase(businessTypeId, newFields)
        showToast.success(t('businessTypeFieldsLoaded') || 'Business type fields loaded')
      } catch (error) {
        showToast.error(t('failedToSaveBusinessTypeFields') || 'Failed to save business type fields')
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
        const businessType = businessTypes.find(bt => 
          bt.id === businessTypeId || 
          bt._id === businessTypeId ||
          bt.id === businessTypeId.toString() ||
          bt._id?.toString() === businessTypeId
        )
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
    const businessType = businessTypes.find(bt => 
      bt.id === selectedBusinessType || 
      bt._id === selectedBusinessType ||
      bt.id === selectedBusinessType.toString() ||
      bt._id?.toString() === selectedBusinessType
    )
    if (businessType && businessType.fields) {
      const existingFieldNames = customFields.map(f => f.name)
      const newFields = businessType.fields.filter(f => !existingFieldNames.includes(f.name))
      
      const updatedFields = [
        ...customFields,
        ...newFields.map(field => ({ ...field, enabled: true }))
      ]
      
      setCustomFields(updatedFields)
      
      try {
        await saveFieldsToDatabase(selectedBusinessType, updatedFields)
        showToast.success(t('templateRefreshed') || 'Template refreshed')
      } catch (error) {
        showToast.error(t('templateRefreshedFailedSave') || 'Failed to save refreshed template')
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
      showToast.success(t('defaultFieldsAdded'))
    } catch (error) {
      showToast.error(t('defaultFieldsAddedFailedSave'))
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
        showToast.success(t('fieldConfigurationSaved'))
      } else {
        showToast.error(t('failedToSaveConfiguration'))
      }
    } catch (error) {
      showToast.error(t('errorSavingConfiguration'))
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
        showToast.success(t('accessGranted'))
      } else {
        showToast.error(t('invalidPassword'))
      }
    } catch (error) {
      showToast.error(t('error'))
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
      <MainLayout title={t('fieldConfiguration')}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>{t('protectedSettings')}</CardTitle>
              <p className="text-sm text-gray-600">{t('passwordRequired')}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className = "pb-2">{t('enterPassword')}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('enterPassword')}
                  onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
                />
              </div>
              <Button 
                onClick={verifyPassword} 
                disabled={authLoading || !password}
                className="w-full"
              >
                {authLoading ? t('loading') : t('accessSettings')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (businessTypes.length === 0) {
    return (
      <MainLayout title={t('fieldConfiguration') || 'Field Configuration'}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Initialize Business Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                No business types found. You need to initialize business types first.
              </p>
              <div className="flex space-x-2">
                <Button onClick={async () => {
                  try {
                    const response = await fetch('/api/init-business-types', { method: 'POST' })
                    if (response.ok) {
                      showToast.success('Business types initialized successfully!')
                      fetchBusinessTypes()
                    } else {
                      showToast.error('Failed to initialize business types')
                    }
                  } catch (error) {
                    showToast.error('Error initializing business types')
                  }
                }}>
                  Initialize Business Types
                </Button>
                <Button variant="outline" onClick={fetchBusinessTypes}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title={t('fieldConfiguration')}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('configureInventoryFields')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedBusinessType && selectedBusinessType !== 'none' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
                <h3 className="font-medium text-blue-900">
                  {t('currentlyAssignedBusinessType') || 'Currently Assigned Business Type'}: {(() => {
                    const businessType = businessTypes.find(bt => 
                      bt.id === selectedBusinessType || 
                      bt._id === selectedBusinessType ||
                      bt.id === selectedBusinessType.toString() ||
                      bt._id?.toString() === selectedBusinessType
                    )
                    return businessType?.name || 'Unknown'
                  })()}
                </h3>
              </div>
            )}



            {/* Field Configuration */}
            {selectedBusinessType && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label className="pb-2">{t('inventoryFields')}</Label>
                  <div className="flex space-x-2">
                    
                    {customFields.length === 0 && (
                      <Button variant="outline" onClick={addDefaultFields}>
                        <Package className="w-4 h-4 mr-2" />
                        {t('addDefaultFields')}
                      </Button>
                    )}
                    <Button variant="outline" onClick={refreshFromTemplate}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t('refreshTemplate')}
                    </Button>
                    <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          {t('requestNewField')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('requestNewField')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label className="pb-2">{t('fieldName')}</Label>
                            <Input
                              value={requestForm.fieldName}
                              onChange={(e) => setRequestForm({...requestForm, fieldName: e.target.value})}
                              placeholder={t('fieldNamePlaceholder')}
                            />
                          </div>
                          <div>
                            <Label className="pb-2">{t('fieldType')}</Label>
                            <Select value={requestForm.fieldType} onValueChange={(value) => setRequestForm({...requestForm, fieldType: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">{t('text')}</SelectItem>
                                <SelectItem value="number">{t('number')}</SelectItem>
                                <SelectItem value="select">{t('dropdown')}</SelectItem>
                                <SelectItem value="date">{t('date')}</SelectItem>
                                <SelectItem value="textarea">{t('descriptionNotes')}</SelectItem>
                                <SelectItem value="barcode">{t('barcode')}</SelectItem>
                                <SelectItem value="email">{t('email')}</SelectItem>
                                <SelectItem value="phone">{t('phone')}</SelectItem>
                                <SelectItem value="url">{t('websiteUrl')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="pb-2">{t('descriptionOptional')}</Label>
                            <Input
                              value={requestForm.description}
                              onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                              placeholder={t('whyNeedField')}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>{t('cancel')}</Button>
                          <Button onClick={async () => {
                            if (!requestForm.fieldName.trim()) {
                              showToast.error(t('fieldNameRequired'))
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
                              showToast.success(t('fieldRequestSent'))
                              setIsRequestDialogOpen(false)
                              setRequestForm({ fieldName: '', fieldType: 'text', description: '' })
                            } catch (error) {
                              showToast.error(t('failedToSendRequest'))
                            }
                          }}>{t('sendRequest')}</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {customFields.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noFieldsConfigured')}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {t('addFieldsToCustomize')}
                    </p>
                    <div className="flex justify-center space-x-2">
                      <Button onClick={addDefaultFields}>
                        <Package className="w-4 h-4 mr-2" />
                        {t('addDefaultFields')}
                      </Button>
                      <Button variant="outline" onClick={addCustomField}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('addCustomField')}
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
                              <Label className="pb-2">{t('fieldName')}</Label>
                              <Input
                                value={field.name}
                                onChange={(e) => updateField(index, { name: e.target.value })}
                                placeholder={t('fieldName')}
                              />
                            </div>
                            <div>
                              <Label className="pb-2">{t('fieldType')}</Label>
                              <Select value={field.type} onValueChange={(value: any) => updateField(index, { type: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">{t('text')}</SelectItem>
                                  <SelectItem value="number">{t('number')}</SelectItem>
                                  <SelectItem value="select">{t('dropdown')}</SelectItem>
                                  <SelectItem value="date">{t('date')}</SelectItem>
                                  <SelectItem value="textarea">{t('descriptionNotes')}</SelectItem>
                                  <SelectItem value="barcode">{t('barcode')}</SelectItem>
                                  <SelectItem value="email">{t('email')}</SelectItem>
                                  <SelectItem value="phone">{t('phone')}</SelectItem>
                                  <SelectItem value="url">{t('websiteUrl')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={field.required}
                                onCheckedChange={(checked) => updateField(index, { required: checked })}
                              />
                              <Label className="pb-2">{t('required')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={field.enabled}
                                onCheckedChange={(checked) => updateField(index, { enabled: checked })}
                              />
                              <Label className="pb-2">{t('enabled')}</Label>
                            </div>
                            <div>
                              <Button variant="ghost" size="sm" onClick={() => removeField(index)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {field.type === 'select' && (
                            <div className="mt-3">
                              <Label className="pb-2">{t('options')}</Label>
                              <Input
                                value={field.options?.join(', ') || ''}
                                onChange={(e) => updateField(index, { 
                                  options: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                })}
                                placeholder={t('optionsPlaceholder')}
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
                      <CardTitle className="text-lg">{t('formPreview')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {customFields.filter(f => f.enabled).map((field, index) => (
                          <div key={index} className="space-y-2">
                            <Label className = "pb-2">
                              {field.name}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            <div className="p-2 border rounded bg-gray-50 text-sm text-gray-600">
                              {field.type === 'select' ? `${t('dropdown')}: ${field.options?.join(', ') || t('noOptions')}` : 
                               field.type === 'textarea' ? t('multiLineTextInput') :
                               field.type === 'date' ? t('datePicker') :
                               field.type === 'number' ? t('numberInput') :
                               field.type === 'barcode' ? t('barcodeWithGenerator') :
                               field.type === 'email' ? t('emailInput') :
                               field.type === 'phone' ? t('phoneInput') :
                               field.type === 'url' ? t('urlInput') :
                               t('textInput')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-600">
                    {customFields.length} {t('fieldsConfigured')} • {customFields.filter(f => f.enabled).length} {t('fieldsEnabled')}
                  </div>
                  <Button onClick={saveConfiguration} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? t('saving') : t('saveConfiguration')}
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
