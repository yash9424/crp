"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Clock, CreditCard, AlertTriangle } from "lucide-react"

interface Tenant {
  _id: string
  name: string
  email: string
  status: string
  plan?: string
  planName?: string
  planExpiryDate?: string
  planAssignedAt?: string
}

interface Plan {
  id: string
  name: string
  price: number
  durationDays: number
  maxProducts: number
}

export function TenantPlanAssignment() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchTenants()
    fetchPlans()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/super-admin/tenants')
      if (response.ok) {
        const data = await response.json()
        setTenants(data)
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans')
      if (response.ok) {
        const result = await response.json()
        const data = result.data || result
        const plansArray = Array.isArray(data) ? data : []
        setPlans(plansArray.filter((plan: any) => plan.status === 'active'))
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      setPlans([])
    }
  }

  const assignPlan = async () => {
    if (!selectedTenant || !selectedPlan) return

    setIsAssigning(true)
    try {
      const response = await fetch('/api/assign-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedTenant._id,
          planId: selectedPlan
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Plan assigned successfully! Expires on: ${new Date(result.expiryDate).toLocaleDateString()}`)
        fetchTenants()
        setIsDialogOpen(false)
        setSelectedTenant(null)
        setSelectedPlan("")
      } else {
        const error = await response.json()
        alert(`Failed to assign plan: ${error.error}`)
      }
    } catch (error) {
      alert('Error assigning plan')
    } finally {
      setIsAssigning(false)
    }
  }

  const getExpiryStatus = (tenant: Tenant) => {
    if (!tenant.planExpiryDate) return { status: 'No Plan', color: 'gray' }
    
    const expiryDate = new Date(tenant.planExpiryDate)
    const now = new Date()
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft < 0) return { status: 'Expired', color: 'red' }
    if (daysLeft <= 7) return { status: `${daysLeft} days left`, color: 'orange' }
    return { status: `${daysLeft} days left`, color: 'green' }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Tenant Plan Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan Expiry</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => {
                const expiryStatus = getExpiryStatus(tenant)
                return (
                  <TableRow key={tenant._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-sm text-muted-foreground">{tenant.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.status === 'active' ? 'default' : 'destructive'}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tenant.plan || tenant.planExpiryDate ? (
                          <>
                            <Clock className="h-4 w-4" />
                            <div>
                              {tenant.planName && <div className="text-sm font-medium">{tenant.planName}</div>}
                              {tenant.planExpiryDate && (
                                <>
                                  <div className="text-sm">{new Date(tenant.planExpiryDate).toLocaleDateString()}</div>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      expiryStatus.color === 'red' ? 'border-red-500 text-red-600' :
                                      expiryStatus.color === 'orange' ? 'border-orange-500 text-orange-600' :
                                      'border-green-500 text-green-600'
                                    }`}
                                  >
                                    {expiryStatus.status}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            No Plan Assigned
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog open={isDialogOpen && selectedTenant?._id === tenant._id} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedTenant(tenant)}
                          >
                            Assign Plan
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Plan to {tenant.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Select Plan</label>
                              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                  {plans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                      <div className="flex items-center justify-between w-full">
                                        <span>{plan.name}</span>
                                        <div className="text-xs text-muted-foreground ml-2">
                                          ₹{plan.price} - {plan.durationDays} days
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {selectedPlan && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="text-sm">
                                  <strong>Plan Details:</strong>
                                  {(() => {
                                    const plan = plans.find(p => p.id === selectedPlan)
                                    if (!plan) return null
                                    const expiryDate = new Date()
                                    expiryDate.setDate(expiryDate.getDate() + plan.durationDays)
                                    return (
                                      <div className="mt-1 space-y-1">
                                        <div>Duration: {plan.durationDays} days</div>
                                        <div>Max Products: {plan.maxProducts}</div>
                                        <div>Expires: {expiryDate.toLocaleDateString()}</div>
                                      </div>
                                    )
                                  })()}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button 
                                onClick={assignPlan} 
                                disabled={!selectedPlan || isAssigning}
                              >
                                {isAssigning ? 'Assigning...' : 'Assign Plan'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}