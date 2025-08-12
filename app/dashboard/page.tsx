'use client';

import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabaseClient';

export default function Dashboard() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      {/* Your dashboard content here */}

      <button
        onClick={handleLogout}
        className="mt-4 bg-red-600 text-white p-2 rounded hover:bg-red-700"
      >
        Log Out
      </button>
    </div>
  );
}
