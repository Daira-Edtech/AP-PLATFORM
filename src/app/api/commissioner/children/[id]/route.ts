import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const adminSb = createAdminClient()

    // Auth check
    const userSb = await createClient()
    const { data: { user } } = await userSb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        switch (type) {
            // ═══════════════════════════════════════════════════════
            // PROFILE — demographics + prenatal + latest growth + geo
            // ═══════════════════════════════════════════════════════
            case 'profile': {
                const { data: child } = await adminSb
                    .from('children')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

                // Get AWC, mandal, district names
                let awcName = 'Unknown', mandalName = 'Unknown', districtName = 'Unknown'
                if (child.awc_id) {
                    const { data: awc } = await adminSb.from('awcs').select('name, mandal_id').eq('id', child.awc_id).single()
                    if (awc) {
                        awcName = awc.name
                        if (awc.mandal_id) {
                            const { data: mandal } = await adminSb.from('mandals').select('name, district_id').eq('id', awc.mandal_id).single()
                            if (mandal) {
                                mandalName = mandal.name
                                if (mandal.district_id) {
                                    const { data: district } = await adminSb.from('districts').select('name').eq('id', mandal.district_id).single()
                                    if (district) districtName = district.name
                                }
                            }
                        }
                    }
                }

                // Prenatal history
                const { data: prenatal } = await adminSb
                    .from('prenatal_history')
                    .select('*')
                    .eq('child_id', id)
                    .single()

                // Latest growth record
                const { data: latestGrowth } = await adminSb
                    .from('growth_records')
                    .select('*')
                    .eq('child_id', id)
                    .order('measurement_date', { ascending: false })
                    .limit(1)
                    .single()

                // Flag count
                const { count: flagCount } = await adminSb
                    .from('flags').select('*', { count: 'exact', head: true })
                    .eq('child_id', id)

                // Referral count
                const { count: referralCount } = await adminSb
                    .from('referrals').select('*', { count: 'exact', head: true })
                    .eq('child_id', id)

                // Screening count
                const { count: screeningCount } = await adminSb
                    .from('questionnaire_sessions').select('*', { count: 'exact', head: true })
                    .eq('child_id', id)

                // Compute age
                let ageStr = 'N/A'
                if (child.dob) {
                    const dob = new Date(child.dob)
                    const now = new Date()
                    const ageMonths = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth())
                    ageStr = `${Math.floor(ageMonths / 12)}y ${ageMonths % 12}m`
                }

                const riskMap: Record<string, string> = { 'low': 'Low', 'medium': 'Medium', 'high': 'High', 'critical': 'Critical' }

                return NextResponse.json({
                    id: child.id,
                    name: child.name,
                    age: ageStr,
                    dob: child.dob,
                    gender: child.gender,
                    motherName: child.mother_name,
                    fatherName: child.father_name,
                    guardianName: child.guardian_name,
                    phone: child.mother_phone || child.father_phone,
                    address: child.address,
                    village: child.village,
                    photoUrl: child.photo_url,
                    riskLevel: riskMap[child.current_risk_level] || 'Unknown',
                    lastScreeningDate: child.last_screening_date,
                    registeredAt: child.registered_at,
                    awc: awcName,
                    mandal: mandalName,
                    district: districtName,
                    prenatal: prenatal ? {
                        gestationalAge: prenatal.gestational_age_weeks,
                        birthWeight: prenatal.birth_weight_grams,
                        deliveryType: prenatal.delivery_type,
                        birthPlace: prenatal.birth_place,
                        apgar1: prenatal.apgar_1min,
                        apgar5: prenatal.apgar_5min,
                        nicuStay: prenatal.nicu_stay,
                        nicuDays: prenatal.nicu_days,
                        birthComplications: prenatal.birth_complications,
                        maternalConditions: prenatal.maternal_conditions,
                    } : null,
                    latestGrowth: latestGrowth ? {
                        date: latestGrowth.measurement_date,
                        weightKg: latestGrowth.weight_kg,
                        heightCm: latestGrowth.height_cm,
                        muacCm: latestGrowth.muac_cm,
                        waz: latestGrowth.waz,
                        haz: latestGrowth.haz,
                        whz: latestGrowth.whz,
                        muacClass: latestGrowth.muac_class,
                        edema: latestGrowth.edema,
                    } : null,
                    counts: {
                        flags: flagCount || 0,
                        referrals: referralCount || 0,
                        screenings: screeningCount || 0,
                    }
                })
            }

            // ═══════════════════════════════════════════════════════
            // GROWTH — all measurements for charting
            // ═══════════════════════════════════════════════════════
            case 'growth': {
                const { data: records } = await adminSb
                    .from('growth_records')
                    .select('measurement_date, age_months_at_measurement, weight_kg, height_cm, head_circumference_cm, muac_cm, waz, haz, whz, muac_class, edema, edema_severity, notes')
                    .eq('child_id', id)
                    .order('measurement_date', { ascending: true })

                return NextResponse.json(records || [])
            }

            // ═══════════════════════════════════════════════════════
            // SCREENINGS — all questionnaire sessions
            // ═══════════════════════════════════════════════════════
            case 'screenings': {
                const { data: sessions } = await adminSb
                    .from('questionnaire_sessions')
                    .select('id, session_type, screening_level, domain_scores, composite_score, risk_level, risk_confidence, ai_narrative, ai_predictions, status, started_at, completed_at, supervisor_override_risk, override_justification')
                    .eq('child_id', id)
                    .order('started_at', { ascending: false })

                return NextResponse.json(sessions || [])
            }

            // ═══════════════════════════════════════════════════════
            // OBSERVATIONS — AWW field notes
            // ═══════════════════════════════════════════════════════
            case 'observations': {
                const { data: obs } = await adminSb
                    .from('observations')
                    .select('id, visit_date, observation_text, category, domain, concern_level, sentiment, auto_tags, ai_response, voice_note_url, photo_url, status, created_at')
                    .eq('child_id', id)
                    .order('created_at', { ascending: false })

                return NextResponse.json(obs || [])
            }

            // ═══════════════════════════════════════════════════════
            // FLAGS — escalation flags
            // ═══════════════════════════════════════════════════════
            case 'flags': {
                const { data: flags } = await adminSb
                    .from('flags')
                    .select('id, title, description, priority, status, category, source, ai_reasoning, acknowledged_at, resolved_at, resolution_notes, escalated_to, escalation_deadline, auto_escalated, created_at')
                    .eq('child_id', id)
                    .order('created_at', { ascending: false })

                return NextResponse.json(flags || [])
            }

            // ═══════════════════════════════════════════════════════
            // REFERRALS — specialist referrals
            // ═══════════════════════════════════════════════════════
            case 'referrals': {
                const { data: referrals } = await adminSb
                    .from('referrals')
                    .select('id, referral_type, urgency, reason, notes, status, outcome_notes, referred_to_name, referred_to_designation, follow_up_date, follow_up_status, completed_at, created_at')
                    .eq('child_id', id)
                    .order('created_at', { ascending: false })

                return NextResponse.json(referrals || [])
            }

            default:
                return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
        }
    } catch (error: any) {
        console.error('Child detail API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
