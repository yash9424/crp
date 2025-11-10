// Server-side auto-alert system
export class AutoAlertSystem {
  private static instance: AutoAlertSystem

  static getInstance(): AutoAlertSystem {
    if (!AutoAlertSystem.instance) {
      AutoAlertSystem.instance = new AutoAlertSystem()
    }
    return AutoAlertSystem.instance
  }

  // Manual trigger for testing
  async triggerNow() {
    return await this.sendDailyAlerts()
  }

  private async sendDailyAlerts() {
    try {
      console.log('📱 Checking for low stock and sending WhatsApp alerts...')
      
      // Use absolute URL for server-side fetch
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/cron/daily-alerts`)
      const result = await response.json()
      
      if (result.sentAlerts && result.sentAlerts.length > 0) {
        console.log(`✅ WhatsApp alerts sent to ${result.sentAlerts.length} store owners`)
        result.sentAlerts.forEach(alert => {
          console.log(`  📱 ${alert.tenantName}: ${alert.phone} (${alert.productsCount} low stock items)`)
        })
      } else {
        console.log('📊 All stores have healthy stock levels - no alerts needed')
      }
      
      return result
    } catch (error) {
      console.error('❌ Failed to send daily alerts:', error)
      throw error
    }
  }
}

// Export for manual testing
export const alertSystem = AutoAlertSystem.getInstance()