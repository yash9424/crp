"use client"

import { useState, useEffect } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Video } from "lucide-react"
import { showToast } from "@/lib/toast"

export default function TutorialsManagement() {
  const [tutorials, setTutorials] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    category: '',
    duration: ''
  })

  const categories = ['Inventory', 'Sales', 'Customers', 'Reports', 'Settings', 'POS']

  const fetchTutorials = async () => {
    try {
      const response = await fetch('/api/tutorials')
      if (response.ok) {
        const data = await response.json()
        setTutorials(data)
      }
    } catch (error) {
      console.error('Failed to fetch tutorials:', error)
    }
  }

  useEffect(() => {
    fetchTutorials()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/tutorials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showToast.success('Tutorial added successfully!')
        setFormData({
          title: '',
          description: '',
          videoUrl: '',
          category: '',
          duration: ''
        })
        fetchTutorials()
      } else {
        showToast.error('Failed to add tutorial')
      }
    } catch (error) {
      showToast.error('Failed to add tutorial')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Video Tutorials Management</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Add New Tutorial</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="How to Add Products"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Learn how to add new products"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Video URL (YouTube Embed)</Label>
                  <Input
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="1:30"
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Tutorial'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Tutorials ({tutorials.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tutorials.map((tutorial: any) => (
                <div key={tutorial._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Video className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{tutorial.title}</h3>
                      <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary">{tutorial.category}</Badge>
                        <span className="text-xs text-muted-foreground">{tutorial.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {tutorials.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No tutorials added yet. Add your first tutorial above.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
    </div>
  )
}