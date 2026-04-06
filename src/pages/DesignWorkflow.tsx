import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Snackbar, 
  Alert, 
  TextField, 
  Box, 
  Typography, 
  Button, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl, 
  Grid, 
  Divider, 
  IconButton, 
  LinearProgress, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  List, 
  ListItem, 
  ListItemText,
  ListItemSecondaryAction,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  DialogActions,
  Tooltip,
  FormHelperText,
  CircularProgress,
  Switch,
  FormControlLabel,
  Paper,
  Stack,
  Container
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DownloadIcon from '@mui/icons-material/Download';
import Papa from 'papaparse';
import useDesignStore from '../store/designStore';
import ApiService from '../api';
import { CustomProbeType, extractParametersFromYaml } from '../types';

import YAML from 'yaml';


interface AttributeValue {
  name: string;
  min?: number;
  max?: number;
  threshold?: number;
  kmer_len?: number;
  aligner?: 'blast' | 'bowtie2' | 'mmseqs2' | 'jellyfish';
  enabled: boolean;
}

interface SortOption {
  category: string;
  field: string;
  order: 'asc' | 'desc';
}

interface SortField {
  value: string;
  label: string;
}

interface SortCategory {
  category: string;
  icon: string;
  fields: SortField[];
}

interface Target {
  target: string;
  sequence?: string;  // Optional sequence field
  [key: string]: string | number | undefined;  // Allow dynamic barcode fields
}

// Helper function to get probe type (DNA/RNA)
const getProbeType = (customType?: CustomProbeType | null): 'DNA' | 'RNA' => {
  if (!customType) return 'RNA'; // Default for built-in types
  
  const probeSource = customType.targetConfig?.source;
  return probeSource === 'genome' ? 'DNA' : 'RNA';
};

