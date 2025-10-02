export const showToast = {
  success: (message: string) => {
    if (typeof window === 'undefined') return
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] font-medium'
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
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] font-medium'
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
    toast.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] font-medium'
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