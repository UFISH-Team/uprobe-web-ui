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
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 处理未授权错误
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Access forbidden:', error.response.data);
          break;
        case 404:
          console.error('Resource not found:', error.response.data);
          break;
        case 500:
          console.error('Server error:', error.response.data);
          break;
        default:
          console.error('API error:', error.response.data);
      }
    } else if (error.request) {
      console.error('Network error:', error.request);
    } else {
      console.error('Error:', error.message);
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
    return api.get('/genome');
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

  static async designUProbe(data: any): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(data)], { type: 'text/yaml' }), 'workflow.yaml');
    return api.post('/workflow/design_uprobe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
    });
  }
  
  // 基因组相关
  static async getGenomes(): Promise<string[]> {
    return api.get('/genome');
  }

  static async getGenomeFiles(genomeName: string): Promise<{ genome: string; files: string[] }> {
    return api.get(`/genome/${genomeName}/files`);
  }

  static async getFileMetadata(genomeName: string, fileName: string): Promise<{
    size: number;
    created: string;
    modified: string;
  }> {
    return api.get(`/genome/${genomeName}/${fileName}/metadata`);
  }

  static async uploadGenomeFile(genomeName: string, file: File): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/genome/${genomeName}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  static async addGenome(genomeName: string): Promise<{ message: string }> {
    return api.post(`/genome/${genomeName}`);
  }

  static async deleteGenome(genomeName: string): Promise<{ message: string }> {
    return api.delete(`/genome/${genomeName}`);
  }

  static async deleteGenomeFile(genomeName: string, fileName: string): Promise<{ message: string }> {
    return api.delete(`/genome/${genomeName}/${fileName}`);
  }

  static async downloadGenomeFile(genomeName: string, fileName: string): Promise<Blob> {
    return api.get(`/genome/${genomeName}/${fileName}`, {
      responseType: 'blob'
    });
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

  // 任务提交
  static async submitTask(data: any): Promise<ApiResponse<{ job_id: string }>> {
    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    return api.post('workflow/submit_task', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  static async getAllJobs(): Promise<ApiResponse<any[]>> {
    return api.get(`/job/list_all`);
  }

  static async getJobStatus(jobId: string): Promise<ApiResponse<any>> {
    return api.get(`/job/status/${jobId}`);
  }

  static async cancelJob(jobId: string): Promise<ApiResponse<any>> {
    return api.get(`/job/cancel/${jobId}`);
  }

  static async reRunJob(jobId: string): Promise<ApiResponse<any>> {
    return api.get(`/job/re_run/${jobId}`);
  }

  static async removeJob(jobId: string): Promise<ApiResponse<any>> {
    return api.get(`/job/remove/${jobId}`);
  }

  static async getJobResult(jobId: string): Promise<ApiResponse<any>> {
    return api.get(`/job/result/${jobId}`);
  }

  static async getJobStdout(jobId: string): Promise<ApiResponse<string>> {
    return api.get(`/job/stdout/${jobId}`);
  }

  static async getJobStderr(jobId: string): Promise<ApiResponse<string>> {
    return api.get(`/job/stderr/${jobId}`);
  }
}

export default ApiService; 