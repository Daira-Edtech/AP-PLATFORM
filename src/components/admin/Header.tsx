'use client'

import { Profile } from '@/lib/types/database'
import { User } from '@supabase/supabase-js'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface HeaderProps {
    user: User
    profile: Profile | null
}

const PAGE_TITLES: Record<string, string> = {
    '/admin/dashboard': 'Dashboard',
    '/admin/users': 'User Management',
    '/admin/users/bulk': 'Bulk Operations',
    '/admin/roles': 'Role Permissions',
    '/admin/geography': 'Geographic Hierarchy',
    '/admin/geography/awcs': 'AWC Management',
    '/admin/assignments': 'Assignment Map',
    '/admin/health': 'System Health',
    '/admin/audit-log': 'Audit Log',
    '/admin/data': 'Data Management',
    '/admin/notifications': 'Notifications',
    '/admin/settings': 'Settings',
}

export default function Header({ user, profile }: HeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    // Improved logic to handle sub-paths and trailing slashes
    const getPageTitle = () => {
        // Sort keys by length descending to find the most specific match first
        const sortedKeys = Object.keys(PAGE_TITLES).sort((a, b) => b.length - a.length)

        for (const key of sortedKeys) {
            if (pathname?.startsWith(key)) {
                return PAGE_TITLES[key]
            }
        }
        return 'Dashboard'
    }

    const pageTitle = getPageTitle()

    useEffect(() => {
        console.log('Current Admin Path:', pathname)
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="h-16 bg-[var(--color-card-bg)] border-b border-[var(--color-border-mute)] shadow-sm flex flex-shrink-0 items-center justify-between px-6 sticky top-0 z-50 w-full backdrop-blur-md bg-white/80">
            <h1 className="text-xl font-black tracking-tight text-[var(--color-dark-slate)] drop-shadow-sm">{pageTitle}</h1>

            <div className="flex items-center gap-4">
                <button className="relative p-2 text-[var(--color-subtle-text)] hover:text-[var(--color-dark-slate)] transition-colors rounded-full hover:bg-[var(--color-slate-light)]">
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-danger-text)] rounded-full border border-white"></span>
                    <Bell className="w-5 h-5" strokeWidth={2.5} />
                </button>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-3 pl-4 border-l border-[var(--color-border-mute)] hover:opacity-80 transition-opacity"
                    >
                        <div className="hidden md:block text-right">
                            <p className="text-sm font-bold text-[var(--color-dark-slate)]">{profile?.name || 'User'}</p>
                            <p className="text-xs font-semibold text-[var(--color-subtle-text)]">{user.email}</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-[var(--color-primary-solid)] flex items-center justify-center text-sm font-black text-white shadow-sm ring-2 ring-[var(--color-slate-mute)]">
                            {profile?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                    </button>

                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: -15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className="absolute right-0 mt-2 w-48 bg-[var(--color-card-bg)] rounded-[16px] shadow-lg shadow-[var(--color-slate-mute)] border-2 border-[var(--color-border-slate)] py-1 z-20 origin-top-right"
                            >
                                <div className="px-4 py-2 border-b border-[var(--color-border-mute)] md:hidden">
                                    <p className="text-sm font-bold text-[var(--color-dark-slate)] truncate">{profile?.name || 'User'}</p>
                                    <p className="text-xs font-semibold text-[var(--color-subtle-text)] truncate">{user.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2.5 text-sm font-bold text-[var(--color-danger-dark)] hover:bg-[var(--color-danger-light)] flex items-center gap-2 transition-colors m-1 rounded-[8px] w-[calc(100%-8px)]"
                                >
                                    <LogOut className="w-4 h-4" strokeWidth={2.5} />
                                    Logout
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    )
}

