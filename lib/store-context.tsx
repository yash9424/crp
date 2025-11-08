"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface StoreContextType {
  storeId: string | null
  storeName: string | null
  tenantId: string | null
  isLoading: boolean
}

const StoreContext = createContext<StoreContextType>({
  storeId: null,
  storeName: null,
  tenantId: null,
  isLoading: true
})

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [storeData, setStoreData] = useState<StoreContextType>({
    storeId: null,
    storeName: null,
    tenantId: null,
    isLoading: true
  })

  useEffect(() => {
    if (status === 'loading') return

    if (session?.user?.role === 'tenant-admin') {
      setStoreData({
        storeId: session.user.id,
        storeName: session.user.storeName || 'Unknown Store',
        tenantId: session.user.tenantId || null,
        isLoading: false
      })
    } else {
      setStoreData({
        storeId: null,
        storeName: null,
        tenantId: null,
        isLoading: false
      })
    }
  }, [session, status])

  return (
    <StoreContext.Provider value={storeData}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}