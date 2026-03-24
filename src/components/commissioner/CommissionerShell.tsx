'use client'

import React, { useState, useRef, useEffect } from 'react'
import { AppView } from '@/lib/commissioner/types'
import { NAV_ITEMS, getIcon } from '@/lib/commissioner/constants'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Settings, LogOut, ChevronDown, Globe } from 'lucide-react'
import { LanguageProvider, useLanguage, LANGUAGE_OPTIONS } from '@/lib/commissioner/LanguageContext'
import { NAV_TRANSLATION_MAP } from '@/lib/commissioner/translations'

const VIEW_TO_ROUTE: Record<string, string> = {
    [AppView.DASHBOARD]: '/commissioner/dashboard',
    [AppView.DISTRICTS]: '/commissioner/districts',
    [AppView.MAP]: '/commissioner/map',
    [AppView.SCREENING]: '/commissioner/screening',
    [AppView.ANALYTICS]: '/commissioner/analytics',
    [AppView.POLICY]: '/commissioner/policy',
    [AppView.ESCALATIONS]: '/commissioner/escalations',
    [AppView.REFERRALS]: '/commissioner/referrals',
    [AppView.WORKFORCE]: '/commissioner/workforce',
    [AppView.CHILDREN]: '/commissioner/children',
    [AppView.BRIEFS]: '/commissioner/briefs',
    [AppView.REPORTS]: '/commissioner/briefs',
    [AppView.SETTINGS]: '/commissioner/settings',
}

const ROUTE_TO_VIEW: Record<string, AppView> = Object.fromEntries(
    Object.entries(VIEW_TO_ROUTE).map(([view, route]) => [route, view as AppView])
) as Record<string, AppView>

interface CommissionerShellProps {
    children: React.ReactNode
    userName: string
    userEmail: string
    avatarUrl: string | null
}

