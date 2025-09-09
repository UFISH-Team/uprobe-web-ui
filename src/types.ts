import yaml from 'js-yaml';

// Folder chain type for file navigation
export type FolderChain = Array<{ name: string }>;

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
  yaml_content?: string;
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
  } else if (parsed.barcodes) {
    // Handle the format used in CustomProbe page and downloaded configs
    const barcodes = parsed.barcodes.barcodes || {};
    const barcodeEntries: Record<string, { name: string; length: number }> = {};
    
    // Convert BC1, BC2 format to barcode1, barcode2 format for internal use
    Object.entries(barcodes).forEach(([key, config]: [string, any]) => {
      if (key.startsWith('BC')) {
        const barcodeIndex = key.replace('BC', '');
        const barcodeKey = `barcode${barcodeIndex}`;
        barcodeEntries[barcodeKey] = {
          name: key,
          length: config.length || 12
        };
      }
    });
    
    parameters.barcodeConfig = {
      count: parsed.barcodes.count,
      default_length: parsed.barcodes.default_length || 
        (Object.keys(barcodeEntries).length > 0 ? 
          Math.min(...Object.values(barcodeEntries).map(b => b.length)) : 12),
      barcodes: barcodeEntries
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
