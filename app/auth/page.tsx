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
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Sign In or Sign Up with Magic Link</h1>
      <p className="mb-6 text-gray-700">
        Enter your email and we&apos;ll send you a magic link to sign in or create an account.
      </p>

      <form onSubmit={handleSendLink} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="border p-2 rounded"
          autoComplete="email"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending magic link...' : 'Send Magic Link'}
        </button>
      </form>

      {errorMsg && <p className="text-red-600 mt-4">{errorMsg}</p>}

      <p className="mt-6 text-center text-sm text-gray-600">
        If you didn&apos;t receive a link, check your spam folder or try again.
      </p>
    </div>
  );
}