function ShellContent({ children, userName, userEmail, avatarUrl }: CommissionerShellProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
    const [langDropdownOpen, setLangDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const langDropdownRef = useRef<HTMLDivElement>(null)
    const { language, setLanguage, t } = useLanguage()

    const activeView = ROUTE_TO_VIEW[pathname]
        || Object.entries(ROUTE_TO_VIEW).find(([route]) => pathname.startsWith(route + '/'))?.[1] as AppView
        || AppView.DASHBOARD

    const avatar = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=000&color=fff&bold=true`

    const handleNavigation = (view: AppView) => {
        const route = VIEW_TO_ROUTE[view]
        if (route) router.push(route)
    }

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    // Translate an AppView label using the nav translation map
    const tNav = (viewId: string) => {
        const key = NAV_TRANSLATION_MAP[viewId]
        return key ? t(key) : viewId
    }

    // Close dropdowns on click outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setProfileDropdownOpen(false)
            }
            if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
                setLangDropdownOpen(false)
            }
        }
        if (profileDropdownOpen || langDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [profileDropdownOpen, langDropdownOpen])

    const currentLangOption = LANGUAGE_OPTIONS.find(l => l.code === language) || LANGUAGE_OPTIONS[0]

    return (
        <div className="min-h-screen bg-[#F9F9F9] selection:bg-black selection:text-white">
            {/* Top Navbar */}
            <nav className="fixed top-0 left-0 right-0 h-[56px] bg-black flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center cursor-pointer" onClick={() => handleNavigation(AppView.DASHBOARD)}>
                        <img src="/whitelogo.png" alt="Jiveesha Logo" className="h-7 w-auto object-contain" />
                    </div>
                    <div className="h-4 w-[1px] bg-[#333333]" />
                    <span className="text-[#888888] text-[11px] font-bold tracking-widest uppercase">{t('header.stateCommand')}</span>
                </div>

                <div className="flex items-center text-[13px] gap-2 ml-auto mr-8">
                    <span className="text-[#AAAAAA]">{t('header.state')}</span>
                    <span className="text-[#AAAAAA] opacity-30 select-none">/</span>
                    <span className="text-white font-bold">{tNav(activeView)}</span>
                </div>

                <div className="flex items-center gap-6">
                    {/* Language Toggle */}
                    <div className="relative" ref={langDropdownRef}>
                        <button
                            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                            className="flex items-center gap-1.5 text-white opacity-80 hover:opacity-100 transition-opacity px-2 py-1 rounded hover:bg-white/10"
                            title={t('header.language')}
                        >
                            <Globe size={16} />
                            <span className="text-[12px] font-bold">{currentLangOption.short}</span>
                            <ChevronDown size={12} className={`transition-transform duration-200 ${langDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {langDropdownOpen && (
                            <div className="absolute right-0 top-[calc(100%+8px)] w-44 bg-[#1A1A1A] rounded-lg shadow-2xl border border-[#333] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-3 py-2 border-b border-[#333]">
                                    <p className="text-[11px] font-bold text-[#888] uppercase tracking-wider">{t('header.language')}</p>
                                </div>
                                {LANGUAGE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.code}
                                        onClick={() => {
                                            setLanguage(opt.code)
                                            setLangDropdownOpen(false)
                                        }}
                                        className={`flex items-center justify-between w-full px-3 py-2.5 text-[13px] transition-colors ${language === opt.code
                                            ? 'bg-white/10 text-white font-bold'
                                            : 'text-[#AAA] hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <span>{opt.label}</span>
                                        <span className="text-[11px] font-bold opacity-60">{opt.short}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notification Bell */}
                    <button className="relative text-white opacity-80 hover:opacity-100 transition-opacity">
                        <span className="sr-only">{t('header.notifications')}</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                        <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-black" />
                    </button>

                    {/* Profile section with dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                            className="flex items-center gap-3 cursor-pointer group"
                        >
                            <div className="flex flex-col items-end">
                                <span className="text-[#AAAAAA] text-[12px] leading-tight">{t('header.commissioner')}</span>
                                <span className="text-white text-[13px] font-medium leading-tight">{userName}</span>
                            </div>
                            <img src={avatar} alt="Profile" className="w-8 h-8 rounded-full border border-[#333]" />
                            <ChevronDown
                                size={14}
                                className={`text-[#888] transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {profileDropdownOpen && (
                            <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white rounded-lg shadow-2xl border border-[#E5E5E5] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-3 border-b border-[#F0F0F0]">
                                    <p className="text-[13px] font-bold text-black truncate">{userName}</p>
                                    <p className="text-[11px] text-[#888] truncate">{userEmail}</p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setProfileDropdownOpen(false)
                                            router.push('/commissioner/settings')
                                        }}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-[#444] font-medium hover:bg-[#F5F5F5] transition-colors"
                                    >
                                        <Settings size={16} className="text-[#888]" />
                                        {t('header.settings')}
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-red-600 font-medium hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut size={16} />
                                        {t('header.logout')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Sidebar */}
            <div
                className={`fixed left-0 top-[56px] h-[calc(100vh-56px)] bg-white border-r border-[#E5E5E5] transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-16' : 'w-[260px]'
                    }`}
            >
                <div className="flex flex-col py-2 overflow-y-auto h-full scrollbar-hide">
                    {NAV_ITEMS.map((item) => (
                        <React.Fragment key={item.id}>
                            <button
                                onClick={() => handleNavigation(item.id)}
                                className={`flex items-center w-full h-12 transition-all relative group overflow-hidden ${activeView === item.id
                                    ? 'bg-black text-white'
                                    : 'bg-white text-[#555555] hover:bg-[#F5F5F5]'
                                    }`}
                            >
                                {activeView === item.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-white z-10" />
                                )}
                                <div className={`flex items-center justify-center shrink-0 ${sidebarCollapsed ? 'w-16' : 'w-14'}`}>
                                    {getIcon(item.icon, 20)}
                                </div>
                                {!sidebarCollapsed && (
                                    <span className="text-[13px] font-medium whitespace-nowrap">{tNav(item.id)}</span>
                                )}
                                {sidebarCollapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-[11px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                                        {tNav(item.id)}
                                    </div>
                                )}
                            </button>
                            {item.divider && <div className="mx-4 my-2 border-t border-[#E5E5E5]" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <main className={`pt-[56px] transition-all duration-300 ${sidebarCollapsed ? 'pl-16' : 'pl-[260px]'}`}>
                <div className="p-8 min-h-[calc(100vh-56px)] overflow-y-auto">
                    <div className="max-w-[1400px] mx-auto">
                        {children}
                    </div>
                </div>
            </main>

            {/* Toggle Button */}
            <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="fixed bottom-8 left-8 z-50 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {sidebarCollapsed ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5" /></svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" /></svg>
                )}
            </button>
        </div>
    )
}

export default function CommissionerShell(props: CommissionerShellProps) {
    return (
        <LanguageProvider>
            <ShellContent {...props} />
        </LanguageProvider>
    )
}
