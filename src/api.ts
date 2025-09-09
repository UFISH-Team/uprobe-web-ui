import axios from 'axios';
import { ApiResponse, PaginatedResponse } from './types';
import { AUTH_CONFIG } from './utils';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('tokenExpiration');
          window.location.href = '/auth';
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
  static async login(username: string, password: string): Promise<{ access_token: string; token_type: string }> {
    // Send JSON data to match backend LoginRequest model
    const response = await api.post('/auth/login', { 
      username, 
      password 
    }) as { token: string; token_type: string; user_info: any };

    // Map backend response to expected frontend format
    const mappedResponse = {
      access_token: response.token,
      token_type: response.token_type
    };

    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('isAuthenticated', 'true');
      // Set login timestamp with configurable expiry duration
      const expirationTime = Date.now() + AUTH_CONFIG.TOKEN_EXPIRY_DURATION;
      localStorage.setItem('tokenExpiration', expirationTime.toString());
    }
    return mappedResponse;
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
    return api.get('/genome/');
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
    return api.get('/genome/');
  }

  static async getGenomeFiles(genomeName: string): Promise<{ genome: string; files: string[] }> {
    return api.get(`/genome/${genomeName}/files`);
  }

  static async getFileMetadata(genomeName: string, fileName: string): Promise<{
    size: number;
    created: string;
    modified: string;
    is_preset: boolean;
    can_delete: boolean;
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
  static async getCurrentUser(): Promise<any> {
    return api.get('/auth/check');
  }

  static async updateUserProfile(data: { full_name?: string; email?: string }): Promise<any> {
    return api.put('/auth/profile', data);
  }

  // Barcode generation using workflow routes
  static async generateQuickBarcode(config: {
    num_barcodes: number;
    length: number;
    alphabet?: string;
    rc_free?: boolean;
    gc_limits?: [number, number];
    prevent_patterns?: string[];
  }): Promise<string[]> {
    return api.post('/workflow/barcodes/quick', config);
  }

  static async generatePcrBarcode(config: {
    num_barcodes: number;
    length?: number;
  }): Promise<string[]> {
    return api.post('/workflow/barcodes/pcr', config);
  }

  static async generateSequencingBarcode(config: {
    num_barcodes: number;
    length?: number;
  }): Promise<string[]> {
    return api.post('/workflow/barcodes/sequencing', config);
  }

  // Legacy method - kept for backward compatibility
  static async generateBarcode(config: {
    length: number;
    type?: string;
    count?: number;
    constraints?: any;
  }): Promise<{ barcode: string }> {
    // Use quick generation by default
    const result = await this.generateQuickBarcode({
      num_barcodes: 1,
      length: config.length,
      alphabet: 'ACTG',
      rc_free: true
    });
    return { barcode: result[0] };
  }

  static async generateBarcodes(config: {
    length: number;
    type?: string;
    count: number;
    constraints?: any;
  }): Promise<{ barcodes: string[] }> {
    const result = await this.generateQuickBarcode({
      num_barcodes: config.count,
      length: config.length,
      alphabet: 'ACTG',
      rc_free: true
    });
    return { barcodes: result };
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
    const yaml = await import('js-yaml');
    const formData = new FormData();
    
    // 将配置数据转换为YAML格式
    const yamlContent = yaml.dump(data, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
    
    formData.append('file', new Blob([yamlContent], { type: 'application/x-yaml' }), 'protocol.yaml');
    
    return api.post('workflow/submit_task', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // 任务管理 - 使用task路由器
  static async getAllTasks(): Promise<ApiResponse<any[]>> {
    return api.get(`/task/`);
  }

  static async getTaskById(taskId: string): Promise<ApiResponse<any>> {
    return api.get(`/task/${taskId}`);
  }

  static async runTask(taskId: string): Promise<ApiResponse<any>> {
    return api.post(`/task/${taskId}/run`);
  }

  static async pauseTask(taskId: string): Promise<ApiResponse<any>> {
    return api.post(`/task/${taskId}/pause`);
  }

  static async resumeTask(taskId: string): Promise<ApiResponse<any>> {
    return api.post(`/task/${taskId}/resume`);
  }

  static async deleteTask(taskId: string): Promise<ApiResponse<any>> {
    return api.delete(`/task/${taskId}`);
  }

  static async downloadTaskResult(taskId: string): Promise<Blob> {
    const response = await axios.get(`${API_BASE_URL}/task/${taskId}/download`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      responseType: 'blob'
    });
    return response.data;
  }

  static async getTaskFiles(taskId: string): Promise<ApiResponse<{ files: any[] }>> {
    return api.get(`/task/${taskId}/files`);
  }

  static async downloadTaskFile(taskId: string, filename: string): Promise<Blob> {
    const response = await axios.get(`${API_BASE_URL}/task/${taskId}/file/${filename}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      responseType: 'blob'
    });
    return response.data;
  }

  // 保留job相关方法以向后兼容
  static async getAllJobs(): Promise<ApiResponse<any[]>> {
    return this.getAllTasks();
  }

  static async getJobStatus(jobId: string): Promise<ApiResponse<any>> {
    return this.getTaskById(jobId);
  }

  static async cancelJob(jobId: string): Promise<ApiResponse<any>> {
    return this.pauseTask(jobId);
  }

  static async reRunJob(jobId: string): Promise<ApiResponse<any>> {
    return this.resumeTask(jobId);
  }

  static async removeJob(jobId: string): Promise<ApiResponse<any>> {
    return this.deleteTask(jobId);
  }

  static async getJobResult(jobId: string): Promise<Blob> {
    return this.downloadTaskResult(jobId);
  }

  static async logout(): Promise<void> {
    // This call is mainly for completeness, the main logic is clearing local storage.
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout failed on server, but proceeding with local cleanup.", error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('tokenExpiration');
      // Redirect to login page to ensure clean state
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
  }
}

export default ApiService; 
