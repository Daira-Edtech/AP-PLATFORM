import { UserRole } from '@/lib/types/database'

export const ROLE_DASHBOARD_MAP: Record<string, string> = {
    commissioner: '/commissioner/dashboard',
    district_officer: '/dpo/dashboard',
    cdpo: '/cdpo/dashboard',
    system_admin: '/admin/dashboard',
    super_admin: '/admin/dashboard',
}

export function getRoleDashboard(role: UserRole | string): string {
    return ROLE_DASHBOARD_MAP[role] || '/login?error=No portal access for this account'
}

export const ROUTE_ROLE_MAP: Record<string, UserRole[]> = {
    '/commissioner': ['commissioner'],
    '/dpo': ['district_officer'],
    '/cdpo': ['cdpo'],
    '/admin': ['system_admin'],
}

export function getAllowedRolesForPath(pathname: string): UserRole[] | null {
    for (const [route, roles] of Object.entries(ROUTE_ROLE_MAP)) {
        if (pathname.startsWith(route)) return roles
    }
    return null
}
