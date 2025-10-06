"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, TrendingUp, Users, DollarSign, Target } from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"

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
  const [employees, setEmployees] = useState<Employee[]>([])
  const [commissionData, setCommissionData] = useState<CommissionData[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(true)

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.filter((emp: Employee) => emp.commissionType !== 'none'))
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  const calculateCommissions = async () => {
    try {
      const response = await fetch(`/api/commission-calculation?month=${selectedMonth}`)
      if (response.ok) {
        const data = await response.json()
        setCommissionData(data)
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
      return <Badge variant="default">% of Sales</Badge>
    }
    return <Badge variant="outline">None</Badge>
  }

  const totalCommissions = commissionData.reduce((sum, emp) => sum + emp.commissionEarned, 0)
  const totalSales = commissionData.reduce((sum, emp) => sum + emp.totalSales, 0)
  const avgCommission = commissionData.length > 0 ? totalCommissions / commissionData.length : 0

  if (loading) {
    return (
      <MainLayout title="Commission Management" userRole="tenant-admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Calculating commissions...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Commission Management" userRole="tenant-admin">
      <FeatureGuard feature="hr">
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">Total Commissions</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹ {totalCommissions.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">Total Sales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹ {totalSales.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">Eligible Staff</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employees.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">Avg Commission</CardTitle>
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
                  <CardTitle>Commission Calculation</CardTitle>
                  <CardDescription>Calculate staff commissions based on sales performance</CardDescription>
                </div>
                <div className="flex items-center space-x-4">
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
                    Recalculate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {commissionData.length === 0 ? (
                <div className="text-center py-12">
                  <Calculator className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No commission data</h3>
                  <p className="text-sm text-muted-foreground">
                    No sales data found for the selected month or no employees with commission setup.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">Employee</TableHead>
                        <TableHead className="text-center">Commission Type</TableHead>
                        <TableHead className="text-center">Sales Made</TableHead>
                        <TableHead className="text-center">Total Sales Value</TableHead>
                        <TableHead className="text-center">Target Progress</TableHead>
                        <TableHead className="text-center">Commission Earned</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionData.map((emp) => (
                        <TableRow key={emp.employeeId}>
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
                          <TableCell className="text-center">{emp.salesCount} sales</TableCell>
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
        </div>
      </FeatureGuard>
    </MainLayout>
  )
}