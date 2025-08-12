'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabaseClient';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push('/dashboard'); // redirect after login
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Login</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      {errorMsg && <p className="text-red-600 mt-4">{errorMsg}</p>}

      <p className="mt-6 text-center">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={() => router.push('/signup')}
          className="text-blue-600 hover:underline"
        >
          Sign Up
        </button>
      </p>
    </div>
  );
}
