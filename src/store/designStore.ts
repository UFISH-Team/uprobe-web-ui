import { create } from 'zustand';
import ApiService from '../api';
import { CustomProbeType } from '../types';

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
  setDownloadUrl: (url) => set({ downloadUrl: url }),
  setAlert: (open, message, severity) => set({
    alertOpen: open,
    alertMessage: message,
    alertSeverity: severity,
  }),
  navigateToJobs: () => {
    const jobStore = (require('./jobStore')).default;
    jobStore.getState().setPanel("job");
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
      
      set({ isSubmitting: true, progress: 30 });
      
      
      const yamlContent = {
        name: state.taskName,
        probetype: state.probeType,
        genome: state.species,
        targets: state.probeType !== 'DNA-FISH' ? state.geneList.map((gene: Gene) => gene.gene) : undefined,
        barcode_set: '',
        extracts: {
          target_region: {
            source: 'targets',
            length: state.minLength,
            overlap: state.overlap
          },
        },  
        ...(state.probeType === 'RCA' && {
          encoding: state.geneList.reduce((acc: { [key: string]: { barcode1: string; barcode2: string } }, item: Gene) => {
            acc[item.gene] = {
              barcode1: item.barcode1 || '',
              barcode2: item.barcode2 || '',
            };
            return acc;
          }, {} as { [key: string]: { barcode1: string; barcode2: string } }),
          probes: {
            circle_probe: {
              template: '{part1}{part2}N{part3}',
              parts: {
                part1: { length: state.partLengths.part1, source: 'target_region[0:length]' },
                part2: { length: state.partLengths.part2, source: 'target_region[len(part1):len(part1)+length]' },
                part3: { length: state.partLengths.part3, source: 'target_region[-length:]' },
              },
            },
            amp_probe: {
              template: "{part1}N{part2}",
              parts: {
                part1: { expr: "rc(circle_probe.part2.barcode2)" },
                part2: { expr: "rc(target_region[-self.length:])" },
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
          pool_list: state.dnaFishParams.poolList.map((pool: Pool) => ({
            name: pool.name,
            location: pool.location,
            numbers: pool.numbers,
            density: pool.density,
          })),
        }),
        ...(state.probeType !== 'RCA' && state.probeType !== 'DNA-FISH' && {
          encoding: state.geneList.reduce((acc: { [key: string]: { [key: string]: string } }, item: Gene) => {
            // Create an object with all barcodes for this gene
            const barcodes: { [key: string]: string } = {};
            // Add all barcodes from the gene object (excluding the gene name itself)
            Object.entries(item).forEach(([key, value]) => {
              if (key !== 'gene' && value) {
                barcodes[key] = value;
              }
            });
            acc[item.gene] = barcodes;
            return acc;
          }, {} as { [key: string]: { [key: string]: string } }),
          ...(state.selectedCustomType?.yamlContent 
            ? (() => {
                try {
                  const yaml = require('js-yaml');
                  const parsed = yaml.load(state.selectedCustomType.yamlContent);
                  return parsed || {};
                } catch (e) {
                  console.error('Error parsing YAML for custom probe type:', e);
                  return {};
                }
              })()
            : {}),
        }),
      };
      
      set({ progress: 60 });
      
      // Submit to API
      const response = await (state.probeType === 'RCA' 
        ? ApiService.designRCA(yamlContent)
        : state.probeType === 'DNA-FISH'
          ? ApiService.designDNAFISH(yamlContent)
          : ApiService.designUProbe(yamlContent));
      
      // Create a job entry
      const jobData = {
        name: state.taskName,
        job_type: state.probeType,
        status: 'running',
        description: `${state.probeType} design for ${state.species}`,
        parameters: yamlContent
      };
      
      // Create job in the system
      await ApiService.createJob(jobData);
      
      // Refresh job list to show the new job
      const jobStore = (await import('./jobStore')).default;
      jobStore.getState().refreshJobs();
      
      set({ progress: 90 });
      
      // Create download URL
      const downloadBlob = new Blob([response], { type: 'application/zip' });
      const url = URL.createObjectURL(downloadBlob);
      
      set({
        progress: 100,
        downloadUrl: url,
        alertOpen: true,
        alertMessage: 'Task submitted successfully! You can now download the result and view it in the Jobs panel.',
        alertSeverity: 'success',
      });

      // Navigate to Jobs panel after a short delay to allow the user to see the success message
      setTimeout(() => {
        get().navigateToJobs();
      }, 2000);
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