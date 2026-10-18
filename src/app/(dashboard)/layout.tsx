import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { sendWelcomeOnce } from '@/lib/welcome-email'
import BottomNav from '@/components/layout/BottomNav'
import '../dashboard.css'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Boas-vindas independem de como a conta foi confirmada (link em outro aparelho, login direto, OAuth).
  // Roda depois da resposta, sem atrasar a página.
  const { data: profile } = await supabase
    .from('profiles')
    .select('welcome_email_sent_at')
    .eq('id', user.id)
    .maybeSingle()
  if (profile && !profile.welcome_email_sent_at) {
    after(() => sendWelcomeOnce(user.id, user.email))
  }

  return (
    <div className="dashboard-wrap">
      <main className="dashboard-content">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}