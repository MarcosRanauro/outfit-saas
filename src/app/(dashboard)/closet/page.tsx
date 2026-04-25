'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ClosetPage() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ padding: '24px 20px' }}>
      <h1 style={{ color: '#f0f0f0', fontSize: '32px' }}>Closet</h1>
      <button
        onClick={handleLogout}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer',
          fontSize: '12px',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}
      >
        Sair
      </button>
    </div>
  )
}