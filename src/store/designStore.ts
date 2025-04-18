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
}

interface Filter {
  type: string;
  value: any;
}

interface Sort {
  type: string;
  order: '↑' | '↓';
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
  
  // Post processing
  filters: Filter[];
  sorts: Sort[];
  removeOverlap: number;
  
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
  updatePool: (index: number, field: keyof Pool, value: any) => void;
  
  // Post processing actions
  addFilter: (filter: Filter) => void;
  removeFilter: (index: number) => void;
  updateFilter: (index: number, value: any) => void;
  addSort: (sort: Sort) => void;
  removeSort: (index: number) => void;
  setRemoveOverlap: (value: number) => void;
  
  // UI actions
  setSubmitting: (isSubmitting: boolean) => void;
  setProgress: (progress: number) => void;
  setDownloadUrl: (url: string | null) => void;
  setAlert: (open: boolean, message: string, severity: 'success' | 'error') => void;
  navigateToJobs: () => void;
  
  // API actions
  submitTask: () => Promise<void>;
  getBarcodeSequence: (barcode: string) => Promise<string | null>;
  refreshJobs: () => void;
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
    poolList: [{ name: '', location: '', numbers: 8000, density: 0.00005 }],
  },
  selectedCustomType: null,
  filters: [],
  sorts: [],
  removeOverlap: 0,
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
        { name: '', location: '', numbers: 8000, density: 0.00005 },
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
  
  // Post processing setters
  addFilter: (filter) => set((state) => ({
    filters: [...state.filters, filter],
  })),
  removeFilter: (index) => set((state) => ({
    filters: state.filters.filter((_, i) => i !== index),
  })),
  updateFilter: (index, value) => set((state) => ({
    filters: state.filters.map((filter, i) =>
      i === index ? { ...filter, value } : filter
    ),
  })),
  addSort: (sort) => set((state) => ({
    sorts: [...state.sorts, sort],
  })),
  removeSort: (index) => set((state) => ({
    sorts: state.sorts.filter((_, i) => i !== index),
  })),
  setRemoveOverlap: (value) => set({ removeOverlap: value }),
  
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
  
  submitTask: async () => {
    try {
      const state = get();
      
      // Input validation
      if (!state.taskName || !state.probeType || !state.species) {
        set({
          alertOpen: true,
          alertMessage: 'Please fill in all required fields before submitting.',
          alertSeverity: 'error',
        });
        return;
      }
      
      if (state.probeType === 'RCA' && state.geneList.some(gene => !gene.gene)) {
        set({
          alertOpen: true,
          alertMessage: 'Please fill in all gene names for RCA design.',
          alertSeverity: 'error',
        });
        return;
      }
      
      if (state.probeType === 'DNA-FISH' && state.dnaFishParams.poolList.some(pool => 
        !pool.name || !pool.location || pool.numbers === 0 || pool.density === 0
      )) {
        set({
          alertOpen: true,
          alertMessage: 'Please fill in all pool details for DNA-FISH design.',
          alertSeverity: 'error',
        });
        return;
      }

      if (state.probeType === 'U-Probe' && state.geneList.some(gene => !gene.gene)) {
        set({
          alertOpen: true,
          alertMessage: 'Please fill in all gene names for U-Probe design.',
          alertSeverity: 'error',
        });
        return;
      }
      
      set({ isSubmitting: true, progress: 10 });
      
      // Prepare the task data based on probe type
      const taskData: any = {
        name: state.taskName,
        description: `${state.probeType} probe design for ${state.species}`,
        probeType: state.probeType,
        species: state.species,
        parameters: {}
      };
      
      // Add parameters based on probe type
      if (state.probeType === 'RCA') {
        taskData.parameters = {
          minLength: state.minLength,
          overlap: state.overlap,
          geneList: state.geneList,
          filters: state.filters,
          sorts: state.sorts,
          removeOverlap: state.removeOverlap
        };
      } else if (state.probeType === 'DNA-FISH') {
        taskData.parameters = {
          ...state.dnaFishParams,
          filters: state.filters,
          sorts: state.sorts,
          removeOverlap: state.removeOverlap
        };
      } else {
        // Custom probe type
        taskData.parameters = {
          minLength: state.minLength,
          overlap: state.overlap,
          geneList: state.geneList,
          customType: state.selectedCustomType?.name || state.probeType,
          filters: state.filters,
          sorts: state.sorts,
          removeOverlap: state.removeOverlap
        };
      }
      
      set({ progress: 30 });
      
      // Submit the task to the API
      const response = await ApiService.submitTask(taskData);
      
      set({ progress: 90 });
      
      if (response && response.data && response.data.job_id) {
        set({
          alertOpen: true,
          alertMessage: 'Task submitted successfully! Redirecting to task page...',
          alertSeverity: 'success',
          progress: 100
        });
        
        // Increment the refresh job counter to trigger a refresh on the Task page
        set(state => ({ nRefreshJobs: state.nRefreshJobs + 1 }));
        
        // Navigate to the task page after a short delay
        setTimeout(() => {
          window.location.href = '/task';
        }, 2000);
      } else {
        throw new Error('Failed to get job ID from response');
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      set({
        isSubmitting: false,
        alertOpen: true,
        alertMessage: 'Failed to submit task. Please try again.',
        alertSeverity: 'error',
      });
    } finally {
      // Reset submission state after a delay
      setTimeout(() => {
        set({ isSubmitting: false, progress: 0 });
      }, 3000);
    }
  },

  refreshJobs: () => {
    set((state) => ({ nRefreshJobs: state.nRefreshJobs + 1 }))
  }
}));

export default useDesignStore;