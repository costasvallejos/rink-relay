'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';

interface Game {
  id: string;
  date: string;
  team_a: { name: string };
  team_b: { name: string };
  score_a: number;
  score_b: number;
}

interface User {
  id: string;
  email: string;
}

export default function PostHighlight() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user as User);

      if (!user) {
        router.push('/auth');
        return;
      }

      // Fetch games for this tournament
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select(`
          id,
          date,
          score_a,
          score_b,
          team_a:teams!games_team_a_id_fkey (name),
          team_b:teams!games_team_b_id_fkey (name)
        `)
        .eq('tournament_id', tournamentId)
        .order('date', { ascending: false });

      if (gamesError) {
        console.error('Error fetching games:', gamesError);
      } else {
        const formattedGames = (gamesData || []).map((game: Record<string, unknown>) => ({
          id: game.id as string,
          date: game.date as string,
          score_a: game.score_a as number,
          score_b: game.score_b as number,
          team_a: Array.isArray(game.team_a) ? game.team_a[0] : game.team_a,
          team_b: Array.isArray(game.team_b) ? game.team_b[0] : game.team_b
        }));
        setGames(formattedGames);
      }

      setLoading(false);
    }

    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!currentUser) {
      alert('Please login to post highlights');
      return;
    }

    if (!selectedGameId || !file) {
      alert('Please select a game and upload a file');
      return;
    }

    setUploading(true);

    try {
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('highlights')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload file');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('highlights')
        .getPublicUrl(fileName);

      // Determine file type
      const fileType = file.type.startsWith('image/') ? 'image' : 'video';

      // Save highlight to database
      const { error: insertError } = await supabase
        .from('highlights')
        .insert([{
          game_id: selectedGameId,
          uploaded_by: currentUser.id,
          file_url: publicUrl,
          file_type: fileType,
          title: title || null,
          description: description || null
        }]);

      if (insertError) {
        console.error('Database error:', insertError);
        alert('Failed to save highlight');
        return;
      }

      alert('Highlight posted successfully!');
      router.push(`/tournaments/${tournamentId}/feed`);
    } catch (error) {
      console.error('Error posting highlight:', error);
      alert('An error occurred while posting the highlight');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="card p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
            <div className="mt-6 h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      <header className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Feed
        </button>
        <h1 className="text-4xl font-bold mb-2">Post Highlight</h1>
        <p className="text-gray-600">Share a photo or video from the tournament</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Game *
          </label>
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a game...</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.team_a.name} vs {game.team_b.name} - {new Date(game.date).toLocaleDateString()} 
                ({game.score_a}-{game.score_b})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your highlight a title..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened in this highlight..."
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File *
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept="image/*,video/*"
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Upload a photo or video (max 50MB)
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Posting...' : 'Post Highlight'}
          </button>
          
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-300 text-gray-700 px-6 py-3 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
