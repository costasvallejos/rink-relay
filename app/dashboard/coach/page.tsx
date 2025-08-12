'use client';

import { useRouter } from 'next/navigation';
import supabase from '../../../lib/supabaseClient';

export default function CoachDashboard() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-6">Coach Dashboard</h1>
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700"
      >
        Log Out
      </button>
    </main>
  );
}
