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

  // Fetch all teams where current user is in team_members
  async function fetchTeams() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('team_members')
      .select(`
        team:teams (
          id,
          name,
          join_code
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      const formattedTeams: Team[] = [];

      for (const item of data) {
        if (item && typeof item === 'object' && 'team' in item) {
          const team = (item as { team: unknown }).team;
          if (
            team && typeof team === 'object' &&
            'id' in team && 'name' in team && 'join_code' in team
          ) {
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

    // 1. Check if join code is valid
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id, name, join_code')
      .eq('join_code', joinCode.trim())
      .single();

    if (teamError || !teamData) {
      alert('Invalid join code.');
      return;
    }

    // 2. Check if already in team_members
    const { data: existing, error: existingError } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', playerId)
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

    // 3. Insert into team_members
    const { error: memberError } = await supabase
      .from('team_members')
      .insert([{
        team_id: teamData.id,
        user_id: playerId,
        member_type: 'player',
        joined_at: new Date().toISOString()
      }]);

    if (memberError) {
      console.error(memberError);
      alert('Error joining team.');
      return;
    }

    alert(`Successfully joined ${teamData.name}!`);
    setJoinCode('');
    fetchTeams();
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Player Dashboard</h1>
            <p className="text-gray-600">Manage your teams and tournaments</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-danger"
          >
            Log Out
          </button>
        </div>

        {/* Join Team Section */}
        <div className="card p-6 mb-8 fade-in">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Join a Team</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter team join code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="input flex-1"
            />
            <button
              onClick={handleJoinTeam}
              className="btn btn-primary"
            >
              Join Team
            </button>
          </div>
        </div>

        {/* Teams Section */}
        <div className="card p-6 fade-in">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Teams</h2>
          
          {teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div 
                  key={team.id} 
                  className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-200"
                  onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      Active
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{team.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">Team Code: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{team.join_code}</code></p>
                  
                  <div className="flex items-center text-sm text-blue-600 font-medium">
                    View Team Details
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
              <p className="text-gray-600 mb-4">Join a team using a join code to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
