"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, Settings, Package, ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"

interface SetupStep {
  id: string
  title: string
  description: string
  completed: boolean
  action?: () => void
  actionText?: string
}

export function InventorySetupGuide() {
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'business-type',
      title: 'Choose Business Type',
      description: 'Select a business type template that matches your store',
      completed: false,
      action: () => window.location.href = '/tenant/field-settings',
      actionText: 'Configure Fields'
    },
    {
      id: 'configure-fields',
      title: 'Configure Inventory Fields',
      description: 'Customize the fields that appear in your inventory form',
      completed: false,
      action: () => window.location.href = '/tenant/field-settings',
      actionText: 'Setup Fields'
    },
    {
      id: 'add-products',
      title: 'Add Your First Product',
      description: 'Start adding products to your inventory',
      completed: false,
      actionText: 'Add Product'
    }
  ])

  const checkSetupStatus = async () => {
    try {
      // Check if tenant has configured fields
      const fieldsResponse = await fetch('/api/tenant-fields')
      const fieldsData = await fieldsResponse.json()
      
      const hasFields = fieldsData.fields && fieldsData.fields.length > 0
      const hasBusinessType = fieldsData.businessType && fieldsData.businessType !== 'none'
      
      // Check if tenant has products
      const inventoryResponse = await fetch('/api/inventory')
      const inventoryData = await inventoryResponse.json()
      const hasProducts = inventoryData && inventoryData.length > 0
      
      setSteps(prev => prev.map(step => ({
        ...step,
        completed: 
          step.id === 'business-type' ? hasBusinessType :
          step.id === 'configure-fields' ? hasFields :
          step.id === 'add-products' ? hasProducts :
          false
      })))
    } catch (error) {
      console.error('Failed to check setup status:', error)
    }
  }

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const completedSteps = steps.filter(step => step.completed).length
  const totalSteps = steps.length

  if (completedSteps === totalSteps) {
    return null // Don't show guide if setup is complete
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-blue-900">Inventory Setup Guide</CardTitle>
          <Badge variant="outline" className="text-blue-700 border-blue-300">
            {completedSteps}/{totalSteps} Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${step.completed ? 'text-green-700' : 'text-gray-900'}`}>
                  {step.title}
                </h4>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
              {!step.completed && step.action && (
                <Button size="sm" variant="outline" onClick={step.action}>
                  {step.actionText}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          ))}
        </div>
        
        {completedSteps < totalSteps && (
          <div className="mt-6 p-4 bg-blue-100 rounded-lg">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Next Step: {steps.find(s => !s.completed)?.title}
              </span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              {steps.find(s => !s.completed)?.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}