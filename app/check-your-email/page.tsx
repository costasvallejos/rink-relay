'use client';

import { useRouter } from 'next/navigation';

export default function CheckYourEmail() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Check Your Email</h1>
          
          <div className="space-y-4 mb-8">
            <p className="text-gray-600">
              We&apos;ve sent a secure magic link to your email address.
            </p>
            <p className="text-gray-600">
              Click the link in your email to sign in to your account.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Check your spam folder if you don&apos;t see the email within a few minutes.
            </p>
          </div>

          <button
            onClick={() => router.push('/auth')}
            className="btn btn-secondary w-full"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
} 
