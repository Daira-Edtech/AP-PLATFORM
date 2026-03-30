'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Users, ListChecks, ShieldCheck,
  Map, Building2, Route,
  Activity, ScrollText, Database, Bell, Settings,
  ClipboardList, Lightbulb, Flag, HelpCircle
} from 'lucide-react'

export default function Sidebar() {
    const pathname = usePathname()

    const sections = [
        {
            title: 'USERS',
            items: [
                { label: 'Dashboard', href: '/admin/dashboard', icon: ClipboardList },
                { label: 'User Management', href: '/admin/users', icon: Users },
                { label: 'Bulk Operations', href: '/admin/users/bulk', icon: ListChecks },
                { label: 'Role Permissions', href: '/admin/roles', icon: ShieldCheck },
            ]
        },
        {
            title: 'HIERARCHY',
            items: [
                { label: 'Geographic Hierarchy', href: '/admin/geography', icon: Map },
                { label: 'AWC Management', href: '/admin/geography/awcs', icon: Building2 },
                { label: 'Assignment Map', href: '/admin/assignments', icon: Route },
            ]
        },
        {
            title: 'CONTENT',
            items: [
                { label: 'Questions Bank', href: '/admin/questions', icon: HelpCircle },
                { label: 'Activity Library', href: '/admin/activities', icon: Lightbulb },
            ]
        },
        {
            title: 'SYSTEM',
            items: [
                { label: 'System Health', href: '/admin/health', icon: Activity },
                { label: 'Audit Log', href: '/admin/audit-log', icon: ScrollText },
                { label: 'Alerts', href: '/admin/alerts', icon: Flag },
                { label: 'Data Management', href: '/admin/data', icon: Database },
                { label: 'Notifications', href: '/admin/notifications', icon: Bell },
                { label: 'Settings', href: '/admin/settings', icon: Settings },
            ]
        }
    ]

    return (
        <aside className="w-64 bg-[var(--color-slate-light)] text-[var(--color-dark-slate)] flex flex-col h-screen fixed left-0 top-0 border-r border-[var(--color-border-mute)] z-30">
            <div className="p-6 pb-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#1a1a1a] to-[#333333] rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-md">E</div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black tracking-tighter text-[var(--color-dark-slate)] leading-none">ECD</span>
                        <span className="text-[10px] font-bold text-[var(--color-subtle-text)] tracking-wider uppercase mt-1">Platform</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-3 space-y-8 overflow-y-auto pt-4">
                {sections.map((section) => (
                    <div key={section.title} className="space-y-1">
                        <h3 className="px-4 text-[10px] font-bold text-[var(--color-placeholder)] uppercase tracking-[0.2em] mb-4">
                            {section.title}
                        </h3>
                        <div className="space-y-0.5">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="block relative outline-none"
                                    >
                                        <motion.div
                                            whileHover={{ x: isActive ? 0 : 4, backgroundColor: isActive ? 'transparent' : 'var(--color-card-bg)' }}
                                            whileTap={{ scale: 0.96 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            className={`relative flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-[12px] group z-10 ${
                                                isActive
                                                    ? 'text-white'
                                                    : 'text-[var(--color-subtle-text)] shadow-transparent'
                                            }`}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeSidebarTab"
                                                    className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] to-[#333333] shadow-md shadow-black/20 border border-white/5 rounded-[12px] -z-10"
                                                    initial={false}
                                                    transition={{
                                                        type: "tween",
                                                        ease: "easeInOut",
                                                        duration: 0.35
                                                    }}
                                                />
                                            )}
                                            
                                            <Icon 
                                                className={`relative z-10 w-5 h-5 transition-colors duration-300 ${isActive ? 'text-white' : 'text-[var(--color-subtle-text)] group-hover:text-[#1a1a1a]'}`} 
                                                strokeWidth={isActive ? 2.5 : 2} 
                                            />
                                            <span className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-white' : 'group-hover:text-[#1a1a1a]'}`}>
                                                {item.label}
                                            </span>
                                        </motion.div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-[var(--color-border-mute)] italic">
                <p className="text-[10px] text-[var(--color-placeholder)] text-center uppercase tracking-widest font-bold">Version 2.4.0-build</p>
            </div>
        </aside>
    )
}
