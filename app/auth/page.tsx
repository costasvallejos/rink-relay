'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabaseClient';

export default function MagicLinkAuth() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/post-login`, // redirect after clicking magic link
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push('/check-your-email'); // NO email param here
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 fade-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Rink Relay</h1>
            <p className="text-gray-600">
              Professional hockey tournament management
            </p>
          </div>

          <form onSubmit={handleSendLink} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="input"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Sending magic link...
                </div>
              ) : (
                'Send Magic Link'
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
              We&apos;ll send you a secure link to sign in or create your account.
              Check your spam folder if you don&apos;t see it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
