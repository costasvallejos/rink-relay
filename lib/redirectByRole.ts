import supabase from './supabaseClient';

export async function redirectByRole(
  userId: string,
  router: ReturnType<typeof import('next/navigation').useRouter>
) {
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !user) {
    router.push('/login'); // fallback to login if no role found
    return;
  }

  switch (user.role) {
    case 'organizer':
      router.push('/dashboard/tournaments');
      break;
    case 'coach':
      router.push('/dashboard/team');
      break;
    case 'player':
      router.push('/team/view');
      break;
    default:
      router.push('/');
  }
}
