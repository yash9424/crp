"use client"

import { useState, useEffect } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X, Clock } from "lucide-react"
import { showToast } from "@/lib/toast"

interface PlanRequest {
  id: string
  tenantId: string
  requestedPlanId: string
  reason: string
  status: string
  requestedAt: string
  requestedBy: string
}

export default function PlanRequestsPage() {
  const [requests, setRequests] = useState<PlanRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/plan-requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveRequest = async (requestId: string, tenantId: string, planId: string) => {
    try {
      const response = await fetch('/api/upgrade-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, tenantId })
      })
      
      if (response.ok) {
        // Update request status to completed
        await fetch('/api/plan-requests', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, status: 'completed' })
        })
        
        // Send notification to tenant
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            type: 'plan_approved',
            title: 'Plan Upgrade Approved',
            message: `Your plan upgrade request has been approved and activated.`,
            priority: 'high'
          })
        })
        
        showToast.success('Plan updated successfully!')
        fetchRequests()
      } else {
        showToast.error('Failed to update plan')
      }
    } catch (error) {
      showToast.error('Error updating plan')
    }
  }

  const rejectRequest = async (requestId: string, tenantId: string) => {
    try {
      await fetch('/api/plan-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: 'rejected' })
      })
      
      // Send notification to tenant
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          type: 'plan_rejected',
          title: 'Plan Upgrade Rejected',
          message: `Your plan upgrade request has been rejected. Please contact support for more information.`,
          priority: 'medium'
        })
      })
      
      showToast.success('Request rejected')
      fetchRequests()
    } catch (error) {
      showToast.error('Error rejecting request')
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading requests...</div>
      </div>
    )
  }

  return (
    <Card>
        <CardHeader>
          <CardTitle>Pending Plan Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Requested Plan</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.requestedBy}</TableCell>
                  <TableCell>{request.requestedPlanId}</TableCell>
                  <TableCell>{request.reason}</TableCell>
                  <TableCell>
                    <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
                      <Clock className="w-3 h-3 mr-1" />
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(request.requestedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => approveRequest(request.id, request.tenantId, request.requestedPlanId)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => rejectRequest(request.id, request.tenantId)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  )
}