'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function redirect() {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        router.replace('/closet')
      } else {
        router.replace('/landing')
      }
    }

    redirect()
  }, [])

  return (
    <div style={{
      background: '#080808',
      minHeight: '100vh'
    }} />
  )
}
