import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

const VALID_CATEGORIES = ['missing_source', 'feature_request', 'bug_report', 'general'] as const

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { category, message, email, page } = body

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }
    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return NextResponse.json({ error: 'Message must be at least 5 characters' }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }
    if (email && typeof email === 'string' && email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
      }
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('feedback').insert({
      category,
      message: message.trim(),
      email: email?.trim() || null,
      page: page || '/news',
    })

    if (error) {
      console.error('Failed to insert feedback:', error)
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
