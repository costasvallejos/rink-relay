'use client';

import { useEffect, useState, useCallback } from 'react';
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

// Flexible interface to handle Supabase response structure
interface TeamTournamentResponse {
  tournaments: Tournament | Tournament[]; // Can be either single object or array
}

// Removed unused TeamMemberResponse interface

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

  // Extract tournament fetching into a separate function
  const fetchTournaments = useCallback(async () => {
    const { data: tournamentData, error: tournamentError } = await supabase
      .from('team_tournaments')
      .select(`
        tournaments (
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
      return [];
    } else {
      console.log('Tournament data:', tournamentData); // Debug log
      
      // Handle both single object and array responses
      const formattedTournaments = tournamentData
        ?.map((item: TeamTournamentResponse) => {
          // Handle case where tournaments might be a single object or array
          const tournaments = item.tournaments;
          return Array.isArray(tournaments) ? tournaments : [tournaments];
        })
        .flat() // Flatten the array of arrays
        .filter(Boolean) || [];
      
      console.log('Formatted tournaments:', formattedTournaments); // Debug log
      return formattedTournaments;
    }
  }, [teamId]);

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

      // Fetch tournaments using the extracted function
      const fetchedTournaments = await fetchTournaments();
      setTournaments(fetchedTournaments);

      // Fetch team members (unchanged)
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
        
        // Use a more flexible type that matches actual Supabase response
        const formattedMembers = membersData?.map((item: Record<string, unknown>) => {
          // Handle both single object and array cases for users
          const userData = Array.isArray(item.users) 
            ? item.users[0] 
            : item.users;
          
          // Type the userData properly
          const typedUserData = userData as { id?: string; email?: string; role?: string } | undefined;
          
          return {
            id: item.user_id as string,
            user: {
              id: typedUserData?.id || item.user_id as string,
              email: typedUserData?.email || 'Unknown',
              role: typedUserData?.role || 'user'
            },
            member_type: item.member_type as string
          };
        }).filter(member => member.user.id) || [];
        
        console.log('Formatted members:', formattedMembers);
        setTeamMembers(formattedMembers);
      }

      setLoading(false);
    }

    if (teamId) {
      fetchData();
    }
  }, [teamId, router, fetchTournaments]);

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
      
      // Refresh tournaments list using the extracted function
      const updatedTournaments = await fetchTournaments();
      setTournaments(updatedTournaments);

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
          <h2 className="text-2xl font-semibold">Tournaments ({tournaments.length})</h2>
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
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => router.push(`/tournaments/${tournament.id}/feed`)}
                    className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700"
                  >
                    View Feed
                  </button>
                  {isCoach && (
                    <button
                      onClick={() => router.push(`/dashboard/organizer/tournaments/${tournament.id}`)}
                      className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700"
                    >
                      Manage
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coach Actions */}
      {isCoach && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Coach Actions</h2>
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