'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';

export default function SelectRole() {
  const router = useRouter();
  const [role, setRole] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function handleRoleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!role) {
      setErrorMsg('Please select a role');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Get the current user
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      setErrorMsg('User not found.');
      setLoading(false);
      return;
    }

    const user = data.user;

    // Update the user's role in your users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ role })
      .eq('id', user.id);

    if (updateError) {
      setErrorMsg(updateError.message);
      setLoading(false);
      return;
    }

    // Redirect to dashboard based on role
    if (role === 'player') router.push('/dashboard/player');
    else if (role === 'organizer') router.push('/dashboard/organizer');
    else if (role === 'coach') router.push('/dashboard/coach');
    else router.push('/dashboard');

    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-6">Select Your Role</h1>

      <form onSubmit={handleRoleSubmit} className="flex flex-col gap-4">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={loading}
          className="border p-2 rounded"
        >
          <option value="">-- Select a role --</option>
          <option value="player">Player</option>
          <option value="organizer">Organizer</option>
          <option value="coach">Coach</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>

      {errorMsg && <p className="text-red-600 mt-4">{errorMsg}</p>}
    </div>
  );
}
