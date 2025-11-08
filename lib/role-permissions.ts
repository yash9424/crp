export type UserRole = 'manufacturer-owner' | 'factory-manager'

export interface RolePermissions {
  canViewAllFactories: boolean
  canCreateFactory: boolean
  canEditFactory: boolean
  canDeleteFactory: boolean
  canAssignManagers: boolean
  canViewFactoryDetails: boolean
  canManageProduction: boolean
  canManageInventory: boolean
  canManageEmployees: boolean
}

export const rolePermissions: Record<UserRole, RolePermissions> = {
  'manufacturer-owner': {
    canViewAllFactories: true,
    canCreateFactory: true,
    canEditFactory: true,
    canDeleteFactory: true,
    canAssignManagers: true,
    canViewFactoryDetails: true,
    canManageProduction: true,
    canManageInventory: true,
    canManageEmployees: true
  },
  'factory-manager': {
    canViewAllFactories: false,
    canCreateFactory: false,
    canEditFactory: false,
    canDeleteFactory: false,
    canAssignManagers: false,
    canViewFactoryDetails: true,
    canManageProduction: true,
    canManageInventory: true,
    canManageEmployees: true
  }
}

export function getUserRole(session: any): UserRole {
  if (session?.user?.role === 'tenant-admin' && session?.user?.tenantType === 'manufacturer') {
    return 'manufacturer-owner'
  }
  if (session?.user?.role === 'factory-manager') {
    return 'factory-manager'
  }
  return 'manufacturer-owner' // default
}

export function hasPermission(userRole: UserRole, permission: keyof RolePermissions): boolean {
  return rolePermissions[userRole][permission]
}