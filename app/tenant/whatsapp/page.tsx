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
  MessageCircle,
  Send,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Settings,
  Phone,
  User,
} from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"

const mockMessages = [
  {
    id: 1,
    customer: "John Smith",
    phone: "+91 9876543210",
    message: "Hi, I want to check my order status",
    timestamp: "2024-09-24 10:30 AM",
    status: "Delivered",
    type: "Incoming",
    orderRef: "ORD001",
  },
  {
    id: 2,
    customer: "Sarah Johnson",
    phone: "+91 9876543212",
    message: "Thank you for the quick delivery!",
    timestamp: "2024-09-24 09:15 AM",
    status: "Read",
    type: "Incoming",
    orderRef: "ORD002",
  },
  {
    id: 3,
    customer: "Mike Wilson",
    phone: "+91 9876543214",
    message: "Your order #ORD003 has been shipped and will arrive tomorrow.",
    timestamp: "2024-09-24 08:45 AM",
    status: "Delivered",
    type: "Outgoing",
    orderRef: "ORD003",
  },
  {
    id: 4,
    customer: "Lisa Brown",
    phone: "+91 9876543216",
    message: "Can I change my delivery address?",
    timestamp: "2024-09-24 07:20 AM",
    status: "Pending",
    type: "Incoming",
    orderRef: "ORD004",
  },
]

const templates = [
  {
    id: 1,
    name: "Order Confirmation",
    message: "🛍️ Hi {customer_name}! Your order #{order_id} has been confirmed.\n\n💰 Total Amount: ₹{amount}\n📅 Date: {date}\n\nThank you for choosing {store_name}! We'll process your order shortly.\n\n📞 Contact: {phone}",
    category: "Order Updates",
  },
  {
    id: 2,
    name: "Order Ready",
    message: "✅ Great news {customer_name}! Your order #{order_id} is ready for pickup.\n\n🕒 Store Hours: 10 AM - 8 PM\n📍 {store_name}\n📞 {phone}\n\nSee you soon!",
    category: "Order Updates",
  },
  {
    id: 3,
    name: "Payment Reminder",
    message: "💳 Hi {customer_name}, friendly reminder about your pending payment of ₹{amount} for order #{order_id}.\n\nPlease complete payment at your earliest convenience.\n\nThank you!\n📞 {phone}",
    category: "Payment",
  },
  {
    id: 4,
    name: "Thank You Message",
    message: "🙏 Thank you {customer_name} for shopping with {store_name}!\n\nWe hope you love your purchase. Your feedback means a lot to us.\n\n⭐ Rate us or share your experience!\n📞 {phone}",
    category: "Support",
  },
  {
    id: 5,
    name: "New Arrival Alert",
    message: "🆕 Hey {customer_name}! New arrivals just landed at {store_name}!\n\n✨ Fresh styles, latest trends\n🎯 Special prices for our valued customers\n\nVisit us today!\n📞 {phone}",
    category: "Marketing",
  },
]

function WhatsAppPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")

  const filteredMessages = mockMessages.filter((message) => {
    const matchesSearch =
      message.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.phone.includes(searchTerm) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || message.status === statusFilter
    const matchesType = typeFilter === "all" || message.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>
      case "Read":
        return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />Read</Badge>
      case "Pending":
        return <Badge variant="destructive"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case "Failed":
        return <Badge variant="outline" className="text-red-500"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const totalMessages = mockMessages.length
  const deliveredMessages = mockMessages.filter((msg) => msg.status === "Delivered").length
  const pendingMessages = mockMessages.filter((msg) => msg.status === "Pending").length
  const incomingMessages = mockMessages.filter((msg) => msg.type === "Incoming").length

  return (
    <MainLayout title="WhatsApp Business Integration" userRole="tenant-admin">
      <FeatureGuard feature="whatsapp">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Total Messages</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMessages}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold ">{deliveredMessages}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold ">{pendingMessages}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Incoming</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold ">{incomingMessages}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Send messages and manage templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send WhatsApp Message</DialogTitle>
                    <DialogDescription>Send a message to customer</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">Customer Phone</Label>
                      <Input id="customerPhone" placeholder="+91 9876543210" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="messageText">Message</Label>
                      <Textarea 
                        id="messageText" 
                        placeholder="Hi {customer_name}, your order #{order_id} has been confirmed. Total: ₹{amount}. Thank you for shopping with us!" 
                        rows={6}
                        className="resize-none"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                      />
                      <div className="text-xs text-muted-foreground">
                        Available variables: {'{customer_name}'}, {'{order_id}'}, {'{amount}'}, {'{store_name}'}, {'{phone}'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template">Use Template</Label>
                      <Select value={selectedTemplate} onValueChange={(value) => {
                        setSelectedTemplate(value)
                        if (value) {
                          const template = templates.find(t => t.id.toString() === value)
                          if (template) {
                            setMessageText(template.message)
                          }
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Select a template...</SelectItem>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      // Here you would implement the actual WhatsApp sending logic
                      console.log('Sending message:', messageText)
                      setIsMessageDialogOpen(false)
                      setMessageText("")
                      setSelectedTemplate("")
                    }}>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Message Template</DialogTitle>
                    <DialogDescription>Create a reusable message template</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="templateName">Template Name</Label>
                      <Input id="templateName" placeholder="Order Confirmation" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="templateCategory">Category</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="order">Order Updates</SelectItem>
                          <SelectItem value="shipping">Shipping</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="templateMessage">Message Template</Label>
                      <Textarea 
                        id="templateMessage" 
                        placeholder="Hi {customer_name}, your order #{order_id}..." 
                        rows={4} 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsTemplateDialogOpen(false)}>
                      Create Template
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                WhatsApp Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Message Templates</CardTitle>
              <CardDescription>Pre-configured message templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div key={template.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>WhatsApp Messages</CardTitle>
                <CardDescription>Manage customer communications and order updates</CardDescription>
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
                  placeholder="Search messages..."
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
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Read">Read</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Incoming">Incoming</SelectItem>
                  <SelectItem value="Outgoing">Outgoing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Customer</TableHead>
                    <TableHead className="text-center">Phone</TableHead>
                    <TableHead className="text-center">Message</TableHead>
                    <TableHead className="text-center">Order Ref</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Time</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <User className="w-4 h-4 mr-2" />
                          {message.customer}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {message.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-center max-w-xs">
                        <div className="truncate">{message.message}</div>
                      </TableCell>
                      <TableCell className="text-center">{message.orderRef}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={message.type === "Incoming" ? "secondary" : "outline"}>
                          {message.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {getStatusBadge(message.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">{message.timestamp}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
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

export default WhatsAppPage