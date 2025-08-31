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
  join_code: string;
}

interface Team {
  id: string;
  name: string;
}

interface Game {
  id: string;
  date: string;
  rink: string | null;
  score_a: number;
  score_b: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  team_a: Team;
  team_b: Team;
}

interface Standing {
  team_id: string;
  team_name: string;
  games_played: number;
  wins: number;
  losses: number;
  ties: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export default function TournamentManagement() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'standings' | 'schedule'>('overview');

  // Game creation form state
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [newGame, setNewGame] = useState({
    date: '',
    time: '',
    team_a_id: '',
    team_b_id: '',
    rink: ''
  });

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      // Fetch tournament details
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .eq('organizer_id', user.id)
        .single();

      if (tournamentError || !tournamentData) {
        console.error('Error fetching tournament:', tournamentError);
        router.push('/dashboard/organizer');
        return;
      }

      setTournament(tournamentData);

      // Fetch teams in this tournament
      const { data: teamsData } = await supabase
        .from('team_tournaments')
        .select(`
          teams (
            id,
            name
          )
        `)
        .eq('tournament_id', tournamentId);

      const formattedTeams = teamsData?.map((item: any) => item.teams).filter(Boolean) || [];
      setTeams(formattedTeams);

      // Fetch games
      const { data: gamesData } = await supabase
        .from('games')
        .select(`
          *,
          team_a:teams!games_team_a_id_fkey (id, name),
          team_b:teams!games_team_b_id_fkey (id, name)
        `)
        .eq('tournament_id', tournamentId)
        .order('date', { ascending: true });

      setGames(gamesData || []);

      // Fetch standings
      const { data: standingsData } = await supabase
        .from('tournament_standings')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('points', { ascending: false });

      setStandings(standingsData || []);

