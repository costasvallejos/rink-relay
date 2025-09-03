'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';

export default function SelectRole() {
  const router = useRouter();
  const [role, setRole] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function handleRoleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!role) {
      setErrorMsg('Please select a role');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Get the current user
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      setErrorMsg('User not found.');
      setLoading(false);
      return;
    }

    const user = data.user;

    // Update the user's role in your users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ role })
      .eq('id', user.id);

    if (updateError) {
      setErrorMsg(updateError.message);
      setLoading(false);
      return;
    }

    // Redirect to dashboard based on role
    if (role === 'player') router.push('/dashboard/player');
    else if (role === 'organizer') router.push('/dashboard/organizer');
    else if (role === 'coach') router.push('/dashboard/coach');
    else router.push('/dashboard');

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 fade-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Role</h1>
            <p className="text-gray-600">
              Select how you&apos;ll be using Rink Relay
            </p>
          </div>

          <form onSubmit={handleRoleSubmit} className="space-y-6">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Your Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
                className="input"
              >
                <option value="">Select your role</option>
                <option value="player">Player - Join teams and participate in tournaments</option>
                <option value="coach">Coach - Manage teams and guide players</option>
                <option value="organizer">Organizer - Create and manage tournaments</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !role}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Setting up your account...
                </div>
              ) : (
                'Continue'
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errorMsg}</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              You can change your role later in your profile settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
