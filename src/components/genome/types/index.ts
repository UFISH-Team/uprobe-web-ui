// Common types used across the application

export interface FileItem {
    id: number;
    name: string;
    type: string;
    date: string;
    progress: number;
    isUploading: boolean;
    size?: string;
    file?: File;
  }
  
  export interface NotificationState {
    open: boolean;
    message: string;
    severity?: 'success' | 'error' | 'info' | 'warning';
  }
  
  export interface GenomeMetadataType {
    name: string;
    scientificName: string;
    assemblyVersion: string;
    totalSize: string;
    chromosomeCount: number;
    geneCount: number;
    ncbiTaxonId?: string;
    assemblyDate?: string;
    source?: string;
    description?: string;
    lastModified: string;
    genomeFiles: {
      type: string;
      count: number;
    }[];
  }
  
  export interface GenomeStats {
    totalSize: string;
    fileCount: number;
    annotationFiles: number;
    genomeFiles: number;
    indexFiles: number;
    otherFiles: number;
    lastUpdated: string;
  }