      setLoading(false);
    }

    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId, router]);

  async function handleCreateGame(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newGame.date || !newGame.time || !newGame.team_a_id || !newGame.team_b_id) {
      alert('Please fill in all required fields');
      return;
    }

    if (newGame.team_a_id === newGame.team_b_id) {
      alert('A team cannot play against itself');
      return;
    }

    const gameDateTime = new Date(`${newGame.date}T${newGame.time}`).toISOString();

    const { error } = await supabase
      .from('games')
      .insert([{
        tournament_id: tournamentId,
        date: gameDateTime,
        team_a_id: newGame.team_a_id,
        team_b_id: newGame.team_b_id,
        rink: newGame.rink || null
      }]);

    if (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game');
      return;
    }

    // Refresh games
    const { data: gamesData } = await supabase
      .from('games')
      .select(`
        *,
        team_a:teams!games_team_a_id_fkey (id, name),
        team_b:teams!games_team_b_id_fkey (id, name)
      `)
      .eq('tournament_id', tournamentId)
      .order('date', { ascending: true });

    setGames(gamesData || []);
    setShowCreateGame(false);
    setNewGame({ date: '', time: '', team_a_id: '', team_b_id: '', rink: '' });
  }

  async function updateScore(gameId: string, scoreA: number, scoreB: number) {
    const { error } = await supabase
      .from('games')
      .update({ 
        score_a: scoreA, 
        score_b: scoreB,
        status: 'completed'
      })
      .eq('id', gameId);

    if (error) {
      console.error('Error updating score:', error);
      alert('Failed to update score');
      return;
    }

    // Refresh games and standings
    const { data: gamesData } = await supabase
      .from('games')
      .select(`
        *,
        team_a:teams!games_team_a_id_fkey (id, name),
        team_b:teams!games_team_b_id_fkey (id, name)
      `)
      .eq('tournament_id', tournamentId)
      .order('date', { ascending: true });

    setGames(gamesData || []);

    const { data: standingsData } = await supabase
      .from('tournament_standings')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('points', { ascending: false });

    setStandings(standingsData || []);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading tournament...</p>
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
    <main className="min-h-screen p-4 max-w-7xl mx-auto">
      <header className="mb-8">
        <button
          onClick={() => router.push('/dashboard/organizer')}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-4xl font-bold mb-2">{tournament.name}</h1>
        <p className="text-gray-600">
          {tournament.location} • {tournament.start_date} - {tournament.end_date}
        </p>
        <p className="text-sm text-gray-500">Join Code: {tournament.join_code}</p>
      </header>

      {/* Tab Navigation */}
      <nav className="flex space-x-1 mb-6 border-b">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'games', label: 'Games' },
          { key: 'standings', label: 'Standings' },
          { key: 'schedule', label: 'Schedule' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === tab.key
                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Teams</h3>
              <p className="text-3xl font-bold text-blue-600">{teams.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Games</h3>
              <p className="text-3xl font-bold text-green-600">{games.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Completed</h3>
              <p className="text-3xl font-bold text-purple-600">
                {games.filter(g => g.status === 'completed').length}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Registered Teams</h3>
            {teams.length === 0 ? (
              <p className="text-gray-500">No teams registered yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                  <div key={team.id} className="border p-3 rounded">
                    <p className="font-medium">{team.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/tournaments/${tournamentId}/feed`)}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
            >
              View Tournament Feed
            </button>
          </div>
        </div>
      )}

      {/* Games Tab */}
      {activeTab === 'games' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Games Management</h2>
            <button
              onClick={() => setShowCreateGame(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create New Game
            </button>
          </div>

          {showCreateGame && (
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold mb-4">Create New Game</h3>
              <form onSubmit={handleCreateGame} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    value={newGame.date}
                    onChange={(e) => setNewGame({ ...newGame, date: e.target.value })}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time *</label>
                  <input
                    type="time"
                    value={newGame.time}
                    onChange={(e) => setNewGame({ ...newGame, time: e.target.value })}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Team A *</label>
                  <select
                    value={newGame.team_a_id}
                    onChange={(e) => setNewGame({ ...newGame, team_a_id: e.target.value })}
                    required
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Team A</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Team B *</label>
                  <select
                    value={newGame.team_b_id}
                    onChange={(e) => setNewGame({ ...newGame, team_b_id: e.target.value })}
                    required
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Team B</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Rink</label>
                  <input
                    type="text"
                    value={newGame.rink}
                    onChange={(e) => setNewGame({ ...newGame, rink: e.target.value })}
                    placeholder="Rink name or number"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Create Game
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateGame(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {games.length === 0 ? (
              <p className="text-gray-500">No games scheduled yet</p>
            ) : (
              games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onScoreUpdate={updateScore}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Standings Tab */}
      {activeTab === 'standings' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-2xl font-bold">Tournament Standings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    W
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    L
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    T
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    +/-
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PTS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {standings.map((standing, index) => (
                  <tr key={standing.team_id} className={index < 3 ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {standing.team_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.games_played}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.losses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.ties}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.goals_for}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.goals_against}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.goal_difference > 0 ? '+' : ''}{standing.goal_difference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {standing.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Tournament Schedule</h2>
          <div className="space-y-4">
            {games.length === 0 ? (
              <p className="text-gray-500">No games scheduled yet</p>
            ) : (
              games.map((game) => (
                <div key={game.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {game.team_a.name} vs {game.team_b.name}
                      </h3>
                      <p className="text-gray-600">
                        {new Date(game.date).toLocaleDateString()} at {new Date(game.date).toLocaleTimeString()}
                        {game.rink && ` • Rink: ${game.rink}`}
                      </p>
                    </div>
                    <div className="text-right">
                      {game.status === 'completed' ? (
                        <div className="text-lg font-bold">
                          {game.score_a} - {game.score_b}
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                          {game.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// Game Card Component for score management
function GameCard({ game, onScoreUpdate }: { game: Game; onScoreUpdate: (gameId: string, scoreA: number, scoreB: number) => void }) {
  const [scoreA, setScoreA] = useState(game.score_a);
  const [scoreB, setScoreB] = useState(game.score_b);
  const [editing, setEditing] = useState(false);

  function handleSave() {
    onScoreUpdate(game.id, scoreA, scoreB);
    setEditing(false);
  }

  function handleCancel() {
    setScoreA(game.score_a);
    setScoreB(game.score_b);
    setEditing(false);
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-lg font-semibold">
            {game.team_a.name} vs {game.team_b.name}
          </h3>
          <p className="text-gray-600">
            {new Date(game.date).toLocaleDateString()} at {new Date(game.date).toLocaleTimeString()}
            {game.rink && ` • Rink: ${game.rink}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={scoreA}
                onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
                className="w-16 border rounded px-2 py-1 text-center"
                min="0"
              />
              <span>-</span>
              <input
                type="number"
                value={scoreB}
                onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
                className="w-16 border rounded px-2 py-1 text-center"
                min="0"
              />
              <button
                onClick={handleSave}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">
                {game.score_a} - {game.score_b}
              </span>
              <span className={`px-2 py-1 rounded text-sm ${
                game.status === 'completed' ? 'bg-green-100 text-green-800' :
                game.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-600'
              }`}>
                {game.status}
              </span>
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Edit Score
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
