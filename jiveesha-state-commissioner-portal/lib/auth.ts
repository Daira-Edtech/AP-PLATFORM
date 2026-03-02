import { supabase } from './supabase';
import type { UserProfile } from '../types/database';

export async function signIn(email: string, password: string): Promise<UserProfile> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Authentication failed');

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

    if (profileError) throw new Error('Failed to fetch user profile');
    if (!profile) throw new Error('Profile not found');

    if (profile.role !== 'commissioner') {
        await supabase.auth.signOut();
        throw new Error('Access denied. This portal is restricted to State Commissioner access only.');
    }

    return profile as UserProfile;
}

export async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'commissioner') return null;
    return profile as UserProfile;
}
