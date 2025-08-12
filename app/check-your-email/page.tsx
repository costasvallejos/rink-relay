'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function CheckYourEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-6">Check Your Email</h1>
      {email ? (
        <p className="mb-4">
          A magic login link has been sent to <strong>{email}</strong>.
        </p>
      ) : (
        <p className="mb-4">
          A magic login link has been sent to your email address.
        </p>
      )}
      <p className="mb-6">Please check your inbox and click the link to sign in.</p>
      
      <button
        onClick={() => router.push('/auth')}
        className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
      >
        Back to Sign Up
      </button>
    </div>
  );
}
