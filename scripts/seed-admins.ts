import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
    const envFileContent = fs.readFileSync(envPath, 'utf8')
    envFileContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim()
            process.env[key.trim()] = value.replace(/^["']|["']$/g, '')
        }
    })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const superAdmins = [
    {
        email: 'admin@jiveesha.com',
        password: 'password123',
        name: 'Super Admin'
    }
]

async function seedSuperAdmins() {
    console.log('--- Starting Super Admin Seeding ---')

    for (const admin of superAdmins) {
        console.log(`Processing: ${admin.email}`)

        // 1. Create/Get User in Auth
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
            email: admin.email,
            password: admin.password,
            email_confirm: true,
            user_metadata: { name: admin.name }
        })

        const isAlreadyRegistered = userError && (
            userError.message.toLowerCase().includes('already registered') ||
            userError.message.toLowerCase().includes('already exists') ||
            (userError as any).status === 422
        )

        if (isAlreadyRegistered) {
            console.log(`User ${admin.email} already exists. Updating profile...`)
            const { data: listAllUsers, error: listError } = await supabase.auth.admin.listUsers()
            if (listError) {
                console.error(`Error listing users: ${listError.message}`)
                continue
            }
            const user = listAllUsers.users.find(u => u.email === admin.email)
            if (user) {
                await updateProfile(user.id, admin.name)
            } else {
                console.error(`Could not find user ${admin.email} in Auth list.`)
            }
        } else if (userError) {
            console.error(`Error creating user ${admin.email}:`, userError.message)
        } else if (userData.user) {
            console.log(`User ${admin.email} created successfully with ID: ${userData.user.id}`)
            await updateProfile(userData.user.id, admin.name)
        }
    }

    console.log('--- Seeding Completed ---')
}

async function updateProfile(userId: string, name: string) {
    console.log(`Updating profile for user ID: ${userId}`)

    // The table uses 'name' instead of 'full_name'
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            name: name,
            role: 'system_admin',
            is_active: true
        }, { onConflict: 'id' })

    if (profileError) {
        console.error(`Error updating profile: ${profileError.message}`)
    } else {
        console.log('Profile updated as system_admin successfully.')
    }
}

seedSuperAdmins().catch(console.error)
