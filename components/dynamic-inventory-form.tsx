"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Package } from "lucide-react"

interface Field {
  name: string
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'barcode' | 'email' | 'phone' | 'url'
  required: boolean
  enabled: boolean
  options?: string[]
}

interface DynamicInventoryFormProps {
  formData: Record<string, any>
  setFormData: (data: Record<string, any>) => void
}

export function DynamicInventoryForm({ formData, setFormData }: DynamicInventoryFormProps) {
  const [fields, setFields] = useState<Field[]>([])
  const [dropdownData, setDropdownData] = useState<Record<string, string[]>>({})

  const fetchTenantFields = async () => {
    try {
      const [fieldsResponse, dropdownResponse] = await Promise.all([
        fetch('/api/tenant-fields'),
        fetch('/api/dropdown-data')
      ])
      
      if (fieldsResponse.ok) {
        const data = await fieldsResponse.json()
        setFields(data.fields?.filter((f: Field) => f.enabled) || [])
      } else {
        console.error('Failed to fetch tenant fields, status:', fieldsResponse.status)
        setFields([])
      }
      
      if (dropdownResponse.ok) {
        const dropdownData = await dropdownResponse.json()
        setDropdownData(dropdownData)
      } else {
        console.error('Failed to fetch dropdown data')
        setDropdownData({})
      }
    } catch (error) {
      console.error('Failed to fetch tenant fields:', error)
      setFields([])
      setDropdownData({})
    }
  }

  const updateFormData = (fieldName: string, value: any) => {
    const fieldKey = fieldName.toLowerCase().replace(/\s+/g, '_')
    const newFormData = { 
      ...formData, 
      [fieldKey]: value,
      [fieldName]: value,
      [fieldName.toLowerCase()]: value
    }
    setFormData(newFormData)
  }

  const renderField = (field: Field) => {
    const fieldKey = field.name.toLowerCase().replace(/\s+/g, '_')
    const fieldValue = formData[fieldKey] || 
                      formData[field.name] || 
                      formData[field.name.toLowerCase()] || 
                      formData[field.name.replace(/\s+/g, '')] ||
                      ''
    
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={fieldValue}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
          />
        )
      
      case 'number':
        return (
          <Input
            type="number"
            step="0.01"
            value={fieldValue}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
          />
        )
      
      case 'select':
        const options = dropdownData[fieldKey] || dropdownData[field.name.toLowerCase()] || field.options || []
        return (
          <Select 
            value={fieldValue} 
            onValueChange={(value) => updateFormData(field.name, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.name}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'date':
        return (
          <Input
            type="date"
            value={fieldValue}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            required={field.required}
          />
        )
      
      case 'textarea':
        return (
          <Textarea
            value={fieldValue}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
            className="min-h-[80px]"
          />
        )
      
      case 'barcode':
        return (
          <div className="flex space-x-2">
            <Input
              value={fieldValue}
              onChange={(e) => updateFormData(field.name, e.target.value)}
              placeholder="Barcode Number"
              required={field.required}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => {
                const newBarcode = `FS${Date.now()}`
                updateFormData(field.name, newBarcode)
              }}
              className="px-3 py-2 border rounded hover:bg-gray-50 text-sm whitespace-nowrap"
            >
              Generate
            </button>
          </div>
        )
      
      case 'email':
        return (
          <Input
            type="email"
            value={fieldValue}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
          />
        )
      
      case 'phone':
        return (
          <Input
            type="tel"
            value={fieldValue}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
          />
        )
      
      case 'url':
        return (
          <Input
            type="url"
            value={fieldValue}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
          />
        )
      
      default:
        return null
    }
  }

  useEffect(() => {
    fetchTenantFields()
  }, [])

  if (fields.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Fields Configured</h3>
        <p className="text-sm text-gray-500 mb-4">
          Configure inventory fields first in field settings.
        </p>
        <a 
          href="/tenant/field-settings" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Configure Fields
        </a>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.name}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderField(field)}
        </div>
      ))}
    </div>
  )
}