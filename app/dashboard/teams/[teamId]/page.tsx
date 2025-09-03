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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
            <div>
              <div className="h-10 bg-gray-200 rounded-lg w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>

          {/* Team Info Skeleton */}
          <div className="card p-6 mb-8">
            <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Members Skeleton */}
          <div className="card p-6 mb-8">
            <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Tournaments Skeleton */}
          <div className="card p-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="btn btn-secondary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{team.name}</h1>
            <p className="text-gray-600">Team management and tournament participation</p>
          </div>
        </div>

        {/* Team Information */}
        <div className="card p-6 mb-8 fade-in">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Team Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Team Name</label>
              <p className="text-lg font-semibold text-gray-900">{team.name}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Join Code</label>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg font-mono text-sm">{team.join_code}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(team.join_code)}
                  className="btn btn-secondary text-xs"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="card p-6 mb-8 fade-in">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Team Members ({teamMembers.length})</h2>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-500">No team members found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <div key={member.user.id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {member.user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      member.member_type === 'coach' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {member.member_type}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 mb-1">{member.user.email}</p>
                  <p className="text-sm text-gray-600 capitalize">{member.user.role}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tournaments Section */}
        <div className="card p-6 fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Tournaments ({tournaments.length})</h2>
            {isCoach && (
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter tournament join code"
                  value={tournamentJoinCode}
                  onChange={(e) => setTournamentJoinCode(e.target.value)}
                  className="input"
                />
                <button
                  onClick={handleJoinTournament}
                  disabled={joiningTournament}
                  className="btn btn-primary"
                >
                  {joiningTournament ? (
                    <div className="flex items-center">
                      <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Joining...
                    </div>
                  ) : (
                    'Join Tournament'
                  )}
                </button>
              </div>
            )}
          </div>

          {tournaments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-500">Team is not registered in any tournaments yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => (
                <div key={tournament.id} className="card p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                      Active
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{tournament.name}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {tournament.location}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">{tournament.join_code}</code>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => router.push(`/tournaments/${tournament.id}/feed`)}
                    className="btn btn-primary w-full"
                  >
                    View Tournament Feed
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}