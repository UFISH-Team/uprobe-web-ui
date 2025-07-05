import { create } from 'zustand';
import ApiService from '../api';
import { CustomProbeType} from '../types';


interface Gene {
  gene: string;
  [key: string]: string; // Allow dynamic barcode fields
}

interface Pool {
  name: string;
  location: string;
  numbers: number;
  density: number;
  [key: string]: string | number;  // Allow dynamic barcode fields
}

interface DesignState {
  // Basic task info
  taskName: string;
  probeType: 'RCA' | 'DNA-FISH' | string;
  species: string;
  
  // RCA specific
  geneList: Gene[];
  minLength: number;
  overlap: number;
  partLengths: {
    part1: number;
    part2: number;
    part3: number;
  };
  
  // DNA-FISH specific
  dnaFishParams: {
    length: number;
    overlap: number;
    poolList: Pool[];
  };

  // Custom probe type specific
  selectedCustomType: CustomProbeType | null;
  
  // UI state
  isSubmitting: boolean;
  progress: number;
  downloadUrl: string | null;
  alertOpen: boolean;
  alertMessage: string;
  alertSeverity: 'success' | 'error';
  nRefreshJobs: number;
  
  // Actions
  setTaskName: (name: string) => void;
  setProbeType: (type: 'RCA' | 'DNA-FISH' | string) => void;
  setSpecies: (species: string) => void;
  setSelectedCustomType: (type: CustomProbeType | null) => void;
  
  // RCA actions
  setGeneList: (list: Gene[]) => void;
  addGene: () => void;
  removeGene: (index: number) => void;
  updateGene: (index: number, field: keyof Gene, value: string) => void;
  setMinLength: (length: number) => void;
  setOverlap: (overlap: number) => void;
  setPartLengths: (part: 'part1' | 'part2' | 'part3', length: number) => void;
  
  // DNA-FISH actions
  setDnaFishParams: (params: Partial<DesignState['dnaFishParams']>) => void;
  addPool: () => void;
  removePool: (index: number) => void;
  updatePool: (index: number, field: string, value: string | number) => void;
  
  // UI actions
  setSubmitting: (isSubmitting: boolean) => void;
  setProgress: (progress: number) => void;
  setDownloadUrl: (url: string | null) => void;
  setAlert: (open: boolean, message: string, severity: 'success' | 'error') => void;
  navigateToJobs: () => void;
  
  // API actions
  getBarcodeSequence: (barcode: string) => Promise<string | null>;
}

const useDesignStore = create<DesignState>((set, get) => ({
  // Initial state
  taskName: '',
  probeType: 'RCA',
  species: '',
  geneList: [{ gene: '' }],
  minLength: 40,
  overlap: 20,
  partLengths: { part1: 13, part2: 13, part3: 13 },
  dnaFishParams: {
    length: 70,
    overlap: 20,
    poolList: [{ name: '', location: '', numbers: 0, density: 0}],
  },
  selectedCustomType: null,
  isSubmitting: false,
  progress: 0,
  downloadUrl: null,
  alertOpen: false,
  alertMessage: '',
  alertSeverity: 'success',
  nRefreshJobs: 0,
  
  // Basic setters
  setTaskName: (name) => set({ taskName: name }),
  setProbeType: (type) => set({ probeType: type }),
  setSpecies: (species) => set({ species }),
  setSelectedCustomType: (type) => set({ selectedCustomType: type }),
  
  // RCA setters
  setGeneList: (list) => set({ geneList: list }),
  addGene: () => set((state) => ({
    geneList: [...state.geneList, { gene: '' }],
  })),
  removeGene: (index) => set((state) => ({
    geneList: state.geneList.filter((_, i) => i !== index),
  })),
  updateGene: (index, field, value) => set((state) => ({
    geneList: state.geneList.map((gene, i) =>
      i === index ? { ...gene, [field]: value } : gene
    ),
  })),
  setMinLength: (length) => set({ minLength: length }),
  setOverlap: (overlap) => set({ overlap }),
  setPartLengths: (part, length) => set((state) => ({
    partLengths: { ...state.partLengths, [part]: length },
  })),
  
  // DNA-FISH setters
  setDnaFishParams: (params) => set((state) => ({
    dnaFishParams: { ...state.dnaFishParams, ...params },
  })),
  addPool: () => set((state) => ({
    dnaFishParams: {
      ...state.dnaFishParams,
      poolList: [
        ...state.dnaFishParams.poolList,
        { name: '', location: '', numbers: 0, density: 0},
      ],
    },
  })),
  removePool: (index) => set((state) => ({
    dnaFishParams: {
      ...state.dnaFishParams,
      poolList: state.dnaFishParams.poolList.filter((_, i) => i !== index),
    },
  })),
  updatePool: (index, field, value) => set((state) => ({
    dnaFishParams: {
      ...state.dnaFishParams,
      poolList: state.dnaFishParams.poolList.map((pool, i) =>
        i === index ? { ...pool, [field]: value } : pool
      ),
    },
  })),
  
  // UI setters
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setProgress: (progress) => set({ progress }),
  setDownloadUrl: (url: string | null) => set({ downloadUrl: url }),
  setAlert: (open, message, severity) => set({
    alertOpen: open,
    alertMessage: message,
    alertSeverity: severity,
  }),
  navigateToJobs: () => {
    // Implementation of navigateToJobs
  },
  
  // API actions
  getBarcodeSequence: async (barcode) => {
    try {
      const response = await ApiService.getBarcodeSequence(barcode);
      return response[barcode] || null;
    } catch (error) {
      console.error(`Error fetching sequence for ${barcode}:`, error);
      return null;
    }
  },
}));

export default useDesignStore;