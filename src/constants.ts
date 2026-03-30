// API related constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
  },
  USERS: {
    PROFILE: '/users/profile',
    CURRENT: '/users/me',
    PASSWORD: '/users/password',
  },
  DESIGNS: {
    BASE: '/designs',
    DETAIL: (id: string) => `/designs/${id}`,
    VALIDATE: (id: string) => `/designs/${id}/validate`,
    EXPORT: (id: string) => `/designs/${id}/export`,
  },
  GENOMES: {
    BASE: '/genomes',
    UPLOAD: '/genomes/upload',
    DETAIL: (id: string) => `/genomes/${id}`,
    ANNOTATIONS: (id: string) => `/genomes/${id}/annotations`,
  },
  JOBS: {
    BASE: '/jobs',
    DETAIL: (id: string) => `/jobs/${id}`,
    CANCEL: (id: string) => `/jobs/${id}/cancel`,
  },
};

// Probe design parameter limits
export const PROBE_CONSTRAINTS = {
  LENGTH: {
    MIN: 18,
    MAX: 30,
    DEFAULT: 20,
  },
  GC_CONTENT: {
    MIN: 40,
    MAX: 60,
    DEFAULT: 50,
  },
  MELTING_TEMP: {
    MIN: 55,
    MAX: 65,
    DEFAULT: 60,
  },
  SPECIFICITY: {
    MIN: 0,
    MAX: 100,
    DEFAULT: 80,
  },
};

// File upload limits
export const UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_FILE_TYPES: {
    GENOME: ['.fasta', '.fa', '.fna'],
    ANNOTATION: ['.gff', '.gff3', '.gtf'],
    PROBE: ['.txt', '.csv'],
  },
};

// Pagination config
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Status constants
export const STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// Role permissions
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// Theme config
export const THEME_CONFIG = {
  LIGHT: 'light',
  DARK: 'dark',
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error, please check network settings',
  SERVER_ERROR: 'Server error, please try again later',
  UNAUTHORIZED: 'Unauthorized access, please login first',
  FORBIDDEN: 'No permission to perform this operation',
  NOT_FOUND: 'Requested resource does not exist',
  VALIDATION_ERROR: 'Input data validation failed',
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_FILE_TYPE: 'Unsupported file type',
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful',
  REGISTER: 'Registration successful',
  SAVE: 'Saved successfully',
  UPDATE: 'Updated successfully',
  DELETE: 'Deleted successfully',
  UPLOAD: 'Uploaded successfully',
}; 
