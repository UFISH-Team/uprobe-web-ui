import axios from 'axios';
import { ApiResponse, PaginatedResponse } from './types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8123';

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

  // 探针设计工作流相关
  static async getBarcodeOptions(): Promise<string[]> {
    return api.get('/workflow/barcodes');
  }

  static async getBarcodeSequence(barcode: string): Promise<{ [key: string]: string }> {
    return api.get(`/workflow/barcodes/${barcode}`);
  }

  static async getSpeciesOptions(): Promise<string[]> {
    return api.get('/genome/genomes');
  }

  static async designRCA(data: any): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(data)], { type: 'text/yaml' }), 'workflow.yaml');
    return api.post('/workflow/design_rca', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
    });
  }

  static async designDNAFISH(data: any): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(data)], { type: 'text/yaml' }), 'workflow.yaml');
    return api.post('/workflow/design_dnafish', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
    });
  }

  // 基因组相关
  static async getGenomes(): Promise<string[]> {
    return api.get('/genome/genomes');
  }

  static async getGenomeFiles(genomeName: string): Promise<{ genome: string; files: string[] }> {
    return api.get(`/genome/genomes/${genomeName}/files`);
  }

  static async getFileMetadata(genomeName: string, fileName: string): Promise<{
    size: number;
    created: string;
    modified: string;
  }> {
    return api.get(`/genome/genomes/${genomeName}/${fileName}/metadata`);
  }

  static async uploadGenomeFile(genomeName: string, file: File): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/genome/genomes/${genomeName}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  static async addGenome(genomeName: string): Promise<{ message: string }> {
    return api.post(`/genome/genomes/${genomeName}`);
  }

  static async deleteGenome(genomeName: string): Promise<{ message: string }> {
    return api.delete(`/genome/genomes/${genomeName}`);
  }

  static async deleteGenomeFile(genomeName: string, fileName: string): Promise<{ message: string }> {
    return api.delete(`/genome/genomes/${genomeName}/${fileName}`);
  }

  static async downloadGenomeFile(genomeName: string, fileName: string): Promise<Blob> {
    return api.get(`/genome/genomes/${genomeName}/${fileName}`, {
      responseType: 'blob'
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