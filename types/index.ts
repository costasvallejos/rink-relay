// Core application types
export interface User {
  id: string;
  email: string;
  role: 'player' | 'coach' | 'organizer';
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  join_code: string;
  coach_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  member_type: 'player' | 'coach';
  joined_at: string;
  user?: User;
}

export interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  join_code: string;
  organizer_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamTournament {
  id: string;
  team_id: string;
  tournament_id: string;
  registered_at: string;
  team?: Team;
  tournament?: Tournament;
}

export interface Post {
  id: string;
  content: string;
  author_id: string;
  tournament_id: string;
  created_at: string;
  updated_at: string;
  author?: User;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Form types
export interface CreateTeamForm {
  name: string;
}

export interface CreateTournamentForm {
  name: string;
  start_date: string;
  end_date: string;
  location: string;
}

export interface JoinTeamForm {
  join_code: string;
}

export interface JoinTournamentForm {
  join_code: string;
}

// UI Component props
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  elevated?: boolean;
}

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
}
