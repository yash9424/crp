"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Gift,
  Users,
  Search,
  Building2,
  Plus,
  Eye,
  UserPlus,
  TrendingUp,
  DollarSign,
} from "lucide-react"

export default function SuperAdminReferralsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedReferral, setSelectedReferral] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState([])
  const [plans, setPlans] = useState([])
  const [newReferral, setNewReferral] = useState({
    referrerShop: "",
    referredShop: "",
    referredEmail: "",
    referralCode: "",
    planType: ""
  })

  useEffect(() => {
    fetchReferrals()
    fetchTenants()
    fetchPlans()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants')
      const data = await response.json()
      setTenants(data)
    } catch (error) {
      console.error('Error fetching tenants:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans')
      const data = await response.json()
      setPlans(data)
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/super-admin/referrals')
      const data = await response.json()
      setReferrals(data)
    } catch (error) {
      console.error('Error fetching referrals:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReferrals = referrals.filter((referral: any) => {
    const matchesSearch =
      referral.referrerShop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referredShop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referralCode?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || referral.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const addNewReferral = async () => {
    if (!newReferral.referrerShop || !newReferral.referredShop || !newReferral.referralCode || !newReferral.planType) {
      alert('Please fill all required fields')
      return
    }

    try {
      const response = await fetch('/api/super-admin/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerShop: newReferral.referrerShop,
          referralCode: newReferral.referralCode,
          referredShop: newReferral.referredShop,
          referredEmail: newReferral.referredEmail,
          planType: newReferral.planType
        })
      })

      if (response.ok) {
        await fetchReferrals()
        setNewReferral({ referrerShop: "", referredShop: "", referredEmail: "", referralCode: "", planType: "" })
        setIsCreateDialogOpen(false)
        alert('Referral saved successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save referral')
      }
    } catch (error) {
      alert('Network error - please try again')
    }
  }

  const updateReferralStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/super-admin/referrals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      if (response.ok) {
        fetchReferrals()
      }
    } catch (error) {
      alert('Error updating referral')
    }
  }



  const totalReferrals = referrals.length
  const completedReferrals = referrals.filter((r: any) => r.status === "Completed").length
  const pendingReferrals = referrals.filter((r: any) => r.status === "Pending").length
  const totalRewards = referrals.reduce((sum: number, r: any) => sum + (r.reward || 0), 0)
  const completedRewards = referrals.filter((r: any) => r.status === "Completed").reduce((sum: number, r: any) => sum + (r.reward || 0), 0)
  const avgReward = Math.round(totalRewards / totalReferrals) || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReferrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedReferrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReferrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ {totalRewards}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ {completedRewards}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Reward</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ {avgReward}</div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Global Referral Tracking</CardTitle>
              <CardDescription>Monitor tenant referrals and commission payouts</CardDescription>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Referral
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Referral</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Referrer Name</Label>
                      <Select value={newReferral.referrerShop} onValueChange={(value) => setNewReferral(prev => ({ ...prev, referrerShop: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select referrer" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(tenants) && tenants.map((tenant: any) => (
                            <SelectItem key={tenant._id} value={tenant.name}>{tenant.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>New Shop Name</Label>
                      <Input
                        placeholder="Enter new shop name"
                        value={newReferral.referredShop}
                        onChange={(e) => setNewReferral(prev => ({ ...prev, referredShop: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Shop Email</Label>
                      <Input
                        placeholder="shop@email.com"
                        value={newReferral.referredEmail}
                        onChange={(e) => setNewReferral(prev => ({ ...prev, referredEmail: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Referral Code Used</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter referral code"
                          value={newReferral.referralCode}
                          onChange={(e) => setNewReferral(prev => ({ ...prev, referralCode: e.target.value.toUpperCase() }))}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const code = Math.random().toString(36).substring(2, 8).toUpperCase()
                            setNewReferral(prev => ({ ...prev, referralCode: code }))
                          }}
                        >
                          Generate
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Plan Selected</Label>
                    <Select value={newReferral.planType} onValueChange={(value) => setNewReferral(prev => ({ ...prev, planType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(plans) && plans.map((plan: any) => (
                          <SelectItem key={plan._id} value={plan.name}>{plan.name} - ₹ {plan.price}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                  <Button onClick={addNewReferral}>Add Referral</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search referrals..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Referring Shop</TableHead>
                  <TableHead className="text-center">Referral Code</TableHead>
                  <TableHead className="text-center">New Shop</TableHead>
                  <TableHead className="text-center">Plan</TableHead>
                  <TableHead className="text-center">Reward</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferrals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {referrals.length === 0 ? 'No referrals found. Add your first referral!' : 'No referrals match your search.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReferrals.map((referral: any) => (
                    <TableRow key={referral._id}>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span className="text-sm font-medium">{referral.referrerShop || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono">{referral.referralCode}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div>
                          <div className="font-medium">{referral.referredShop}</div>
                          <div className="text-xs text-muted-foreground">{referral.referredEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{referral.planType}</TableCell>
                      <TableCell className="text-center">₹ {referral.reward || 0}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={referral.status === "Completed" ? "default" : referral.status === "Pending" ? "secondary" : "outline"}>
                          {referral.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{referral.dateReferred}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedReferral(referral); setIsViewDialogOpen(true) }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {referral.status === "Pending" && (
                            <Button variant="ghost" size="sm" className="text-green-600" onClick={() => updateReferralStatus(referral._id, "Completed")}>
                              ✓
                            </Button>
                          )}

                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Referral Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Referral Details</DialogTitle>
          </DialogHeader>
          {selectedReferral && (
            <div className="space-y-6 py-4">
              <div className="flex items-center space-x-4 pb-4 border-b">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  {selectedReferral.referredShop?.charAt(0) || 'R'}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{selectedReferral.referredShop}</h2>
                  <p className="text-muted-foreground">{selectedReferral.referredEmail}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="font-mono">{selectedReferral.referralCode}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={selectedReferral.status === "Completed" ? "default" : "secondary"}>
                    {selectedReferral.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Referral Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Referring Shop:</span>
                      <p className="text-sm text-muted-foreground">{selectedReferral.referrerShop || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">New Shop:</span>
                      <p className="text-sm text-muted-foreground">{selectedReferral.referredShop}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Plan Selected:</span>
                      <span className="text-sm text-muted-foreground ml-2">{selectedReferral.planType}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Reward Details</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Reward Amount:</span>
                      <span className="text-sm text-muted-foreground ml-2">₹ {selectedReferral.reward || 0}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Date Referred:</span>
                      <span className="text-sm text-muted-foreground ml-2">{selectedReferral.dateReferred}</span>
                    </div>
                    {selectedReferral.dateCompleted && (
                      <div>
                        <span className="text-sm font-medium">Date Completed:</span>
                        <span className="text-sm text-muted-foreground ml-2">{selectedReferral.dateCompleted}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                {selectedReferral.status === "Pending" && (
                  <Button onClick={() => updateReferralStatus(selectedReferral._id, "Completed")}>
                    Mark as Completed
                  </Button>
                )}
                {selectedReferral.status === "Completed" && (
                  <Button variant="outline" onClick={() => updateReferralStatus(selectedReferral._id, "Pending")}>
                    Mark as Pending
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}