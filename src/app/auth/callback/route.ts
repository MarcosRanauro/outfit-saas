import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendWelcomeOnce } from '@/lib/welcome-email'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/closet'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      if (data.user) await sendWelcomeOnce(data.user.id, data.user.email)
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Erro no callback:', error)
  }

  return NextResponse.redirect(`${origin}/login?error=callback`)
}
