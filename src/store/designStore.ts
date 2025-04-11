import { create } from 'zustand';
import ApiService from '../api';

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
  
  // Actions
  setTaskName: (name: string) => void;
  setProbeType: (type: 'RCA' | 'DNA-FISH' | string) => void;
  setSpecies: (species: string) => void;
  
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
  
  // API actions
  submitTask: () => Promise<void>;
  getBarcodeSequence: (barcode: string) => Promise<string | null>;
}

const useDesignStore = create<DesignState>((set, get) => ({
  // Initial state
  taskName: '',
  probeType: 'RCA',
  species: '',
  geneList: [{ gene: '' }],
  minLength: 40,
  overlap: 35,
  partLengths: { part1: 13, part2: 13, part3: 13 },
  dnaFishParams: {
    length: 70,
    overlap: 20,
    poolList: [{ name: '', location: '', numbers: 8000, density: 0.00005 }],
  },
  filters: [],
  sorts: [],
  removeOverlap: 0,
  isSubmitting: false,
  progress: 0,
  downloadUrl: null,
  alertOpen: false,
  alertMessage: '',
  alertSeverity: 'success',
  
  // Basic setters
  setTaskName: (name) => set({ taskName: name }),
  setProbeType: (type) => set({ probeType: type }),
  setSpecies: (species) => set({ species }),
  
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
  setDownloadUrl: (url) => set({ downloadUrl: url }),
  setAlert: (open, message, severity) => set({
    alertOpen: open,
    alertMessage: message,
    alertSeverity: severity,
  }),
  
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
    
    set({ isSubmitting: true, progress: 30 });
    
    try {
      // Generate YAML content
      const barcodeSet: { [key: string]: string } = {};
      
      if (state.probeType === 'RCA') {
        for (const item of state.geneList) {
          const barcode1Sequence = await get().getBarcodeSequence(item.barcode1);
          const barcode2Sequence = await get().getBarcodeSequence(item.barcode2);
          
          if (barcode1Sequence && barcode2Sequence) {
            barcodeSet[item.barcode1] = barcode1Sequence;
            barcodeSet[item.barcode2] = barcode2Sequence;
          }
        }
      }
      
      const yamlContent = {
        name: state.taskName,
        probetype: state.probeType,
        genome: state.species,
        targets: state.probeType === 'RCA' ? state.geneList.map(gene => gene.gene) : undefined,
        ...(state.probeType === 'RCA' && {
          barcode_set: barcodeSet,
          encoding: state.geneList.reduce((acc, item) => {
            acc[item.gene] = {
              barcode1: item.barcode1,
              barcode2: item.barcode2,
            };
            return acc;
          }, {} as { [key: string]: { barcode1: string; barcode2: string } }),
          extracts: {
            target_region: {
              source: 'targets',
              min_length: state.minLength,
              overlap: state.overlap,
              template: '{part1}{part2}N{part3}',
              parts: {
                part1: { length: state.partLengths.part1, source: 'target_region[0:length]' },
                part2: { length: state.partLengths.part2, source: 'target_region[len(part1):len(part1)+length]' },
                part3: { length: state.partLengths.part3, source: 'target_region[-length:]' },
              },
            },
          },
        }),
        ...(state.probeType === 'DNA-FISH' && {
          probes: {
            fish_probe: {
              length: state.dnaFishParams.length,
              overlap: state.dnaFishParams.overlap,
            },
          },
          pool_list: state.dnaFishParams.poolList.map(pool => ({
            name: pool.name,
            location: pool.location,
            numbers: pool.numbers,
            density: pool.density,
          })),
        }),
      };
      
      set({ progress: 60 });
      
      // Submit to API
      const response = await (state.probeType === 'RCA' 
        ? ApiService.designRCA(yamlContent)
        : ApiService.designDNAFISH(yamlContent));
      
      set({ progress: 90 });
      
      // Create download URL
      const downloadBlob = new Blob([response], { type: 'application/zip' });
      const url = URL.createObjectURL(downloadBlob);
      
      set({
        progress: 100,
        downloadUrl: url,
        alertOpen: true,
        alertMessage: 'Task submitted successfully! You can now download the result.',
        alertSeverity: 'success',
      });
    } catch (error) {
      set({
        alertOpen: true,
        alertMessage: `Error submitting task: ${(error as Error).message}`,
        alertSeverity: 'error',
      });
    } finally {
      set({ isSubmitting: false, progress: 0 });
    }
  },
}));

export default useDesignStore;