'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';

function generateJoinCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for(let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function CreateTeam() {
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setErrorMsg('User not authenticated.');
      setLoading(false);
      return;
    }

    const joinCode = generateJoinCode();

    try {
      // First, create the team and get the team data back
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert([{
          name: teamName,
          coach_id: user.id,
          join_code: joinCode,
        }])
        .select()
        .single();

      if (teamError) {
        setErrorMsg(teamError.message);
        setLoading(false);
        return;
      }

      // Then, add the coach as a team member with joined_at timestamp
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([{
          team_id: teamData.id,
          user_id: user.id,
          member_type: 'coach',
          joined_at: new Date().toISOString() // Add the joined_at timestamp
        }]);

      if (memberError) {
        // If adding the coach as a member fails, we should probably delete the team
        // or handle this error appropriately
        console.error('Error adding coach as team member:', memberError);
        setErrorMsg('Team created but failed to add coach as member. Please contact support.');
        setLoading(false);
        return;
      }

      setLoading(false);
      router.push('/dashboard/coach');
    } catch (error) {
      console.error('Unexpected error:', error);
      setErrorMsg('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Create New Team</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Team Name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
          className="border p-2 rounded"
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Team'}
        </button>
        {errorMsg && <p className="text-red-600 mt-2">{errorMsg}</p>}
      </form>
    </main>
  );
}