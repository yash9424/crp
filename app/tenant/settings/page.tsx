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
import { useLanguage } from "@/lib/language-context"

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
  const { t } = useLanguage()

  const fetchSettings = async () => {
    try {
      const [settingsResponse, businessTypesResponse, tenantResponse] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/business-types'),
        fetch('/api/tenant-features')
      ])
      
      if (settingsResponse.ok) {
        const data = await settingsResponse.json()
        console.log('Settings data:', data)
        setSettings(data)
      }
      
      if (businessTypesResponse.ok) {
        const businessTypesResult = await businessTypesResponse.json()
        const businessTypesData = businessTypesResult.data || businessTypesResult
        console.log('Business types data:', businessTypesData)
        setBusinessTypes(Array.isArray(businessTypesData) ? businessTypesData : [])
      } else {
        console.log('Business types response not ok:', businessTypesResponse.status)
        setBusinessTypes([])
      }
      
      if (tenantResponse.ok) {
        const tenantData = await tenantResponse.json()
        console.log('Tenant features data:', tenantData)
        if (tenantData.businessType) {
          setSettings(prev => ({ ...prev, businessType: tenantData.businessType }))
        }
      } else {
        console.log('Tenant response not ok:', tenantResponse.status)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setBusinessTypes([])
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
        showToast.success(t('saveSuccess'))
      } else {
        showToast.error(t('saveError'))
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      showToast.error(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  if (loading) {
    return (
      <MainLayout title={t('settings')}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('loading')}</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title={t('settings')}>
      <FeatureGuard feature="settings">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Store className="w-5 h-5" />
              <span>{t('settings')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">{t('storeName')}</Label>
              <Input
                id="storeName"
                value={settings.storeName}
                onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                placeholder={t('storeName')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t('storeAddress')}</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                placeholder={t('storeAddress')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phoneNumber')}</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings({...settings, phone: e.target.value})}
                  placeholder={t('enterPhoneNumber')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  value={settings.email}
                  onChange={(e) => setSettings({...settings, email: e.target.value})}
                  placeholder={t('enterEmail')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst">{t('gstNumber')}</Label>
              <Input
                id="gst"
                value={settings.gst}
                onChange={(e) => setSettings({...settings, gst: e.target.value})}
                placeholder={t('enterGstNumber')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billPrefix">{t('billPrefix')}</Label>
                <Input
                  id="billPrefix"
                  value={settings.billPrefix}
                  onChange={(e) => setSettings({...settings, billPrefix: e.target.value})}
                  placeholder={t('enterBillPrefix')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billCounter">{t('nextBillNumber')}</Label>
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
              <Label htmlFor="terms">{t('termsConditions')}</Label>
              <textarea
                id="terms"
                value={settings.terms}
                onChange={(e) => setSettings({...settings, terms: e.target.value})}
                placeholder={t('enterTermsConditions')}
                className="w-full p-2 border rounded-md h-20 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappMessage">{t('customWhatsappMessage')}</Label>
              <textarea
                id="whatsappMessage"
                value={settings.whatsappMessage}
                onChange={(e) => setSettings({...settings, whatsappMessage: e.target.value})}
                placeholder={t('customMessageAfterThankYou')}
                className="w-full p-2 border rounded-md h-16 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billFormat">{t('billFormat')}</Label>
              <select
                id="billFormat"
                value={settings.billFormat}
                onChange={(e) => setSettings({...settings, billFormat: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="professional">{t('professionalInvoiceFormat')}</option>
                <option value="simple">{t('simpleReceiptFormat')}</option>
              </select>
              <p className="text-sm text-muted-foreground">
                {t('chooseBillFormat')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">{t('businessTypeAssigned')}</Label>
              <Input
                id="businessType"
                value={(() => {
                  if (!settings.businessType || settings.businessType === 'none') {
                    return t('noTemplateAssigned') || 'No Template Assigned'
                  }
                  if (!Array.isArray(businessTypes) || businessTypes.length === 0) {
                    return 'Loading...'
                  }
                  const businessType = businessTypes.find(bt => 
                    bt.id === settings.businessType || 
                    bt._id === settings.businessType ||
                    bt.id === settings.businessType.toString() ||
                    bt._id?.toString() === settings.businessType
                  )
                  return businessType?.name || `Unknown (ID: ${settings.businessType})`
                })()}
                readOnly
                className="w-full p-2 border rounded-md bg-gray-50 cursor-not-allowed"
              />
              <p className="text-sm text-muted-foreground">
                {t('businessTypeCannotChange') || 'Business type is assigned by super admin and cannot be changed'}
              </p>
              {settings.businessType && settings.businessType !== 'none' && Array.isArray(businessTypes) && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  {(() => {
                    const businessType = businessTypes.find(bt => 
                      bt.id === settings.businessType || 
                      bt._id === settings.businessType ||
                      bt.id === settings.businessType.toString() ||
                      bt._id?.toString() === settings.businessType
                    )
                    return businessType?.description || 'No description available'
                  })()}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deletePassword">{t('deletePassword')}</Label>
              <div className="relative">
                <Input
                  id="deletePassword"
                  type={showPassword ? "text" : "password"}
                  value={settings.deletePassword || ''}
                  onChange={(e) => setSettings({...settings, deletePassword: e.target.value})}
                  placeholder={t('setPasswordForDeleting')}
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
              <span>{t('taxPricingSettings')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">{t('taxRate')}</Label>
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
                    {t('enableTextMinusMode')}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('textMinusModeDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={saveSettings} disabled={saving} className="w-full">
          <Settings className="w-4 h-4 mr-2" />
          {saving ? t('loading') : t('save')}
        </Button>
      </div>
      </FeatureGuard>
    </MainLayout>
  )
}