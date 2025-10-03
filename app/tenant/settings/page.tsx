"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Store, Percent } from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    storeName: '',
    address: '',
    phone: '',
    email: '',
    gst: '',
    taxRate: 10,
    gstRate: 18,
    terms: '',
    billPrefix: 'BILL',
    billCounter: 1,
    whatsappMessage: '',
    deletePassword: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
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
        alert('Settings saved successfully!')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
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
              <Label htmlFor="deletePassword">Delete Password</Label>
              <Input
                id="deletePassword"
                type="password"
                value={settings.deletePassword || ''}
                onChange={(e) => setSettings({...settings, deletePassword: e.target.value})}
                placeholder="Set password for deleting bills"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Percent className="w-5 h-5" />
              <span>Tax Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({...settings, taxRate: parseFloat(e.target.value) || 0})}
                  placeholder="Enter tax rate"
                />
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