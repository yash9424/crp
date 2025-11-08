"use client"

import { SimpleChart } from "./simple-chart"

export function TestChart() {
  const testData = [
    { label: "Mon", value: 1200 },
    { label: "Tue", value: 1900 },
    { label: "Wed", value: 800 },
    { label: "Thu", value: 2100 },
    { label: "Fri", value: 1600 },
    { label: "Sat", value: 2800 },
    { label: "Sun", value: 1400 }
  ]

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Test Chart</h3>
      <SimpleChart data={testData} height={200} />
    </div>
  )
}