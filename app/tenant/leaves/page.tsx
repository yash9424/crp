"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Calendar, Clock, Users, Filter, Trash2 } from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"
import { showToast } from "@/lib/toast"

interface Employee {
  _id: string
  name: string
  employeeId: string
}

interface Leave {
  _id?: string
  employeeId: string
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: string
  tenantId: string
  createdAt: Date
}

export default function LeavesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [leaveToDelete, setLeaveToDelete] = useState<Leave | null>(null)
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  })

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  const fetchLeaves = async () => {
    try {
      let url = '/api/leaves'
      const params = new URLSearchParams()
      
      if (selectedEmployee !== 'all') params.append('employeeId', selectedEmployee)
      params.append('month', selectedMonth.toString())
      params.append('year', selectedYear.toString())
      
      if (params.toString()) url += `?${params.toString()}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setLeaves(data)
      }
    } catch (error) {
      console.error('Failed to fetch leaves:', error)
    } finally {
      setLoading(false)
    }
  }

  const createLeave = async () => {
    try {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          days
        })
      })
      
      if (response.ok) {
        fetchLeaves()
        setIsAddDialogOpen(false)
        resetForm()
        showToast.success('Leave request created successfully!')
      } else {
        showToast.error('Failed to create leave request')
      }
    } catch (error) {
      console.error('Failed to create leave:', error)
      showToast.error('Error creating leave request')
    }
  }

  const openDeleteDialog = (leave: Leave) => {
    setLeaveToDelete(leave)
    setIsDeleteDialogOpen(true)
  }

  const deleteLeave = async () => {
    if (!leaveToDelete) return
    try {
      const response = await fetch(`/api/leaves/${leaveToDelete._id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchLeaves()
        setIsDeleteDialogOpen(false)
        setLeaveToDelete(null)
        showToast.success('Leave record deleted successfully!')
      } else {
        showToast.error('Failed to delete leave record')
      }
    } catch (error) {
      console.error('Failed to delete leave:', error)
      showToast.error('Error deleting leave record')
    }
  }

  const resetForm = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: ''
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge variant="default">Approved</Badge>
      case "Pending":
        return <Badge variant="secondary">Pending</Badge>
      case "Rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    fetchLeaves()
  }, [selectedEmployee, selectedMonth, selectedYear])

  const filteredLeaves = leaves.filter((leave) =>
    leave.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.leaveType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalLeaves = leaves.length
  const approvedLeaves = leaves.filter(l => l.status === 'Approved').length
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length

  if (loading) {
    return (
      <MainLayout title="Leave Management" userRole="tenant-admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading leaves...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Leave Management" userRole="tenant-admin">
      <FeatureGuard feature="leaves">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-medium">Total Leaves</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeaves}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-medium">Approved</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedLeaves}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-medium">Pending</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingLeaves}</div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Leave Records</CardTitle>
                <CardDescription>Employee leave history and management</CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Leave
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Leave</DialogTitle>
                    <DialogDescription>Create new leave for employee</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Employee</Label>
                        <Select value={formData.employeeId} onValueChange={(value) => {
                          const employee = employees.find(e => e._id === value)
                          setFormData({...formData, employeeId: value, employeeName: employee?.name || ''})
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((employee) => (
                              <SelectItem key={employee._id} value={employee._id}>
                                {employee.name} ({employee.employeeId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Leave Type</Label>
                        <Select value={formData.leaveType} onValueChange={(value) => setFormData({...formData, leaveType: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select leave type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                            <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                            <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                            <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                            <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                            <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input 
                          type="date" 
                          value={formData.startDate}
                          onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input 
                          type="date" 
                          value={formData.endDate}
                          onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Textarea 
                        value={formData.reason}
                        onChange={(e) => setFormData({...formData, reason: e.target.value})}
                        placeholder="Reason for leave"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => {
                      setIsAddDialogOpen(false)
                      resetForm()
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={createLeave}>Add Leave</Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Delete Confirmation Dialog */}
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Leave Record</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this leave record for {leaveToDelete?.employeeName}? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => {
                      setIsDeleteDialogOpen(false)
                      setLeaveToDelete(null)
                    }}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={deleteLeave}>
                      Delete Leave
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search leaves..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32">
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
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: 5}, (_, i) => (
                    <SelectItem key={2020 + i} value={(2020 + i).toString()}>
                      {2020 + i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredLeaves.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No leave records found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  No leave requests for the selected period
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Leave Request
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Employee</TableHead>
                      <TableHead className="text-center">Leave Type</TableHead>
                      <TableHead className="text-center">Start Date</TableHead>
                      <TableHead className="text-center">End Date</TableHead>
                      <TableHead className="text-center">Days</TableHead>
                      <TableHead className="text-center">Reason</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeaves.map((leave) => (
                      <TableRow key={leave._id}>
                        <TableCell className="text-center font-medium">{leave.employeeName}</TableCell>
                        <TableCell className="text-center">{leave.leaveType}</TableCell>
                        <TableCell className="text-center">{leave.startDate}</TableCell>
                        <TableCell className="text-center">{leave.endDate}</TableCell>
                        <TableCell className="text-center">{leave.days}</TableCell>
                        <TableCell className="text-center">{leave.reason}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            {getStatusBadge(leave.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => openDeleteDialog(leave)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
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