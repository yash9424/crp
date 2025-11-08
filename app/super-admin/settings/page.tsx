"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { showToast } from "@/lib/toast"
import {
  Shield,
  Save,
  Eye,
  EyeOff,
} from "lucide-react"

export default function SuperAdminSettingsPage() {
  const [fieldSettingsPassword, setFieldSettingsPassword] = useState('vivekVOra32*')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const updateFieldSettingsPassword = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/super-admin-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldSettingsPassword })
      })
      
      if (response.ok) {
        const data = await response.json()
        showToast.success(data.message)
      } else {
        showToast.error('Failed to update password')
      }
    } catch (error) {
      showToast.error('Error updating password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Configuration
          </CardTitle>
          <CardDescription>Manage field settings password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fieldSettingsPassword">Field Settings Password</Label>
            <div className="relative">
              <Input 
                id="fieldSettingsPassword" 
                type={showPassword ? "text" : "password"}
                value={fieldSettingsPassword}
                onChange={(e) => setFieldSettingsPassword(e.target.value)}
                placeholder="Password for field configuration access"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">This password protects tenant field configuration settings</p>
          </div>

          <div className="flex justify-end">
            <Button onClick={updateFieldSettingsPassword} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}