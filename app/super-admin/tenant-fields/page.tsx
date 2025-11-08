"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, Save, Package } from "lucide-react"
import { showToast } from "@/lib/toast"

interface Field {
  name: string
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'barcode' | 'email' | 'phone' | 'url'
  required: boolean
  enabled: boolean
  options?: string[]
}

interface Tenant {
  id: string
  name: string
  email: string
}

export default function TenantFieldsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [fields, setFields] = useState<Field[]>([])
  const [businessTypes, setBusinessTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/super-admin/tenants')
      if (response.ok) {
        const data = await response.json()
        setTenants(data)
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
    }
  }

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

  const fetchTenantFields = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/super-admin/tenant-fields/${tenantId}`)
      if (response.ok) {
        const data = await response.json()
        setFields(data.fields || [])
      }
    } catch (error) {
      console.error('Failed to fetch tenant fields:', error)
    }
  }

  const addField = () => {
    setFields([...fields, { name: '', type: 'text', required: false, enabled: true }])
  }

  const updateField = (index: number, field: Partial<Field>) => {
    const updatedFields = [...fields]
    updatedFields[index] = { ...updatedFields[index], ...field }
    setFields(updatedFields)
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const loadBusinessTypeFields = (businessTypeId: string) => {
    const businessType = businessTypes.find(bt => bt.id === businessTypeId)
    if (businessType) {
      const newFields = businessType.fields.filter((f: Field) => !fields.some(cf => cf.name === f.name))
      if (newFields.length > 0) {
        setFields([...fields, ...newFields.map((f: Field) => ({ ...f, enabled: true }))])
        showToast.success(`Added ${newFields.length} fields from ${businessType.name}`)
      } else {
        showToast.success('All fields from this template are already added')
      }
    }
  }

  const saveFields = async () => {
    if (!selectedTenant) {
      showToast.error('Please select a tenant')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/super-admin/tenant-fields/${selectedTenant}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      })

      if (response.ok) {
        showToast.success('Fields saved successfully!')
      } else {
        showToast.error('Failed to save fields')
      }
    } catch (error) {
      showToast.error('Error saving fields')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
    fetchBusinessTypes()
  }, [])

  useEffect(() => {
    if (selectedTenant) {
      fetchTenantFields(selectedTenant)
    }
  }, [selectedTenant])

  return (
    <MainLayout title="Manage Tenant Fields">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assign Inventory Fields to Tenants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tenant Selection */}
            <div>
              <Label className="pb-2">Select Tenant</Label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTenant && (
              <>
                {/* Business Type Templates */}
                <div>
                  <Label className="pb-2">Load Fields from Business Type</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    {businessTypes.map((type) => (
                      <Card key={type.id} className="cursor-pointer hover:bg-gray-50" onClick={() => loadBusinessTypeFields(type.id)}>
                        <CardContent className="p-4">
                          <h3 className="font-medium text-sm">{type.name}</h3>
                          <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                          <div className="text-xs text-blue-600 mt-2">
                            {type.fields?.length || 0} fields
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Field Management */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="pb-2">Inventory Fields</Label>
                    <Button variant="outline" onClick={addField}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Field
                    </Button>
                  </div>

                  {fields.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Fields Configured</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Add fields or load from business type templates
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {fields.map((field, index) => (
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

                  <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-gray-600">
                      {fields.length} field{fields.length !== 1 ? 's' : ''} configured • {fields.filter(f => f.enabled).length} enabled
                    </div>
                    <Button onClick={saveFields} disabled={loading}>
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Fields'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}