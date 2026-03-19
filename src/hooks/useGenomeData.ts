import { useState, useCallback } from 'react';
import ApiService from '../api';
import { useNotification } from './useNotification';

export const useGenomeData = () => {
  const [genomes, setGenomes] = useState<{name: string, is_public: boolean}[]>([]);
  const [selectedGenome, setSelectedGenome] = useState<string | null>(null);
  const [genomeFiles, setGenomeFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification } = useNotification();

  // 获取所有基因组列表
  const fetchGenomes = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getGenomes();
      setGenomes(response);
    } catch (error) {
      showNotification('Failed to fetch genomes', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // 获取基因组文件列表
  const fetchGenomeFiles = useCallback(async (genomeName: string) => {
    try {
      setIsLoading(true);
      const response = await ApiService.getGenomeFiles(genomeName);
      setGenomeFiles(response.files);
    } catch (error) {
      showNotification('Failed to fetch genome files', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // 上传基因组文件
  const uploadGenomeFile = useCallback(async (genomeName: string, file: File) => {
    try {
      setIsLoading(true);
      await ApiService.uploadGenomeFile(genomeName, file);
      await fetchGenomeFiles(genomeName);
      showNotification('File uploaded successfully', 'success');
    } catch (error) {
      showNotification('Failed to upload file', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchGenomeFiles, showNotification]);

  // 删除基因组文件
  const deleteGenomeFile = useCallback(async (genomeName: string, fileName: string) => {
    try {
      setIsLoading(true);
      await ApiService.deleteGenomeFile(genomeName, fileName);
      await fetchGenomeFiles(genomeName);
      showNotification('File deleted successfully', 'success');
    } catch (error) {
      showNotification('Failed to delete file', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchGenomeFiles, showNotification]);

  // 下载基因组文件
  const downloadGenomeFile = useCallback(async (genomeName: string, fileName: string) => {
    try {
      setIsLoading(true);
      const response = await ApiService.downloadGenomeFile(genomeName, fileName);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      // 获取文件名（不包含路径）
      const actualFileName = fileName.split('/').pop() || fileName;
      link.setAttribute('download', actualFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showNotification('File downloaded successfully', 'success');
    } catch (error) {
      showNotification('Failed to download file', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // 获取文件元数据
  const getFileMetadata = useCallback(async (genomeName: string, fileName: string) => {
    try {
      const response = await ApiService.getFileMetadata(genomeName, fileName);
      return response;
    } catch (error) {
      console.error('Failed to fetch file metadata:', error);
      return null;
    }
  }, []);

  // 添加新基因组
  const addGenome = useCallback(async (genomeName: string) => {
    try {
      setIsLoading(true);
      await ApiService.addGenome(genomeName);
      await fetchGenomes();
      showNotification('Genome added successfully', 'success');
    } catch (error) {
      showNotification('Failed to add genome', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchGenomes, showNotification]);

  // 删除基因组
  const deleteGenome = useCallback(async (genomeName: string) => {
    try {
      setIsLoading(true);
      await ApiService.deleteGenome(genomeName);
      await fetchGenomes();
      if (selectedGenome === genomeName) {
        setSelectedGenome(null);
      }
      showNotification('Genome deleted successfully', 'success');
    } catch (error) {
      showNotification('Failed to delete genome', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchGenomes, selectedGenome, showNotification]);

  return {
    genomes,
    selectedGenome,
    genomeFiles,
    isLoading,
    setSelectedGenome,
    fetchGenomes,
    fetchGenomeFiles,
    uploadGenomeFile,
    deleteGenomeFile,
    downloadGenomeFile,
    getFileMetadata,
    addGenome,
    deleteGenome,
  };
};
