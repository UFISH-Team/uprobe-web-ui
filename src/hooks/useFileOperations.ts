import { useState, useRef, useCallback } from 'react';
import { FileItem } from '../types';
import { useNotification } from './useNotification';
import { API_BASE_URL } from '../api';

// Utility function to categorize file types
const getFileType = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'fa':
    case 'fna':
    case 'fasta':
      return 'Genome File';
    case 'gff':
    case 'gtf':
      return 'Annotation File';
    case 'jf':
    case 'sam':
    case 'bam':
      return 'Index File';
    default:
      return 'Other';
  }
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const useFileOperations = (selectedGenome: string, customGenome: string) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();

  const uploadFile = useCallback(async (file: File, fileId: number, genomeName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/genomes/${genomeName}/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.id === fileId ? { ...f, progress } : f
            )
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.id === fileId ? { ...f, isUploading: false, progress: 100 } : f
            )
          );
          showNotification(`File '${file.name}' uploaded successfully`, 'success');
          resolve();
        } else {
          reject(xhr.responseText);
        }
      };

      xhr.onerror = () => {
        reject('Network error');
      };

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  }, [showNotification]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const genomeName = customGenome || selectedGenome;

    if (!genomeName) {
      showNotification("Please select or enter a genome name before uploading files", "warning");
      return;
    }

    const uploadedFiles = Array.from(event.target.files || []);
    if (uploadedFiles.length === 0) return;

    const newFiles = uploadedFiles.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: getFileType(file.name),
      date: new Date().toLocaleDateString(),
      progress: 0,
      isUploading: true,
      size: formatFileSize(file.size),
      file
    }));

    setFiles([...files, ...newFiles]);

    const uploadPromises = newFiles.map((fileItem) =>
      uploadFile(fileItem.file as File, fileItem.id, genomeName)
    );

    Promise.all(uploadPromises)
      .then(() => {
        console.log('All files uploaded successfully');
      })
      .catch(() => {
        console.error('Some uploads failed');
        showNotification('Some files failed to upload', 'error');
      });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [files, selectedGenome, customGenome, uploadFile, showNotification]);

  const deleteFile = useCallback(async (fileName: string) => {
    try {
      const encodedFileName = encodeURIComponent(fileName);
      const response = await fetch(`${API_BASE_URL}/genomes/${selectedGenome}/files/${encodedFileName}`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        showNotification(`File '${fileName}' deleted successfully`, 'success');
        setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
      } else {
        throw new Error('File deletion failed');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      showNotification(`Error deleting file: ${fileName}`, 'error');
    }
  }, [selectedGenome, showNotification]);
  
  const downloadFile = useCallback(async (fileName: string) => {
    try {
      const encodedFileName = encodeURIComponent(fileName);
      const response = await fetch(`${API_BASE_URL}/genomes/${selectedGenome}/files/${encodedFileName}`);
  
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        showNotification(`File '${fileName}' downloaded successfully`, 'success');
      } else {
        throw new Error('File download failed');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      showNotification(`Error downloading file: ${fileName}`, 'error');
    }
  }, [selectedGenome, showNotification]);

  return {
    files,
    fileInputRef,
    handleFileUpload,
    deleteFile,
    downloadFile
  };
};