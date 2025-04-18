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
  partLengths?: {
    part1: number;
    part2: number;
    part3: number;
  };
  probes?: { [key: string]: any };
}

export const parseYamlContent = (yamlContent: string) => {
  try {
    const yaml = require('js-yaml');
    const parsed = yaml.load(yamlContent);
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
  
  // Extract target length from YAML
  if (parsed.target_sequence_length) {
    parameters.targetLength = parsed.target_sequence_length;
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

  // Extract post-processing parameters
  if (parsed.post_process) {
    parameters.postProcess = {
      filters: parsed.post_process.filters || {},
      sorts: parsed.post_process.sorts || {},
      removeOverlap: parsed.post_process.remove_overlap?.location_interval || 0
    };
  }

  return parameters;
};