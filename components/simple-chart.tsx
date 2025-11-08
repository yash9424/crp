"use client"

interface SimpleChartProps {
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  type?: 'bar' | 'line'
  height?: number
}

export function SimpleChart({ data, type = 'bar', height = 200 }: SimpleChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center border rounded-lg bg-muted/20" style={{ height }}>
        <div className="text-muted-foreground">No data available</div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => Math.abs(d.value)))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  return (
    <div className="w-full border rounded-lg p-4 bg-card" style={{ height }}>
      <div className="flex items-end justify-between h-full space-x-1">
        {data.map((item, index) => {
          const isNegative = item.value < 0
          const heightPercentage = Math.max(5, (Math.abs(item.value) / maxValue) * 70)
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 min-w-0 h-full">
              <div className="flex-1 flex items-end justify-center w-full relative">
                <div
                  className={`w-full max-w-8 rounded-t transition-all duration-300 hover:opacity-80 ${
                    item.color || (isNegative ? 'bg-red-500' : 'bg-blue-500')
                  }`}
                  style={{ 
                    height: `${heightPercentage}%`,
                    minHeight: '4px'
                  }}
                  title={`${item.label}: ₹${item.value.toLocaleString()}`}
                />
              </div>
              <div className="mt-2 text-xs text-center text-muted-foreground truncate w-full">
                {item.label}
              </div>
              <div className="text-xs font-medium text-center">
                ₹{Math.abs(item.value).toLocaleString()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}