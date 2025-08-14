'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import supabase from '../../../lib/supabaseClient';

type Team = {
  id: string;
  name: string;
  join_code: string;
};

export default function PlayerDashboard() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [joinCode, setJoinCode] = useState('');

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  async function fetchTeams() {
    const { data, error } = await supabase
      .from('players_teams')
      .select(`
        team:teams (
          id,
          name,
          join_code
        )
      `);

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      // Handle the response more safely without strict typing
      const formattedTeams: Team[] = [];
      
      for (const item of data) {
        // Check if team exists and has the required properties
        if (item && typeof item === 'object' && 'team' in item) {
          const team = (item as { team: unknown }).team;
          
          if (team && typeof team === 'object' && 
              'id' in team && 'name' in team && 'join_code' in team) {
            formattedTeams.push({
              id: String((team as { id: unknown }).id),
              name: String((team as { name: unknown }).name),
              join_code: String((team as { join_code: unknown }).join_code)
            });
          }
        }
      }
      
      setTeams(formattedTeams);
    }
  }

  async function handleJoinTeam() {
    if (!joinCode.trim()) return alert('Please enter a join code.');

    const { data: userData } = await supabase.auth.getUser();
    const playerId = userData?.user?.id;
    if (!playerId) return alert('You must be logged in.');

    // 1️⃣ Check if join code is valid
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id, name, join_code')
      .eq('join_code', joinCode.trim())
      .single();

    if (teamError || !teamData) {
      alert('Invalid join code.');
      return;
    }

    // 2️⃣ Check if already in team
    const { data: existing, error: existingError } = await supabase
      .from('players_teams')
      .select('*')
      .eq('player_id', playerId)
      .eq('team_id', teamData.id);

    if (existingError) {
      console.error(existingError);
      alert('Error checking team membership.');
      return;
    }

    if (existing && existing.length > 0) {
      alert('You are already in this team.');
      return;
    }

    // 3️⃣ Insert into players_teams
    const { error: insertError } = await supabase
      .from('players_teams')
      .insert([{ player_id: playerId, team_id: teamData.id }]);

    if (insertError) {
      console.error(insertError);
      alert('Error joining team.');
      return;
    }

    alert(`Successfully joined ${teamData.name}!`);
    setJoinCode('');
    // Refresh teams
    fetchTeams();
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-6">Player Dashboard</h1>
      
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Enter join code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={handleJoinTeam}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Join Team
        </button>
      </div>

      {teams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
          {teams.map((team) => (
            <div key={team.id} className="p-4 border rounded shadow">
              <h2 className="font-bold text-lg">{team.name}</h2>
              <p className="text-sm text-gray-600">Code: {team.join_code}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">You haven&apos;t joined any teams yet.</p>
      )}

      <button
        onClick={handleLogout}
        className="mt-6 bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700"
      >
        Log Out
      </button>
    </main>
  );
}