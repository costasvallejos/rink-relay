'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import supabase from '../../../../lib/supabaseClient';

interface Team {
  id: string;
  name: string;
  join_code: string;
  coach_id: string;
}

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  join_code: string;
}

interface TeamMember {
  id: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
  member_type: string;
}

interface TeamTournamentResponse {
  tournament: Tournament[];
}

// Fixed interface for team member response
interface TeamMemberResponse {
  team_id: string;
  user_id: string;
  joined_at: string;
  member_type: string;
  users: {
    id: string;
    email: string;
    role: string;
  };
}

export default function TeamView() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const [tournamentJoinCode, setTournamentJoinCode] = useState('');
  const [joiningTournament, setJoiningTournament] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        router.push('/auth');
        return;
      }

      // Fetch team details
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamError || !teamData) {
        console.error('Error fetching team:', teamError);
        router.push('/dashboard');
        return;
      }

      setTeam(teamData);
      setIsCoach(user.id === teamData.coach_id);

      // Fetch tournaments the team is registered in
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('team_tournaments')
        .select(`
          tournament:tournaments (
            id,
            name,
            start_date,
            end_date,
            location,
            join_code
          )
        `)
        .eq('team_id', teamId);

      if (tournamentError) {
        console.error('Error fetching tournaments:', tournamentError);
      } else {
        const formattedTournaments = tournamentData?.map((item: TeamTournamentResponse) => item.tournament[0]).filter(Boolean) || [];
        setTournaments(formattedTournaments);
      }

      // Fixed: Use the specific foreign key relationship name
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select(`
          team_id,
          user_id,
          joined_at,
          member_type,
          users!team_members_user_id_fkey (
            id,
            email,
            role
          )
        `)
        .eq('team_id', teamId);

      if (membersError) {
        console.error('Error fetching team members:', membersError);
        console.error('Error details:', JSON.stringify(membersError, null, 2));
        console.error('Error code:', membersError.code);
        console.error('Error message:', membersError.message);
      } else {
        console.log('Raw members data:', membersData);
        
        // Format the data correctly
        const formattedMembers = membersData?.map((item: any) => ({
          id: item.user_id, // Using user_id as the unique identifier since team_members doesn't have its own id
          user: {
            id: item.users?.id || item.user_id,
            email: item.users?.email || 'Unknown',
            role: item.users?.role || 'user'
          },
          member_type: item.member_type
        })).filter(member => member.user.id) || []; // Filter out any null users
        
        console.log('Formatted members:', formattedMembers);
        setTeamMembers(formattedMembers);
      }

      setLoading(false);
    }

    if (teamId) {
      fetchData();
    }
  }, [teamId, router]);

  async function handleJoinTournament() {
    if (!tournamentJoinCode.trim()) {
      alert('Please enter a tournament join code.');
      return;
    }

    setJoiningTournament(true);

    try {
      // Check if tournament exists and get its details
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('join_code', tournamentJoinCode.trim())
        .single();

      if (tournamentError || !tournamentData) {
        alert('Invalid tournament join code.');
        return;
      }

      // Check if team is already registered in this tournament
      const { data: existingRegistration, error: existingError } = await supabase
        .from('team_tournaments')
        .select('*')
        .eq('team_id', teamId)
        .eq('tournament_id', tournamentData.id);

      if (existingError) {
        console.error('Error checking existing registration:', existingError);
        alert('Error checking tournament registration.');
        return;
      }

      if (existingRegistration && existingRegistration.length > 0) {
        alert('Team is already registered in this tournament.');
        return;
      }

      // Register team in tournament
      const { error: insertError } = await supabase
        .from('team_tournaments')
        .insert([{
          team_id: teamId,
          tournament_id: tournamentData.id
        }]);

      if (insertError) {
        console.error('Error joining tournament:', insertError);
        alert('Failed to join tournament. Please try again.');
        return;
      }

      alert(`Successfully joined tournament: ${tournamentData.name}!`);
      setTournamentJoinCode('');
      
      // Refresh tournaments list
      const { data: updatedTournaments, error: refreshError } = await supabase
        .from('team_tournaments')
        .select(`
          tournament:tournaments (
            id,
            name,
            start_date,
            end_date,
            location,
            join_code
          )
        `)
        .eq('team_id', teamId);

      if (!refreshError && updatedTournaments) {
        const formattedTournaments = updatedTournaments.map((item: TeamTournamentResponse) => item.tournament[0]).filter(Boolean);
        setTournaments(formattedTournaments);
      }

    } catch (error) {
      console.error('Error joining tournament:', error);
      alert('An unexpected error occurred.');
    } finally {
      setJoiningTournament(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading team information...</p>
      </main>
    );
  }

  if (!team) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Team not found.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-8 gap-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          ← Back
        </button>
        <h1 className="text-4xl font-bold">{team.name}</h1>
      </div>

      {/* Team Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Team Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Team Name</p>
            <p className="font-medium">{team.name}</p>
          </div>
          <div>
            <p className="text-gray-600">Join Code</p>
            <p className="font-mono bg-gray-100 px-2 py-1 rounded">{team.join_code}</p>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Team Members</h2>
        {teamMembers.length === 0 ? (
          <p className="text-gray-500">No team members found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <div key={member.user.id} className="border p-3 rounded">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{member.user.email}</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    member.member_type === 'coach' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {member.member_type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 capitalize">{member.user.role}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tournaments Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Tournaments</h2>
          {isCoach && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter tournament join code"
                value={tournamentJoinCode}
                onChange={(e) => setTournamentJoinCode(e.target.value)}
                className="border p-2 rounded"
              />
              <button
                onClick={handleJoinTournament}
                disabled={joiningTournament}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
              >
                {joiningTournament ? 'Joining...' : 'Join Tournament'}
              </button>
            </div>
          )}
        </div>

        {tournaments.length === 0 ? (
          <p className="text-gray-500">Team is not registered in any tournaments yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="border p-4 rounded-lg hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-2">{tournament.name}</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Location:</span> {tournament.location}</p>
                  <p><span className="font-medium">Start Date:</span> {formatDate(tournament.start_date)}</p>
                  <p><span className="font-medium">End Date:</span> {formatDate(tournament.end_date)}</p>
                  <p><span className="font-medium">Join Code:</span> <code className="bg-gray-100 px-1 rounded">{tournament.join_code}</code></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coach Actions */}
      {isCoach && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibent mb-4">Coach Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/dashboard/coach/teams/${teamId}/edit`)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Edit Team
            </button>
            <button
              onClick={() => router.push(`/dashboard/coach/teams/${teamId}/members`)}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Manage Members
            </button>
          </div>
        </div>
      )}
    </main>
  );
}