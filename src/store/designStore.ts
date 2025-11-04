import { create } from 'zustand';
import ApiService from '../api';
import { CustomProbeType} from '../types';


interface Target {
  target: string;
  sequence?: string;  // Optional sequence field
  [key: string]: string | number | undefined;  // Allow dynamic barcode fields
}

interface DesignState {
  // Basic task info
  taskName: string;
  probeType: string;
  species: string;
  
  // Unified target configuration
  targetList: Target[];
  minLength: number;
  overlap: number;

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
  setProbeType: (type: string) => void;
  setSpecies: (species: string) => void;
  setSelectedCustomType: (type: CustomProbeType | null) => void;
  
  // Unified target actions
  setTargetList: (list: Target[]) => void;
  addTarget: () => void;
  removeTarget: (index: number) => void;
  updateTarget: (index: number, field: keyof Target, value: string | number) => void;
  setMinLength: (length: number) => void;
  setOverlap: (overlap: number) => void;
  
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
  probeType: '',
  species: '',
  targetList: [{ target: '', sequence: '' }],
  minLength: 40,
  overlap: 20,
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
  
  // Unified target setters
  setTargetList: (list) => set({ targetList: list }),
  addTarget: () => set((state) => ({
    targetList: [...state.targetList, { target: '', sequence: '' }],
  })),
  removeTarget: (index) => set((state) => ({
    targetList: state.targetList.filter((_, i) => i !== index),
  })),
  updateTarget: (index, field, value) => set((state) => ({
    targetList: state.targetList.map((target, i) =>
      i === index ? { ...target, [field]: value } : target
    ),
  })),
  setMinLength: (length) => set({ minLength: length }),
  setOverlap: (overlap) => set({ overlap }),
  
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
