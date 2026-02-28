import Link from 'next/link'

export default function Sidebar() {
    // This hook would be used if this were a client component to highlight active links
    // For now we'll keep it simple or make it 'use client' if needed

    const menuItems = [
        { label: 'Dashboard', href: '/admin/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { label: 'User Management', href: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { label: 'Geographic Hierarchy', href: '/admin/geography', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'AWC Management', href: '/admin/geography/awcs', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
        { label: 'System Health', href: '/admin/audit-log', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { label: 'Alerts', href: '/admin/alerts', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    ]

    return (
        <aside className="w-64 bg-gradient-to-b from-slate-900 to-black text-white flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center font-bold text-white">J</div>
                <span className="text-lg font-bold tracking-tight">JIVEESHA</span>
                <span className="text-[10px] bg-red-900/50 text-red-200 px-1.5 py-0.5 rounded border border-red-800 ml-auto">ADMIN</span>
            </div>

            <div className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Main Menu
            </div>

            <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-400 rounded-lg hover:bg-zinc-900 hover:text-white transition-colors group"
                    >
                        <svg className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                        {item.label}
                    </Link>
                ))}
            </nav>

        </aside>
    )
}