const DesignWorkflow: React.FC = () => {
  const [speciesOptions, setSpeciesOptions] = useState<string[]>([]);
  const [barcodeOptions, setBarcodeOptions] = useState<string[]>([]);

  // Helper functions to format probe and part names for display
  const formatProbeName = (probeName: string): string => {
    // Convert "probe_1" to "Probe_1", "probe_2" to "Probe_2", etc.
    if (probeName.startsWith('probe_')) {
      return probeName.replace('probe_', 'Probe_');
    }
    // Handle pure numbers like "0", "1", "2" -> "Probe_1", "Probe_2", "Probe_3"
    if (/^\d+$/.test(probeName)) {
      return `Probe_${parseInt(probeName) + 1}`;
    }
    return probeName;
  };


  const formatPartName = (partName: string): string => {
    // Convert "part1" to "Part_1", "part2" to "Part_2", etc.
    const match = partName.match(/^part(\d+)$/);
    if (match) {
      return `Part_${match[1]}`;
    }
    // Handle pure numbers like "0", "1", "2" -> "Part_1", "Part_2", "Part_3"
    if (/^\d+$/.test(partName)) {
      return `Part_${parseInt(partName) + 1}`;
    }
    return partName;
  };

  const [customProbeTypes, setCustomProbeTypes] = useState<CustomProbeType[]>([]);
  const [builtinProbeTypes, setBuiltinProbeTypes] = useState<CustomProbeType[]>([]);
  const [isLoadingCustomTypes, setIsLoadingCustomTypes] = useState(true);
  const [showCustomProbeTypes, setShowCustomProbeTypes] = useState(false);
  const [expandedProbes, setExpandedProbes] = useState<Record<string, boolean>>({});

  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    taskName: true,
    species: true,
    probeType: true,
    targetParams: true,
    geneMap: true
  });
  const [showAttributeDialog, setShowAttributeDialog] = useState(false);
  const [showEditAttributeDialog, setShowEditAttributeDialog] = useState(false);

  const [currentAttributeType, setCurrentAttributeType] = useState<'target' | 'probe' | 'part'>('target');
  const [currentProbeName, setCurrentProbeName] = useState<string>('');
  const [currentPartName, setCurrentPartName] = useState<string>('');
  const [editingAttribute, setEditingAttribute] = useState<AttributeValue | null>(null);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [showPostProcess, setShowPostProcess] = useState(true);
  const [overlapThreshold, setOverlapThreshold] = useState(0);
  const [barcodeFromFile, setBarcodeFromFile] = useState<{[key: string]: boolean}>({});
  
  // Post-processing feature states
  const [enableBasicFilter, setEnableBasicFilter] = useState(true);
  const [enableAvoidOtp, setEnableAvoidOtp] = useState(false);
  const [enableEqualSpace, setEnableEqualSpace] = useState(false);
  const [enableRemoveOverlap, setEnableRemoveOverlap] = useState(true);
  const [enableSorting, setEnableSorting] = useState(true);
  
  // avoid_otp configuration interface
  interface AvoidOtpConfig {
    [targetName: string]: {
      target_regions: string;
      density_thresh: number;
    };
  }
  const [avoidOtpConfig, setAvoidOtpConfig] = useState<AvoidOtpConfig>({});
  
  // equal_space configuration interface
  interface EqualSpaceConfig {
    [targetName: string]: {
      number_desired: number;
    };
  }
  const [equalSpaceConfig, setEqualSpaceConfig] = useState<EqualSpaceConfig>({});
  
  // Helper function to check if current probe type is DNA
  const isCurrentProbeDna = (): boolean => {
    return selectedCustomType ? getProbeType(selectedCustomType) === 'DNA' : false;
  };
  
  // Helper function to check if OTP and Equal Space should be enabled for current probe type
  const shouldEnableDnaFeatures = (): boolean => {
    return isCurrentProbeDna();
  };
  
  // Helper function: get current target list
  const getCurrentTargets = () => {
    return targetList.map(item => item.target).filter(target => target.trim() !== '');
  };
  
  // Helper function: initialize avoid_otp configuration
  const initializeAvoidOtpConfig = () => {
    const targets = getCurrentTargets();
    const newConfig: AvoidOtpConfig = {};
    targets.forEach(target => {
      if (!avoidOtpConfig[target]) {
        newConfig[target] = {
          target_regions: target, // Default to target name
          density_thresh: 1e-5
        };
      } else {
        newConfig[target] = avoidOtpConfig[target];
      }
    });
    setAvoidOtpConfig(newConfig);
  };
  
  // Helper function: initialize equal_space configuration
  const initializeEqualSpaceConfig = () => {
    const targets = getCurrentTargets();
    const newConfig: EqualSpaceConfig = {};
    targets.forEach(target => {
      if (!equalSpaceConfig[target]) {
        newConfig[target] = {
          number_desired: 1000
        };
      } else {
        newConfig[target] = equalSpaceConfig[target];
      }
    });
    setEqualSpaceConfig(newConfig);
  };
  
  // New states for barcode modes
  interface BarcodeMode {
    [key: string]: 'builtin' | 'auto' | 'manual' | 'file';
  }
  const [barcodeModes, setBarcodeModes] = useState<BarcodeMode>({});
  

  // Function to validate barcode length
  const validateBarcodeLength = (barcode: string, expectedLength: number): boolean => {
    return barcode.length === expectedLength;
  };

  // Function to auto-generate barcode based on config with length validation
  const generateBarcode = async (barcodeIndex: number, generationType: 'quick' | 'pcr' | 'sequencing' = 'quick'): Promise<string> => {
    let expectedLength = 12; // Default fallback
    let barcodeType = 'default';
    
    if (selectedCustomType?.barcodeConfig) {
      const config = selectedCustomType.barcodeConfig;
      
      // Try to get specific barcode from config
      const barcodeKey = `barcode${barcodeIndex + 1}`;
      if (config.barcodes && config.barcodes[barcodeKey]) {
        const barcodeConfig = config.barcodes[barcodeKey];
        expectedLength = barcodeConfig.length || config.default_length || 12;
        barcodeType = barcodeConfig.name || barcodeType;
      } else {
        expectedLength = config.default_length || 12;
      }
    }

    try {

      let generatedBarcode = '';
      
      // Call appropriate API based on generation type
      switch (generationType) {
        case 'quick':
          const quickResult = await ApiService.generateQuickBarcode({
            num_barcodes: 1,
            length: expectedLength,
            alphabet: 'ACTG',
            rc_free: true,
            gc_limits: [40, 60]
          });
          generatedBarcode = quickResult[0];
          break;
          
        case 'pcr':
          const pcrResult = await ApiService.generatePcrBarcode({
            num_barcodes: 1,
            length: expectedLength
          });
          generatedBarcode = pcrResult[0];
          break;
          
        case 'sequencing':
          const seqResult = await ApiService.generateSequencingBarcode({
            num_barcodes: 1,
            length: expectedLength
          });
          generatedBarcode = seqResult[0];
          break;
          
        default:
          throw new Error(`Unsupported generation type: ${generationType}`);
      }

      // Validate barcode length
      if (!validateBarcodeLength(generatedBarcode, expectedLength)) {
        throw new Error(`Generated barcode length (${generatedBarcode.length}) does not match expected length (${expectedLength})`);
      }

      return generatedBarcode;
    } catch (error) {
      console.error('Failed to generate barcode via API:', error);
      
      // Show error to user with option to retry
      setAlert(true, `Barcode generation failed: ${error instanceof Error ? error.message : String(error)}。Please regenerate or input manually。`, 'error');
      
      // Fallback to local generation if API fails
      const bases = ['A', 'T', 'G', 'C'];
      // Use the same expectedLength calculation as above for consistency
      let fallbackLength = expectedLength;
      let sequence = '';
      for (let i = 0; i < fallbackLength; i++) {
        sequence += bases[Math.floor(Math.random() * bases.length)];
      }
      
      // Validate fallback barcode
      if (!validateBarcodeLength(sequence, fallbackLength)) {
        setAlert(true, `Fallback barcode length validation failed. Please manually enter barcode of length ${fallbackLength}.`, 'error');
        return '';
      }
      
      return sequence;
    }
  };

  // Add loading state for barcode generation
  const [generatingBarcodes, setGeneratingBarcodes] = useState<{[key: string]: boolean}>({});

  // Function to handle barcode mode change
  const handleBarcodeModeChange = async (barcodeKey: string, mode: 'builtin' | 'auto' | 'manual' | 'file') => {
    setBarcodeModes(prev => ({ ...prev, [barcodeKey]: mode }));
    
  };


  // Function to generate barcodes for all targets
  const generateBarcodesForAllTargets = async (barcodeKey: string) => {
    const loadingKey = `target_all_${barcodeKey}`;
    setGeneratingBarcodes(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      const barcodeIndex = parseInt(barcodeKey.replace('barcode', '')) - 1;
      const targetsNeedingBarcodes = targetList; // Generate for all targets, including empty ones
      
      if (targetsNeedingBarcodes.length === 0) {
        setAlert(true, 'No targets found', 'error');
        return;
      }
      
      // Get expected length for this barcode type
      let expectedLength = 12; // Default fallback
      if (selectedCustomType?.barcodeConfig) {
        const config = selectedCustomType.barcodeConfig;
        const barcodeConfigKey = `barcode${barcodeIndex + 1}`;
        if (config.barcodes && config.barcodes[barcodeConfigKey]) {
          expectedLength = config.barcodes[barcodeConfigKey].length || config.default_length || 12;
        } else {
          expectedLength = config.default_length || 12;
        }
      }
      
      let generatedBarcodes: string[] = [];
      
      try {
        // Use quick generation by default
        const quickResult = await ApiService.generateQuickBarcode({
          num_barcodes: targetsNeedingBarcodes.length,
          length: expectedLength,
          alphabet: 'ACTG',
          rc_free: true,
          gc_limits: [40, 60]
        });
        generatedBarcodes = quickResult;
      } catch (apiError) {
        console.warn('API barcode generation failed, falling back to local generation:', apiError);
        
        // Fallback to local generation
        const bases = ['A', 'T', 'G', 'C'];
        generatedBarcodes = [];
        
        for (let i = 0; i < targetsNeedingBarcodes.length; i++) {
          let sequence = '';
          for (let j = 0; j < expectedLength; j++) {
            sequence += bases[Math.floor(Math.random() * bases.length)];
          }
          generatedBarcodes.push(sequence);
        }
        
        // Don't show alert here, we'll show it at the end
      }
      
      if (generatedBarcodes.length !== targetsNeedingBarcodes.length) {
        throw new Error(`Expected ${targetsNeedingBarcodes.length} barcodes, but got ${generatedBarcodes.length}`);
      }
      
      // Validate all generated barcodes
      const invalidBarcodes = generatedBarcodes.filter(barcode => !validateBarcodeLength(barcode, expectedLength));
      if (invalidBarcodes.length > 0) {
        throw new Error(`${invalidBarcodes.length} generated barcodes have incorrect length`);
      }
      
      // Assign unique barcodes to all targets
      const updatedTargetList = targetList.map((target, index) => ({
        ...target,
        [barcodeKey]: generatedBarcodes[index]
      }));
      
      setTargetList(updatedTargetList);
      
      // Show appropriate success message
      if (generatedBarcodes.length > 0) {
        setAlert(true, `Successfully generated ${targetList.length} unique barcodes for all targets`, 'success');
      }
      
    } catch (error) {
      console.error('Failed to generate barcodes:', error);
      setAlert(true, `Batch barcode generation failed: ${error instanceof Error ? error.message : String(error)}. Please try again or generate individually.`, 'error');
    } finally {
      setGeneratingBarcodes(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Function to auto-generate barcode for specific item
  const autoGenerateBarcodeForItem = async (itemIndex: number, barcodeKey: string) => {
    const loadingKey = `target_${itemIndex}_${barcodeKey}`;
    setGeneratingBarcodes(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      const barcodeIndex = parseInt(barcodeKey.replace('barcode', '')) - 1;
      const newBarcode = await generateBarcode(barcodeIndex, 'quick');
      
      if (newBarcode) {
        updateTarget(itemIndex, barcodeKey as keyof Target, newBarcode);
        setAlert(true, 'Barcode generated successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to generate barcode:', error);
      setAlert(true, `Barcode generated failed. Please try again or manually input.`, 'error');
    } finally {
      setGeneratingBarcodes(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Function to validate manual barcode input
  const validateManualBarcode = (barcode: string, barcodeKey: string): boolean => {
    if (!selectedCustomType?.barcodeConfig) return true;
    
    const config = selectedCustomType.barcodeConfig;
    
    let expectedLength = config.default_length || 12;
    if (config.barcodes && config.barcodes[barcodeKey]) {
      expectedLength = config.barcodes[barcodeKey].length || expectedLength;
    }
    
    return validateBarcodeLength(barcode, expectedLength);
  };

  // Function to handle manual barcode input with validation
  const handleManualBarcodeInput = (itemIndex: number, barcodeKey: string, value: string) => {
    const isValid = validateManualBarcode(value, barcodeKey);
    
    if (!isValid && value.length > 0) {
      const expectedLength = getExpectedBarcodeLength(barcodeKey);
      setAlert(true, `Barcode length mismatch. Expected length: ${expectedLength}, actual length: ${value.length}`, 'error');
    }
    
    updateTarget(itemIndex, barcodeKey as keyof Target, value);
  };

  // Helper function to get expected barcode length
  const getExpectedBarcodeLength = (barcodeKey: string): number => {
    if (!selectedCustomType?.barcodeConfig) return 12;
    
    const config = selectedCustomType.barcodeConfig;
    if (config.barcodes && config.barcodes[barcodeKey]) {
      return config.barcodes[barcodeKey].length || config.default_length || 12;
    }
    return config.default_length || 12;
  };

  const {
    // State
    taskName,
    probeType,
    species,
    targetList,
    minLength,
    overlap,
    selectedCustomType,
    isSubmitting,
    progress,
    alertOpen,
    alertMessage,
    alertSeverity,
    
    // Actions
    setTaskName,
    setProbeType,
    setSpecies,
    setTargetList,
    addTarget,
    removeTarget,
    updateTarget,
    setMinLength,
    setOverlap,
    setSelectedCustomType,
    setAlert,
    setSubmitting,
    setProgress,
  } = useDesignStore();

  const navigate = useNavigate();




  // Fetch species options on mount
  useEffect(() => {
    const fetchSpeciesOptions = async () => {
      try {
        const speciesResponse = await ApiService.getSpeciesOptions();
        setSpeciesOptions(speciesResponse);
      } catch (error) {
        console.error('Error fetching species options:', error);
      }
    };
    fetchSpeciesOptions();
  }, []);

  // Fetch barcode options on mount
  useEffect(() => {
    const fetchBarcodeOptions = async () => {
      try {
        const barcodeResponse = await ApiService.getBarcodeOptions();
        setBarcodeOptions(barcodeResponse);
      } catch (error) {
        console.error('Error fetching barcode options:', error);
      }
    };
    fetchBarcodeOptions();
  }, []);

  const loadCustomProbeTypes = async () => {
    setIsLoadingCustomTypes(true);
    try {
      // Load custom types from API
      const savedGroups = await ApiService.getCustomProbes();
      const customTypes = savedGroups
        .filter((group: any) => group.type === 'custom')
        .map((group: any) => {
          const parameters = extractParametersFromYaml(group.yamlContent);
          
          let targetConfig: any = undefined;
          if (parameters?.target_sequence) {
            targetConfig = {
              source: parameters.target_sequence.source,
              sequence: parameters.target_sequence.sequence,
              length: parameters.target_sequence.length,
              attributes: parameters.target_sequence.attributes || {}
            };
          }

          return {
            id: group.id,
            name: group.name,
            type: 'custom',
            yamlContent: group.yamlContent,
            createdAt: new Date(group.createdAt),
            updatedAt: new Date(group.updatedAt),
            barcodeCount: group.barcodeCount,
            targetLength: group.targetLength,
            overlap: group.overlap,
            probes: group.probes || {},
            targetConfig: targetConfig,
          };
        });
      setCustomProbeTypes(customTypes);

      // Load builtin types from API
      try {
        const builtinData = await ApiService.getBuiltinProbes();
        const builtinTypes: CustomProbeType[] = [];
        
        for (const [name, config] of Object.entries(builtinData)) {
          const typedConfig = config as any;
          
          // Parse target config
          const targetLength = typedConfig.extracts?.target_region?.length || 100;
          const overlap = typedConfig.extracts?.target_region?.overlap || 20;
          const source = typedConfig.extracts?.target_region?.source || 'exon';
          
          const targetConfig: any = {
            source: source,
            sequence: '',
            length: targetLength,
            attributes: {}
          };
          
          // Parse probes
          const probes = JSON.parse(JSON.stringify(typedConfig.probes || {}));
          
          // Parse attributes and distribute them
          const attributes = JSON.parse(JSON.stringify(typedConfig.attributes || {}));
          
          // Parse post_process filters to extract min/max values
          const filters = typedConfig.post_process?.filters || {};
          const filterValues: Record<string, {min?: number, max?: number}> = {};
          
          for (const [filterKey, filterVal] of Object.entries(filters)) {
            const condition = (filterVal as any).condition;
            if (typeof condition === 'string') {
              const minMatch = condition.match(/>=\s*([\d.-]+)/);
              const maxMatch = condition.match(/<=\s*([\d.-]+)/);
              
              if (!filterValues[filterKey]) filterValues[filterKey] = {};
              if (minMatch) filterValues[filterKey].min = parseFloat(minMatch[1]);
              if (maxMatch) filterValues[filterKey].max = parseFloat(maxMatch[1]);
              
              // Special handling for gcContent which might be in decimals (0.2-0.9) while UI expects percentages (20-90)
              if (filterKey.toLowerCase().includes('gccontent')) {
                if (filterValues[filterKey].min !== undefined && filterValues[filterKey].min! <= 1) {
                  filterValues[filterKey].min = filterValues[filterKey].min! * 100;
                }
                if (filterValues[filterKey].max !== undefined && filterValues[filterKey].max! <= 1) {
                  filterValues[filterKey].max = filterValues[filterKey].max! * 100;
                }
              }
            }
          }
          
          const defaultValues: Record<string, Partial<AttributeValue>> = {
            gcContent: { min: 40, max: 60, enabled: true },
            foldScore: { max: 40, enabled: true },
            tm: { min: 60, max: 75, enabled: true },
            selfMatch: { max: 4, enabled: true },
            mappedGenes: { max: 5, aligner: 'bowtie2', enabled: true },
            kmerCount: { kmer_len: 35, aligner: 'jellyfish', enabled: true },
            mappedSites: { aligner: 'bowtie2', enabled: true }
          };

          const typeToNameMapping: Record<string, string> = {
            'gc_content': 'gcContent',
            'fold_score': 'foldScore',
            'annealing_temperature': 'tm',
            'self_match': 'selfMatch',
            'mapped_genes': 'mappedGenes',
            'kmer_count': 'kmerCount',
            'mapped_sites': 'mappedSites'
          };

          for (const [attrKey, attrVal] of Object.entries(attributes)) {
            const typedAttrVal = attrVal as any;
            const target = typedAttrVal.target;
            const attrType = typedAttrVal.type;
            const uiAttrName = typeToNameMapping[attrType] || attrType;
            
            const attrObj = {
              ...defaultValues[uiAttrName],
              ...typedAttrVal,
              ...filterValues[attrKey],
              enabled: true
            };
            delete attrObj.target;
            delete attrObj.type;

            if (target === 'target_region') {
              targetConfig.attributes[uiAttrName] = attrObj;
            } else if (target.includes('.')) {
              // Part attribute (e.g. mRNA.part1)
              const [probeName, partName] = target.split('.');
              if (probes[probeName] && probes[probeName].parts && probes[probeName].parts[partName]) {
                if (!probes[probeName].parts[partName].attributes) {
                  probes[probeName].parts[partName].attributes = {};
                }
                probes[probeName].parts[partName].attributes[uiAttrName] = attrObj;
              }
            } else {
              // Probe attribute (e.g. pad_probe)
              if (probes[target]) {
                if (!probes[target].attributes) {
                  probes[target].attributes = {};
                }
                probes[target].attributes[uiAttrName] = attrObj;
              }
            }
          }

          // Calculate barcode count
          let barcodeCount = 0;
          const barcodeSet = new Set<string>();
          
          const findBarcodes = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            
            if (obj.expr && typeof obj.expr === 'string' && obj.expr.includes('encoding')) {
              const barcodeMatch = obj.expr.match(/\['([^']+)'\]/);
              if (barcodeMatch) {
                barcodeSet.add(barcodeMatch[1]);
              }
            }
            
            if (obj.parts) {
              Object.values(obj.parts).forEach(part => findBarcodes(part));
            }
          };

          Object.values(probes).forEach((probe: any) => {
            findBarcodes(probe);
          });
          
          barcodeCount = barcodeSet.size;

          // Generate dummy YAML content for submission compatibility
          const yamlObj = {
            name: name,
            extracts: typedConfig.extracts,
            probes: typedConfig.probes,
            attributes: typedConfig.attributes
          };
          const yamlContent = YAML.stringify(yamlObj);

          builtinTypes.push({
            id: `builtin_${name}`,
            name: name,
            type: 'builtin',
            yamlContent: yamlContent,
            createdAt: new Date(),
            updatedAt: new Date(),
            barcodeCount: barcodeCount,
            targetLength: targetLength,
            overlap: overlap,
            probes: probes,
            targetConfig: targetConfig,
          });
        }
        setBuiltinProbeTypes(builtinTypes);
      } catch (err) {
        console.error('Error loading builtin probe types:', err);
      }

    } catch (error) {
      console.error('Error loading custom probe types:', error);
    } finally {
      setIsLoadingCustomTypes(false);
    }
  };

  // Add this useEffect to load custom probe types
  useEffect(() => {
    loadCustomProbeTypes();
  }, []);

  // Add a new useEffect to handle probe type selection when custom types are loaded
  useEffect(() => {
    if (!isLoadingCustomTypes && probeType) {
      const allTypes = [...builtinProbeTypes, ...customProbeTypes];
      const customType = allTypes.find(t => t.name === probeType);
      if (customType) {
        if (customType.type === 'builtin') {
          setSelectedCustomType(customType);
          if (customType.targetLength) setMinLength(customType.targetLength);
          if (customType.overlap) setOverlap(customType.overlap);
        } else {
          const parameters = extractParametersFromYaml(customType.yamlContent);
          console.log('Debug - UseEffect - Extracted parameters:', parameters);
          
        // Helper to enable attributes
        const enableAttributes = (attrs: any) => {
          if (!attrs) return attrs;
          const enabledAttrs: any = {};
          for (const [key, val] of Object.entries(attrs)) {
            enabledAttrs[key] = { ...(val as any), enabled: true };
          }
          return enabledAttrs;
        };

        let targetConfig = null;
        if (parameters?.target_sequence) {
          targetConfig = {
            source: parameters.target_sequence.source,
            sequence: parameters.target_sequence.sequence,
            length: parameters.target_sequence.length,
            attributes: enableAttributes(parameters.target_sequence.attributes)
          };
        }
        
        const probes = parameters?.probes || customType.probes || {};
        const enabledProbes: any = {};
        for (const [probeName, probe] of Object.entries(probes)) {
          enabledProbes[probeName] = { ...probe as any };
          if ((probe as any).attributes) {
            enabledProbes[probeName].attributes = enableAttributes((probe as any).attributes);
          }
          if ((probe as any).parts) {
            enabledProbes[probeName].parts = {};
            for (const [partName, part] of Object.entries((probe as any).parts)) {
              enabledProbes[probeName].parts[partName] = { ...part as any };
              if ((part as any).attributes) {
                enabledProbes[probeName].parts[partName].attributes = enableAttributes((part as any).attributes);
              }
            }
          }
        }
        
        const updatedCustomType = {
          ...customType,
          targetLength: parameters?.targetLength || customType.targetLength,
          barcodeCount: parameters?.barcodeCount || parameters?.barcodeConfig?.count || customType.barcodeCount,
          probes: enabledProbes,
          targetConfig: targetConfig || customType.targetConfig,
          barcodeConfig: parameters?.barcodeConfig || customType.barcodeConfig
        };
          
          console.log('Debug - UseEffect - Updated custom type:', updatedCustomType);
          setSelectedCustomType(updatedCustomType);
          
          if (customType.targetLength) {
            setMinLength(customType.targetLength);
          } else if (parameters?.targetLength) {
            setMinLength(parameters.targetLength);
          }
          
          if (parameters?.overlap) {
            setOverlap(parameters.overlap);
          }
        }
      }
    }
  }, [isLoadingCustomTypes, probeType, customProbeTypes, builtinProbeTypes, setMinLength, setOverlap, setSelectedCustomType]);

  useEffect(() => {
    if (selectedCustomType?.probes) {
      const allProbesExpanded: Record<string, boolean> = {};
      for (const probeName of Object.keys(selectedCustomType.probes)) {
        allProbesExpanded[probeName] = true;
      }
      setExpandedProbes(allProbesExpanded);
    }
  }, [selectedCustomType]);

  const handleResetTargetList = () => {
    setTargetList([{ target: '', sequence: '' }]);
    setBarcodeFromFile({});
    setBarcodeModes({});
    setGeneratingBarcodes({});
    setAlert(true, 'Target list has been reset', 'success');
  };

  const handleTargetCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Reset file input
      event.target.value = '';
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true, // 添加此行：自动跳过空行
        complete: (results: Papa.ParseResult<Record<string, string>>) => {
          try {
            if (results.data.length === 0) {
              throw new Error('File is empty');
            }

            // Get all column names from the first row
            const headers = Object.keys(results.data[0]);
            const barcodeColumns = headers.filter(h => h.startsWith('barcode'));
            
            // Update which barcodes are from file
            const newBarcodeFromFile: {[key: string]: boolean} = {};
            const newBarcodeModes: BarcodeMode = {};
            if (selectedCustomType?.barcodeCount) {
              for (let i = 1; i <= selectedCustomType.barcodeCount; i++) {
                const barcodeKey = `barcode${i}`;
                const isFromFile = barcodeColumns.includes(barcodeKey);
                newBarcodeFromFile[barcodeKey] = isFromFile;
                newBarcodeModes[barcodeKey] = isFromFile ? 'file' : 'builtin';
              }
            }
            setBarcodeFromFile(newBarcodeFromFile);
            setBarcodeModes(newBarcodeModes);

            const parsedData = results.data.map((row, index) => {
              // Validate required fields
              if (!row['target']) {
                throw new Error(`Row ${index + 2}: Missing required field 'target'`);
              }

              // Create the target object with target name
              const targetObj: any = { target: row['target'] };
              
              // Add sequence field if exists
              if (row['sequence']) {
                targetObj.sequence = row['sequence'];
              }
              
              // Add barcode fields
              if (selectedCustomType?.barcodeCount) {
                for (let i = 1; i <= selectedCustomType.barcodeCount; i++) {
                  const barcodeKey = `barcode${i}`;
                  // Check if the barcode exists in the file
                  if (barcodeColumns.includes(barcodeKey)) {
                    targetObj[barcodeKey] = row[barcodeKey] || '';
                  } else {
                    targetObj[barcodeKey] = '';
                  }
                }
              }

              return targetObj;
            });
            setTargetList(parsedData);
            setAlert(true, 'Target list uploaded successfully', 'success');
          } catch (error) {
            setAlert(true, error instanceof Error ? error.message : 'Error parsing target list file', 'error');
          }
        },
        error: (error: Error) => {
          setAlert(true, `Error parsing file: ${error.message}`, 'error');
        }
      });
    }
  };



  const handleAlertClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlert(false, '', 'success');
  };

  // Modify the handleProbeTypeSelect function
  const handleProbeTypeSelect = (type: string) => {
    setProbeType(type);
    setShowCustomProbeTypes(false);
    
    // Reset barcode modes when changing probe type
    setBarcodeModes({});
    setBarcodeFromFile({});
    setGeneratingBarcodes({});
    
    // Find custom probe type
    const allTypes = [...builtinProbeTypes, ...customProbeTypes];
    const customType = allTypes.find(t => t.name === type);
    if (customType) {
      if (customType.type === 'builtin') {
        setSelectedCustomType(customType);
        if (customType.targetLength) setMinLength(customType.targetLength);
        if (customType.overlap) setOverlap(customType.overlap);
      } else {
        const parameters = extractParametersFromYaml(customType.yamlContent);
        console.log('Debug - Extracted parameters:', parameters);
        
        // Helper to enable attributes
        const enableAttributes = (attrs: any) => {
          if (!attrs) return attrs;
          const enabledAttrs: any = {};
          for (const [key, val] of Object.entries(attrs)) {
            enabledAttrs[key] = { ...(val as any), enabled: true };
          }
          return enabledAttrs;
        };
        
        let targetConfig = null;
        if (parameters?.target_sequence) {
          targetConfig = {
            source: parameters.target_sequence.source,
            sequence: parameters.target_sequence.sequence,
            length: parameters.target_sequence.length,
            attributes: enableAttributes(parameters.target_sequence.attributes)
          };
        }
        
        const probes = parameters?.probes || customType.probes || {};
        const enabledProbes: any = {};
        for (const [probeName, probe] of Object.entries(probes)) {
          enabledProbes[probeName] = { ...probe as any };
          if ((probe as any).attributes) {
            enabledProbes[probeName].attributes = enableAttributes((probe as any).attributes);
          }
          if ((probe as any).parts) {
            enabledProbes[probeName].parts = {};
            for (const [partName, part] of Object.entries((probe as any).parts)) {
              enabledProbes[probeName].parts[partName] = { ...part as any };
              if ((part as any).attributes) {
                enabledProbes[probeName].parts[partName].attributes = enableAttributes((part as any).attributes);
              }
            }
          }
        }
        
        const updatedCustomType = {
          ...customType,
          targetLength: parameters?.targetLength || customType.targetLength,
          barcodeCount: parameters?.barcodeCount || parameters?.barcodeConfig?.count || customType.barcodeCount,
          probes: enabledProbes,
          targetConfig: targetConfig || customType.targetConfig,
          barcodeConfig: parameters?.barcodeConfig || customType.barcodeConfig
        };
        
        console.log('Debug - Updated custom type:', updatedCustomType);
        setSelectedCustomType(updatedCustomType);
        
        // Set default target length from YAML or custom type
        if (customType.targetLength) {
          setMinLength(customType.targetLength);
        } else if (parameters?.targetLength) {
          setMinLength(parameters.targetLength);
        } else {
          setMinLength(100);
        }
        
        // Set default overlap if specified in YAML
        if (parameters?.overlap) {
          setOverlap(parameters.overlap);
        } else {
          setOverlap(20);
        }
      }
    } else {
      console.log('Debug - Custom type not found');
      setSelectedCustomType(null);
      setMinLength(100);
      setOverlap(20);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Function to handle downloading YAML content
  const handleDownload = (type: CustomProbeType) => {
    const blob = new Blob([type.yamlContent], { type: 'text/yaml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type.name}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Function to handle deleting a custom probe type
  const handleDelete = async (typeId: string) => {
    try {
      await ApiService.deleteCustomProbe(typeId);
      loadCustomProbeTypes();
      setAlert(true, 'Custom probe type deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete custom probe:', error);
      setAlert(true, 'Failed to delete custom probe type', 'error');
    }
  };

  // Add new function to handle attribute editing
  const handleEditAttribute = (attribute: Partial<AttributeValue>) => {
    const updatedAttribute: AttributeValue = {
      name: attribute.name || '',
      min: attribute.min || 0,
      max: attribute.max || 100,
      threshold: attribute.threshold,
      aligner: attribute.aligner as 'blast' | 'bowtie2' | 'mmseqs2' | 'jellyfish' | undefined,
      enabled: true
    };
    setEditingAttribute(updatedAttribute);
    setShowEditAttributeDialog(true);
  };

  // Add new function to save edited attribute
  const handleSaveAttribute = () => {
    if (!editingAttribute) return;

    const updatedType = { ...selectedCustomType };
    if (currentAttributeType === 'target') {
      if (!updatedType.targetConfig) {
        updatedType.targetConfig = {
          source: '',
          sequence: '',
          length: updatedType.targetLength || 0,
          attributes: {}
        };
      }
      if (!updatedType.targetConfig.attributes) {
        updatedType.targetConfig.attributes = {};
      }
      updatedType.targetConfig.attributes[editingAttribute.name] = {
        ...editingAttribute,
        enabled: true
      };
    } else if (currentAttributeType === 'probe') {
      if (!updatedType.probes?.[currentProbeName]?.attributes) {
        if (!updatedType.probes) updatedType.probes = {};
        if (!updatedType.probes[currentProbeName]) updatedType.probes[currentProbeName] = { 
          template: '',
          parts: {} 
        };
        updatedType.probes[currentProbeName].attributes = {};
      }
      updatedType.probes[currentProbeName].attributes![editingAttribute.name] = {
        ...editingAttribute,
        enabled: true
      };
    } else if (currentAttributeType === 'part') {
      if (!updatedType.probes?.[currentProbeName]?.parts?.[currentPartName]?.attributes) {
        if (!updatedType.probes) updatedType.probes = {};
        if (!updatedType.probes[currentProbeName]) updatedType.probes[currentProbeName] = { 
          template: '',
          parts: {} 
        };
        if (!updatedType.probes[currentProbeName].parts) updatedType.probes[currentProbeName].parts = {};
        if (!updatedType.probes[currentProbeName].parts[currentPartName]) {
          updatedType.probes[currentProbeName].parts[currentPartName] = { 
            expr: '',
            attributes: {} 
          };
        }
        updatedType.probes[currentProbeName].parts[currentPartName].attributes = {};
      }
      updatedType.probes[currentProbeName].parts[currentPartName].attributes![editingAttribute.name] = {
        ...editingAttribute,
        enabled: true
      };
    }

    setSelectedCustomType(updatedType as CustomProbeType);
    setShowEditAttributeDialog(false);
    setEditingAttribute(null);
  };

  // Modify the handleAddAttribute function
  const handleAddAttribute = (attributeId: string) => {
    const defaultValues: Record<string, Partial<AttributeValue>> = {
      gcContent: { min: 40, max: 60, enabled: true },
      foldScore: { max: 40, enabled: true },
      tm: { min: 60, max: 75, enabled: true },
      selfMatch: { max: 4, enabled: true },
      mappedGenes: { max: 5, aligner: 'bowtie2', enabled: true },
      kmerCount: { kmer_len: 35, aligner: 'jellyfish', enabled: true },
      mappedSites: { aligner: 'bowtie2', enabled: true }
    };

    const attributeValue = defaultValues[attributeId];
    setEditingAttribute({
      name: attributeId,
      ...attributeValue,
      enabled: true
    } as AttributeValue);
    setShowAttributeDialog(false);
    setShowEditAttributeDialog(true);
  };



  // Add new function to handle attribute click
  const handleAttributeClick = (probeName: string, partName: string | null, attrName: string, attrValue: any) => {
    setCurrentProbeName(probeName);
    if (partName) {
      setCurrentPartName(partName);
      setCurrentAttributeType('part');
    } else {
      setCurrentAttributeType('probe');
    }
    handleEditAttribute({
      name: attrName,
      ...attrValue
    });
  };

  // Add new function to format attribute value display
  const formatAttributeValue = (attrValue: any) => {
    if (typeof attrValue === 'object') {
      if (attrValue.threshold !== undefined) {
        return `${attrValue.threshold}%`;
      }
      return `${attrValue.min}% <= value <= ${attrValue.max}%`;
    }
    return attrValue;
  };

  // Modify the renderAttributeChip function
  const renderAttributeChip = (probeName: string, partName: string | null, attrName: string, attrValue: any) => {
    if (!attrValue?.enabled) return null;

    const chipKey = partName ? `${probeName}-${partName}-${attrName}` : `${probeName}-${attrName}`;
    
    const handleDelete = () => {
      if (partName) {
        handleDeleteAttribute('part', attrName, probeName, partName);
      } else {
        handleDeleteAttribute('probe', attrName, probeName);
      }
    };

    const chipProps = {
      key: chipKey,
      size: "small" as const,
      variant: "outlined" as const,
      sx: { height: 20, fontSize: '0.7rem', cursor: 'pointer' },
      onClick: () => handleAttributeClick(probeName, partName, attrName, attrValue),
      onDelete: handleDelete
    };

    switch(attrName) {
      case 'gcContent':
      case 'gc_content':
        return (
          <Chip
            {...chipProps}
            label={`GC: ${attrValue.min}%-${attrValue.max}%`}
            color="primary"
          />
        );
      case 'foldScore':
      case 'fold_score':
        return (
          <Chip
            {...chipProps}
            label={`Fold: max ${attrValue.max}`}
            color="secondary"
          />
        );
      case 'tm':
        return (
          <Chip
            {...chipProps}
            label={`Tm: ${attrValue.min}°C-${attrValue.max}°C`}
            color="error"
          />
        );
      case 'selfMatch':
      case 'self_match':
        return (
          <Chip
            {...chipProps}
            label={`Self: max ${attrValue.max}`}
            color="warning"
          />
        );
      case 'mappedGenes':
      case 'mapped_genes':
        return (
          <Chip
            {...chipProps}
            label={`Map: max ${attrValue.max}${attrValue.aligner ? ` (${attrValue.aligner})` : ''}`}
            color="info"
          />
        );
      case 'kmerCount':
      case 'kmer_count':
        return (
          <Chip
            {...chipProps}
            label={`Kmer: ${attrValue.kmer_len}${attrValue.aligner ? ` (${attrValue.aligner})` : ''}`}
            color="success"
          />
        );
      case 'mappedSites':
      case 'mapped_sites':
        return (
          <Chip
            {...chipProps}
            label={`Sites${attrValue.aligner ? ` (${attrValue.aligner})` : ''}`}
            color="info"
          />
        );
      default:
        return null;
    }
  };



  const handleAddSortOption = () => {
    setSortOptions([...sortOptions, { category: '', field: '', order: 'asc' }]);
  };

  const handleRemoveSortOption = (index: number) => {
    const newOptions = [...sortOptions];
    newOptions.splice(index, 1);
    setSortOptions(newOptions);
  };

  const handleSortOptionChange = (index: number, field: string, order: 'asc' | 'desc') => {
    const newOptions = [...sortOptions];
    newOptions[index] = { ...newOptions[index], field, order };
    setSortOptions(newOptions);
  };

  const handleOverlapThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOverlapThreshold(Number(event.target.value));
  };

  const getAvailableSortFields = (): SortCategory[] => {
    if (!selectedCustomType) return [];

    const categories: SortCategory[] = [];
    
    if (selectedCustomType.targetConfig?.attributes) {
      const targetFields: SortField[] = [];
      Object.entries(selectedCustomType.targetConfig.attributes).forEach(([key, value]) => {
        if (value.enabled) {
          const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
          targetFields.push({
            value: `target_${getSnakeCaseAttrName(key)}`,
            label: fieldLabel
          });
        }
      });
      if (targetFields.length > 0) {
        categories.push({
          category: 'Target Sequence',
          icon: '🎯',
          fields: targetFields
        });
      }
    }

    // Add probe attributes
    if (selectedCustomType.probes) {
      const probeFields: SortField[] = [];
      Object.entries(selectedCustomType.probes).forEach(([probeName, probe]) => {
        const formattedProbeName = /^\d+$/.test(probeName) ? `probe${parseInt(probeName) + 1}` : probeName;
        
        if (probe.attributes) {
          Object.entries(probe.attributes).forEach(([key, value]) => {
            if (value.enabled) {
              const fieldLabel = `${formatProbeName(probeName)} - ${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}`;
              probeFields.push({
                value: `${formattedProbeName}_${getSnakeCaseAttrName(key)}`,
                label: fieldLabel
              });
            }
          });
        }
      });
      if (probeFields.length > 0) {
        categories.push({
          category: 'Probe Attributes',
          icon: '🧬',
          fields: probeFields
        });
      }

      // Add probe part attributes
      const partFields: SortField[] = [];
      Object.entries(selectedCustomType.probes).forEach(([probeName, probe]) => {
        const formattedProbeName = /^\d+$/.test(probeName) ? `probe${parseInt(probeName) + 1}` : probeName;
        
        if (probe.parts) {
          Object.entries(probe.parts).forEach(([partName, part]) => {
            const formattedPartName = /^\d+$/.test(partName) ? `part${parseInt(partName) + 1}` : partName;
            
            if (part.attributes) {
              Object.entries(part.attributes).forEach(([key, value]) => {
                if (value.enabled) {
                  const fieldLabel = `${formatProbeName(probeName)} - ${formatPartName(partName)} - ${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}`;
                  partFields.push({
                    value: `${formattedProbeName}_${formattedPartName}_${getSnakeCaseAttrName(key)}`,
                    label: fieldLabel
                  });
                }
              });
            }
          });
        }
      });
      if (partFields.length > 0) {
        categories.push({
          category: 'Part Attributes',
          icon: '🔬',
          fields: partFields
        });
      }
    }

    return categories;
  };

  // when probe type changes, reset sort options
  useEffect(() => {
    setSortOptions([]);
  }, [selectedCustomType]);

  // when probe type changes, update DNA-specific features
  useEffect(() => {
    const isDnaProbe = shouldEnableDnaFeatures();
    if (isDnaProbe) {
      // DNA probe: enable OTP and Equal Space by default
      setEnableAvoidOtp(true);
      setEnableEqualSpace(true);
    } else {
      // RNA probe: disable OTP and Equal Space
      setEnableAvoidOtp(false);
      setEnableEqualSpace(false);
    }
  }, [selectedCustomType]);

  const getActiveSteps = () => {
    const steps = [
      { label: 'Species', completed: !!species },
      { label: 'Probe Type', completed: !!probeType }
    ];

    if (selectedCustomType) {
      steps.push({ label: 'Custom Probe Parameters', completed: true });
    }

    if (probeType) {
      const hasInput = targetList.length > 0 && targetList[0].target !== '';
      steps.push(
        { label: 'Target Input', completed: hasInput }
      );
    }

    steps.push({ 
      label: 'Post Processing', 
      completed: sortOptions.length > 0 || overlapThreshold !== 20 
    });

    steps.push({ 
      label: 'Task Name', 
      completed: true // Task name is optional, so always completed
    });

    return steps;
  };

  // Helper function to filter out disabled attributes
  const removeDisabledAttributes = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const filtered: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && 'enabled' in value) {
        if (value.enabled) {
          const { enabled, ...rest } = value;
          filtered[key] = rest;
        }
      } else {
        filtered[key] = removeDisabledAttributes(value);
      }
    }
    return filtered;
  };

  // Helper function to remove attributes recursively
  const removeAttributes = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => removeAttributes(item));
    }
    
    const filtered: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key !== 'attributes' && key !== 'target_sequence' && key !== 'barcodes') {
        filtered[key] = removeAttributes(value);
      }
    }
    return filtered;
  };

  const extractAttributes = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const filtered: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip the fields we want to remove
      if (key === 'id' || key === 'sequence' || key === 'source' ||
          key === 'isReverseComplement' || key === 'sourceProbeId' ||
          key === 'sourceStartPos' || key === 'sourceEndPos' ||
          key === 'isComplete' || key ==='startPos' || key ==='endPos') {
        continue;
      }
      
      // Recursively process nested objects
      if (typeof value === 'object' && value !== null) {
        filtered[key] = extractAttributes(value);
      } else {
        filtered[key] = value;
      }
    }
    return filtered;
  };

  // Function to convert probe/part keys to match the YAML format
  const convertToYamlFormat = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      let newKey = key;
      
      // Convert probe names: "0", "1", "2" -> "probe_1", "probe_2", "probe_3"
      if (/^\d+$/.test(key) && value && typeof value === 'object' && 'parts' in value) {
        newKey = `probe_${parseInt(key) + 1}`;
      }
      
      // Process nested objects
      if (typeof value === 'object' && value !== null) {
        const convertedValue: any = {};
        
        // Handle probe object with parts
        if ('parts' in value && value.parts) {
          convertedValue.parts = {};
          for (const [partKey, partValue] of Object.entries(value.parts as any)) {
            // Convert part names: "0", "1", "2" -> "part1", "part2", "part3"
            const newPartKey = /^\d+$/.test(partKey) ? `part${parseInt(partKey) + 1}` : partKey;
            convertedValue.parts[newPartKey] = convertToYamlFormat(partValue);
          }
          
          // Handle other probe properties
          for (const [propKey, propValue] of Object.entries(value)) {
            if (propKey !== 'parts') {
              convertedValue[propKey] = convertToYamlFormat(propValue);
            }
          }
        } else {
          // Regular nested object
          Object.assign(convertedValue, convertToYamlFormat(value));
        }
        
        converted[newKey] = convertedValue;
      } else {
        converted[newKey] = value;
      }
    }
    return converted;
  };

  // Helper function to map attribute names to types
  const getAttributeType = (attrName: string): string => {
    const typeMapping: Record<string, string> = {
      'gcContent': 'gc_content',
      'foldScore': 'fold_score',
      'tm': 'annealing_temperature',
      'selfMatch': 'self_match',
      'mappedGenes': 'mapped_genes',
      'kmerCount': 'kmer_count',
      'mappedSites': 'mapped_sites'
    };
    return typeMapping[attrName] || attrName;
  };

  // Helper function to get snake_case attribute name for keys
  const getSnakeCaseAttrName = (attrName: string): string => {
    const mapping: Record<string, string> = {
      'gcContent': 'gc_content',
      'foldScore': 'fold_score',
      'tm': 'tm',
      'selfMatch': 'self_match',
      'mappedGenes': 'mapped_genes',
      'kmerCount': 'kmer_count',
      'mappedSites': 'mapped_sites'
    };
    return mapping[attrName] || attrName;
  };

  // Helper function to generate automatic task name
  const generateAutoTaskName = () => {
    const probeName = selectedCustomType?.name || probeType || 'probe';
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    return `${probeName.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')}_${timestamp}`;
  };

  // Helper function to validate form before submission
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!species) {
      errors.push('please select species');
    }
    
    if (!probeType) {
      errors.push('please select probe type');
    }
    
    const hasValidTargets = targetList.some(item => item.target.trim() !== '');
    if (!hasValidTargets) {
      errors.push('please add at least one target');
    }
    
    if (!selectedCustomType?.targetConfig?.source) {
      errors.push('please select a Source Type for the Target Sequence in the custom probe configuration');
    }

    if (overlap === undefined || overlap === null || isNaN(Number(overlap)) || overlap.toString().trim() === '') {
      errors.push('please specify a valid Overlap value for the Target Sequence Configuration');
    }

    if (minLength === undefined || minLength === null || isNaN(Number(minLength)) || minLength.toString().trim() === '') {
      errors.push('please specify a valid Target Length value for the Target Sequence Configuration');
    }

    // Check if barcode fields are filled and have correct length when required
    if (selectedCustomType?.barcodeCount) {
      const targetsWithInvalidBarcodes = targetList.filter(item => {
        if (item.target.trim() === '') return false;
        
        for (let i = 1; i <= selectedCustomType.barcodeCount; i++) {
          const barcodeKey = `barcode${i}`;
          const mode = barcodeModes[barcodeKey] || 'builtin';
          const barcodeValue = (item as any)[barcodeKey];
          
          // Check if barcode is missing when required
          if (mode !== 'builtin' && !barcodeValue) {
            return true;
          }
          
          // Check barcode length validation for non-builtin modes
          if (barcodeValue && mode !== 'builtin' && !validateManualBarcode(barcodeValue, barcodeKey)) {
            return true;
          }
        }
        return false;
      });
      
      if (targetsWithInvalidBarcodes.length > 0) {
        errors.push('some target barcodes are missing or have incorrect length, please check the barcode configuration');
      }
    }
    
    // Validate attributes
    if (selectedCustomType) {
      const validateAttrs = (attrs: any, context: string) => {
        if (!attrs) return;
        Object.entries(attrs).forEach(([attrName, attrValue]: [string, any]) => {
          if (attrValue.enabled) {
            if (attrName === 'gcContent' || attrName === 'gc_content' || attrName === 'tm') {
              if (attrValue.min === undefined || attrValue.min === '' || isNaN(Number(attrValue.min)) || 
                  attrValue.max === undefined || attrValue.max === '' || isNaN(Number(attrValue.max))) {
                errors.push(`${context}: ${attrName} requires valid min and max values.`);
              }
            } else if (attrName === 'foldScore' || attrName === 'fold_score' || attrName === 'selfMatch' || attrName === 'self_match' || attrName === 'mappedGenes' || attrName === 'mapped_genes') {
              if (attrValue.max === undefined || attrValue.max === '' || isNaN(Number(attrValue.max))) {
                errors.push(`${context}: ${attrName} requires a valid max value.`);
              }
            } else if (attrName === 'kmerCount' || attrName === 'kmer_count') {
              if (attrValue.kmer_len === undefined || attrValue.kmer_len === '' || isNaN(Number(attrValue.kmer_len))) {
                errors.push(`${context}: ${attrName} requires a valid k-mer length.`);
              }
            }
            
            if (attrName === 'mappedGenes' || attrName === 'mapped_genes' || attrName === 'kmerCount' || attrName === 'kmer_count' || attrName === 'mappedSites' || attrName === 'mapped_sites') {
              if (!attrValue.aligner) {
                errors.push(`${context}: ${attrName} requires an aligner.`);
              }
            }
          }
        });
      };

      validateAttrs(selectedCustomType.targetConfig?.attributes, 'Target Sequence');
      
      if (selectedCustomType.probes) {
        Object.entries(selectedCustomType.probes).forEach(([probeName, probeConfig]) => {
          validateAttrs(probeConfig.attributes, formatProbeName(probeName));
          if (probeConfig.parts) {
            Object.entries(probeConfig.parts).forEach(([partName, partConfig]) => {
              validateAttrs(partConfig.attributes, `${formatProbeName(probeName)} - ${formatPartName(partName)}`);
            });
          }
        });
      }
    }
    
    return errors;
  };

  const generateTaskConfig = () => {
    const probeName = selectedCustomType?.name || probeType;
    const finalTaskName = taskName.trim() || generateAutoTaskName();
    
    // Basic config - ordered by expected format
    const config: any = {
      name: finalTaskName.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_'),
      description: `Protocol for designing ${probeName} probes from species ${species}`,
      genome: species,
      targets: targetList
        .filter(item => item.target.trim() !== '')
        .map(item => {
          if (item.sequence && typeof item.sequence === 'string' && item.sequence.trim() !== '') {
            // Return as object with sequence: {targetName: 'sequence'}
            return { [item.target]: item.sequence.trim() };
          } else {
            // Return as simple string
            return item.target;
          }
        })
    };

    // Encoding config (barcode mapping)
    const targetEncoding: any = {};
    targetList.forEach(item => {
      if (item.target.trim() !== '' && selectedCustomType?.barcodeCount) {
        const targetBarcodes: any = {};
        for (let i = 1; i <= selectedCustomType.barcodeCount; i++) {
          const barcodeKey = `barcode${i}`;
          const bcKey = `BC${i}`;
          if ((item as any)[barcodeKey]) {
            targetBarcodes[bcKey] = (item as any)[barcodeKey];
          }
        }
        if (Object.keys(targetBarcodes).length > 0) {
          targetEncoding[item.target] = targetBarcodes;
        }
      }
    });
    
    
    config.encoding = targetEncoding;

    // Extraction config
    config.extracts = {
      target_region: {
        source: selectedCustomType?.targetConfig?.source || 
                (probeType === 'RCA' ? 'exon' : 
                 probeType === 'DNA-FISH' ? 'genome' : 'exon'),
        length: minLength,
        overlap: overlap
      }
    };
    
    // Add custom probe type parameters if selected (probes section - third from last)
    if (selectedCustomType) {
      // Extract only the actual probe configurations from yamlContent
      const yamlContent = selectedCustomType.yamlContent;
      const yamlObj = YAML.parse(yamlContent);
      
      // Find the probes section and extract only probe configurations (probe_1, probe_2, etc.)
      let probesConfig: any = {};
      
      if (yamlObj.probes) {
        // Extract probe configurations from the probes section
        Object.entries(yamlObj.probes).forEach(([key, value]) => {
          // Include all probe configurations, skip barcodes and other configs if any
          if (key !== 'barcodes' && key !== 'attributes' && key !== 'probes') {
            probesConfig[key] = removeAttributes(value);
          }
        });
      } else {
        // If no probes section, look for probe configurations at the top level
        Object.entries(yamlObj).forEach(([key, value]) => {
          if (key !== 'barcodes' && key !== 'attributes' && key !== 'extracts' && key !== 'target_sequence' && key !== 'name' && key !== 'description' && key !== 'probes') {
            probesConfig[key] = removeAttributes(value);
          }
        });
      }
      
      // Only add probes config if we found actual probe configurations
      if (Object.keys(probesConfig).length > 0) {
        config.probes = probesConfig;
      }
    }

    // Attribute config - use expected naming format
    if (selectedCustomType) {
      const attributes: any = {};
      
      // Target region attributes
      if (selectedCustomType.targetConfig?.attributes) {
        Object.entries(selectedCustomType.targetConfig.attributes).forEach(([attrName, attrValue]) => {
          if (attrValue.enabled) {
            const attributeKey = `target_${getSnakeCaseAttrName(attrName)}`;
            const attr: any = {
              target: 'target_region',
              type: getAttributeType(attrName)
            };
            
            if (attrValue.aligner) {
              attr.aligner = attrValue.aligner.toLowerCase();
            }
            if (attrValue.aligner && (attrName === 'mappedGenes')) {
              attr.min_mapq = 30;
            }
            if (attrValue.aligner && (attrName === 'mappedSites')) {
              attr.aligner = attrValue.aligner;
            }
            // Add specific attribute parameters
            if (attrName === 'kmerCount' && attrValue.kmer_len) {
              attr.kmer_len = attrValue.kmer_len;
              attr.threads = 10;
              attr.size = '1G';
            }
            
            attributes[attributeKey] = attr;
          }
        });
      }
      
      // Probe attributes - use expected naming format (probe1 instead of probe_1)
      if (selectedCustomType.probes) {
        Object.entries(selectedCustomType.probes).forEach(([probeName, probeConfig]) => {
          const formattedProbeName = /^\d+$/.test(probeName) ? `probe${parseInt(probeName) + 1}` : probeName;
          
          // Probe level attributes
          if (probeConfig.attributes) {
            Object.entries(probeConfig.attributes).forEach(([attrName, attrValue]) => {
              if (attrValue.enabled) {
                const attributeKey = `${formattedProbeName}_${getSnakeCaseAttrName(attrName)}`;
                const attr: any = {
                  target: formattedProbeName.replace(/probe(\d+)/, 'probe_$1'), // Use probe_1 format in target
                  type: getAttributeType(attrName)
                };
                
                if (attrValue.aligner) {
                  attr.aligner = attrValue.aligner.toLowerCase();
                }
                if (attrValue.aligner && (attrName === 'mappedGenes')) {
                  attr.min_mapq = 30;
                }
                if (attrValue.aligner && (attrName === 'mappedSites')) {
                  attr.aligner = 'bowtie2';
                }
                if (attrName === 'kmerCount' && attrValue.kmer_len) {
                  attr.aligner = 'jellyfish';
                  attr.kmer_len = attrValue.kmer_len;
                  attr.threads = 10;
                  attr.size = '1G';
                }
                
                attributes[attributeKey] = attr;
              }
            });
          }
          
          // Part level attributes - use dot separator
          if (probeConfig.parts) {
            Object.entries(probeConfig.parts).forEach(([partName, partConfig]) => {
              const formattedPartName = /^\d+$/.test(partName) ? `part${parseInt(partName) + 1}` : partName;
              
              if (partConfig.attributes) {
                Object.entries(partConfig.attributes).forEach(([attrName, attrValue]) => {
                  if (attrValue.enabled) {
                    const attributeKey = `${formattedProbeName}_${formattedPartName}_${getSnakeCaseAttrName(attrName)}`;
                    const attr: any = {
                      target: `${formattedProbeName.replace(/probe(\d+)/, 'probe_$1')}.${formattedPartName}`, // Use dot separator
                      type: getAttributeType(attrName)
                    };
                    
                    if (attrValue.aligner) {
                      attr.aligner = attrValue.aligner.toLowerCase();
                    }
                    if (attrValue.aligner && (attrName === 'mappedGenes')) {
                      attr.min_mapq = 30;
                    }
                    if (attrValue.aligner && (attrName === 'mappedSites')) {
                      attr.aligner = attrValue.aligner;
                    }
                    if (attrName === 'kmerCount' && attrValue.kmer_len) {
                      attr.kmer_len = attrValue.kmer_len;
                      attr.threads = 10;
                      attr.size = '1G';
                    }
                    
                    attributes[attributeKey] = attr;
                  }
                });
              }
            });
          }
        });
      }
      
      if (Object.keys(attributes).length > 0) {
        config.attributes = attributes;
      }
    }

    // Post-processing config
    const post_process: any = {};
    
    // 1. Filters
    if (enableBasicFilter && selectedCustomType) {
      const filters: any = {};
      
      // Target region filtering
      if (selectedCustomType.targetConfig?.attributes) {
        Object.entries(selectedCustomType.targetConfig.attributes).forEach(([attrName, attrValue]) => {
          if (attrValue.enabled) {
            const filterName = `target_${getSnakeCaseAttrName(attrName)}`;
            let condition = '';
            
            if (attrName === 'gcContent' || attrName === 'gc_content') {
              if (attrValue.min !== undefined && attrValue.max !== undefined) {
                condition = `${filterName} >= ${attrValue.min/100} & ${filterName} <= ${attrValue.max/100}`;
              } else if (attrValue.max !== undefined) {
                condition = `${filterName} <= ${attrValue.max/100}`;
              }
            } else {
              if (attrValue.min !== undefined && attrValue.max !== undefined) {
                condition = `${filterName} >= ${attrValue.min} & ${filterName} <= ${attrValue.max}`;
              } else if (attrValue.max !== undefined) {
                condition = `${filterName} <= ${attrValue.max}`;
              }
            }
            
            if (condition) {
              filters[filterName] = { condition };
            }
          }
        });
      }
      
      // Probe and part filtering - use expected naming format
      if (selectedCustomType.probes) {
        Object.entries(selectedCustomType.probes).forEach(([probeName, probeConfig]) => {
          const formattedProbeName = /^\d+$/.test(probeName) ? `probe${parseInt(probeName) + 1}` : probeName;
          
          if (probeConfig.attributes) {
            Object.entries(probeConfig.attributes).forEach(([attrName, attrValue]) => {
              if (attrValue.enabled) {
                const filterName = `${formattedProbeName}_${getSnakeCaseAttrName(attrName)}`;
                let condition = '';
                
                if (attrName === 'gcContent' || attrName === 'gc_content') {
                  if (attrValue.min !== undefined && attrValue.max !== undefined) {
                    condition = `${filterName} >= ${attrValue.min/100} & ${filterName} <= ${attrValue.max/100}`;
                  } else if (attrValue.max !== undefined) {
                    condition = `${filterName} <= ${attrValue.max/100}`;
                  }
                } else {
                  if (attrValue.min !== undefined && attrValue.max !== undefined) {
                    condition = `${filterName} >= ${attrValue.min} & ${filterName} <= ${attrValue.max}`;
                  } else if (attrValue.max !== undefined) {
                    condition = `${filterName} <= ${attrValue.max}`;
                  }
                }
                
                if (condition) {
                  filters[filterName] = { condition };
                }
              }
            });
          }
          
          if (probeConfig.parts) {
            Object.entries(probeConfig.parts).forEach(([partName, partConfig]) => {
              const formattedPartName = /^\d+$/.test(partName) ? `part${parseInt(partName) + 1}` : partName;
              
              if (partConfig.attributes) {
                Object.entries(partConfig.attributes).forEach(([attrName, attrValue]) => {
                  if (attrValue.enabled) {
                    const filterName = `${formattedProbeName}_${formattedPartName}_${getSnakeCaseAttrName(attrName)}`;
                    let condition = '';
                    
                    if (attrName === 'gcContent' || attrName === 'gc_content') {
                      if (attrValue.min !== undefined && attrValue.max !== undefined) {
                        condition = `${filterName} >= ${attrValue.min/100} & ${filterName} <= ${attrValue.max/100}`;
                      } else if (attrValue.max !== undefined) {
                        condition = `${filterName} <= ${attrValue.max/100}`;
                      }
                    } else {
                      if (attrValue.min !== undefined && attrValue.max !== undefined) {
                        condition = `${filterName} >= ${attrValue.min} & ${filterName} <= ${attrValue.max}`;
                      } else if (attrValue.max !== undefined) {
                        condition = `${filterName} <= ${attrValue.max}`;
                      }
                    }
                    
                    if (condition) {
                      filters[filterName] = { condition };
                    }
                  }
                });
              }
            });
          }
        });
      }
      
      if (Object.keys(filters).length > 0) {
        post_process.filters = filters;
      }
    }
    
    // 2. Avoid off-target - modified to array format
    if (enableAvoidOtp && Object.keys(avoidOtpConfig).length > 0) {
      const avoid_otp: any = {};
      Object.entries(avoidOtpConfig).forEach(([target, config]) => {
        avoid_otp[target] = {
          target_regions: [config.target_regions], // Convert to array format
          density_thresh: config.density_thresh
        };
      });
      post_process.avoid_otp = avoid_otp;
    }
    
    // 3. Equal spacing
    if (enableEqualSpace && Object.keys(equalSpaceConfig).length > 0) {
      post_process.equal_space = equalSpaceConfig;
    }
    
    // 4. Remove overlap
    if (enableRemoveOverlap) {
      post_process.remove_overlap = {
        location_interval: overlapThreshold
      };
    }
    
    // 5. Sorting
    if (enableSorting && sortOptions.length > 0) {
      const ascFields = sortOptions.filter(opt => opt.order === 'asc').map(opt => opt.field);
      const descFields = sortOptions.filter(opt => opt.order === 'desc').map(opt => opt.field);
      
      if (ascFields.length > 0 || descFields.length > 0) {
        post_process.sorts = {};
        if (ascFields.length > 0) post_process.sorts.is_ascending = ascFields;
        if (descFields.length > 0) post_process.sorts.is_descending = descFields;
      }
    }
    
    config.post_process = post_process;

    // Add report config
    const summaryConfig: any = {};
    
    // Determine probe type: DNA (source is genome) or RNA (source is not genome)
    const probeSource = selectedCustomType?.targetConfig?.source || 
                       (probeType === 'DNA-FISH' ? 'genome' : 'exon');
    const isDnaProbe = probeSource === 'genome';
    summaryConfig.report_name = isDnaProbe ? 'dna_report' : 'rna_report';
    
    // Dynamically collect all enabled attributes
    const summaryAttributes: string[] = [];
    
    // Collect target region attributes
    if (selectedCustomType?.targetConfig?.attributes) {
      Object.entries(selectedCustomType.targetConfig.attributes).forEach(([attrName, attrValue]) => {
        if (attrValue.enabled) {
          summaryAttributes.push(`target_${getSnakeCaseAttrName(attrName)}`);
        }
      });
    }
    
    // Collect probe attributes
    if (selectedCustomType?.probes) {
      Object.entries(selectedCustomType.probes).forEach(([probeName, probeConfig]) => {
        const formattedProbeName = /^\d+$/.test(probeName) ? `probe${parseInt(probeName) + 1}` : probeName;
        
        if (probeConfig.attributes) {
          Object.entries(probeConfig.attributes).forEach(([attrName, attrValue]) => {
            if (attrValue.enabled) {
              summaryAttributes.push(`${formattedProbeName}_${getSnakeCaseAttrName(attrName)}`);
            }
          });
        }
        
        // Collect part attributes
        if (probeConfig.parts) {
          Object.entries(probeConfig.parts).forEach(([partName, partConfig]) => {
            const formattedPartName = /^\d+$/.test(partName) ? `part${parseInt(partName) + 1}` : partName;
            
            if (partConfig.attributes) {
              Object.entries(partConfig.attributes).forEach(([attrName, attrValue]) => {
                if (attrValue.enabled) {
                  summaryAttributes.push(`${formattedProbeName}_${formattedPartName}_${getSnakeCaseAttrName(attrName)}`);
                }
              });
            }
          });
        }
      });
    }
    
    if (summaryAttributes.length > 0) {
      summaryConfig.attributes = summaryAttributes;
    }
    
    config.summary = summaryConfig;

    return config;
  };

  const handleSubmitTask = async () => {
    try {
      // Validate form before submission
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setAlert(true, `please complete the following information:\n${validationErrors.join('\n')}`, 'error');
        return;
      }

      setSubmitting(true);
      setProgress(0);

      // Generate the complete task configuration
      const taskConfig = generateTaskConfig();

      // Submit the task and get the new task's ID
      const response = await ApiService.submitTask(taskConfig);
      const newTaskId = response.data?.job_id || (response as any).job_id || (response as any).id;

      // Automatically start the task
      if (newTaskId) {
        await ApiService.runTask(newTaskId);
        setAlert(true, 'Task submitted and started successfully!', 'success');
      } else {
        setAlert(true, 'Task submitted successfully! You can start it manually.', 'success');
      }
      
      setProgress(100);
      
      // Navigate to tasks page immediately
      navigate('/task');
    } catch (error) {
      console.error('Failed to submit task:', error);
      setAlert(true, 'Failed to submit task. Please try again.', 'error');
      setProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  // Function to handle attribute deletion
  const handleDeleteAttribute = (
    type: 'target' | 'probe' | 'part',
    attrName: string,
    probeName?: string,
    partName?: string
  ) => {
    if (!selectedCustomType) return;
    
    // Use deep copy to avoid state mutation
    const newType = JSON.parse(JSON.stringify(selectedCustomType));

    if (type === 'target') {
      if (newType.targetConfig?.attributes?.[attrName]) {
        delete newType.targetConfig.attributes[attrName];
      }
    } else if (type === 'probe' && probeName) {
      if (newType.probes?.[probeName]?.attributes?.[attrName]) {
        delete newType.probes[probeName].attributes[attrName];
      }
    } else if (type === 'part' && probeName && partName) {
      if (newType.probes?.[probeName]?.parts?.[partName]?.attributes?.[attrName]) {
        delete newType.probes[probeName].parts[partName].attributes[attrName];
      }
    }

    setSelectedCustomType(newType);
  };

  const handleToggleProbeAccordion = (probeName: string) => {
    setExpandedProbes(prev => ({
      ...prev,
      [probeName]: !prev[probeName],
    }));
  };

  // Get all attribute options (always show all, but some may be disabled)
  const getAllAttributeOptions = () => {
    return [
      { id: 'gcContent', label: 'GC Content', icon: '🧬', type: 'common' },
      { id: 'foldScore', label: 'Fold Score', icon: '📊', type: 'common' },
      { id: 'tm', label: 'Melting Temperature', icon: '🌡️', type: 'common' },
      { id: 'selfMatch', label: 'Self Match', icon: '🔍', type: 'common' },
      { id: 'mappedGenes', label: 'Mapped Genes', icon: '🧬', type: 'rna' },
      { id: 'mappedSites', label: 'Mapped Sites', icon: '📍', type: 'dna' },
      { id: 'kmerCount', label: 'K-mer Count', icon: '🔢', type: 'dna' }
    ];
  };

  // Check if an attribute option should be disabled
  const isAttributeOptionDisabled = (optionType: string) => {
    if (!selectedCustomType || optionType === 'common') return false;
    const isDna = isCurrentProbeDna();
    return (optionType === 'dna' && !isDna) || (optionType === 'rna' && isDna);
  };


  return (
    <Container
      maxWidth="xl" 
      sx={{ 
        width: '100%',
        px: { xs: 2, sm: 3, md: 4 },
        py: 3,
      }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" sx={{ mt: 2 }} gutterBottom>
          Ready to craft your perfect workflow? 🎨
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Follow the steps below to design your probe workflow
        </Typography>
      </Box>

      <Stepper activeStep={-1} alternativeLabel sx={{ mb: 4 }}>
        {getActiveSteps().map((step, index) => (
          <Step key={index} completed={step.completed}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Species Option */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="🌍 Species Option" 
          subheader="Choose the species genome to design your probes"
          action={
            <IconButton onClick={() => toggleSection('species')}>
              {expandedSections.species ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
        />
        <Collapse in={expandedSections.species}>
          <CardContent>
            <FormControl fullWidth>
              <InputLabel id="species-select-label">Species</InputLabel>
              <Select
                labelId="species-select-label"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
              >
                {speciesOptions.map((speciesOption, idx) => (
                  <MenuItem key={idx} value={speciesOption}>
                    {speciesOption}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Collapse>
      </Card>

      {/* Probe Type */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="🔬 Probe Type" 
          subheader="Choose from existing probe types or use a custom design from history"
          action={
            <IconButton onClick={() => toggleSection('probeType')}>
              {expandedSections.probeType ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
        />
        <Collapse in={expandedSections.probeType}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="probe-type-label">Probe Type</InputLabel>
                <Select
                  labelId="probe-type-label"
                  value={probeType}
                  onChange={(e) => handleProbeTypeSelect(e.target.value)}
                  disabled={isLoadingCustomTypes}
                >
                  {isLoadingCustomTypes ? (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} />
                        <Typography>Loading custom types...</Typography>
                      </Box>
                    </MenuItem>
                  ) : (
                    [...builtinProbeTypes, ...customProbeTypes].map((type) => (
                      <MenuItem key={type.id} value={type.name}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                          <Typography>{type.name}</Typography>
                          <Chip 
                            size="small" 
                            label={type.type === 'builtin' ? 'Built-in' : getProbeType(type)} 
                            color={type.type === 'builtin' ? 'default' : (getProbeType(type) === 'DNA' ? 'primary' : 'secondary')}
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
                {isLoadingCustomTypes && (
                  <FormHelperText>
                    Loading custom probe types...
                  </FormHelperText>
                )}
              </FormControl>
              
              <Button
                variant="outlined"
                onClick={() => setShowCustomProbeTypes(true)}
                disabled={isLoadingCustomTypes}
              >
                View Custom Types
              </Button>
            </Box>

            {/* Custom Probe Parameters Section */}
            {selectedCustomType && (
              <Box sx={{ mt: 3 }}>
                <Card variant="outlined" sx={{ 
                  backgroundColor: 'background.paper',
                  boxShadow: 'none'
                }}>
                  <CardHeader
                    title="⚙️ Custom Probe Parameters"
                    subheader="Adjust the parameters for your custom probe design"
                  />
                  <CardContent>
                    {/* Target Sequence Configuration */}
                    <Box sx={{ mb: 4 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: 'text.primary' }}>
                          🎯 Target Sequence Configuration
                        </Typography>
                        <Tooltip title="Add target sequence attributes">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentAttributeType('target');
                              setShowAttributeDialog(true);
                            }}
                            sx={{ 
                              border: '1px solid',
                              borderColor: 'divider',
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              }
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      
                      <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Target Length"
                            type="number"
                            value={selectedCustomType.targetLength}
                            onChange={(e) => {
                              const updatedType = {
                                ...selectedCustomType,
                                targetLength: Number(e.target.value)
                              };
                              setSelectedCustomType(updatedType);
                              setMinLength(Number(e.target.value));
                            }}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">bp</InputAdornment>,
                            }}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Overlap"
                            type="number"
                            value={selectedCustomType.overlap}
                            onChange={(e) => {
                              const updatedType = {
                                ...selectedCustomType,
                                overlap: Number(e.target.value)
                              };
                              setSelectedCustomType(updatedType);
                              setOverlap(Number(e.target.value));
                            }}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">bp</InputAdornment>,
                            }}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                      </Grid>

                      {selectedCustomType.targetConfig?.attributes && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {Object.entries(selectedCustomType.targetConfig.attributes).map(([attrName, attrValue]) => (
                            <Chip
                              key={attrName}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem', cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentAttributeType('target');
                                  handleEditAttribute({
                                    name: attrName,
                                    ...attrValue
                                  });
                                }}
                                onDelete={() => handleDeleteAttribute('target', attrName)}
                              label={
                                attrName === 'gcContent' ? `GC: ${attrValue.min}%-${attrValue.max}%` :
                                attrName === 'gc_content' ? `GC: ${attrValue.min}%-${attrValue.max}%` :
                                attrName === 'foldScore' ? `Fold: max ${attrValue.max}` :
                                attrName === 'fold_score' ? `Fold: max ${attrValue.max}` :
                                attrName === 'tm' ? `Tm: ${attrValue.min}°C-${attrValue.max}°C` :
                                attrName === 'selfMatch' ? `Self: max ${attrValue.max}` :
                                attrName === 'self_match' ? `Self: max ${attrValue.max}` :
                                attrName === 'mappedGenes' ? `Map: max ${attrValue.max}${attrValue.aligner ? ` (${attrValue.aligner})` : ''}` :
                                attrName === 'mapped_genes' ? `Map: max ${attrValue.max}${attrValue.aligner ? ` (${attrValue.aligner})` : ''}` :
                                attrName === 'kmerCount' ? `Kmer: ${attrValue.kmer_len}${attrValue.aligner ? ` (${attrValue.aligner})` : ''}` :
                                attrName === 'kmer_count' ? `Kmer: ${attrValue.kmer_len}${attrValue.aligner ? ` (${attrValue.aligner})` : ''}` :
                                attrName === 'mappedSites' ? `Sites${attrValue.aligner ? ` (${attrValue.aligner})` : ''}` :
                                attrName === 'mapped_sites' ? `Sites${attrValue.aligner ? ` (${attrValue.aligner})` : ''}` :
                                `${attrName}: ${formatAttributeValue(attrValue)}`
                              }
                              color={
                                attrName === 'gcContent' || attrName === 'gc_content' ? 'primary' :
                                attrName === 'foldScore' || attrName === 'fold_score' ? 'secondary' :
                                attrName === 'tm' ? 'error' :
                                attrName === 'selfMatch' || attrName === 'self_match' ? 'warning' :
                                attrName === 'mappedGenes' || attrName === 'mapped_genes' ? 'info' :
                                attrName === 'kmerCount' || attrName === 'kmer_count' ? 'success' :
                                attrName === 'mappedSites' || attrName === 'mapped_sites' ? 'info' :
                                'default'
                              }
                            />
                          ))}
                          {!Object.values(selectedCustomType.targetConfig.attributes).some(attr => attr?.enabled) && (
                            <Typography variant="caption" color="text.secondary">
                              No attributes configured
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>

                    {/* Probe Configuration */}
                    <Box sx={{ mb: 4 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: 'text.primary' }}>
                          🔬 Probe Configuration
                        </Typography>
                      </Box>

                      {(() => {
                        console.log('Debug - Rendering probes:', selectedCustomType.probes);
                        return selectedCustomType.probes && Object.keys(selectedCustomType.probes).length > 0 ? (
                          Object.entries(selectedCustomType.probes).map(([probeName, probeConfig]) => (
                        <Accordion 
                          key={probeName} 
                          sx={{ mb: 2 }}
                          expanded={expandedProbes[probeName] ?? true}
                          onChange={() => handleToggleProbeAccordion(probeName)}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                {formatProbeName(probeName)}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentProbeName(probeName);
                                  setCurrentAttributeType('probe');
                                  setShowAttributeDialog(true);
                                }}
                                sx={{ 
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  '&:hover': {
                                    backgroundColor: 'action.hover',
                                  }
                                }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            {/* Probe-level attributes */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                              {probeConfig.attributes && Object.entries(probeConfig.attributes).map(([attrName, attrValue]) => 
                                renderAttributeChip(probeName, null, attrName, attrValue)
                              )}
                              {(!probeConfig.attributes || !Object.values(probeConfig.attributes).some(attr => attr?.enabled)) && (
                                <Typography variant="caption" color="text.secondary">
                                  No attributes configured
                                </Typography>
                              )}
                            </Box>

                            {/* Part-level attributes */}
                            {probeConfig.parts && Object.entries(probeConfig.parts).map(([partName, partConfig]) => (
                              <Box key={partName} sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                  <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                      {formatPartName(partName)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Part of {formatProbeName(probeName)}
                                    </Typography>
                                  </Box>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCurrentProbeName(probeName);
                                      setCurrentPartName(partName);
                                      setCurrentAttributeType('part');
                                      setShowAttributeDialog(true);
                                    }}
                                    sx={{ 
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      '&:hover': {
                                        backgroundColor: 'action.hover',
                                      }
                                    }}
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                                {partConfig.attributes && (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {Object.entries(partConfig.attributes).map(([attrName, attrValue]) => 
                                      renderAttributeChip(probeName, partName, attrName, attrValue)
                                    )}
                                    {!Object.values(partConfig.attributes).some(attr => attr?.enabled) && (
                                      <Typography variant="caption" color="text.secondary">
                                        No attributes configured
                                      </Typography>
                                    )}
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                        No probes configured
                      </Typography>
                    );
                  })()}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </CardContent>
        </Collapse>
      </Card>

      {/* Targets */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="🎯 Targets" 
          subheader="Input target names and select barcodes according to your probe type configuration."
          action={
            <IconButton onClick={() => toggleSection('geneMap')}>
              {expandedSections.geneMap ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
        />
        <Collapse in={expandedSections.geneMap}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<AddIcon />}
              >
                Upload target list (.csv)
                <input
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={handleTargetCsvUpload}
                />
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleResetTargetList}
              >
                Reset Target List
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              <strong>CSV Format Required:</strong> The first row must be a header. <code>target</code> is required, <code>sequence</code> is optional.<br />
              {selectedCustomType?.barcodeCount ? 
                `Header format: target,sequence${Array.from({ length: selectedCustomType.barcodeCount }, (_, i) => `,barcode${i + 1}`).join('')}` :
                'Header format: target,sequence'}<br />
              <em>Note: You can leave sequence or barcodes empty in the CSV and configure them later in the UI.</em>
            </Typography>

            {/* Global Barcode Configuration */}
            {selectedCustomType?.barcodeCount && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  🔧 Barcode Configuration
                </Typography>
                <Grid container spacing={2}>
                  {Array.from({ length: selectedCustomType.barcodeCount }).map((_, barcodeIndex) => {
                    const barcodeKey = `barcode${barcodeIndex + 1}`;
                    const currentMode = barcodeModes[barcodeKey] || 'builtin';
                    return (
                      <Grid item xs={12} sm={6} md={4} key={barcodeIndex}>
                        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                            Barcode {barcodeIndex + 1} ({getExpectedBarcodeLength(barcodeKey)}bp)
                          </Typography>
                          
                          <Stack spacing={1}>
                            {/* Mode Selector */}
                            <FormControl size="small" fullWidth>
                              <InputLabel>Mode</InputLabel>
                              <Select
                                value={currentMode}
                                onChange={(e) => handleBarcodeModeChange(barcodeKey, e.target.value as any)}
                                disabled={generatingBarcodes[`target_all_${barcodeKey}`]}
                              >
                                <MenuItem value="builtin">Builtin</MenuItem>
                                <MenuItem value="auto">Auto Generate</MenuItem>
                                <MenuItem value="manual">Manual Input</MenuItem>
                                {barcodeFromFile[barcodeKey] && <MenuItem value="file">From File</MenuItem>}
                              </Select>
                            </FormControl>


                            {/* Batch Generate Button (only for auto mode) */}
                            {currentMode === 'auto' && (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => generateBarcodesForAllTargets(barcodeKey)}
                                disabled={generatingBarcodes[`target_all_${barcodeKey}`]}
                                sx={{ fontSize: '0.75rem' }}
                              >
                                {generatingBarcodes[`target_all_${barcodeKey}`] ? 'Generating...' : 'Generate for All'}
                              </Button>
                            )}
                          </Stack>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            )}

            {targetList.map((item, index) => (
                  <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 1 }}>
                    <Grid item xs={selectedCustomType?.barcodeCount ? 3 : 5}>
                      <TextField
                        fullWidth
                        label="Target"
                        value={item.target}
                        onChange={(e) => updateTarget(index, 'target', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={selectedCustomType?.barcodeCount ? 3 : 5}>
                      <TextField
                        fullWidth
                        label="Sequence (Optional)"
                        value={item.sequence || ''}
                        onChange={(e) => updateTarget(index, 'sequence', e.target.value)}
                        placeholder="ATCGATCGATCG..."
                        inputProps={{ 
                          style: { fontFamily: 'monospace', fontSize: '0.875rem' } 
                        }}
                      />
                    </Grid>

                    {selectedCustomType?.barcodeCount ? (
                      Array.from({ length: selectedCustomType.barcodeCount }).map((_, barcodeIndex) => {
                        const barcodeKey = `barcode${barcodeIndex + 1}`;
                        const currentMode = barcodeModes[barcodeKey] || 'builtin';
                        const barcodeGridSize = Math.floor(4 / selectedCustomType.barcodeCount); // 4 columns for barcodes
                        return (
                          <Grid item xs={barcodeGridSize} key={barcodeIndex}>
                            {/* Simplified Barcode Input Field */}
                            {(currentMode === 'file' || barcodeFromFile[barcodeKey]) ? (
                              <TextField
                                fullWidth
                                label={`BC${barcodeIndex + 1}`}
                                value={(item as any)[barcodeKey] || ''}
                                onChange={(e) => handleManualBarcodeInput(index, barcodeKey, e.target.value)}
                                size="small"
                                error={!validateManualBarcode((item as any)[barcodeKey] || '', barcodeKey) && ((item as any)[barcodeKey] || '').length > 0}
                                helperText={!validateManualBarcode((item as any)[barcodeKey] || '', barcodeKey) && ((item as any)[barcodeKey] || '').length > 0 ? `Expected: ${getExpectedBarcodeLength(barcodeKey)}bp` : ''}
                              />
                            ) : currentMode === 'manual' ? (
                              <TextField
                                fullWidth
                                label={`BC${barcodeIndex + 1}`}
                                value={(item as any)[barcodeKey] || ''}
                                onChange={(e) => handleManualBarcodeInput(index, barcodeKey, e.target.value)}
                                size="small"
                                placeholder={`${getExpectedBarcodeLength(barcodeKey)}bp`}
                                error={!validateManualBarcode((item as any)[barcodeKey] || '', barcodeKey) && ((item as any)[barcodeKey] || '').length > 0}
                                helperText={!validateManualBarcode((item as any)[barcodeKey] || '', barcodeKey) && ((item as any)[barcodeKey] || '').length > 0 ? `Expected: ${getExpectedBarcodeLength(barcodeKey)}bp` : ''}
                              />
                            ) : currentMode === 'auto' ? (
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                  fullWidth
                                  label={`BC${barcodeIndex + 1}`}
                                  value={(item as any)[barcodeKey] || ''}
                                  onChange={(e) => handleManualBarcodeInput(index, barcodeKey, e.target.value)}
                                  size="small"
                                  error={!validateManualBarcode((item as any)[barcodeKey] || '', barcodeKey) && ((item as any)[barcodeKey] || '').length > 0}
                                />
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => autoGenerateBarcodeForItem(index, barcodeKey)}
                                  disabled={generatingBarcodes[`target_${index}_${barcodeKey}`]}
                                  sx={{ minWidth: '40px', fontSize: '0.7rem', px: 1 }}
                                >
                                  {generatingBarcodes[`target_${index}_${barcodeKey}`] ? '...' : 'Gen'}
                                </Button>
                              </Box>
                            ) : (
                              <FormControl fullWidth size="small">
                                <InputLabel>BC{barcodeIndex + 1}</InputLabel>
                                <Select
                                  value={(item as any)[barcodeKey] || ''}
                                  onChange={(e) => updateTarget(index, barcodeKey as keyof Target, e.target.value)}
                                >
                                  <MenuItem value="">
                                    <em>None</em>
                                  </MenuItem>
                                  {barcodeOptions.map((barcode, idx) => (
                                    <MenuItem key={idx} value={barcode}>
                                      {barcode}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          </Grid>
                        );
                      })
                    ) : null}

                    <Grid item xs={2}>
                      <IconButton onClick={() => removeTarget(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addTarget}
                  sx={{ mt: 2 }}
                >
                  Add Target
                </Button>
          </CardContent>
        </Collapse>
      </Card>

      {/* Post Processing Step */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="🛠️ Post Processing"
          subheader="Configure processing options for optimal probe selection"
          action={
            <IconButton onClick={() => setShowPostProcess(!showPostProcess)}>
              {showPostProcess ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
        />
        <Collapse in={showPostProcess}>
          <CardContent>
            <Stack spacing={3}>
              {/* Processing Options Grid */}
              <Grid container spacing={2}>
                {/* Basic Filtering */}
                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    elevation={enableBasicFilter ? 2 : 0}
                    sx={{ 
                      p: 2, 
                      height: '100%',
                      border: enableBasicFilter ? '2px solid' : '1px solid',
                      borderColor: enableBasicFilter ? 'primary.main' : 'divider',
                      backgroundColor: enableBasicFilter ? 'primary.50' : 'background.paper',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={enableBasicFilter}
                          onChange={(e) => setEnableBasicFilter(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium">
                            🔍 Basic Filtering
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Apply attribute-based filters
                          </Typography>
                        </Box>
                      }
                      labelPlacement="start"
                      sx={{ 
                        width: '100%', 
                        justifyContent: 'space-between',
                        ml: 0,
                        mr: 0
                      }}
                    />
                  </Paper>
                </Grid>

                {/* Avoid Off-Target Priming */}
                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    elevation={enableAvoidOtp ? 2 : 0}
                    sx={{ 
                      p: 2, 
                      height: '100%',
                      border: enableAvoidOtp ? '2px solid' : '1px solid',
                      borderColor: enableAvoidOtp ? 'warning.main' : 'divider',
                      backgroundColor: enableAvoidOtp ? 'warning.50' : !shouldEnableDnaFeatures() ? 'grey.100' : 'background.paper',
                      opacity: !shouldEnableDnaFeatures() ? 0.6 : 1,
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={enableAvoidOtp}
                          onChange={(e) => {
                            setEnableAvoidOtp(e.target.checked);
                            if (e.target.checked) {
                              initializeAvoidOtpConfig();
                            }
                          }}
                          color="warning"
                          disabled={!shouldEnableDnaFeatures()}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium" sx={{ color: !shouldEnableDnaFeatures() ? 'text.disabled' : 'text.primary' }}>
                            ⚠️ Avoid Off-Target
                          </Typography>
                          <Typography variant="caption" color={!shouldEnableDnaFeatures() ? 'text.disabled' : 'text.secondary'}>
                            {!shouldEnableDnaFeatures() ? 'DNA only' : 'Prevent off-target binding'}
                          </Typography>
                        </Box>
                      }
                      labelPlacement="start"
                      sx={{ 
                        width: '100%', 
                        justifyContent: 'space-between',
                        ml: 0,
                        mr: 0
                      }}
                    />
                  </Paper>
                </Grid>

                {/* Equal Spacing */}
                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    elevation={enableEqualSpace ? 2 : 0}
                    sx={{ 
                      p: 2, 
                      height: '100%',
                      border: enableEqualSpace ? '2px solid' : '1px solid',
                      borderColor: enableEqualSpace ? 'secondary.main' : 'divider',
                      backgroundColor: enableEqualSpace ? 'secondary.50' : !shouldEnableDnaFeatures() ? 'grey.100' : 'background.paper',
                      opacity: !shouldEnableDnaFeatures() ? 0.6 : 1,
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={enableEqualSpace}
                          onChange={(e) => {
                            setEnableEqualSpace(e.target.checked);
                            if (e.target.checked) {
                              initializeEqualSpaceConfig();
                            }
                          }}
                          color="secondary"
                          disabled={!shouldEnableDnaFeatures()}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium" sx={{ color: !shouldEnableDnaFeatures() ? 'text.disabled' : 'text.primary' }}>
                            📏 Equal Spacing
                          </Typography>
                          <Typography variant="caption" color={!shouldEnableDnaFeatures() ? 'text.disabled' : 'text.secondary'}>
                            {!shouldEnableDnaFeatures() ? 'DNA only' : 'Distribute probes evenly'}
                          </Typography>
                        </Box>
                      }
                      labelPlacement="start"
                      sx={{ 
                        width: '100%', 
                        justifyContent: 'space-between',
                        ml: 0,
                        mr: 0
                      }}
                    />
                  </Paper>
                </Grid>

                {/* Remove Overlap */}
                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    elevation={enableRemoveOverlap ? 2 : 0}
                    sx={{ 
                      p: 2, 
                      height: '100%',
                      border: enableRemoveOverlap ? '2px solid' : '1px solid',
                      borderColor: enableRemoveOverlap ? 'error.main' : 'divider',
                      backgroundColor: enableRemoveOverlap ? 'error.50' : 'background.paper',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={enableRemoveOverlap}
                          onChange={(e) => setEnableRemoveOverlap(e.target.checked)}
                          color="error"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium">
                            🚫 Remove Overlap
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Eliminate overlapping probes
                          </Typography>
                        </Box>
                      }
                      labelPlacement="start"
                      sx={{ 
                        width: '100%', 
                        justifyContent: 'space-between',
                        ml: 0,
                        mr: 0
                      }}
                    />
                  </Paper>
                </Grid>

                {/* Sorting Options */}
                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    elevation={enableSorting ? 2 : 0}
                    sx={{ 
                      p: 2, 
                      height: '100%',
                      border: enableSorting ? '2px solid' : '1px solid',
                      borderColor: enableSorting ? 'info.main' : 'divider',
                      backgroundColor: enableSorting ? 'info.50' : 'background.paper',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={enableSorting}
                          onChange={(e) => setEnableSorting(e.target.checked)}
                          color="info"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium">
                            🔄 Sorting Options
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Sort by attributes
                          </Typography>
                        </Box>
                      }
                      labelPlacement="start"
                      sx={{ 
                        width: '100%', 
                        justifyContent: 'space-between',
                        ml: 0,
                        mr: 0
                      }}
                    />
                  </Paper>
                </Grid>
              </Grid>

              {/* Configuration Sections */}
              {/* Avoid OTP Configuration */}
              <Collapse in={enableAvoidOtp}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    ⚠️ Off-Target Peak
                  </Typography>
                  {getCurrentTargets().length > 0 ? (
                    <Grid container spacing={2}>
                      {getCurrentTargets().map((target) => (
                        <Grid item xs={12} md={6} key={target}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
                              {target}
                            </Typography>
                            <Stack spacing={2}>
                              <TextField
                                fullWidth
                                label="Target Regions"
                                value={avoidOtpConfig[target]?.target_regions || target}
                                onChange={(e) => {
                                  setAvoidOtpConfig(prev => ({
                                    ...prev,
                                    [target]: {
                                      ...prev[target],
                                      target_regions: e.target.value
                                    }
                                  }));
                                }}
                                size="small"
                              />
                              <TextField
                                fullWidth
                                label="Density Threshold"
                                type="number"
                                value={avoidOtpConfig[target]?.density_thresh || 1e-5}
                                onChange={(e) => {
                                  setAvoidOtpConfig(prev => ({
                                    ...prev,
                                    [target]: {
                                      ...prev[target],
                                      density_thresh: parseFloat(e.target.value)
                                    }
                                  }));
                                }}
                                inputProps={{ step: "0.00001" }}
                                size="small"
                              />
                            </Stack>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No targets available. Please add targets first.
                    </Typography>
                  )}
                </Paper>
              </Collapse>

              {/* Equal Space Configuration */}
              <Collapse in={enableEqualSpace}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    📏 Equal Spacing 
                  </Typography>
                  {getCurrentTargets().length > 0 ? (
                    <Grid container spacing={2}>
                      {getCurrentTargets().map((target) => (
                        <Grid item xs={12} sm={6} md={4} key={target}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
                              {target}
                            </Typography>
                            <TextField
                              fullWidth
                              label="Number Desired"
                              type="number"
                              value={equalSpaceConfig[target]?.number_desired || 1000}
                              onChange={(e) => {
                                setEqualSpaceConfig(prev => ({
                                  ...prev,
                                  [target]: {
                                    number_desired: parseInt(e.target.value)
                                  }
                                }));
                              }}
                              size="small"
                            />
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No targets available. Please add targets first.
                    </Typography>
                  )}
                </Paper>
              </Collapse>

              {/* Remove Overlap Configuration */}
              <Collapse in={enableRemoveOverlap}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    🚫 Overlap Removal 
                  </Typography>
                  <Box sx={{ maxWidth: 300 }}>
                    <TextField
                      fullWidth
                      label="Overlap Threshold"
                      type="number"
                      value={overlapThreshold}
                      onChange={handleOverlapThresholdChange}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">bp</InputAdornment>,
                      }}
                      size="small"
                    />
                  </Box>
                </Paper>
              </Collapse>

              {/* Sorting Configuration */}
              <Collapse in={enableSorting}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    🔄 Sorting 
                  </Typography>
                  <Stack spacing={2}>
                    {sortOptions.map((option, index) => (
                      <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={3}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Category</InputLabel>
                              <Select
                                value={option.category}
                                onChange={(e) => {
                                  const category = e.target.value;
                                  const newOptions = [...sortOptions];
                                  newOptions[index] = { ...option, category, field: '' };
                                  setSortOptions(newOptions);
                                }}
                              >
                                {getAvailableSortFields().map((cat) => (
                                  <MenuItem key={cat.category} value={cat.category}>
                                    {cat.icon} {cat.category}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Sort Field</InputLabel>
                              <Select
                                value={option.field}
                                onChange={(e) => handleSortOptionChange(index, e.target.value, option.order)}
                                disabled={!option.category}
                              >
                                {option.category && getAvailableSortFields()
                                  .find(cat => cat.category === option.category)
                                  ?.fields.map((field) => (
                                    <MenuItem key={field.value} value={field.value}>
                                      {field.label}
                                    </MenuItem>
                                  ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Order</InputLabel>
                              <Select
                                value={option.order}
                                onChange={(e) => handleSortOptionChange(index, option.field, e.target.value as 'asc' | 'desc')}
                                disabled={!option.field}
                              >
                                <MenuItem value="asc">Ascending⬆️</MenuItem>
                                <MenuItem value="desc">Descending⬇️</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <IconButton 
                              onClick={() => handleRemoveSortOption(index)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAddSortOption}
                      size="small"
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Add Sort Option
                    </Button>
                  </Stack>
                </Paper>
              </Collapse>
            </Stack>
          </CardContent>
        </Collapse>
      </Card>

      {/* Task Name */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="📝 Task Name" 
          subheader="Give your task a unique name to easily identify it (optional - will auto-generate if empty)"
          action={
            <IconButton onClick={() => toggleSection('taskName')}>
              {expandedSections.taskName ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
        />
        <Collapse in={expandedSections.taskName}>
          <CardContent>
            <TextField
              fullWidth
              label="Task Name (Optional)"
              placeholder={probeType ? `Auto-generated: ${generateAutoTaskName()}` : "Select probe type first"}
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              helperText="Leave empty to auto-generate based on probe type and timestamp"
            />
          </CardContent>
        </Collapse>
      </Card>

      <Divider sx={{ my: 4 }} />

      {/* Submit button and progress bar */}
      <Box display="flex" justifyContent="center" alignItems="center" mt={4}>
        <Button
          variant="contained"
          color={isSubmitting ? 'secondary' : 'primary'}
          onClick={handleSubmitTask}
          disabled={isSubmitting}
          size="large"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Task'}
        </Button>
      </Box>

      {/* Progress bar */}
      {isSubmitting && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}
      

      {/* Alert */}
      <Snackbar open={alertOpen} autoHideDuration={6000} onClose={handleAlertClose}>
        <Alert onClose={handleAlertClose} severity={alertSeverity} sx={{ width: '100%', whiteSpace: 'pre-line' }}>
          {alertMessage}
        </Alert>
      </Snackbar>

      {/* Custom Probe Types Dialog */}
      <Dialog
        open={showCustomProbeTypes}
        onClose={() => setShowCustomProbeTypes(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Custom Probe Types</Typography>
            <IconButton onClick={() => setShowCustomProbeTypes(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {customProbeTypes.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No custom probe types available
            </Typography>
          ) : (
            <List>
              {customProbeTypes.map((type) => (
                <ListItem
                  key={type.id}
                  divider
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemText
                    primary={type.name}
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        Created: {new Date(type.createdAt).toLocaleDateString()}<br />
                        Barcode Count: {type.barcodeCount}<br />
                        Target Length: {type.targetLength}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleDownload(type)}
                      title="Download YAML"
                      sx={{ mr: 1 }}
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(type.id)}
                      title="Delete"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* Attribute Selection Dialog */}
      <Dialog
        open={showAttributeDialog}
        onClose={() => setShowAttributeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Attribute</Typography>
            <IconButton onClick={() => setShowAttributeDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
              {getAllAttributeOptions().map((option) => {
                const isDisabled = isAttributeOptionDisabled(option.type);
                return (
                  <Grid item xs={12} sm={6} key={option.id}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleAddAttribute(option.id)}
                      disabled={isDisabled}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2,
                        opacity: isDisabled ? 0.5 : 1
                      }}
                    >
                      <Typography variant="h4" sx={{ mb: 1 }}>{option.icon}</Typography>
                      <Typography variant="body1">{option.label}</Typography>
                      {isDisabled && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          {option.type === 'dna' ? 'DNA only' : 'RNA only'}
                        </Typography>
                      )}
                    </Button>
                  </Grid>
                );
              })}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Edit Attribute Dialog */}
      <Dialog
        open={showEditAttributeDialog}
        onClose={() => setShowEditAttributeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Edit Attribute</Typography>
            <IconButton onClick={() => setShowEditAttributeDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              {(editingAttribute?.name === 'gcContent' || editingAttribute?.name === 'gc_content') && '🧬 GC Content'}
              {(editingAttribute?.name === 'foldScore' || editingAttribute?.name === 'fold_score') && '📊 Fold Score'}
              {editingAttribute?.name === 'tm' && '🌡️ Melting Temperature'}
              {(editingAttribute?.name === 'selfMatch' || editingAttribute?.name === 'self_match') && '🔍 Self Match'}
              {(editingAttribute?.name === 'mappedGenes' || editingAttribute?.name === 'mapped_genes') && '🧬 Mapped Genes'}
              {(editingAttribute?.name === 'kmerCount' || editingAttribute?.name === 'kmer_count') && '🔢 K-mer Count'}
              {(editingAttribute?.name === 'mappedSites' || editingAttribute?.name === 'mapped_sites') && '📍 Mapped Sites'}
            </Typography>
            <Grid container spacing={2}>
              {(editingAttribute?.name === 'gcContent' || editingAttribute?.name === 'gc_content' || editingAttribute?.name === 'tm') && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Min"
                      type="number"
                      value={editingAttribute?.min}
                      onChange={(e) => setEditingAttribute(prev => prev ? {
                        ...prev,
                        min: Number(e.target.value)
                      } : null)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Max"
                      type="number"
                      value={editingAttribute?.max}
                      onChange={(e) => setEditingAttribute(prev => prev ? {
                        ...prev,
                        max: Number(e.target.value)
                      } : null)}
                    />
                  </Grid>
                </>
              )}
              {(editingAttribute?.name === 'foldScore' || editingAttribute?.name === 'fold_score' || 
                editingAttribute?.name === 'selfMatch' || editingAttribute?.name === 'self_match' || 
                editingAttribute?.name === 'mappedGenes' || editingAttribute?.name === 'mapped_genes') && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Max"
                    type="number"
                    value={editingAttribute?.max}
                    onChange={(e) => setEditingAttribute(prev => prev ? {
                      ...prev,
                      max: Number(e.target.value)
                    } : null)}
                  />
                </Grid>
              )}
              {(editingAttribute?.name === 'kmerCount' || editingAttribute?.name === 'kmer_count') && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="K-mer Length"
                    type="number"
                    value={editingAttribute?.kmer_len}
                    onChange={(e) => setEditingAttribute(prev => prev ? {
                      ...prev,
                      kmer_len: Number(e.target.value)
                    } : null)}
                  />
                </Grid>
              )}
              {(editingAttribute?.name === 'mappedGenes' || editingAttribute?.name === 'mapped_genes' || 
                editingAttribute?.name === 'kmerCount' || editingAttribute?.name === 'kmer_count' || 
                editingAttribute?.name === 'mappedSites' || editingAttribute?.name === 'mapped_sites') && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Aligner</InputLabel>
                    <Select
                      value={editingAttribute?.aligner || 'BLAST'}
                      onChange={(e) =>                       setEditingAttribute(prev => prev ? {
                        ...prev,
                        aligner: e.target.value as 'blast' | 'bowtie2' | 'mmseqs2' | 'jellyfish'
                      } : null)}
                    >
                      <MenuItem value="blast">BLAST</MenuItem>
                      <MenuItem value="bowtie2">Bowtie2</MenuItem>
                      <MenuItem value="mmseqs2">MMseqs2</MenuItem>
                      <MenuItem value="jellyfish">Jellyfish</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditAttributeDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveAttribute} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>


    </Container>
  );
};

export default DesignWorkflow;
