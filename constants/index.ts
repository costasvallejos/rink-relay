// Application constants
export const APP_CONFIG = {
  name: 'Rink Relay',
  description: 'Professional hockey tournament management platform',
  version: '1.0.0',
} as const;

// API Configuration
export const API_CONFIG = {
  cacheTimeout: 30000, // 30 seconds
  maxRetries: 3,
  timeout: 10000, // 10 seconds
} as const;

// User Roles
export const USER_ROLES = {
  PLAYER: 'player',
  COACH: 'coach',
  ORGANIZER: 'organizer',
} as const;

// Member Types
export const MEMBER_TYPES = {
  PLAYER: 'player',
  COACH: 'coach',
} as const;

// UI Constants
export const UI_CONFIG = {
  animationDuration: 200,
  skeletonCount: 3,
  itemsPerPage: 10,
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  teamName: {
    minLength: 2,
    maxLength: 50,
  },
  tournamentName: {
    minLength: 3,
    maxLength: 100,
  },
  joinCode: {
    length: 6,
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  TEAM_CREATED: 'Team created successfully!',
  TEAM_JOINED: 'Successfully joined the team!',
  TOURNAMENT_CREATED: 'Tournament created successfully!',
  TOURNAMENT_JOINED: 'Successfully joined the tournament!',
  POST_CREATED: 'Post created successfully!',
} as const;
