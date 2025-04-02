// API 相关常量
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

// 探针设计参数限制
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

// 文件上传限制
export const UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_FILE_TYPES: {
    GENOME: ['.fasta', '.fa', '.fna'],
    ANNOTATION: ['.gff', '.gff3', '.gtf'],
    PROBE: ['.txt', '.csv'],
  },
};

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// 状态常量
export const STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// 角色权限
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
};

// 本地存储键名
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// 主题配置
export const THEME_CONFIG = {
  LIGHT: 'light',
  DARK: 'dark',
};

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接错误，请检查网络设置',
  SERVER_ERROR: '服务器错误，请稍后重试',
  UNAUTHORIZED: '未授权访问，请先登录',
  FORBIDDEN: '没有权限执行此操作',
  NOT_FOUND: '请求的资源不存在',
  VALIDATION_ERROR: '输入数据验证失败',
  FILE_TOO_LARGE: '文件大小超过限制',
  INVALID_FILE_TYPE: '不支持的文件类型',
};

// 成功消息
export const SUCCESS_MESSAGES = {
  LOGIN: '登录成功',
  REGISTER: '注册成功',
  SAVE: '保存成功',
  UPDATE: '更新成功',
  DELETE: '删除成功',
  UPLOAD: '上传成功',
}; 