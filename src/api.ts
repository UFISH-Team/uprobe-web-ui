import axios from 'axios';
import { ApiResponse, PaginatedResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 处理未授权错误
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API 服务类
class ApiService {
  // 认证相关
  static async login(email: string, password: string): Promise<ApiResponse<{ token: string }>> {
    return api.post('/auth/login', { email, password });
  }

  static async register(username: string, email: string, password: string): Promise<ApiResponse<{ token: string }>> {
    return api.post('/auth/register', { username, email, password });
  }

  // 探针设计相关
  static async getDesigns(params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<any>> {
    return api.get('/designs', { params });
  }

  static async createDesign(data: any): Promise<ApiResponse<any>> {
    return api.post('/designs', data);
  }

  static async updateDesign(id: string, data: any): Promise<ApiResponse<any>> {
    return api.put(`/designs/${id}`, data);
  }

  static async deleteDesign(id: string): Promise<ApiResponse<void>> {
    return api.delete(`/designs/${id}`);
  }

  // 基因组相关
  static async getGenomes(params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<any>> {
    return api.get('/genomes', { params });
  }

  static async uploadGenome(data: FormData): Promise<ApiResponse<any>> {
    return api.post('/genomes/upload', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // 任务相关
  static async getJobs(params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<any>> {
    return api.get('/jobs', { params });
  }

  static async createJob(data: any): Promise<ApiResponse<any>> {
    return api.post('/jobs', data);
  }

  static async cancelJob(id: string): Promise<ApiResponse<void>> {
    return api.post(`/jobs/${id}/cancel`);
  }

  // 用户相关
  static async getCurrentUser(): Promise<ApiResponse<any>> {
    return api.get('/users/me');
  }

  static async updateUserProfile(data: any): Promise<ApiResponse<any>> {
    return api.put('/users/profile', data);
  }

  // 文件上传
  static async uploadFile(file: File, type: string): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export default ApiService; 