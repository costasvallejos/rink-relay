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
    async function checkUserAndRedirect() {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Fetch user role from your 'users' table
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error || !userData?.role) {
          // If no role found or error, fallback to general dashboard or logout
          router.replace('/dashboard')
        } else {
          // Redirect based on role
          switch (userData.role) {
            case 'organizer':
              router.replace('/dashboard/organizer')
              break
            case 'coach':
              router.replace('/dashboard/coach')
              break
            case 'player':
              router.replace('/dashboard/player')
              break
            default:
              router.replace('/dashboard')
          }
        }
      } else {
        router.replace('/auth')
      }

      setLoading(false)
    }

    checkUserAndRedirect()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Rink Relay...</p>
        </div>
      </div>
    )
  }

  return null
}
