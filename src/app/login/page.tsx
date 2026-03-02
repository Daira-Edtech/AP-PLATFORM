'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { getRoleDashboard } from '@/lib/roles'

export default function LoginPage() {
    const searchParams = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(searchParams.get('error'))
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const err = searchParams.get('error')
        if (err) setError(err)
    }, [searchParams])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) throw authError

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', authData.user.id)
                .single()

            if (profileError || !profile) {
                await supabase.auth.signOut()
                throw new Error('Profile not found. Contact your administrator.')
            }

            const dashboard = getRoleDashboard(profile.role)

            if (dashboard.startsWith('/login')) {
                await supabase.auth.signOut()
                throw new Error('No portal access for this account role.')
            }

            router.push(dashboard)
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Failed to sign in')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen font-sans">
            {/* Left Side - Hero/Info */}
            <div className="hidden lg:flex w-1/2 bg-black flex-col justify-between p-12 text-white">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-bold text-sm rounded">J</div>
                        <span className="text-lg font-bold tracking-tight">Jiveesha ECD Platform</span>
                    </div>

                    <div className="mt-24 max-w-md">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mb-6">
                            Unified Portal Access
                        </p>
                        <h1 className="text-5xl font-bold leading-[1.1] tracking-tight mb-12">
                            Secure access for every level of the ICDS hierarchy.
                        </h1>

                        <div className="space-y-3">
                            {[
                                { label: 'State Commissioner', desc: 'State-wide oversight & analytics' },
                                { label: 'District Programme Officer', desc: 'District-level monitoring' },
                                { label: 'CDPO', desc: 'Project-level management' },
                            ].map((item) => (
                                <div key={item.label} className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                                        <p className="text-[10px] text-zinc-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="text-[10px] text-zinc-600 font-medium tracking-wider">
                    © 2025 JIVEESHA PLATFORMS. ALL RIGHTS RESERVED.
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center p-8 lg:p-24">
                <div className="w-full max-w-[360px] space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In</h2>
                        <p className="text-xs text-zinc-500 font-medium mt-1">Access your role-specific dashboard</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 tracking-widest uppercase mb-1.5 ml-0.5">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@jiveesha.in"
                                    className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-black placeholder-zinc-300 transition-all"
                                />
                            </div>

                            <div className="relative">
                                <label className="block text-[10px] font-bold text-zinc-400 tracking-widest uppercase mb-1.5 ml-0.5">
                                    Password
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-black placeholder-zinc-300 transition-all pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 bottom-3 text-zinc-400 hover:text-black transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={showPassword ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"} />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-[10px] font-bold text-center bg-red-50 py-2 rounded-lg border border-red-100 uppercase tracking-wider">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white rounded-lg py-3.5 text-sm font-bold hover:bg-zinc-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>

                    {error && (
                        <div className="text-center">
                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut()
                                    router.replace('/login')
                                    setError(null)
                                }}
                                className="text-[10px] text-zinc-400 font-bold hover:text-black hover:underline uppercase tracking-widest mt-2"
                            >
                                Sign out of current session
                            </button>
                        </div>
                    )}

                    <div className="pt-8">
                        <p className="text-[10px] text-zinc-400 font-medium text-center leading-relaxed">
                            Access from unauthorized IP addresses is prohibited and monitored.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
