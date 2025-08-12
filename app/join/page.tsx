'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabaseClient';
import { redirectByRole } from '../../lib/redirectByRole';  // <-- import this

export default function JoinCode() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    // Step 1: Check join code validity
    const { data: joinCode, error: fetchError } = await supabase
      .from('join_codes')
      .select('id, type, expires_at')
      .eq('code', code)
      .limit(1)
      .single();

    if (fetchError || !joinCode) {
      setErrorMsg('Invalid join code.');
      return;
    }

    // Check expiration
    if (joinCode.expires_at && new Date(joinCode.expires_at) < new Date()) {
      setErrorMsg('Join code has expired.');
      return;
    }

    // Step 2: Get current user
    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !currentUser) {
      setErrorMsg('User not authenticated.');
      return;
    }

    // Step 3: Update role in users table based on join code type
    const newRole = joinCode.type === 'tournament' ? 'organizer' : 'coach'; // Adjust as needed

    const { error: updateError } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', currentUser.id);

    if (updateError) {
      setErrorMsg('Failed to update role.');
      return;
    }

    // Step 4: Use redirectByRole helper instead of hardcoded push
    await redirectByRole(currentUser.id, router);
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Enter Join Code</h1>
      <form onSubmit={handleJoin} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Join Code"
          value={code}
          required
          onChange={(e) => setCode(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700"
        >
          Submit
        </button>
      </form>
      {errorMsg && <p className="text-red-600 mt-2">{errorMsg}</p>}
    </div>
  );
}
