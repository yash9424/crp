"use client"

import { useState, useEffect } from "react"
import jsPDF from 'jspdf'
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Download, Calculator, Users, Upload, Trash2, X } from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"
import { useLanguage } from "@/lib/language-context"
import { showToast } from "@/lib/toast"

interface SalaryData {
  employeeId: string
  employeeName: string
  baseSalary: number
  workingDays: number
  leaveDays: number
  effectiveSalary: number
}

export default function SalaryPage() {
  const { t } = useLanguage()
  const [salaryData, setSalaryData] = useState<SalaryData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedSalaries, setSelectedSalaries] = useState<string[]>([])
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [isClearAllOpen, setIsClearAllOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const calculateSalary = async () => {
    try {
      const currentYear = new Date().getFullYear()
      const response = await fetch(`/api/salary/calculate?month=${selectedMonth}&year=${currentYear}`)
      if (response.ok) {
        const data = await response.json()
        setSalaryData(data)
      }
    } catch (error) {
      console.error('Failed to calculate salary:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadSalarySlip = async (employeeId: string) => {
    try {
      const currentYear = new Date().getFullYear()
      const response = await fetch(`/api/salary/slip?employeeId=${employeeId}&month=${selectedMonth}&year=${currentYear}`)
      if (response.ok) {
        const data = await response.json()
        
        const pdf = new jsPDF()
        
        // Border
        pdf.setLineWidth(1)
        pdf.rect(10, 10, 190, 270)
        
        // Store Header
        pdf.setFontSize(18)
        pdf.setFont('helvetica', 'bold')
        pdf.text(data.storeName || 'FASHION STORE', 105, 22, { align: 'center' })
        
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        if (data.address) pdf.text(data.address, 105, 28, { align: 'center' })
        if (data.phone) pdf.text(`Ph: ${data.phone}`, 80, 34, { align: 'center' })
        if (data.gst) pdf.text(`GST: ${data.gst}`, 130, 34, { align: 'center' })
        
        // Title Box
        pdf.setFillColor(240, 240, 240)
        pdf.rect(15, 40, 180, 12, 'F')
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('SALARY SLIP', 105, 48, { align: 'center' })
        
        pdf.setFontSize(10)
        pdf.text(`${new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`, 105, 58, { align: 'center' })
        
        // Employee Info
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')
        pdf.text('EMPLOYEE DETAILS', 15, 70)
        
        pdf.setFont('helvetica', 'normal')
        pdf.text(`Name: ${data.employeeName}`, 15, 78)
        pdf.text(`ID: ${data.employeeId}`, 15, 84)
        pdf.text(`Dept: ${data.department || 'Sales'}`, 110, 78)
        pdf.text(`Position: ${data.position || 'Staff'}`, 110, 84)
        
        // Salary Details
        pdf.line(15, 90, 195, 90)
        pdf.setFont('helvetica', 'bold')
        pdf.text('PARTICULARS', 15, 98)
        pdf.text('AMOUNT', 170, 98)
        pdf.line(15, 100, 195, 100)
        
        pdf.setFont('helvetica', 'normal')
        let y = 108
        
        pdf.text('Basic Salary', 15, y)
        pdf.text(` ${data.baseSalary.toLocaleString()}`, 170, y)
        y += 8
        
        pdf.text('Working Days (30)', 15, y)
        pdf.text(`${data.workingDays}`, 170, y)
        y += 8
        
        pdf.text('Leave Days', 15, y)
        pdf.text(`${data.leaveDays}`, 170, y)
        y += 8
        
        pdf.text('Leave Deduction', 15, y)
        pdf.text(` ${data.deduction.toLocaleString()}`, 170, y)
        y += 12
        
        // Net Salary
        pdf.line(15, y, 195, y)
        pdf.setFont('helvetica', 'bold')
        pdf.text('NET SALARY', 15, y + 8)
        pdf.text(` ${data.effectiveSalary.toLocaleString()}`, 170, y + 8)
        pdf.line(15, y + 12, 195, y + 12)
        

        
        // Footer
        pdf.setFontSize(8)
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 270, { align: 'center' })
        
        pdf.save(`${data.employeeName}-Salary-${selectedMonth}-${new Date().getFullYear()}.pdf`)
      }
    } catch (error) {
      console.error('Failed to download salary slip:', error)
    }
  }

  useEffect(() => {
    calculateSalary()
  }, [selectedMonth])

  const filteredSalaryData = salaryData.filter((salary) =>
    salary.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salary.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <MainLayout title={t('salaryManagement')}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('calculatingSalaries')}</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title={t('salaryManagement')}>
      <FeatureGuard feature="salary">
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalEmployees')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salaryData.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalPayroll')}</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹ {salaryData.reduce((sum, s) => sum + s.effectiveSalary, 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('deductions')}</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹ {salaryData.reduce((sum, s) => sum + (s.baseSalary - s.effectiveSalary), 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('salaryCalculation')}</CardTitle>
                <CardDescription>{t('monthlySalaryWithDeductions')}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSalaries.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete ({selectedSalaries.length})
                  </Button>
                )}
                {selectedSalaries.length === 0 && (
                  <Button variant="destructive" size="sm" onClick={() => setIsClearAllOpen(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={async () => {
                  try {
                    const response = await fetch('/api/salary/export')
                    if (response.ok) {
                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `salary_${new Date().toISOString().split('T')[0]}.csv`
                      a.click()
                      showToast.success('✅ Salary data exported successfully!')
                    }
                  } catch (error) {
                    showToast.error('❌ Failed to export salary data')
                  }
                }}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={() => document.getElementById('salaryImportInput')?.click()} disabled={isImporting}>
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
                <input
                  id="salaryImportInput"
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
                      const response = await fetch('/api/salary/import', {
                        method: 'POST',
                        body: formData
                      })
                      const result = await response.json()
                      if (response.ok) {
                        showToast.success(`✅ Imported ${result.imported} salary records successfully!`)
                        calculateSalary()
                      } else {
                        showToast.error(result.error || '❌ Failed to import salary data')
                      }
                    } catch (error) {
                      showToast.error('❌ Error importing salary data')
                    } finally {
                      setIsImporting(false)
                      e.target.value = ''
                    }
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('searchEmployees')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: 12}, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedSalaries.length === filteredSalaryData.length && filteredSalaryData.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSalaries(filteredSalaryData.map(s => s.employeeId))
                          } else {
                            setSelectedSalaries([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="text-center">{t('employee')}</TableHead>
                    <TableHead className="text-center">{t('baseSalary')}</TableHead>
                    <TableHead className="text-center">{t('workingDays')}</TableHead>
                    <TableHead className="text-center">{t('leaveDays')}</TableHead>
                    <TableHead className="text-center">{t('effectiveSalary')}</TableHead>
                    <TableHead className="text-center">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSalaryData.map((salary) => (
                    <TableRow key={salary.employeeId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSalaries.includes(salary.employeeId)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSalaries([...selectedSalaries, salary.employeeId])
                            } else {
                              setSelectedSalaries(selectedSalaries.filter(id => id !== salary.employeeId))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div>
                          <div className="font-medium">{salary.employeeName}</div>
                          <div className="text-sm text-muted-foreground">{salary.employeeId}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">₹ {salary.baseSalary.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{salary.workingDays}</TableCell>
                      <TableCell className="text-center">{salary.leaveDays}</TableCell>
                      <TableCell className="text-center font-medium">₹ {salary.effectiveSalary.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => downloadSalarySlip(salary.employeeId)}>
                          <Download className="w-4 h-4 mr-2" />
                          {t('downloadSlip')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Selected Salary Records</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedSalaries.length} salary records? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsBulkDeleteOpen(false)
                setSelectedSalaries([])
              }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/salary/bulk-delete', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ employeeIds: selectedSalaries })
                    })
                    if (response.ok) {
                      showToast.success(`✅ Deleted ${selectedSalaries.length} salary records`)
                      setSelectedSalaries([])
                      calculateSalary()
                    } else {
                      showToast.error('❌ Failed to delete salary records')
                    }
                  } catch (error) {
                    showToast.error('❌ Failed to delete salary records')
                  }
                  setIsBulkDeleteOpen(false)
                }}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isClearAllOpen} onOpenChange={setIsClearAllOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                <span>Clear All Salary Records</span>
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>ALL salary records</strong>? This action cannot be undone!
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsClearAllOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={async () => {
                try {
                  const response = await fetch('/api/salary/clear', { method: 'DELETE' })
                  if (response.ok) {
                    showToast.success('✅ All salary records cleared!')
                    setSelectedSalaries([])
                    calculateSalary()
                  } else {
                    showToast.error('❌ Failed to clear salary records')
                  }
                } catch (error) {
                  showToast.error('❌ Error clearing salary records')
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