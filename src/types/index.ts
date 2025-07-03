
// Corrigir tipagem inconsistente da interface User
export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  total_score: number;
  games_played: number;
  best_daily_position?: number;
  best_weekly_position?: number;
  pix_key?: string;
  pix_holder_name?: string;
  phone?: string; // Adicionar campo de telefone
  experience_points?: number; // Adicionar campo de XP
  created_at: string;
  updated_at: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  competition_id?: string;
  level: number;
  board: string[][];
  words_found: string[];
  total_score: number;
  time_elapsed: number;
  is_completed: boolean;
  started_at: string;
  completed_at?: string;
}

export interface Competition {
  id: string;
  title: string;
  description?: string;
  theme?: string;
  start_date: string;
  end_date: string;
  status: string;
  type: 'daily' | 'weekly' | 'challenge';
  prize_pool: number;
  total_participants: number;
  max_participants: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  competition_type: string; // Adicionar propriedade necessária para o hook
}

export interface CompetitionParticipation {
  id: string;
  competition_id: string;
  user_id: string;
  user_position: number;
  user_score: number;
  prize?: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'not_eligible';
  payment_date?: string;
}

// Corrigir RankingPlayer para consistência com User
export interface RankingPlayer {
  pos: number;
  name: string;
  score: number;
  avatar_url?: string; // Alterado de 'avatar' para 'avatar_url'
  user_id: string; // Removido opcional - sempre necessário para comparações
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  prize: string;
  participants: number;
  timeLeft: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  category: string;
  status: 'active' | 'completed' | 'upcoming';
}

// Formulários de autenticação
export interface LoginForm {
  emailOrPhone: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  username: string;
  emailOrPhone: string;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
}

// Tipos para game - Expandir Position interface
export interface Position {
  row: number;
  col: number;
  direction?: 'horizontal' | 'vertical' | 'diagonal';
  length?: number;
}

export interface WordFound {
  word: string;
  points: number;
  positions: Position[];
  foundAt: string;
}

export interface GameConfig {
  level: number;
  boardSize?: number;
  timeLimit?: number;
  competitionId?: string; // Adicionar competitionId como propriedade opcional
}

// Estados assíncronos
export interface AsyncState<T> {
  isLoading: boolean;
  error?: string;
  data?: T;
}

// Corrigir ApiResponse para ter tipos mais específicos
export interface ApiResponse<T> {
  data: T | null;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
