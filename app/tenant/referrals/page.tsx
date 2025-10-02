"use client"

import { useState } from "react"
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
  Users,
  Gift,
  TrendingUp,
  DollarSign,
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  Download,
  Share2,
  Award,
  Copy,
  CheckCircle,
} from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"

const mockReferrals = [
  {
    id: 1,
    referrerName: "John Smith",
    referrerEmail: "john.smith@email.com",
    referrerPhone: "+91 9876543210",
    referredName: "Mike Johnson",
    referredEmail: "mike.johnson@email.com",
    referredPhone: "+91 9876543211",
    referralCode: "REF001",
    status: "Completed",
    orderValue: 2500,
    commission: 250,
    commissionRate: 10,
    dateReferred: "2024-09-20",
    dateCompleted: "2024-09-22",
  },
  {
    id: 2,
    referrerName: "Sarah Wilson",
    referrerEmail: "sarah.wilson@email.com",
    referrerPhone: "+91 9876543212",
    referredName: "Lisa Brown",
    referredEmail: "lisa.brown@email.com",
    referredPhone: "+91 9876543213",
    referralCode: "REF002",
    status: "Pending",
    orderValue: 0,
    commission: 0,
    commissionRate: 10,
    dateReferred: "2024-09-23",
    dateCompleted: null,
  },
  {
    id: 3,
    referrerName: "David Lee",
    referrerEmail: "david.lee@email.com",
    referrerPhone: "+91 9876543214",
    referredName: "Emma Davis",
    referredEmail: "emma.davis@email.com",
    referredPhone: "+91 9876543215",
    referralCode: "REF003",
    status: "Completed",
    orderValue: 1800,
    commission: 180,
    commissionRate: 10,
    dateReferred: "2024-09-18",
    dateCompleted: "2024-09-21",
  },
  {
    id: 4,
    referrerName: "Anna Taylor",
    referrerEmail: "anna.taylor@email.com",
    referrerPhone: "+91 9876543216",
    referredName: "Tom Wilson",
    referredEmail: "tom.wilson@email.com",
    referredPhone: "+91 9876543217",
    referralCode: "REF004",
    status: "Expired",
    orderValue: 0,
    commission: 0,
    commissionRate: 10,
    dateReferred: "2024-08-15",
    dateCompleted: null,
  },
]

const referralPrograms = [
  {
    id: 1,
    name: "Standard Referral",
    commissionRate: 10,
    minOrderValue: 1000,
    maxCommission: 500,
    validityDays: 30,
    status: "Active",
  },
  {
    id: 2,
    name: "VIP Referral",
    commissionRate: 15,
    minOrderValue: 2000,
    maxCommission: 1000,
    validityDays: 60,
    status: "Active",
  },
]

export default function ReferralsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddReferralOpen, setIsAddReferralOpen] = useState(false)
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false)

  const filteredReferrals = mockReferrals.filter((referral) => {
    const matchesSearch =
      referral.referrerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referredName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referralCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || referral.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case "Pending":
        return <Badge variant="secondary">Pending</Badge>
      case "Expired":
        return <Badge variant="destructive">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const totalReferrals = mockReferrals.length
  const completedReferrals = mockReferrals.filter((ref) => ref.status === "Completed").length
  const totalCommission = mockReferrals.reduce((sum, ref) => sum + ref.commission, 0)
  const totalOrderValue = mockReferrals.reduce((sum, ref) => sum + ref.orderValue, 0)

  return (
    <MainLayout title="Referral Management System" userRole="tenant-admin">
      <FeatureGuard feature="referrals">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReferrals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedReferrals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Total Commission</CardTitle>
              <span className="h-4 w-4 text-muted-foreground  text-xl">₹</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹ {totalCommission.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Referral Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹ {totalOrderValue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Programs */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Referral Programs</CardTitle>
                  <CardDescription>Manage referral commission structures</CardDescription>
                </div>
                <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Program
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Referral Program</DialogTitle>
                      <DialogDescription>Set up a new referral commission program</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="programName">Program Name</Label>
                        <Input id="programName" placeholder="Standard Referral" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                          <Input id="commissionRate" type="number" placeholder="10" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="minOrderValue">Min Order Value</Label>
                          <Input id="minOrderValue" type="number" placeholder="1000" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="maxCommission">Max Commission</Label>
                          <Input id="maxCommission" type="number" placeholder="500" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="validityDays">Validity (Days)</Label>
                          <Input id="validityDays" type="number" placeholder="30" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsProgramDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsProgramDialogOpen(false)}>
                        Create Program
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referralPrograms.map((program) => (
                  <div key={program.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{program.name}</h4>
                      <Badge variant={program.status === "Active" ? "default" : "secondary"}>
                        {program.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Commission: {program.commissionRate}%</div>
                      <div>Min Order: ₹{program.minOrderValue}</div>
                      <div>Max Commission: ₹{program.maxCommission}</div>
                      <div>Validity: {program.validityDays} days</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Generate referral codes and manage referrals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={isAddReferralOpen} onOpenChange={setIsAddReferralOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Share2 className="w-4 h-4 mr-2" />
                    Create Referral
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Referral</DialogTitle>
                    <DialogDescription>Generate a referral code for a customer</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="referrerName">Referrer Name</Label>
                      <Input id="referrerName" placeholder="Customer name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referrerEmail">Referrer Email</Label>
                      <Input id="referrerEmail" type="email" placeholder="customer@email.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referrerPhone">Referrer Phone</Label>
                      <Input id="referrerPhone" placeholder="+91 9876543210" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="program">Referral Program</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent>
                          {referralPrograms.map((program) => (
                            <SelectItem key={program.id} value={program.id.toString()}>
                              {program.name} ({program.commissionRate}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddReferralOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsAddReferralOpen(false)}>
                      Generate Code
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" className="w-full">
                <Gift className="w-4 h-4 mr-2" />
                Bulk Generate Codes
              </Button>

              <Button variant="outline" className="w-full">
                <Award className="w-4 h-4 mr-2" />
                Commission Report
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Referral Tracking</CardTitle>
                <CardDescription>Monitor all referral activities and commissions</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search referrals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Referrer</TableHead>
                    <TableHead className="text-center">Referred Customer</TableHead>
                    <TableHead className="text-center">Code</TableHead>
                    <TableHead className="text-center">Order Value</TableHead>
                    <TableHead className="text-center">Commission</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Date</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="text-center">
                        <div>
                          <div className="font-medium">{referral.referrerName}</div>
                          <div className="text-sm text-muted-foreground">{referral.referrerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div>
                          <div className="font-medium">{referral.referredName}</div>
                          <div className="text-sm text-muted-foreground">{referral.referredEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm">{referral.referralCode}</code>
                          <Button variant="ghost" size="sm">
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">₹ {referral.orderValue.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <div>
                          <div className="font-medium">₹ {referral.commission}</div>
                          <div className="text-xs text-muted-foreground">{referral.commissionRate}%</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {getStatusBadge(referral.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div>
                          <div className="text-sm">{referral.dateReferred}</div>
                          {referral.dateCompleted && (
                            <div className="text-xs text-muted-foreground">Completed: {referral.dateCompleted}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      </FeatureGuard>
    </MainLayout>
  )
}