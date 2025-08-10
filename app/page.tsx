'use client'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  async function testConnection() {
    const { data, error } = await supabase.from('test').select('*')
    console.log('Supabase response:', { data, error })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold">Hello Rink Relay</h1>
      <button
        onClick={testConnection}
        className="mt-6 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Test Supabase
      </button>
    </main>
  )
}
