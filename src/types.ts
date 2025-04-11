export type ServerRouter = "job" | "task" | "file" | "proxy"

export type UserMode = "free" | "mono" | "hub"

export type JobStatus = "pending" | "running" | "done" | "failed" | "canceled"

export interface TaskArg {
  name: string,
  type: string,
  range: Array<string | number> | null,
  default: string | null,
}

export interface Task {
  name: string,
  description: string,
  args: Array<TaskArg>,
}

export interface JobAttr {
  cmd?: string,
  address?: string,
}

export interface Job {
  id: string,
  status: JobStatus,
  name: string,
  job_type: string,
  check_time: string,
  created_time: string,
  submit_time: string | null,
  stoped_time: string | null,
  condition: Condition | null
  attrs: JobAttr,
}

export interface Condition {
  type: string,
  arguments: ConditionAfterAnoter
}

export interface ConditionAfterAnoter {
  job_id: string,
  statuses: JobStatus[]
}

export type PanelLabel = 'home' | 'launch' | 'jobs' | 'files'

export interface Folder {
  id: string,
  name: string,
}

export type FolderChain = Array<Folder>

export interface CallReq {
  task_name: string,
  args: any[],
  kwargs: object,
  condition: Condition | null
}

export type JobModify = "re_run" | "cancel" | "remove"

export interface UserInfo {
  id: number,
  username: string,
  role: string,
}


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

  // Extract barcode count from probes
  if (parsed.probes) {
    const barcodeSet = new Set<string>();
    Object.values(parsed.probes).forEach((probe: any) => {
      if (probe.parts) {
        Object.values(probe.parts).forEach((part: any) => {
          if (part.expr && part.expr.includes('encoding')) {
            const barcodeMatch = part.expr.match(/'([^']+)'/);
            if (barcodeMatch) {
              barcodeSet.add(barcodeMatch[1]);
            }
          }
        });
      }
    });
    parameters.barcodeCount = barcodeSet.size;
  }

  return parameters;
};
