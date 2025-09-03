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
  const [lastFetch, setLastFetch] = useState<number>(0);

  useEffect(() => {
    async function fetchTeams() {
      // Cache for 30 seconds to avoid unnecessary requests
      const now = Date.now();
      if (now - lastFetch < 30000 && teams.length > 0) {
        setLoading(false);
        return;
      }

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
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching teams:', error.message);
      } else {
        setTeams(data || []);
        setLastFetch(now);
      }
      setLoading(false);
    }

    fetchTeams();
  }, [router, lastFetch, teams.length]);

  function goToCreateTeam() {
    router.push('/dashboard/coach/create-team');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-10 bg-gray-200 rounded-lg w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="card p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
            </div>
          </div>

          {/* Teams Grid Skeleton */}
          <div className="card p-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Coach Dashboard</h1>
            <p className="text-gray-600">Manage your teams and guide your players</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-danger"
          >
            Log Out
          </button>
        </div>

        {/* Quick Actions */}
        <div className="card p-6 mb-8 fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Quick Actions</h2>
              <p className="text-gray-600">Create and manage your teams</p>
            </div>
            <button
              onClick={goToCreateTeam}
              className="btn btn-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Team
            </button>
          </div>
        </div>

        {/* Teams Section */}
        <div className="card p-6 fade-in">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Teams ({teams.length})</h2>
          
          {teams.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
              <p className="text-gray-600 mb-4">Create your first team to get started</p>
              <button
                onClick={goToCreateTeam}
                className="btn btn-primary"
              >
                Create Your First Team
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-200"
                  onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                      Active
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{team.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">Join Code: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{team.join_code}</code></p>
                  
                  <div className="flex items-center text-sm text-green-600 font-medium">
                    Manage Team
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
