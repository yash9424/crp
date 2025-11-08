"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  HelpCircle,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Send,
  Building2,
} from "lucide-react"

const mockTickets = [
  {
    id: "TKT-001",
    tenantName: "Fashion Store Ltd",
    subject: "Payment gateway integration issue",
    priority: "High",
    status: "Open",
    category: "Technical",
    createdBy: "John Smith",
    createdAt: "2024-09-24 10:30 AM",
    lastUpdate: "2024-09-24 11:15 AM",
  },
  {
    id: "TKT-002",
    tenantName: "Style Boutique",
    subject: "Unable to generate GST reports",
    priority: "Medium",
    status: "In Progress",
    category: "Feature",
    createdBy: "Sarah Wilson",
    createdAt: "2024-09-23 02:20 PM",
    lastUpdate: "2024-09-24 09:30 AM",
  },
  {
    id: "TKT-003",
    tenantName: "Trendy Clothes Co",
    subject: "Inventory sync not working",
    priority: "Low",
    status: "Resolved",
    category: "Bug",
    createdBy: "Mike Johnson",
    createdAt: "2024-09-22 04:45 PM",
    lastUpdate: "2024-09-23 10:20 AM",
  },
]

export default function SuperAdminSupportPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  const filteredTickets = mockTickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Open</Badge>
      case "In Progress":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>
      case "Resolved":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <Badge variant="destructive">High</Badge>
      case "Medium":
        return <Badge variant="secondary">Medium</Badge>
      case "Low":
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const totalTickets = mockTickets.length
  const openTickets = mockTickets.filter((ticket) => ticket.status === "Open").length
  const inProgressTickets = mockTickets.filter((ticket) => ticket.status === "In Progress").length
  const resolvedTickets = mockTickets.filter((ticket) => ticket.status === "Resolved").length

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Open Tickets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold ">{inProgressTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedTickets}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Response */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Response</CardTitle>
          <CardDescription>Send broadcast message to all tenants</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input placeholder="Subject" className="w-80" />
          </div>
          <div className="space-y-2">
            <Textarea className="w-120" placeholder="Message content..." rows={8} />
          </div>
          <div className="flex space-x-4">
            <Button>
              <Send className="w-4 h-4 mr-2" />
              Send to All Tenants
            </Button>
            <Button variant="outline">Save as Template</Button>
          </div>
        </CardContent>
      </Card>

      {/* Support Tickets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>Manage tenant support requests and issues</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Ticket ID</TableHead>
                  <TableHead className="text-center">Tenant</TableHead>
                  <TableHead className="text-center">Subject</TableHead>
                  <TableHead className="text-center">Priority</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Category</TableHead>
                  <TableHead className="text-center">Created</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="text-center font-medium">{ticket.id}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Building2 className="w-4 h-4 mr-2" />
                        {ticket.tenantName}
                      </div>
                    </TableCell>
                    <TableCell className="text-center max-w-xs">
                      <div className="truncate">{ticket.subject}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {getPriorityBadge(ticket.priority)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {getStatusBadge(ticket.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{ticket.category}</TableCell>
                    <TableCell className="text-center">
                      <div>
                        <div className="text-sm">{ticket.createdAt}</div>
                        <div className="text-xs text-muted-foreground">by {ticket.createdBy}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          View
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
  )
}