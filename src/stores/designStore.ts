import { create } from 'zustand';
import axios from 'axios';


interface Gene {
  gene: string;
  barcode1: string;
  barcode2: string;
}

interface Pool {
  name: string;
  location: string;
  numbers: number;
  density: number;
}

interface DesignState {
  // Basic task info
  taskName: string;
  probeType: 'RCA' | 'DNA-FISH';
  species: string;

  // RCA parameters
  geneList: Gene[];
  minLength: number;
  overlap: number;
  partLengths: { part1: number; part2: number; part3: number };

  // DNA-FISH parameters
  dnaFishParams: {
    length: number;
    overlap: number;
    poolList: Pool[];
  };

  // Post processing
  filters: Array<{ type: string; value: any }>;
  sorts: Array<{ type: string; order: '↑' | '↓' }>;
  removeOverlap: number;

  // Global options
  speciesOptions: string[];
  barcodeOptions: string[];

  // Task submission
  isSubmitting: boolean;
  progress: number;
  downloadUrl: string | null;

  // Alerts
  alertOpen: boolean;
  alertMessage: string;
  alertSeverity: 'success' | 'error';

  // Actions
  setTaskName: (name: string) => void;
  setProbeType: (type: 'RCA' | 'DNA-FISH') => void;
  setSpecies: (species: string) => void;

  // RCA actions
  setGeneList: (geneList: Gene[]) => void;
  addGeneRow: () => void;
  removeGeneRow: (index: number) => void;

  // DNA-FISH actions
  setDnaFishParams: (params: {
    length: number;
    overlap: number;
    poolList: Pool[];
  }) => void;
  addPoolRow: () => void;
  removePoolRow: (index: number) => void;

  // Global options actions
  fetchSpeciesOptions: () => Promise<void>;
  fetchBarcodeOptions: () => Promise<void>;

  // Task submission actions
  submitTask: () => Promise<void>;

  // Alerts actions
  setAlert: (open: boolean, message: string, severity: 'success' | 'error') => void;

  // Reset
  reset: () => void;
}

const useDesignStore = create<DesignState>((set, get) => ({
  // Initial state
  taskName: '',
  probeType: 'RCA',
  species: '',
  geneList: [{ gene: '', barcode1: '', barcode2: '' }],
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
  speciesOptions: [],
  barcodeOptions: [],
  isSubmitting: false,
  progress: 0,
  downloadUrl: null,
  alertOpen: false,
  alertMessage: '',
  alertSeverity: 'success',

  // Actions
  setTaskName: (name) => set({ taskName: name }),
  setProbeType: (type) => set({ probeType: type }),
  setSpecies: (species) => set({ species }),

  setGeneList: (geneList) => set({ geneList }),
  addGeneRow: () => {
    const updatedGeneList = [...get().geneList, { gene: '', barcode1: '', barcode2: '' }];
    set({ geneList: updatedGeneList });
  },
  removeGeneRow: (index) => {
    const updatedGeneList = [...get().geneList];
    updatedGeneList.splice(index, 1);
    set({ geneList: updatedGeneList });
  },

  setDnaFishParams: (params) => set({ dnaFishParams: params }),
  addPoolRow: () => {
    const updatedPoolList = [...get().dnaFishParams.poolList, { name: '', location: '', numbers: 0, density: 0 }];
    set({ dnaFishParams: { ...get().dnaFishParams, poolList: updatedPoolList } });
  },
  removePoolRow: (index) => {
    const updatedPoolList = [...get().dnaFishParams.poolList];
    updatedPoolList.splice(index, 1);
    set({ dnaFishParams: { ...get().dnaFishParams, poolList: updatedPoolList } });
  },

  fetchSpeciesOptions: async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8123/genomes");
      set({ speciesOptions: response.data });
    } catch (error) {
      console.error("Error fetching species options:", error);
    }
  },
  fetchBarcodeOptions: async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8123/workflow/barcodes_list");
      set({ barcodeOptions: response.data });
    } catch (error) {
      console.error("Error fetching barcode options:", error);
    }
  },

  submitTask: async () => {
    const { taskName, probeType, species, geneList, dnaFishParams, setAlert, setIsSubmitting, setProgress, setDownloadUrl } = get();

    if (!taskName || !probeType || !species || (
      probeType === 'RCA' && geneList.some(gene => !gene.gene)
    ) || (
      probeType === 'DNA-FISH' && dnaFishParams.poolList.some(pool => 
        !pool.name || !pool.location || pool.numbers === 0 || pool.density === 0
      )
    )) {
      setAlert(true, "Please fill in all required fields before submitting.", "error");
      return;
    }

    setIsSubmitting(true);
    setProgress(30);

    try {
      const yamlContent = {}; // Generate YAML content here
      const yamlString = JSON.stringify(yamlContent); // Convert to string
      const blob = new Blob([yamlString], { type: 'text/yaml' });

      const formData = new FormData();
      formData.append("file", blob, "workflow.yaml");

      const apiUrl = probeType === 'RCA'
        ? "http://127.0.0.1:8123/workflow/design_rca"
        : "http://127.0.0.1:8123/workflow/design_dnafish";

      setProgress(60);

      const response = await axios.post(apiUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
      });

      setProgress(90);

      const fileData = response.data;
      const downloadBlob = new Blob([fileData], { type: 'application/zip' });
      const url = URL.createObjectURL(downloadBlob);
      setDownloadUrl(url);

      setProgress(100);
      setAlert(true, "Task submitted successfully! You can now download the result.", "success");
    } catch (error) {
      setAlert(true, "Error submitting task: " + (error as Error).message, "error");
    } finally {
      setIsSubmitting(false);
      setProgress(0);
    }
  },

  setAlert: (open, message, severity) => set({ alertOpen: open, alertMessage: message, alertSeverity: severity }),

  reset: () => set({
    taskName: '',
    probeType: 'RCA',
    species: '',
    geneList: [{ gene: '', barcode1: '', barcode2: '' }],
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
    speciesOptions: [],
    barcodeOptions: [],
    isSubmitting: false,
    progress: 0,
    downloadUrl: null,
    alertOpen: false,
    alertMessage: '',
    alertSeverity: 'success',
  }),
}));

export default useDesignStore;