'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';

function generateJoinCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function CreateTournament() {
  const router = useRouter();
  const [tournamentName, setTournamentName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError('You must be logged in to create a tournament.');
      setLoading(false);
      return;
    }

    const join_code = generateJoinCode();

    const { error: insertError } = await supabase.from('tournaments').insert([
      {
        name: tournamentName,
        start_date: startDate,
        end_date: endDate,
        location,
        organizer_id: user.id,
        join_code,
      },
    ]);

    if (insertError) {
      setError('Failed to create tournament. Please try again.');
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push('/dashboard/organizer');
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create Tournament</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Tournament Name"
          value={tournamentName}
          onChange={(e) => setTournamentName(e.target.value)}
          required
          className="border p-2 rounded"
        />

        <label>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="border p-2 rounded w-full"
          />
        </label>

        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          className="border p-2 rounded"
        />

        {error && <p className="text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Tournament'}
        </button>
      </form>
    </main>
  );
}
