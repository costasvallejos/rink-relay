'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function signOutAndRedirect() {
      await supabase.auth.signOut()  // force sign out every time on home page load

      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }

      setLoading(false)
    }
    signOutAndRedirect()
  }, [router])

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <p>Loading...</p>
      </main>
    )
  }

  return null
}
