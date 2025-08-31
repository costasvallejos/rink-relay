'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
}

interface User {
  id: string;
  email: string;
}

interface Highlight {
  id: string;
  title: string | null;
  description: string | null;
  file_url: string;
  file_type: 'image' | 'video';
  created_at: string;
  uploaded_by: string;
  game: {
    id: string;
    date: string;
    team_a: { name: string };
    team_b: { name: string };
    score_a: number;
    score_b: number;
  };
  likes_count: number;
  user_liked: boolean;
}

export default function TournamentFeed() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user as User);

      // Fetch tournament details
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (tournamentError || !tournamentData) {
        console.error('Error fetching tournament:', tournamentError);
        router.push('/dashboard');
        return;
      }

      setTournament(tournamentData);

      // Fetch highlights for this tournament
      const { data: highlightsData, error: highlightsError } = await supabase
        .from('highlights')
        .select(`
          *,
          games!inner (
            id,
            date,
            score_a,
            score_b,
            tournament_id,
            team_a:teams!games_team_a_id_fkey (name),
            team_b:teams!games_team_b_id_fkey (name)
          )
        `)
        .eq('games.tournament_id', tournamentId)
        .order('created_at', { ascending: false });

      if (highlightsError) {
        console.error('Error fetching highlights:', highlightsError);
      } else {
        // Get likes count and user's like status for each highlight
        const highlightsWithLikes = await Promise.all(
          (highlightsData || []).map(async (highlight: Record<string, unknown>) => {
            const { count } = await supabase
              .from('highlight_likes')
              .select('*', { count: 'exact', head: true })
              .eq('highlight_id', highlight.id);

            let userLiked = false;
            if (user) {
              const { data: userLike } = await supabase
                .from('highlight_likes')
                .select('id')
                .eq('highlight_id', highlight.id)
                .eq('user_id', user.id)
                .single();
              userLiked = !!userLike;
            }

            return {
              id: highlight.id as string,
              title: highlight.title as string | null,
              description: highlight.description as string | null,
              file_url: highlight.file_url as string,
              file_type: highlight.file_type as 'image' | 'video',
              created_at: highlight.created_at as string,
              uploaded_by: highlight.uploaded_by as string,
              game: highlight.games as Highlight['game'],
              likes_count: count || 0,
              user_liked: userLiked
            };
          })
        );

        setHighlights(highlightsWithLikes);
      }

      setLoading(false);
    }

    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId, router]);

  async function handleLike(highlightId: string) {
    if (!currentUser) {
      alert('Please login to like highlights');
      return;
    }

    const highlight = highlights.find(h => h.id === highlightId);
    if (!highlight) return;

    if (highlight.user_liked) {
      // Unlike
      const { error } = await supabase
        .from('highlight_likes')
        .delete()
        .eq('highlight_id', highlightId)
        .eq('user_id', currentUser.id);

      if (!error) {
        setHighlights(highlights.map(h => 
          h.id === highlightId 
            ? { ...h, user_liked: false, likes_count: h.likes_count - 1 }
            : h
        ));
      }
    } else {
      // Like
      const { error } = await supabase
        .from('highlight_likes')
        .insert([{ highlight_id: highlightId, user_id: currentUser.id }]);

      if (!error) {
        setHighlights(highlights.map(h => 
          h.id === highlightId 
            ? { ...h, user_liked: true, likes_count: h.likes_count + 1 }
            : h
        ));
      }
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading tournament feed...</p>
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Tournament not found</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 max-w-4xl mx-auto">
      <header className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Back
        </button>
        <h1 className="text-4xl font-bold mb-2">{tournament.name}</h1>
        <p className="text-gray-600">
          {tournament.location} • {tournament.start_date} - {tournament.end_date}
        </p>
      </header>

      <div className="mb-6">
        <button
          onClick={() => router.push(`/tournaments/${tournamentId}/post`)}
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
        >
          Post Highlight
        </button>
      </div>

      {highlights.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No highlights yet!</p>
          <p className="text-gray-400">Be the first to share a highlight from this tournament.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {highlights.map((highlight) => (
            <div key={highlight.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {highlight.title || 'Untitled Highlight'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {highlight.game.team_a.name} vs {highlight.game.team_b.name} • 
                      {highlight.game.score_a}-{highlight.game.score_b}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(highlight.game.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {highlight.description && (
                  <p className="text-gray-700 mb-3">{highlight.description}</p>
                )}

                {highlight.file_type === 'image' ? (
                  <img
                    src={highlight.file_url}
                    alt={highlight.title || 'Highlight'}
                    className="w-full max-h-96 object-cover rounded"
                  />
                ) : (
                  <video
                    src={highlight.file_url}
                    controls
                    className="w-full max-h-96 rounded"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <button
                    onClick={() => handleLike(highlight.id)}
                    className={`flex items-center space-x-2 px-3 py-1 rounded transition-colors ${
                      highlight.user_liked
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{highlight.user_liked ? '❤️' : '🤍'}</span>
                    <span>{highlight.likes_count}</span>
                  </button>
                  
                  <span className="text-gray-500 text-sm">
                    {new Date(highlight.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
