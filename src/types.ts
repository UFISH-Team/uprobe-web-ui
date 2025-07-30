import yaml from 'js-yaml';

// Task
export interface Task {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed" | "paused";
  progress: number;
  created_at: string;
  updated_at: string;
  genome: string;
  parameters: Record<string, any>;
  result_url?: string;
}

export const statusColors = {
  pending: "blue",
  running: "green",
  completed: "success",
  failed: "error",
  paused: "warning",
};

// genome
export interface FileItem {
  id: number;
  name: string;
  type: string;
  date: string;
  progress: number;
  isUploading: boolean;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

// API响应类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 基因组相关类型
export interface Genome {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
}

export interface GenomeMetadata {
  id: string;
  genomeId: string;
  species: string;
  assembly: string;
  version: string;
  source: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenomeFile {
  id: string;
  genomeId: string;
  name: string;
  type: string;
  size: number;
  path: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProbeConfig {
  template: string;
  parts: Record<string, {
    expr: string;
    attributes?: Record<string, any>;
  }>;
  attributes?: Record<string, any>;
}

export interface CustomProbeType {
  id: string;
  name: string;
  type: string;
  yamlContent: string;
  createdAt: Date;
  updatedAt: Date;
  barcodeCount: number;
  targetLength?: number;
  overlap?: number;
  targetConfig?: {
    source: string;
    sequence: string;
    length: number;
    attributes?: Record<string, any>;
  };
  barcodeConfig?: {
    count: number;
    default_length: number;
    barcodes: Record<string, {
      name: string;
      length: number;
    }>;
  };
  probes?: Record<string, ProbeConfig>;
}

export const parseYamlContent = (yamlContent: string) => {
  try {
    const parsed = yaml.load(yamlContent) as any;
    return parsed;
  } catch (e) {
    console.error('Error parsing YAML:', e);
    return null;
  }
};

// Add this function to extract parameters from YAML
export const extractParametersFromYaml = (yamlContent: string) => {
  const parsed = parseYamlContent(yamlContent);
  if (!parsed) return null;

  const parameters: any = {};
  
  // Extract target sequence information
  if (parsed.target_sequence) {
    parameters.target_sequence = {
      source: parsed.target_sequence.source,
      sequence: parsed.target_sequence.sequence,
      length: parsed.target_sequence.length,
      attributes: parsed.target_sequence.attributes || {}
    };
    // Also set targetLength for backward compatibility
    parameters.targetLength = parsed.target_sequence.length;
  }
  
  // Extract target length from YAML (fallback)
  if (!parameters.targetLength && parsed.target_sequence_length) {
    parameters.targetLength = parsed.target_sequence_length;
  }

  // Extract barcode configuration
  if (parsed.barcode_config) {
    parameters.barcodeConfig = {
      count: parsed.barcode_config.count,
      default_length: parsed.barcode_config.default_length,
      barcodes: parsed.barcode_config.barcodes || {}
    };
  }

  // Extract overlap from extracts section
  if (parsed.extracts && parsed.extracts.target_region && parsed.extracts.target_region.overlap) {
    parameters.overlap = parsed.extracts.target_region.overlap;
  }

  // Extract probe names and their parts
  if (parsed.probes) {
    parameters.probeNames = Object.keys(parsed.probes);
    parameters.probes = parsed.probes;
    
    // Extract barcode count from probes
    const barcodeSet = new Set<string>();
    Object.values(parsed.probes).forEach((probe: any) => {
      if (probe.parts) {
        Object.values(probe.parts).forEach((part: any) => {
          if (part.expr && typeof part.expr === 'string' && part.expr.includes('encoding')) {
            const barcodeMatch = part.expr.match(/'([^']+)'/);
            if (barcodeMatch) {
              barcodeSet.add(barcodeMatch[1]);
            }
          }
        });
      }
    });
    parameters.barcodeCount = barcodeSet.size;
    
    // Extract part lengths for RCA probes
    if (parsed.probes.circle_probe && parsed.probes.circle_probe.parts) {
      parameters.partLengths = {
        part1: parsed.probes.circle_probe.parts.part1?.length || 0,
        part2: parsed.probes.circle_probe.parts.part2?.length || 0,
        part3: parsed.probes.circle_probe.parts.part3?.length || 0
      };
    }
  }

  return parameters;
};

import { styled } from '@mui/system';
import { Box, Paper, Button, Card } from '@mui/material';

// Modern Container with better spacing and styling
export const Container = styled(Box)(({ theme }) => ({
  padding: '32px',
  maxWidth: '1400px',
  margin: '0 auto',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
  
  [theme.breakpoints.down('md')]: {
    padding: '24px',
    borderRadius: '12px',
  },
  
  [theme.breakpoints.down('sm')]: {
    padding: '16px',
    borderRadius: '8px',
  },
}));

// Modern Section with improved spacing
export const Section = styled(Box)(({ theme }) => ({
  marginBottom: '48px',
  
  [theme.breakpoints.down('md')]: {
    marginBottom: '32px',
  },
  
  [theme.breakpoints.down('sm')]: {
    marginBottom: '24px',
  },
}));

// Modern Gradient Button
export const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
  borderRadius: '12px',
  padding: '12px 24px',
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: 'none',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    background: 'linear-gradient(135deg, #1d4ed8 0%, #0e7490 100%)',
    transform: 'translateY(-1px)',
    boxShadow: '0px 6px 20px -4px rgba(37, 99, 235, 0.3), 0px 12px 24px -8px rgba(37, 99, 235, 0.2)',
  },
  
  '&:active': {
    transform: 'translateY(0)',
  },
}));

// Modern Card with glass effect
export const GlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '16px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    transform: 'translateY(-2px)',
    background: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(37, 99, 235, 0.2)',
    boxShadow: '0px 4px 12px -2px rgba(0, 0, 0, 0.08), 0px 12px 24px -4px rgba(0, 0, 0, 0.08)',
  },
}));

// Status indicator component
export const StatusIndicator = styled(Box)<{ status: 'success' | 'warning' | 'error' | 'info' }>(
  ({ theme, status }) => {
    const colors = {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    };
    
    return {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: colors[status],
      position: 'relative',
      
      '&::after': {
        content: '""',
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        backgroundColor: colors[status],
        animation: 'pulse 2s infinite',
        opacity: 0.6,
      },
    };
  }
);

// Modern progress bar
export const ProgressBar = styled(Box)<{ progress: number }>(({ theme, progress }) => ({
  width: '100%',
  height: '8px',
  backgroundColor: 'rgba(226, 232, 240, 0.5)',
  borderRadius: '4px',
  overflow: 'hidden',
  position: 'relative',
  
  '&::after': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: `${progress}%`,
    background: 'linear-gradient(90deg, #2563eb 0%, #0891b2 100%)',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
}));
