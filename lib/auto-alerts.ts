// Auto-alert system that runs daily
export class AutoAlertSystem {
  private static instance: AutoAlertSystem
  private intervalId: NodeJS.Timeout | null = null

  static getInstance(): AutoAlertSystem {
    if (!AutoAlertSystem.instance) {
      AutoAlertSystem.instance = new AutoAlertSystem()
    }
    return AutoAlertSystem.instance
  }

  start() {
    // Run daily at 11:30 AM
    const now = new Date()
    const target = new Date()
    target.setHours(11, 30, 0, 0)
    
    if (target <= now) {
      target.setDate(target.getDate() + 1)
    }
    
    const timeUntilTarget = target.getTime() - now.getTime()
    const hours = Math.floor(timeUntilTarget / (1000 * 60 * 60))
    const minutes = Math.floor((timeUntilTarget % (1000 * 60 * 60)) / (1000 * 60))
    
    console.log(`📅 Next WhatsApp alert scheduled in ${hours}h ${minutes}m (at 11:30 AM)`)
    
    setTimeout(() => {
      console.log('🕚 11:30 AM - Sending WhatsApp alerts now!')
      this.sendDailyAlerts()
      // Then repeat every 24 hours
      this.intervalId = setInterval(() => {
        console.log('🕚 11:30 AM - Daily WhatsApp alerts!')
        this.sendDailyAlerts()
      }, 24 * 60 * 60 * 1000)
    }, timeUntilTarget)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private async sendDailyAlerts() {
    try {
      console.log('📱 Checking for low stock and sending WhatsApp alerts...')
      const response = await fetch('/api/cron/daily-alerts')
      const result = await response.json()
      
      if (result.sentAlerts && result.sentAlerts.length > 0) {
        console.log(`✅ WhatsApp alerts sent to ${result.sentAlerts.length} store owners`)
        result.sentAlerts.forEach(alert => {
          console.log(`  📱 ${alert.tenantName}: ${alert.phone} (${alert.productsCount} low stock items)`)
        })
      } else {
        console.log('📊 All stores have healthy stock levels - no alerts needed')
      }
    } catch (error) {
      console.error('❌ Failed to send daily alerts:', error)
    }
  }
}

// Auto-start the system
if (typeof window !== 'undefined') {
  AutoAlertSystem.getInstance().start()
}