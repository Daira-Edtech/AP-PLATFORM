import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROLE_DASHBOARD_MAP } from '@/lib/roles'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request: { headers: request.headers },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request: { headers: request.headers },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const protectedPrefixes = ['/admin', '/commissioner', '/dpo', '/cdpo']
    const isProtectedRoute = protectedPrefixes.some(p => request.nextUrl.pathname.startsWith(p))
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/admin')

    // Block unauthenticated API access
    if (!user && isApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Redirect unauthenticated users on protected routes to login
    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        const redirectResponse = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach((c) => {
            redirectResponse.cookies.set(c.name, c.value, c)
        })
        return redirectResponse
    }

    // Redirect authenticated users away from login/root to their dashboard
    if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/')) {
        const hasError = request.nextUrl.searchParams.has('error')
        if (!hasError) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile) {
                const dashboard = ROLE_DASHBOARD_MAP[profile.role]
                if (dashboard) {
                    const url = request.nextUrl.clone()
                    url.pathname = dashboard
                    const redirectResponse = NextResponse.redirect(url)
                    supabaseResponse.cookies.getAll().forEach((c) => {
                        redirectResponse.cookies.set(c.name, c.value, c)
                    })
                    return redirectResponse
                }
            }
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: ['/', '/admin/:path*', '/commissioner/:path*', '/dpo/:path*', '/cdpo/:path*', '/login', '/api/:path*'],
}