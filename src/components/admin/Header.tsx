import { Profile } from '@/lib/types/database'
import { User } from '@supabase/supabase-js'

interface HeaderProps {
    user: User
    profile: Profile | null
}

export default function Header({ user, profile }: HeaderProps) {
    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 w-full">
            <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>

            <div className="flex items-center gap-4">
                <button className="relative p-2 text-slate-400 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-100">
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-medium text-slate-800">{profile?.name || 'User'}</p>
                        <p className="text-xs text-slate-500 capitalize">{profile?.role?.replace('_', ' ') || 'Admin'}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-sm font-medium text-white border border-slate-700">
                        {profile?.name?.[0] || user.email?.[0] || 'U'}
                    </div>
                </div>
            </div>
        </header>
    )
}
