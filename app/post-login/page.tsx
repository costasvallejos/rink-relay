'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';

export default function PostLogin() {
  const router = useRouter();

  useEffect(() => {
    async function handlePostLogin() {
      // Step 1: Get session from magic link or stored cookie
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error('No valid session found:', sessionError);
        router.push('/auth');
        return;
      }

      const user = sessionData.session.user;

      // Step 2: Look up user in your "users" table
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle(); // doesn't error if no rows

      if (userError) {
        console.error('Error fetching user record:', userError);
        router.push('/error');
        return;
      }

      // Step 3: Handle first-time user
      if (!userRecord) {
        await supabase
          .from('users')
          .upsert([{ id: user.id, email: user.email, role: null }], { onConflict: 'id' });

        router.push('/select-role');
        return;
      }

      // Step 4: Existing user — check role
      if (!userRecord.role) {
        router.push('/select-role');
        return;
      }

      // Step 5: Redirect based on role
      switch (userRecord.role) {
        case 'player':
          router.push('/dashboard/player');
          break;
        case 'organizer':
          router.push('/dashboard/organizer');
          break;
        case 'coach':
          router.push('/dashboard/coach');
          break;
        default:
          router.push('/dashboard');
          break;
      }
    }

    handlePostLogin();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-2xl font-bold mb-4">Logging you in...</h1>
      <p>Please wait while we complete your sign in.</p>
    </div>
  );
}
