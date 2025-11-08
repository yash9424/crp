"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Store, Percent, Eye, EyeOff } from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"
import { showToast } from "@/lib/toast"

interface BusinessType {
  id: string
  name: string
  description: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    storeName: '',
    address: '',
    phone: '',
    email: '',
    gst: '',
    taxRate: 0,
    gstRate: 18,
    terms: '',
    billPrefix: 'BILL',
    billCounter: 1,
    whatsappMessage: '',
    deletePassword: '',
    discountMode: false,
    billFormat: 'professional',
    businessType: 'none'
  })
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const fetchSettings = async () => {
    try {
      const [settingsResponse, businessTypesResponse, tenantResponse] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/business-types'),
        fetch('/api/tenant-features')
      ])
      
      if (settingsResponse.ok) {
        const data = await settingsResponse.json()
        setSettings(data)
      }
      
      if (businessTypesResponse.ok) {
        const businessTypesData = await businessTypesResponse.json()
        setBusinessTypes(businessTypesData)
      }
      
      if (tenantResponse.ok) {
        const tenantData = await tenantResponse.json()
        if (tenantData.businessType) {
          setSettings(prev => ({ ...prev, businessType: tenantData.businessType }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (response.ok) {
        const updatedSettings = await response.json()
        setSettings(updatedSettings)
        showToast.success('Settings saved successfully!')
      } else {
        showToast.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      showToast.error('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  if (loading) {
    return (
      <MainLayout title="Settings" userRole="tenant-admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading settings...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Store Settings" userRole="tenant-admin">
      <FeatureGuard feature="settings">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Store className="w-5 h-5" />
              <span>Store Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={settings.storeName}
                onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                placeholder="Enter store name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Store Address</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                placeholder="Enter store address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings({...settings, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={settings.email}
                  onChange={(e) => setSettings({...settings, email: e.target.value})}
                  placeholder="Enter email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst">GST Number</Label>
              <Input
                id="gst"
                value={settings.gst}
                onChange={(e) => setSettings({...settings, gst: e.target.value})}
                placeholder="Enter GST number"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billPrefix">Bill Number Prefix</Label>
                <Input
                  id="billPrefix"
                  value={settings.billPrefix}
                  onChange={(e) => setSettings({...settings, billPrefix: e.target.value})}
                  placeholder="Enter bill prefix (e.g., TT)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billCounter">Next Bill Number</Label>
                <Input
                  id="billCounter"
                  type="number"
                  value={settings.billCounter}
                  onChange={(e) => setSettings({...settings, billCounter: parseInt(e.target.value) || 1})}
                  placeholder="001"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms">Terms & Conditions</Label>
              <textarea
                id="terms"
                value={settings.terms}
                onChange={(e) => setSettings({...settings, terms: e.target.value})}
                placeholder="Enter terms and conditions for bills"
                className="w-full p-2 border rounded-md h-20 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappMessage">Custom WhatsApp Message</Label>
              <textarea
                id="whatsappMessage"
                value={settings.whatsappMessage}
                onChange={(e) => setSettings({...settings, whatsappMessage: e.target.value})}
                placeholder="Custom message to add after 'Thank you for your business!' in WhatsApp"
                className="w-full p-2 border rounded-md h-16 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billFormat">Bill Format for WhatsApp</Label>
              <select
                id="billFormat"
                value={settings.billFormat}
                onChange={(e) => setSettings({...settings, billFormat: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="professional">Professional Invoice Format</option>
                <option value="simple">Simple Receipt Format</option>
              </select>
              <p className="text-sm text-muted-foreground">
                Choose the bill format to send via WhatsApp. Professional format includes table layout, Simple format is basic receipt style.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type (Assigned by Super Admin)</Label>
              <Input
                id="businessType"
                value={settings.businessType === 'none' ? 'No Template Assigned' : businessTypes.find(t => t.id === settings.businessType)?.name || 'Unknown'}
                readOnly
                className="w-full p-2 border rounded-md bg-gray-50 cursor-not-allowed"
              />
              <p className="text-sm text-muted-foreground">
                Business type is assigned by Super Admin and cannot be changed from here.
              </p>
              {settings.businessType && settings.businessType !== 'none' && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  {businessTypes.find(t => t.id === settings.businessType)?.description}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deletePassword">Delete Password</Label>
              <div className="relative">
                <Input
                  id="deletePassword"
                  type={showPassword ? "text" : "password"}
                  value={settings.deletePassword || ''}
                  onChange={(e) => setSettings({...settings, deletePassword: e.target.value})}
                  placeholder="Set password for deleting bills"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Percent className="w-5 h-5" />
              <span>Tax & Pricing Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({...settings, taxRate: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="discountMode"
                    checked={settings.discountMode}
                    onChange={(e) => setSettings({...settings, discountMode: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="discountMode" className="cursor-pointer">
                    Enable Text Minus Mode
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  When ON: Shows "text minus" in product pricing.
                  When OFF: Shows normal pricing without text minus.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={saveSettings} disabled={saving} className="w-full">
          <Settings className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
      </FeatureGuard>
    </MainLayout>
  )
}