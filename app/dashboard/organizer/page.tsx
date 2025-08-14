'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../lib/supabaseClient';

type Tournament = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  join_code: string;
};

export default function OrganizerDashboard() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchTournaments() {
    setLoading(true);
    setError('');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError('Failed to get user info. Please login again.');
      setLoading(false);
      return;
    }

    const { data, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('id, name, start_date, end_date, location, join_code')
      .eq('organizer_id', user.id)
      .order('start_date', { ascending: false });

    if (tournamentsError) {
      setError('Failed to fetch tournaments.');
      setLoading(false);
      return;
    }

    setTournaments(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  function goToCreateTournament() {
    router.push('/dashboard/organizer/create-tournament');
  }

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto flex flex-col gap-8">
      <header className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Organizer Dashboard</h1>
        <div className="flex gap-4">
          <button
            onClick={goToCreateTournament}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
          >
            Create New Tournament
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700"
          >
            Log Out
          </button>
        </div>
      </header>

      {loading && <p>Loading your tournaments...</p>}

      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && tournaments.length === 0 && (
        <p>You don&apos;t have any tournaments right now.</p>
      )}

      {!loading && tournaments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="border rounded p-4 shadow hover:shadow-lg cursor-pointer"
              onClick={() =>
                router.push(`/dashboard/organizer/tournaments/${tournament.id}`)
              }
            >
              <h2 className="text-xl font-semibold mb-2">{tournament.name}</h2>
              <p>
                <strong>Dates:</strong> {tournament.start_date} - {tournament.end_date}
              </p>
              <p>
                <strong>Location:</strong> {tournament.location}
              </p>
              <p>
                <strong>Join Code:</strong> {tournament.join_code}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
