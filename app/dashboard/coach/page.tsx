'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../lib/supabaseClient';

interface Team {
  id: string;
  name: string;
  join_code: string;
}

export default function CoachDashboard() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('teams')
        .select('id, name, join_code')
        .eq('coach_id', user.id);

      if (error) {
        console.error('Error fetching teams:', error.message);
      } else {
        setTeams(data || []);
      }
      setLoading(false);
    }

    fetchTeams();
  }, [router]);

  function goToCreateTeam() {
    router.push('/dashboard/coach/create-team');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading teams...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-8 gap-6">
      <h1 className="text-4xl font-bold mb-6">Coach Dashboard</h1>

      <button
        onClick={goToCreateTeam}
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 self-start"
      >
        Create New Team
      </button>

      {teams.length === 0 ? (
        <p>You don&apos;t have any teams yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              className="border p-4 rounded hover:shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/teams/${team.id}`)}
            >
              <h2 className="text-xl font-semibold">{team.name}</h2>
              <p className="text-sm">Join Code: <code>{team.join_code}</code></p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 self-start"
      >
        Log Out
      </button>
    </main>
  );
}
