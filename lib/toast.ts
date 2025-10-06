export const showToast = {
  success: (message: string) => {
    if (typeof window === 'undefined') return
    const toast = document.createElement('div')
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #10b981;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 99999;
      font-family: system-ui;
      font-weight: 500;
      max-width: 400px;
      word-wrap: break-word;
    `
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
    }, 3000)
  },
  
  error: (message: string) => {
    if (typeof window === 'undefined') return
    const toast = document.createElement('div')
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #ef4444;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 99999;
      font-family: system-ui;
      font-weight: 500;
      max-width: 400px;
      word-wrap: break-word;
    `
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
    }, 3000)
  },
  
  alert: (message: string) => {
    if (typeof window === 'undefined') return
    const toast = document.createElement('div')
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #f59e0b;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 99999;
      font-family: system-ui;
      font-weight: 500;
      max-width: 400px;
      word-wrap: break-word;
    `
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
    }, 3000)
  }
}

export const confirmDelete = (message: string = 'Are you sure you want to delete this item?'): boolean => {
  return confirm(message)
}