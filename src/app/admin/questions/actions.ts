'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type QuestionDomain = 'GM' | 'FM' | 'LC' | 'COG' | 'SE'

export interface Question {
    id: string
    question_number: number
    text_en: string
    text_te: string | null
    domain: QuestionDomain
    age_min_months: number
    age_max_months: number
    weight: number
    is_critical: boolean
    illustration_url: string | null
    audio_url_te: string | null
    created_at: string
}

export interface QuestionInput {
    question_number: number
    text_en: string
    text_te?: string
    domain: QuestionDomain
    age_min_months: number
    age_max_months: number
    weight: number
    is_critical: boolean
}

export async function getQuestions(filters?: {
    domain?: QuestionDomain | ''
    search?: string
    isCritical?: boolean
}) {
    const supabase = await createClient()

    let query = supabase
        .from('questions')
        .select('*')
        .order('question_number', { ascending: true })

    if (filters?.domain) query = query.eq('domain', filters.domain)
    if (filters?.isCritical) query = query.eq('is_critical', true)
    if (filters?.search) {
        query = query.or(`text_en.ilike.%${filters.search}%,text_te.ilike.%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data as Question[]
}

export async function createQuestion(input: QuestionInput) {
    const supabase = await createClient()
    const { error } = await supabase.from('questions').insert(input)
    if (error) throw error
    revalidatePath('/admin/questions')
}

export async function updateQuestion(id: string, input: Partial<QuestionInput>) {
    const supabase = await createClient()
    const { error } = await supabase.from('questions').update(input).eq('id', id)
    if (error) throw error
    revalidatePath('/admin/questions')
}

export async function deleteQuestion(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/admin/questions')
}
