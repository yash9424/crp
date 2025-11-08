"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Settings, Store } from "lucide-react"
import { showToast } from "@/lib/toast"

interface Field {
  name: string
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'barcode' | 'email' | 'phone' | 'url'
  required: boolean
  options?: string[]
}

interface BusinessType {
  id: string
  name: string
  description: string
  fields: Field[]
}

export default function BusinessTypesPage() {
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<BusinessType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [] as Field[]
  })

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

  const createBusinessType = async () => {
    try {
      const response = await fetch('/api/business-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        fetchBusinessTypes()
        setIsAddDialogOpen(false)
        resetForm()
        showToast.success('Business type created successfully!')
      }
    } catch (error) {
      showToast.error('Failed to create business type')
    }
  }

  const addField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { name: '', type: 'text', required: false }]
    })
  }

  const updateField = (index: number, field: Partial<Field>) => {
    const updatedFields = [...formData.fields]
    updatedFields[index] = { ...updatedFields[index], ...field }
    setFormData({ ...formData, fields: updatedFields })
  }

  const removeField = (index: number) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((_, i) => i !== index)
    })
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', fields: [] })
    setEditingType(null)
  }

  const openEditDialog = (businessType: BusinessType) => {
    setEditingType(businessType)
    setFormData({
      name: businessType.name,
      description: businessType.description,
      fields: [...businessType.fields]
    })
    setIsEditDialogOpen(true)
  }

  const updateBusinessType = async () => {
    if (!editingType) return

    try {
      const response = await fetch(`/api/business-types/${editingType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        fetchBusinessTypes()
        setIsEditDialogOpen(false)
        resetForm()
        showToast.success('Business type updated successfully!')
      }
    } catch (error) {
      showToast.error('Failed to update business type')
    }
  }

  const deleteBusinessType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this business type?')) return

    try {
      const response = await fetch(`/api/business-types/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchBusinessTypes()
        showToast.success('Business type deleted successfully!')
      }
    } catch (error) {
      showToast.error('Failed to delete business type')
    }
  }

  useEffect(() => {
    fetchBusinessTypes()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Store className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Business Types</h1>
            <p className="text-muted-foreground">Manage retail store categories and templates</p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Business Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-semibold">Create Business Type Template</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Define custom fields for this business type</p>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-1 py-4">
              <div className="space-y-6">
              <div>
                <Label className="pb-2">Business Type Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Clothing Store, Supermarket"
                />
              </div>
              <div>
                <Label className="pb-2">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this business type"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-lg font-medium">Custom Fields</Label>
                  <Button variant="outline" onClick={addField}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-3 pr-2 border rounded-lg p-4 bg-gray-50">
                  {formData.fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No custom fields added yet</p>
                      <p className="text-xs">Click "Add Field" to create your first field</p>
                    </div>
                  ) : (
                    formData.fields.map((field, index) => (
                      <div key={index} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-900">Field {index + 1}</h4>
                          <Button variant="ghost" size="sm" onClick={() => removeField(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Field Name</Label>
                            <Input
                              value={field.name}
                              onChange={(e) => updateField(index, { name: e.target.value })}
                              placeholder="e.g., Size, Color, Brand"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Field Type</Label>
                            <Select value={field.type} onValueChange={(value: any) => updateField(index, { type: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">📝 Text</SelectItem>
                                <SelectItem value="number">🔢 Number</SelectItem>
                                <SelectItem value="select">📋 Dropdown</SelectItem>
                                <SelectItem value="date">📅 Date</SelectItem>
                                <SelectItem value="textarea">📄 Description/Notes</SelectItem>
                                <SelectItem value="barcode">🏷️ Barcode</SelectItem>
                                <SelectItem value="email">📧 Email</SelectItem>
                                <SelectItem value="phone">📞 Phone</SelectItem>
                                <SelectItem value="url">🌐 Website/URL</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-3">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <Label className="text-sm font-medium text-gray-700">This field is required</Label>
                        </div>
                        {field.type === 'select' && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <Label className="text-sm font-medium text-gray-700">Dropdown Options</Label>
                            <Input
                              value={field.options?.join(', ') || ''}
                              onChange={(e) => updateField(index, { 
                                options: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                              })}
                              placeholder="Small, Medium, Large, XL"
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">Separate options with commas</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t bg-gray-50 px-6 py-4 -mx-6 -mb-6">
              <div className="text-sm text-muted-foreground">
                {formData.fields.length} custom field{formData.fields.length !== 1 ? 's' : ''} added
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createBusinessType} disabled={!formData.name.trim()}>
                  Create Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Type Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {businessTypes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Store className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No business types yet</h3>
              <p className="text-muted-foreground mb-4">Create your first business type template to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {businessTypes.map((type) => (
                <Card key={type.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Store className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(type)}>
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteBusinessType(type.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{type.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{type.description}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {type.fields.length} custom fields
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">Edit Business Type Template</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Modify custom fields for this business type</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1 py-4">
            <div className="space-y-6">
            <div>
              <Label className="pb-2">Business Type Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Clothing Store, Supermarket"
              />
            </div>
            <div>
              <Label className="pb-2">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this business type"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <Label className="text-lg font-medium">Custom Fields</Label>
                <Button variant="outline" onClick={addField}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-3 pr-2 border rounded-lg p-4 bg-gray-50">
                {formData.fields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No custom fields added yet</p>
                    <p className="text-xs">Click "Add Field" to create your first field</p>
                  </div>
                ) : (
                  formData.fields.map((field, index) => (
                    <div key={index} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">Field {index + 1}</h4>
                        <Button variant="ghost" size="sm" onClick={() => removeField(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Field Name</Label>
                          <Input
                            value={field.name}
                            onChange={(e) => updateField(index, { name: e.target.value })}
                            placeholder="e.g., Size, Color, Brand"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Field Type</Label>
                          <Select value={field.type} onValueChange={(value: any) => updateField(index, { type: value })}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">📝 Text</SelectItem>
                              <SelectItem value="number">🔢 Number</SelectItem>
                              <SelectItem value="select">📋 Dropdown</SelectItem>
                              <SelectItem value="date">📅 Date</SelectItem>
                              <SelectItem value="textarea">📄 Description/Notes</SelectItem>
                              <SelectItem value="barcode">🏷️ Barcode</SelectItem>
                              <SelectItem value="email">📧 Email</SelectItem>
                              <SelectItem value="phone">📞 Phone</SelectItem>
                              <SelectItem value="url">🌐 Website/URL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-3">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label className="text-sm font-medium text-gray-700">This field is required</Label>
                      </div>
                      {field.type === 'select' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <Label className="text-sm font-medium text-gray-700">Dropdown Options</Label>
                          <Input
                            value={field.options?.join(', ') || ''}
                            onChange={(e) => updateField(index, { 
                              options: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                            })}
                            placeholder="Small, Medium, Large, XL"
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">Separate options with commas</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t bg-gray-50 px-6 py-4 -mx-6 -mb-6">
            <div className="text-sm text-muted-foreground">
              {formData.fields.length} custom field{formData.fields.length !== 1 ? 's' : ''} configured
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateBusinessType} disabled={!formData.name.trim()}>
                Update Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}