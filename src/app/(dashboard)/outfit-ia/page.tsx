'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OutfitIARedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/mia')
  }, [router])

  return null
}
