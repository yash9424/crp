"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  UserCheck,
  Calendar,
  Clock,
  Filter,
  Download,
  Upload,
  Phone,
  Mail,
  MapPin,
} from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"
import { showToast } from "@/lib/toast"

interface Employee {
  _id?: string
  name: string
  employeeId: string
  email: string
  phone: string
  department: string
  position: string
  salary: number
  joinDate: string
  address: string
  emergencyContact: string
  status: string
  tenantId: string
  createdAt: Date
  updatedAt: Date
}

export default function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    email: '',
    phone: '',
    salary: '',
    joinDate: '',
    address: '',
    emergencyContact: '',
    commissionType: 'none',
    commissionRate: ''
  })

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
        // Auto-generate next employee ID
        const nextId = `EMP${String(data.length + 1).padStart(3, '0')}`
        setFormData(prev => ({...prev, employeeId: nextId}))
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const createEmployee = async () => {
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salary: parseFloat(formData.salary) || 0,
          commissionRate: parseFloat(formData.commissionRate) || 0,
          salesTarget: parseFloat(formData.salesTarget) || 0
        })
      })
      
      if (response.ok) {
        fetchEmployees()
        setIsAddDialogOpen(false)
        resetForm()
        showToast.success('Employee created successfully!')
      } else {
        showToast.error('Failed to create employee')
      }
    } catch (error) {
      console.error('Failed to create employee:', error)
      showToast.error('Error creating employee')
    }
  }

  const updateEmployee = async () => {
    if (!selectedEmployee) return
    try {
      const response = await fetch(`/api/employees/${selectedEmployee._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salary: parseFloat(formData.salary) || 0,
          commissionRate: parseFloat(formData.commissionRate) || 0,
          salesTarget: parseFloat(formData.salesTarget) || 0
        })
      })
      
      if (response.ok) {
        fetchEmployees()
        setIsEditDialogOpen(false)
        resetForm()
        showToast.success('Employee updated successfully!')
      } else {
        showToast.error('Failed to update employee')
      }
    } catch (error) {
      console.error('Failed to update employee:', error)
      showToast.error('Error updating employee')
    }
  }

  const openDeleteDialog = (employee: Employee) => {
    setEmployeeToDelete(employee)
    setIsDeleteDialogOpen(true)
  }

  const deleteEmployee = async () => {
    if (!employeeToDelete) return
    try {
      const response = await fetch(`/api/employees/${employeeToDelete._id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchEmployees()
        setIsDeleteDialogOpen(false)
        setEmployeeToDelete(null)
        showToast.success('Employee deleted successfully!')
      } else {
        showToast.error('Failed to delete employee')
      }
    } catch (error) {
      console.error('Failed to delete employee:', error)
      showToast.error('Error deleting employee')
    }
  }

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee)
    setFormData({
      name: employee.name || '',
      employeeId: employee.employeeId || '',
      email: employee.email || '',
      phone: employee.phone || '',
      salary: employee.salary?.toString() || '',
      joinDate: employee.joinDate || '',
      address: employee.address || '',
      emergencyContact: employee.emergencyContact || '',
      commissionType: (employee as any).commissionType || 'none',
      commissionRate: (employee as any).commissionRate?.toString() || ''
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    const nextId = `EMP${String(employees.length + 1).padStart(3, '0')}`
    setFormData({
      name: '',
      employeeId: nextId,
      email: '',
      phone: '',
      salary: '',
      joinDate: '',
      address: '',
      emergencyContact: '',
      commissionType: 'none',
      commissionRate: ''
    })
    setSelectedEmployee(null)
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter
    return matchesSearch  && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge variant="default">Active</Badge>
      case "On Leave":
        return <Badge variant="secondary">On Leave</Badge>
      case "Inactive":
        return <Badge variant="destructive">Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const totalEmployees = employees.length
  const activeEmployees = employees.filter((emp) => emp.status === "Active").length
  const onLeaveEmployees = employees.filter((emp) => emp.status === "On Leave").length
  const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0)

  if (loading) {
    return (
      <MainLayout title="HR & Staff Management" userRole="tenant-admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading employees...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="HR & Staff Management" userRole="tenant-admin">
      <FeatureGuard feature="hr">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Active Staff</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold ">{activeEmployees}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">On Leave</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold ">{onLeaveEmployees}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Total Payroll</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹ {totalSalary.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Employee Directory</CardTitle>
                <CardDescription>Manage HR records and staff information</CardDescription>
              </div>
              <div className="flex space-x-2">              
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Employee</DialogTitle>
                      <DialogDescription>Enter employee details for HR records</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="employeeName">Full Name</Label>
                          <Input 
                            id="employeeName" 
                            placeholder="Enter full name" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="employeeId">Employee ID</Label>
                          <Input 
                            id="employeeId" 
                            placeholder="EMP001" 
                            value={formData.employeeId}
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="employee@company.com" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input 
                            id="phone" 
                            placeholder="+91 9876543210" 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="salary">Salary</Label>
                          <Input 
                            id="salary" 
                            type="number" 
                            placeholder="50000" 
                            value={formData.salary}
                            onChange={(e) => setFormData({...formData, salary: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="joinDate">Join Date</Label>
                          <Input 
                            id="joinDate" 
                            type="date" 
                            value={formData.joinDate}
                            onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea 
                          id="address" 
                          placeholder="Employee address" 
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContact">Emergency Contact</Label>
                        <Input 
                          id="emergencyContact" 
                          placeholder="+91 9876543210" 
                          value={formData.emergencyContact}
                          onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                        />
                      </div>
                      
                      {/* Commission Settings */}
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="text-sm font-medium">Commission Settings</h3>
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <Label htmlFor="commissionType">Commission Type</Label>
                            <Select value={formData.commissionType} onValueChange={(value) => setFormData({...formData, commissionType: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Commission</SelectItem>
                                <SelectItem value="percentage">Percentage of Sales</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="commissionRate">Commission Rate</Label>
                            <Input 
                              id="commissionRate" 
                              type="number" 
                              placeholder={formData.commissionType === 'percentage' ? '5' : '100'}
                              value={formData.commissionRate}
                              onChange={(e) => setFormData({...formData, commissionRate: e.target.value})}
                              disabled={formData.commissionType === 'none'}
                            />
                            <div className="text-xs text-muted-foreground">
                              {formData.commissionType === 'percentage' ? '% of sales' : formData.commissionType === 'fixed' ? '₹ per sale' : formData.commissionType === 'target' ? '₹ bonus' : ''}
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createEmployee}>Add Employee</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Employee</DialogTitle>
                      <DialogDescription>Update employee details</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editEmployeeName">Full Name</Label>
                          <Input 
                            id="editEmployeeName" 
                            placeholder="Enter full name" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editEmployeeId">Employee ID</Label>
                          <Input 
                            id="editEmployeeId" 
                            placeholder="EMP001" 
                            value={formData.employeeId}
                            onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editEmail">Email</Label>
                          <Input 
                            id="editEmail" 
                            type="email" 
                            placeholder="employee@company.com" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editPhone">Phone</Label>
                          <Input 
                            id="editPhone" 
                            placeholder="+91 9876543210" 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editSalary">Salary</Label>
                          <Input 
                            id="editSalary" 
                            type="number" 
                            placeholder="50000" 
                            value={formData.salary}
                            onChange={(e) => setFormData({...formData, salary: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editJoinDate">Join Date</Label>
                          <Input 
                            id="editJoinDate" 
                            type="date" 
                            value={formData.joinDate}
                            onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editAddress">Address</Label>
                        <Textarea 
                          id="editAddress" 
                          placeholder="Employee address" 
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editEmergencyContact">Emergency Contact</Label>
                        <Input 
                          id="editEmergencyContact" 
                          placeholder="+91 9876543210" 
                          value={formData.emergencyContact}
                          onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                        />
                      </div>
                      
                      {/* Commission Settings */}
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="text-sm font-medium">Commission Settings</h3>
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <Label htmlFor="editCommissionType">Commission Type</Label>
                            <Select value={formData.commissionType} onValueChange={(value) => setFormData({...formData, commissionType: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Commission</SelectItem>
                                <SelectItem value="percentage">Percentage of Sales</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editCommissionRate">Commission Rate</Label>
                            <Input 
                              id="editCommissionRate" 
                              type="number" 
                              placeholder={formData.commissionType === 'percentage' ? '5' : '100'}
                              value={formData.commissionRate}
                              onChange={(e) => setFormData({...formData, commissionRate: e.target.value})}
                              disabled={formData.commissionType === 'none'}
                            />
                            <div className="text-xs text-muted-foreground">
                              {formData.commissionType === 'percentage' ? '% of sales' : formData.commissionType === 'fixed' ? '₹ per sale' : formData.commissionType === 'target' ? '₹ bonus' : ''}
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => {
                        setIsEditDialogOpen(false)
                        resetForm()
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={updateEmployee}>Update Employee</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Employee</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete {employeeToDelete?.name}? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => {
                        setIsDeleteDialogOpen(false)
                        setEmployeeToDelete(null)
                      }}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={deleteEmployee}>
                        Delete Employee
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
                
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredEmployees.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No employees found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {employees.length === 0 ? 'Start by adding your first employee' : 'Try adjusting your search or filters'}
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Employee
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Employee</TableHead>
                      <TableHead className="text-center">ID</TableHead>
                      <TableHead className="text-center">Contact</TableHead>
                      <TableHead className="text-center">Salary</TableHead>
                      <TableHead className="text-center">Join Date</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee._id}>
                        <TableCell className="text-center">
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center justify-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {employee.address?.split(',')[1] || employee.address || 'No address'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{employee.employeeId}</TableCell>
                        <TableCell className="text-center">
                          <div>
                            <div className="text-sm flex items-center justify-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {employee.email}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center justify-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {employee.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">₹ {employee.salary?.toLocaleString() || 0}</TableCell>
                        <TableCell className="text-center">{employee.joinDate}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            {getStatusBadge(employee.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={async () => {
                                const newStatus = employee.status === 'Active' ? 'Inactive' : 'Active'
                                try {
                                  const response = await fetch(`/api/employees/${employee._id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: newStatus })
                                  })
                                  if (response.ok) {
                                    fetchEmployees()
                                    showToast.success('✅ Employee status updated successfully!')
                                  }
                                } catch (error) {
                                  console.error('Failed to update status:', error)
                                }
                              }}
                              className={employee.status === 'Active' ? 'text-black hover:text-black' : 'text-red-600 hover:text-red-800'}
                              title={employee.status === 'Active' ? 'Deactivate Employee' : 'Activate Employee'}
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/tenant/leaves'} title="View Leaves">
                              <Calendar className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(employee)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => openDeleteDialog(employee)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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