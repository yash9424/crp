"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, TrendingUp, Users, DollarSign, Target, Download, Upload, Trash2, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { showToast } from "@/lib/toast"
import { FeatureGuard } from "@/components/feature-guard"
import { useLanguage } from "@/lib/language-context"

interface Employee {
  _id: string
  name: string
  employeeId: string
  commissionType: string
  commissionRate: number
  salesTarget: number
}

interface CommissionData {
  employeeId: string
  employeeName: string
  totalSales: number
  salesCount: number
  targetAchieved: number
  commissionEarned: number
  commissionType: string
}

export default function CommissionPage() {
  const { t, language } = useLanguage()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [commissionData, setCommissionData] = useState<CommissionData[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(true)
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([])
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [isClearAllOpen, setIsClearAllOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const result = await response.json()
        const data = result.data || result || []
        const employeesArray = Array.isArray(data) ? data : []
        setEmployees(employeesArray.filter((emp: Employee) => emp.commissionType !== 'none'))
      } else {
        setEmployees([])
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
      setEmployees([])
    }
  }

  const calculateCommissions = async () => {
    try {
      console.log('Calling commission API for month:', selectedMonth)
      const response = await fetch(`/api/commission-calculation?month=${selectedMonth}`)
      console.log('Commission API response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Commission data received:', data)
        console.log('Data type:', typeof data)
        console.log('Is array:', Array.isArray(data))
        
        // Handle debug responses
        if (data && typeof data === 'object' && data.debug) {
          console.log('Debug response:', data)
          alert(`Debug: ${data.debug}\n\nData: ${JSON.stringify(data, null, 2)}`)
        }
        
        setCommissionData(Array.isArray(data) ? data : [])
      } else {
        const error = await response.text()
        console.error('Commission API error:', error)
      }
    } catch (error) {
      console.error('Failed to calculate commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (employees.length > 0) {
      calculateCommissions()
    }
  }, [selectedMonth, employees])

  const getCommissionBadge = (type: string) => {
    if (type === 'percentage') {
      return <Badge variant="default">{t('percentOfSales')}</Badge>
    }
    return <Badge variant="outline">{t('none')}</Badge>
  }

  const totalCommissions = commissionData.reduce((sum, emp) => sum + emp.commissionEarned, 0)
  const totalSales = commissionData.reduce((sum, emp) => sum + emp.totalSales, 0)
  const avgCommission = commissionData.length > 0 ? totalCommissions / commissionData.length : 0

  if (loading) {
    return (
      <MainLayout title={t('commissionManagement')}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('calculatingCommissions')}</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title={t('commissionManagement')}>
      <FeatureGuard feature="hr">
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">{t('totalCommissions')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹ {totalCommissions.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">{t('totalSales')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹ {totalSales.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">{t('eligibleStaff')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employees.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">{t('avgCommission')}</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹ {Math.round(avgCommission).toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Commission Calculation */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('commissionCalculation')}</CardTitle>
                  <CardDescription>{t('calculateStaffCommissions')}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCommissions.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete ({selectedCommissions.length})
                    </Button>
                  )}
                  {selectedCommissions.length === 0 && (
                    <Button variant="destructive" size="sm" onClick={() => setIsClearAllOpen(true)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={async () => {
                    try {
                      const response = await fetch(`/api/commission/export?month=${selectedMonth}`)
                      if (response.ok) {
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `commissions_${selectedMonth}.csv`
                        a.click()
                        showToast.success('✅ Commissions exported successfully!')
                      }
                    } catch (error) {
                      showToast.error('❌ Failed to export commissions')
                    }
                  }}>
                    <Upload className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('commissionImportInput')?.click()} disabled={isImporting}>
                    <Download className="w-4 h-4 mr-2" />
                    {isImporting ? 'Importing...' : 'Import'}
                  </Button>
                  <input
                    id="commissionImportInput"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setIsImporting(true)
                      const formData = new FormData()
                      formData.append('file', file)
                      try {
                        const response = await fetch('/api/commission/import', {
                          method: 'POST',
                          body: formData
                        })
                        const result = await response.json()
                        if (response.ok) {
                          showToast.success(`✅ Imported ${result.imported} commission records successfully!`)
                          calculateCommissions()
                        } else {
                          showToast.error(result.error || '❌ Failed to import commissions')
                        }
                      } catch (error) {
                        showToast.error('❌ Error importing commissions')
                      } finally {
                        setIsImporting(false)
                        e.target.value = ''
                      }
                    }}
                  />
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const date = new Date()
                        date.setMonth(date.getMonth() - i)
                        const value = date.toISOString().slice(0, 7)
                        const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                        return (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <Button onClick={calculateCommissions}>
                    <Calculator className="w-4 h-4 mr-2" />
                    {t('recalculate')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {commissionData.length === 0 ? (
                <div className="text-center py-12">
                  <Calculator className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">{t('noCommissionData')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('noSalesDataFound')}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedCommissions.length === commissionData.length && commissionData.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCommissions(commissionData.map(c => c.employeeId))
                              } else {
                                setSelectedCommissions([])
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead className="text-center">{t('employee')}</TableHead>
                        <TableHead className="text-center">{t('commissionType')}</TableHead>
                        <TableHead className="text-center">{t('salesMade')}</TableHead>
                        <TableHead className="text-center">{t('totalSalesValue')}</TableHead>
                        <TableHead className="text-center">{t('targetProgress')}</TableHead>
                        <TableHead className="text-center">{t('commissionEarned')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionData.map((emp) => (
                        <TableRow key={emp.employeeId}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCommissions.includes(emp.employeeId)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCommissions([...selectedCommissions, emp.employeeId])
                                } else {
                                  setSelectedCommissions(selectedCommissions.filter(id => id !== emp.employeeId))
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <div>
                              <div className="font-medium">{emp.employeeName}</div>
                              <div className="text-sm text-muted-foreground">{emp.employeeId}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              {getCommissionBadge(emp.commissionType)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{emp.salesCount} {t('sales')}</TableCell>
                          <TableCell className="text-center">₹ {emp.totalSales.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="text-sm">{emp.targetAchieved}%</div>
                              {emp.targetAchieved >= 100 && <Target className="w-4 h-4 text-green-500" />}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-bold text-green-600">₹ {emp.commissionEarned.toLocaleString()}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bulk Delete Dialog */}
          <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Selected Commission Records</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {selectedCommissions.length} commission records? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsBulkDeleteOpen(false)
                  setSelectedCommissions([])
                }}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/commission/bulk-delete', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ employeeIds: selectedCommissions })
                      })
                      if (response.ok) {
                        showToast.success(`✅ Deleted ${selectedCommissions.length} commission records`)
                        setSelectedCommissions([])
                        calculateCommissions()
                      } else {
                        showToast.error('❌ Failed to delete commission records')
                      }
                    } catch (error) {
                      showToast.error('❌ Error deleting commission records')
                    }
                    setIsBulkDeleteOpen(false)
                  }}
                >
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Clear All Dialog */}
          <Dialog open={isClearAllOpen} onOpenChange={setIsClearAllOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <span>Clear All Commission Data</span>
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete <strong>ALL commission data</strong>? This action cannot be undone!
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsClearAllOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={async () => {
                  try {
                    const response = await fetch('/api/commission/clear', { method: 'DELETE' })
                    if (response.ok) {
                      showToast.success('✅ All commission data cleared!')
                      setSelectedCommissions([])
                      calculateCommissions()
                    } else {
                      showToast.error('❌ Failed to clear commission data')
                    }
                  } catch (error) {
                    showToast.error('❌ Error clearing commission data')
                  }
                  setIsClearAllOpen(false)
                }}>
                  Delete All
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </FeatureGuard>
    </MainLayout>
  )
}