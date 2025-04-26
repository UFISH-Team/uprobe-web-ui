import React, { useEffect, useState } from 'react';
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
  Menu, 
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
  Paper,
  DialogActions,
  Tooltip
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import Papa from 'papaparse';
import useDesignStore from '../store/designStore';
import ApiService from '../api';
import { CustomProbeType, extractParametersFromYaml } from '../types';

import { Container } from '../style';

type AlignerType = 'BLAST' | 'Bowtie2' | 'MMseqs2';

interface TargetConfig {
  source: string;
  sequence: string;
  length: number;
  attributes?: Record<string, any>;
}

interface PartConfig {
  expr: string;
  attributes?: Record<string, any>;
}

interface ProbeConfig {
  template: string;
  parts: Record<string, PartConfig>;
  attributes?: Record<string, any>;
}

interface TargetAttributes {
  gcContent?: {
    min?: number;
    max?: number;
    enabled: boolean;
  };
  foldScore?: {
    max?: number;
    enabled: boolean;
  };
  tm?: {
    min?: number;
    max?: number;
    enabled: boolean;
  };
  selfMatch?: {
    max?: number;
    enabled: boolean;
  };
  mappedGenes?: {
    max?: number;
    aligner?: AlignerType;
    enabled: boolean;
  };
  specific?: {
    threshold?: number;
    aligner?: AlignerType;
    enabled: boolean;
  };
}

interface AttributeValue {
  name: string;
  min?: number;
  max?: number;
  threshold?: number;
  aligner?: 'BLAST' | 'Bowtie2' | 'MMseqs2';
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

interface Pool {
  name: string;
  location: string;
  numbers: number;
  density: number;
  [key: string]: string | number;  // Allow dynamic barcode fields
}

interface DnaFishParams {
  poolList: Pool[];
}

const DesignWorkflow: React.FC = () => {
  const [speciesOptions, setSpeciesOptions] = useState<string[]>([]);
  const [barcodeOptions, setBarcodeOptions] = useState<string[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [customProbeTypes, setCustomProbeTypes] = useState<CustomProbeType[]>([]);
  const [showCustomProbeTypes, setShowCustomProbeTypes] = useState(false);
  const [selectedCustomType, setSelectedCustomType] = useState<CustomProbeType | null>(null);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    taskName: true,
    species: true,
    probeType: true,
    targetParams: true,
    geneMap: true
  });
  const [showAttributeDialog, setShowAttributeDialog] = useState(false);
  const [showEditAttributeDialog, setShowEditAttributeDialog] = useState(false);
  const [showPartSelectionDialog, setShowPartSelectionDialog] = useState(false);
  const [currentAttributeType, setCurrentAttributeType] = useState<'target' | 'probe' | 'part'>('target');
  const [currentProbeName, setCurrentProbeName] = useState<string>('');
  const [currentPartName, setCurrentPartName] = useState<string>('');
  const [editingAttribute, setEditingAttribute] = useState<AttributeValue | null>(null);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [showPostProcess, setShowPostProcess] = useState(true);
  const [overlapThreshold, setOverlapThreshold] = useState(20);
  const [barcodeFromFile, setBarcodeFromFile] = useState<{[key: string]: boolean}>({});
  const [poolBarcodeFromFile, setPoolBarcodeFromFile] = useState<{[key: string]: boolean}>({});

  const {
    // State
    taskName,
    probeType,
    species,
    geneList,
    minLength,
    overlap,
    dnaFishParams,
    isSubmitting,
    progress,
    alertOpen,
    alertMessage,
    alertSeverity,
    
    // Actions
    setTaskName,
    setProbeType,
    setSpecies,
    setGeneList,
    addGene,
    removeGene,
    updateGene,
    setMinLength,
    setOverlap,
    setDnaFishParams,
    addPool,
    removePool,
    updatePool,
    setAlert,
    setSubmitting,
    setProgress,
    navigateToJobs,
  } = useDesignStore();

  const attributeOptions = [
    { id: 'gcContent', label: 'GC Content', icon: '🧬' },
    { id: 'foldScore', label: 'Fold Score', icon: '📊' },
    { id: 'tm', label: 'Melting Temperature', icon: '🌡️' },
    { id: 'selfMatch', label: 'Self Match', icon: '🔍' },
    { id: 'mappedGenes', label: 'Mapped Genes', icon: '🧬' },
    { id: 'specific', label: 'Specificity', icon: '🎯' }
  ];

  const sortCategories: SortCategory[] = [
    {
      category: 'Target Sequence',
      icon: '🎯',
      fields: [
        { value: 'target.gcContent', label: 'GC Content' },
        { value: 'target.foldScore', label: 'Fold Score' },
        { value: 'target.tm', label: 'Melting Temperature' },
        { value: 'target.selfMatch', label: 'Self Match' },
        { value: 'target.mappedGenes', label: 'Mapped Genes' },
        { value: 'target.specific', label: 'Specificity' },
        { value: 'target.length', label: 'Length' }
      ]
    },
    {
      category: 'Whole Probe',
      icon: '🧬',
      fields: [
        { value: 'probe.gcContent', label: 'GC Content' },
        { value: 'probe.foldScore', label: 'Fold Score' },
        { value: 'probe.tm', label: 'Melting Temperature' },
        { value: 'probe.selfMatch', label: 'Self Match' },
        { value: 'probe.mappedGenes', label: 'Mapped Genes' },
        { value: 'probe.specific', label: 'Specificity' },
        { value: 'probe.length', label: 'Length' }
      ]
    }
  ];

  // Fetch species and barcode options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [speciesResponse, barcodeResponse] = await Promise.all([
          ApiService.getGenomes(),
          ApiService.getBarcodeOptions(),
        ]);
        setSpeciesOptions(speciesResponse);
        setBarcodeOptions(barcodeResponse);
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    };
    fetchOptions();
  }, []);

  // Extract loadCustomProbeTypes function
  const loadCustomProbeTypes = () => {
    const savedGroups = JSON.parse(localStorage.getItem('savedProbeGroups') || '[]');
    const customTypes = savedGroups
      .filter((group: any) => group.type === 'custom')
      .map((group: any) => ({
        id: group.id,
        name: group.name,
        type: 'custom',
        yamlContent: group.yamlContent,
        createdAt: new Date(group.createdAt),
        updatedAt: new Date(group.updatedAt),
        barcodeCount: group.barcodeCount,
        targetLength: group.targetLength,
        overlap: group.overlap,
        probes: group.probes || {}
      }));
    setCustomProbeTypes(customTypes);
  };

  // Add this useEffect to load custom probe types
  useEffect(() => {
    loadCustomProbeTypes();
    
    // Add event listener for storage changes
    window.addEventListener('storage', loadCustomProbeTypes);
    
    return () => {
      window.removeEventListener('storage', loadCustomProbeTypes);
    };
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, section: string) => {
    setMenuAnchor(event.currentTarget);
    setActiveSection(section);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleResetGeneList = () => {
    setGeneList([{ gene: '' }]);
    setBarcodeFromFile({});
    setAlert(true, 'Gene list has been reset', 'success');
  };

  const handleResetPoolList = () => {
    setDnaFishParams({ 
      poolList: [{ name: '', location: '', numbers: 8000, density: 0.00005 }] 
    });
    setPoolBarcodeFromFile({});
    setAlert(true, 'Pool list has been reset', 'success');
  };

  const handleGeneCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Reset file input
      event.target.value = '';
      
      Papa.parse(file, {
        header: true,
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
            if (selectedCustomType?.barcodeCount) {
              for (let i = 1; i <= selectedCustomType.barcodeCount; i++) {
                const barcodeKey = `barcode${i}`;
                newBarcodeFromFile[barcodeKey] = barcodeColumns.includes(barcodeKey);
              }
            }
            setBarcodeFromFile(newBarcodeFromFile);

            const parsedData = results.data.map((row, index) => {
              // Validate required fields
              if (!row['gene']) {
                throw new Error(`Row ${index + 2}: Missing required field 'gene'`);
              }

              // Create the gene object with gene name
              const geneObj: any = { gene: row['gene'] };
              
              // Add barcode fields
              if (selectedCustomType?.barcodeCount) {
                for (let i = 1; i <= selectedCustomType.barcodeCount; i++) {
                  const barcodeKey = `barcode${i}`;
                  // Check if the barcode exists in the file
                  if (barcodeColumns.includes(barcodeKey)) {
                    geneObj[barcodeKey] = row[barcodeKey] || '';
                  } else {
                    geneObj[barcodeKey] = '';
                  }
                }
              }

              return geneObj;
            });
            setGeneList(parsedData);
            setAlert(true, 'Gene list uploaded successfully', 'success');
          } catch (error) {
            setAlert(true, error instanceof Error ? error.message : 'Error parsing gene list file', 'error');
          }
        },
        error: (error: Error) => {
          setAlert(true, `Error parsing file: ${error.message}`, 'error');
        }
      });
    }
  };

  const handlePoolCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Reset file input
      event.target.value = '';
      
      Papa.parse(file, {
        header: true,
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
            if (selectedCustomType?.barcodeCount) {
              for (let i = 1; i <= selectedCustomType.barcodeCount; i++) {
                const barcodeKey = `barcode${i}`;
                newBarcodeFromFile[barcodeKey] = barcodeColumns.includes(barcodeKey);
              }
            }
            setPoolBarcodeFromFile(newBarcodeFromFile);

            const parsedData = results.data.map((row, index) => {
              // Validate required fields
              if (!row['name'] || !row['location'] || !row['numbers'] || !row['density']) {
                throw new Error(`Row ${index + 2}: Missing required fields. Each row must have name, location, numbers, and density.`);
              }

              // Validate location format
              if (!row['location'].match(/^chr\d*:\d+-\d+$/)) {
                throw new Error(`Row ${index + 2}: Invalid location format. Should be like 'chr1:100-200'`);
              }

              // Validate numbers and density are numeric
              const numbers = Number(row['numbers']);
              const density = Number(row['density']);
              if (isNaN(numbers) || isNaN(density)) {
                throw new Error(`Row ${index + 2}: Numbers and density must be numeric values`);
              }

              const poolObj: any = {
                name: row['name'],
                location: row['location'],
                numbers: numbers,
                density: density,
              };

              // Add barcode fields
              if (selectedCustomType?.barcodeCount) {
                for (let i = 1; i <= selectedCustomType.barcodeCount; i++) {
                  const barcodeKey = `barcode${i}`;
                  if (barcodeColumns.includes(barcodeKey)) {
                    poolObj[barcodeKey] = row[barcodeKey] || '';
                  } else {
                    poolObj[barcodeKey] = '';
                  }
                }
              }

              return poolObj;
            });
            setDnaFishParams({ poolList: parsedData });
            setAlert(true, 'Pool list uploaded successfully', 'success');
          } catch (error) {
            setAlert(true, error instanceof Error ? error.message : 'Error parsing pool list file', 'error');
          }
        },
        error: (error: Error) => {
          setAlert(true, `Error parsing file: ${error.message}`, 'error');
        }
      });
    }
  };

  const handleAlertClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlert(false, '', 'success');
  };

  // Modify the handleProbeTypeSelect function
  const handleProbeTypeSelect = (type: string) => {
    setProbeType(type);
    setShowCustomProbeTypes(false);
    if (type !== 'RCA' && type !== 'DNA-FISH') {
      const customType = customProbeTypes.find(t => t.name === type);
      if (customType) {
        console.log('Debug - Found custom type:', customType);
        const parameters = extractParametersFromYaml(customType.yamlContent);
        console.log('Debug - YAML parameters:', parameters);
        if (parameters && parameters.target_sequence) {
          const targetConfig = {
            source: parameters.target_sequence.source,
            sequence: parameters.target_sequence.sequence,
            length: parameters.target_sequence.length,
            attributes: parameters.target_sequence.attributes || {}
          };
          console.log('Debug - Constructed targetConfig:', targetConfig);
          const updatedCustomType = {
            ...customType,
            targetLength: parameters.targetLength,
            barcodeCount: parameters.barcodeCount,
            probes: parameters.probes,
            targetConfig
          };
          console.log('Debug - Updated custom type:', updatedCustomType);
          setSelectedCustomType(updatedCustomType);
          // Set default target length from YAML or custom type
          if (customType.targetLength) {
            setMinLength(customType.targetLength);
          } else if (parameters.targetLength) {
            setMinLength(parameters.targetLength);
          } else {
            setMinLength(100);
          }
          // Set default overlap if specified in YAML
          if (parameters.overlap) {
            setOverlap(parameters.overlap);
          } else {
            setOverlap(20);
          }
        } else {
          console.log('Debug - Failed to parse YAML parameters or missing target_sequence');
          setSelectedCustomType(customType);
          if (customType.targetLength) {
            setMinLength(customType.targetLength);
          } else {
            setMinLength(100);
          }
          setOverlap(20);
        }
      } else {
        console.log('Debug - Custom type not found');
        setSelectedCustomType(null);
        setMinLength(100);
        setOverlap(20);
      }
    } else {
      setSelectedCustomType(null);
      if (type === 'RCA') {
        setMinLength(100);
        setOverlap(20);
      } else if (type === 'DNA-FISH') {
        setMinLength(50);
        setOverlap(10);
      }
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
  const handleDelete = (typeId: string) => {
    const savedGroups = JSON.parse(localStorage.getItem('savedProbeGroups') || '[]');
    const updatedGroups = savedGroups.filter((group: any) => group.id !== typeId);
    localStorage.setItem('savedProbeGroups', JSON.stringify(updatedGroups));
    loadCustomProbeTypes(); // Reload the list
    setAlert(true, 'Custom probe type deleted successfully', 'success');
  };

  // Add new function to handle attribute editing
  const handleEditAttribute = (attribute: Partial<AttributeValue>) => {
    const updatedAttribute: AttributeValue = {
      name: attribute.name || '',
      min: attribute.min || 0,
      max: attribute.max || 100,
      threshold: attribute.threshold,
      aligner: attribute.aligner,
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
      mappedGenes: { max: 5, aligner: 'BLAST', enabled: true },
      specific: { threshold: 80, aligner: 'BLAST', enabled: true }
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

  // Modify the handlePartSelect function
  const handlePartSelect = (probeName: string, partName: string) => {
    setCurrentProbeName(probeName);
    setCurrentPartName(partName);
    setShowPartSelectionDialog(false);
    if (editingAttribute) {
      setShowEditAttributeDialog(true);
    } else {
      setShowAttributeDialog(true);
    }
  };

  // Add new function to handle part selection button click
  const handlePartSelectionClick = () => {
    setShowPartSelectionDialog(true);
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

    const chipProps = {
      size: "small" as const,
      variant: "outlined" as const,
      sx: { height: 20, fontSize: '0.7rem', cursor: 'pointer' },
      onClick: () => handleAttributeClick(probeName, partName, attrName, attrValue)
    };

    switch(attrName) {
      case 'gcContent':
        return (
          <Chip
            {...chipProps}
            label={`GC: ${attrValue.min}%-${attrValue.max}%`}
            color="primary"
          />
        );
      case 'foldScore':
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
        return (
          <Chip
            {...chipProps}
            label={`Self: max ${attrValue.max}`}
            color="warning"
          />
        );
      case 'mappedGenes':
        return (
          <Chip
            {...chipProps}
            label={`Map: max ${attrValue.max}${attrValue.aligner ? ` (${attrValue.aligner})` : ''}`}
            color="info"
          />
        );
      case 'specific':
        return (
          <Chip
            {...chipProps}
            label={`Spec: ${attrValue.threshold}%${attrValue.aligner ? ` (${attrValue.aligner})` : ''}`}
            color="success"
          />
        );
      default:
        return null;
    }
  };

  const isGenomeLikeSource = () => {
    console.log('Debug - selectedCustomType:', selectedCustomType);
    
    if (!selectedCustomType?.yamlContent) {
      return false;
    }

    const yamlContent = selectedCustomType.yamlContent;
    const sourceMatch = yamlContent.match(/target_sequence:\s*\n\s*source:\s*['"]?([^'\n]+)['"]?/);
    const extractedSource = sourceMatch ? sourceMatch[1] : null;
    
    return extractedSource === 'genome';
  };

  const handleAddProbe = () => {
    if (!selectedCustomType) return;
    
    const newProbeName = `probe${Object.keys(selectedCustomType.probes || {}).length + 1}`;
    const updatedType = {
      ...selectedCustomType,
      probes: {
        ...selectedCustomType.probes,
        [newProbeName]: {
          template: '',
          parts: {},
          attributes: {}
        }
      }
    };
    setSelectedCustomType(updatedType);
  };

  const handleAddPart = (probeName: string) => {
    if (!selectedCustomType) return;
    
    const probe = selectedCustomType.probes?.[probeName];
    if (!probe) return;
    
    const newPartName = `part${Object.keys(probe.parts).length + 1}`;
    const updatedType = {
      ...selectedCustomType,
      probes: {
        ...selectedCustomType.probes,
        [probeName]: {
          ...probe,
          parts: {
            ...probe.parts,
            [newPartName]: {
              expr: '',
              attributes: {}
            }
          }
        }
      }
    };
    setSelectedCustomType(updatedType);
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

  // 根据选中的探针类型动态生成排序选项
  const getAvailableSortFields = (): SortCategory[] => {
    if (!selectedCustomType) return [];

    const categories: SortCategory[] = [];
    
    // 添加目标序列属性
    if (selectedCustomType.targetConfig?.attributes) {
      const targetFields: SortField[] = [];
      Object.entries(selectedCustomType.targetConfig.attributes).forEach(([key, value]) => {
        if (value.enabled) {
          const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
          targetFields.push({
            value: `target.${key}`,
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

    // 添加探针属性
    if (selectedCustomType.probes) {
      const probeFields: SortField[] = [];
      Object.entries(selectedCustomType.probes).forEach(([probeName, probe]) => {
        if (probe.attributes) {
          Object.entries(probe.attributes).forEach(([key, value]) => {
            if (value.enabled) {
              const fieldLabel = `Probe: ${probeName} - ${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}`;
              probeFields.push({
                value: `probe.${probeName}.${key}`,
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

      // 添加探针部分属性
      const partFields: SortField[] = [];
      Object.entries(selectedCustomType.probes).forEach(([probeName, probe]) => {
        if (probe.parts) {
          Object.entries(probe.parts).forEach(([partName, part]) => {
            if (part.attributes) {
              Object.entries(part.attributes).forEach(([key, value]) => {
                if (value.enabled) {
                  const fieldLabel = `Probe: ${probeName} - Part: ${partName} - ${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}`;
                  partFields.push({
                    value: `part.${probeName}.${partName}.${key}`,
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

  // 当探针类型改变时重置排序选项
  useEffect(() => {
    setSortOptions([]);
  }, [selectedCustomType]);

  const getActiveSteps = () => {
    const steps = [
      { label: 'Task Name', completed: !!taskName },
      { label: 'Species', completed: !!species },
      { label: 'Probe Type', completed: !!probeType }
    ];

    if (selectedCustomType) {
      steps.push({ label: 'Custom Probe Parameters', completed: true });
    }

    if (probeType === 'RCA' || probeType === 'DNA-FISH' || selectedCustomType) {
      const hasInput = probeType === 'RCA' 
        ? geneList.length > 0 
        : dnaFishParams.poolList.length > 0;
      steps.push(
        { label: 'Sample Input', completed: hasInput }
      );
    }

    steps.push({ 
      label: 'Post Processing', 
      completed: sortOptions.length > 0 || overlapThreshold !== 20 
    });

    return steps;
  };

  const generateTaskConfig = () => {
    const config: any = {
      name: taskName,
      description: 'Protocol for designing probe type ' + probeType + ' from ' + species,
      species,
      probe_type: probeType,
      parameters: {
        min_length: minLength,
        overlap,
        post_processing: {
          sort_options: sortOptions,
          overlap_threshold: overlapThreshold
        }
      }
    };

    // Add custom probe type parameters if selected
    if (selectedCustomType) {
      config.parameters.custom_probe = {
        target_config: selectedCustomType.targetConfig,
        probes: selectedCustomType.probes,
        target_length: selectedCustomType.targetLength,
        barcode_count: selectedCustomType.barcodeCount
      };
    }

    // Add input data based on probe type
    if (probeType === 'RCA') {
      config.parameters.input = {
        type: 'gene_list',
        data: geneList
      };
    } else if (probeType === 'DNA-FISH' || (selectedCustomType && isGenomeLikeSource())) {
      config.parameters.input = {
        type: 'pool_list',
        data: dnaFishParams.poolList
      };
    } else if (selectedCustomType) {
      config.parameters.input = {
        type: 'gene_list',
        data: geneList
      };
    }

    return config;
  };

  const handleSubmitTask = async () => {
    try {
      setSubmitting(true);
      setProgress(0);

      // Generate the complete task configuration
      const taskConfig = generateTaskConfig();

      // Submit the task
      const response = await ApiService.submitTask(taskConfig);
      
      setAlert(true, 'Task submitted successfully!', 'success');
      setProgress(100);
      
      // Navigate to tasks page after a short delay
      setTimeout(() => {
        navigateToJobs();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit task:', error);
      setAlert(true, 'Failed to submit task. Please try again.', 'error');
      setProgress(0);
    } finally {
      setSubmitting(false);
    }
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

      {/* Task Name */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="📝 Task Name" 
          subheader="Give your task a unique name to easily identify it"
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
              label="Task Name"
              placeholder="Enter the task name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />
          </CardContent>
        </Collapse>
      </Card>

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
                >
                  <MenuItem value="RCA">RCA</MenuItem>
                  <MenuItem value="DNA-FISH">DNA-FISH</MenuItem>
                  {customProbeTypes.map((type) => (
                    <MenuItem key={type.id} value={type.name}>
                      {type.name} 
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button
                variant="outlined"
                onClick={() => setShowCustomProbeTypes(true)}
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
                              label={
                                attrName === 'gcContent' ? `GC: ${attrValue.min}%-${attrValue.max}%` :
                                attrName === 'foldScore' ? `Fold: max ${attrValue.max}` :
                                attrName === 'tm' ? `Tm: ${attrValue.min}°C-${attrValue.max}°C` :
                                attrName === 'selfMatch' ? `Self: max ${attrValue.max}` :
                                attrName === 'mappedGenes' ? `Map: max ${attrValue.max}${attrValue.aligner ? ` (${attrValue.aligner})` : ''}` :
                                attrName === 'specific' ? `Spec: ${attrValue.threshold}%${attrValue.aligner ? ` (${attrValue.aligner})` : ''}` :
                                `${attrName}: ${formatAttributeValue(attrValue)}`
                              }
                              color={
                                attrName === 'gcContent' ? 'primary' :
                                attrName === 'foldScore' ? 'secondary' :
                                attrName === 'tm' ? 'error' :
                                attrName === 'selfMatch' ? 'warning' :
                                attrName === 'mappedGenes' ? 'info' :
                                attrName === 'specific' ? 'success' :
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

                      {selectedCustomType.probes && Object.entries(selectedCustomType.probes).map(([probeName, probeConfig]) => (
                        <Accordion key={probeName} sx={{ mb: 2 }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                Probe: {probeName}
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
                              {probeConfig.attributes && Object.entries(probeConfig.attributes).map(([attrName, attrValue]) => (
                                renderAttributeChip(probeName, null, attrName, attrValue)
                              ))}
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
                                      Part: {partName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Part of probe {probeName}
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
                                    {Object.entries(partConfig.attributes).map(([attrName, attrValue]) => (
                                      renderAttributeChip(probeName, partName, attrName, attrValue)
                                    ))}
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
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </CardContent>
        </Collapse>
      </Card>

      {/* Gene Barcode Map or Pool List */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title={probeType === 'RCA' ? '🔢 RCA Gene Barcode Map' : 
                 probeType === 'DNA-FISH' ? '🔢 DNA-FISH Pool List' : 
                 isGenomeLikeSource() ? '🔢 DNA FISH Pool List' :
                 '🔢 RNA FISH Gene Map'} 
          subheader={probeType === 'RCA' ? 
            'Manually input gene names and select the corresponding barcodes.' :
            probeType === 'DNA-FISH' ? 
            'Provide pool list for DNA FISH including name, location(chr:start-end), numbers, and density.' :
            isGenomeLikeSource() ?
            'Provide pool list for DNA FISH including name, location(chr:start-end), numbers, and density.' :
            'Input gene names and select barcodes according to your custom probe type configuration.'}
          action={
            <IconButton onClick={() => toggleSection('geneMap')}>
              {expandedSections.geneMap ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
        />
        <Collapse in={expandedSections.geneMap}>
          <CardContent>
            {probeType === 'RCA' && (
              <>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AddIcon />}
                  >
                    Upload genelist csv/txt
                    <input
                      type="file"
                      hidden
                      accept=".csv,.txt"
                      onChange={handleGeneCsvUpload}
                    />
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleResetGeneList}
                  >
                    Reset Gene List
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  {selectedCustomType?.barcodeCount ? 
                    `CSV/TXT format: gene${Array.from({ length: selectedCustomType.barcodeCount }, (_, i) => `,barcode${i + 1}`).join('')} (one line per gene)` :
                    'CSV/TXT format: gene (one line per gene)'}<br />
                  Note: Barcodes can be loaded from file or selected from dropdown
                </Typography>

                {geneList.map((item, index) => (
                  <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 1 }}>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Gene"
                        value={item.gene}
                        onChange={(e) => updateGene(index, 'gene', e.target.value)}
                      />
                    </Grid>

                    {selectedCustomType?.barcodeCount ? (
                      Array.from({ length: selectedCustomType.barcodeCount }).map((_, barcodeIndex) => {
                        const barcodeKey = `barcode${barcodeIndex + 1}`;
                        return (
                          <Grid item xs={3} key={barcodeIndex}>
                            {barcodeFromFile[barcodeKey] ? (
                              <TextField
                                fullWidth
                                label={`Barcode ${barcodeIndex + 1}`}
                                value={(item as any)[barcodeKey] || ''}
                                onChange={(e) => updateGene(index, barcodeKey as keyof typeof item, e.target.value)}
                              />
                            ) : (
                              <FormControl fullWidth>
                                <InputLabel>Barcode {barcodeIndex + 1}</InputLabel>
                                <Select
                                  value={(item as any)[barcodeKey] || ''}
                                  onChange={(e) => updateGene(index, barcodeKey as keyof typeof item, e.target.value)}
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
                      <IconButton onClick={() => removeGene(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addGene}
                  sx={{ mt: 2 }}
                >
                  Add Gene
                </Button>
              </>
            )}

            {(probeType === 'DNA-FISH' || (probeType !== 'RCA' && selectedCustomType && isGenomeLikeSource())) && (
              <>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AddIcon />}
                  >
                    Upload poollist csv/txt
                    <input
                      type="file"
                      hidden
                      accept=".csv,.txt"
                      onChange={handlePoolCsvUpload}
                    />
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleResetPoolList}
                  >
                    Reset Pool List
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  CSV/TXT format: name,location,numbers,density{selectedCustomType?.barcodeCount ? 
                    Array.from({ length: selectedCustomType.barcodeCount }, (_, i) => `,barcode${i + 1}`).join('') : ''} (one line per pool)<br />
                  location format: chr:start-end (e.g., chr1:100-200)<br />
                  numbers and density should be numeric values (e.g., 8000,0.11)<br />
                  Example:<br />
                  name,location,numbers,density{selectedCustomType?.barcodeCount ? 
                    Array.from({ length: selectedCustomType.barcodeCount }, (_, i) => `,barcode${i + 1}`).join('') : ''}<br />
                  pool1,chr1:100-200,8000,0.11{selectedCustomType?.barcodeCount ? 
                    Array.from({ length: selectedCustomType.barcodeCount }, (_, i) => `,barcode${i + 1}_value`).join('') : ''}
                </Typography>
                {dnaFishParams.poolList.map((pool, index) => (
                  <Grid container spacing={2} key={index} sx={{ mb: 1 }}>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={pool.name}
                        onChange={(e) => updatePool(index, 'name', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Location"
                        value={pool.location}
                        onChange={(e) => updatePool(index, 'location', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField
                        fullWidth
                        label="Numbers"
                        type="number"
                        value={pool.numbers}
                        onChange={(e) => updatePool(index, 'numbers', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField
                        fullWidth
                        label="Density"
                        type="number"
                        value={pool.density}
                        onChange={(e) => updatePool(index, 'density', Number(e.target.value))}
                      />
                    </Grid>
                    {selectedCustomType?.barcodeCount ? (
                      Array.from({ length: selectedCustomType.barcodeCount }).map((_, barcodeIndex) => {
                        const barcodeKey = `barcode${barcodeIndex + 1}`;
                        return (
                          <Grid item xs={2} key={barcodeIndex}>
                            {poolBarcodeFromFile[barcodeKey] ? (
                              <TextField
                                fullWidth
                                label={`Barcode ${barcodeIndex + 1}`}
                                value={(pool as any)[barcodeKey] || ''}
                                onChange={(e) => updatePool(index, barcodeKey, e.target.value)}
                              />
                            ) : (
                              <FormControl fullWidth>
                                <InputLabel>Barcode {barcodeIndex + 1}</InputLabel>
                                <Select
                                  value={(pool as any)[barcodeKey] || ''}
                                  onChange={(e) => updatePool(index, barcodeKey, e.target.value)}
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
                      <IconButton onClick={() => removePool(index)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => addPool()}
                  sx={{ mt: 1 }}
                >
                  Add Pool
                </Button>
              </>
            )}

            {probeType !== 'RCA' && probeType !== 'DNA-FISH' && selectedCustomType && !isGenomeLikeSource() && (
              <>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AddIcon />}
                  >
                    Upload genelist csv/txt
                    <input
                      type="file"
                      hidden
                      accept=".csv,.txt"
                      onChange={handleGeneCsvUpload}
                    />
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleResetGeneList}
                  >
                    Reset Gene List
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  {selectedCustomType?.barcodeCount ? 
                    `CSV/TXT format: gene${Array.from({ length: selectedCustomType.barcodeCount }, (_, i) => `,barcode${i + 1}`).join('')} (one line per gene)` :
                    'CSV/TXT format: gene (one line per gene)'}<br />
                  Note: Barcodes can be loaded from file or selected from dropdown
                </Typography>

                {geneList.map((item, index) => (
                  <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 1 }}>
                    <Grid item xs={12 - (selectedCustomType?.barcodeCount || 0) * 3}>
                      <TextField
                        fullWidth
                        label="Gene"
                        value={item.gene}
                        onChange={(e) => updateGene(index, 'gene', e.target.value)}
                      />
                    </Grid>
                    {Array.from({ length: selectedCustomType?.barcodeCount || 0 }).map((_, barcodeIndex) => {
                      const barcodeKey = `barcode${barcodeIndex + 1}`;
                      return (
                        <Grid item xs={3} key={barcodeIndex}>
                          {barcodeFromFile[barcodeKey] ? (
                            <TextField
                              fullWidth
                              label={`Barcode ${barcodeIndex + 1}`}
                              value={(item as any)[barcodeKey] || ''}
                              onChange={(e) => updateGene(index, barcodeKey as keyof typeof item, e.target.value)}
                            />
                          ) : (
                            <FormControl fullWidth>
                              <InputLabel>Barcode {barcodeIndex + 1}</InputLabel>
                              <Select
                                value={(item as any)[barcodeKey] || ''}
                                onChange={(e) => updateGene(index, barcodeKey as keyof typeof item, e.target.value)}
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
                    })}
                    <Grid item xs={2}>
                      <IconButton onClick={() => removeGene(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addGene}
                  sx={{ mt: 2 }}
                >
                  Add Gene
                </Button>
              </>
            )}
          </CardContent>
        </Collapse>
      </Card>

      {/* Post Processing Step */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="🛠️ Post Processing"
          subheader="Sorting the probes by the selected attributes and remove overlap"
          action={
            <IconButton onClick={() => setShowPostProcess(!showPostProcess)}>
              {showPostProcess ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
        />
        <Collapse in={showPostProcess}>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                • Sorting Options
              </Typography>
              {sortOptions.map((option, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <FormControl sx={{ minWidth: 250 }}>
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
                  <FormControl sx={{ minWidth: 250 }}>
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
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Order</InputLabel>
                    <Select
                      value={option.order}
                      onChange={(e) => handleSortOptionChange(index, option.field, e.target.value as 'asc' | 'desc')}
                      disabled={!option.field}
                    >
                      <MenuItem value="asc">⬆️ Ascending</MenuItem>
                      <MenuItem value="desc">⬇️ Descending</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton onClick={() => handleRemoveSortOption(index)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddSortOption}
                sx={{ mt: 1 }}
              >
                Add Sort Option
              </Button>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>
              • Remove Overlap
              </Typography>
              <TextField
                label="Overlap Threshold (bp)"
                type="number"
                value={overlapThreshold}
                onChange={handleOverlapThresholdChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">bp</InputAdornment>,
                }}
                sx={{ width: 200 }}
              />
            </Box>
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
        <Alert onClose={handleAlertClose} severity={alertSeverity} sx={{ width: '100%' }}>
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
            {attributeOptions.map((option) => (
              <Grid item xs={12} sm={6} key={option.id}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleAddAttribute(option.id)}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2
                  }}
                >
                  <Typography variant="h4" sx={{ mb: 1 }}>{option.icon}</Typography>
                  <Typography variant="body1">{option.label}</Typography>
                </Button>
              </Grid>
            ))}
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
              {editingAttribute?.name === 'gcContent' && '🧬 GC Content'}
              {editingAttribute?.name === 'foldScore' && '📊 Fold Score'}
              {editingAttribute?.name === 'tm' && '🌡️ Melting Temperature'}
              {editingAttribute?.name === 'selfMatch' && '🔍 Self Match'}
              {editingAttribute?.name === 'mappedGenes' && '🧬 Mapped Genes'}
              {editingAttribute?.name === 'specific' && '🎯 Specificity'}
            </Typography>
            <Grid container spacing={2}>
              {(editingAttribute?.name === 'gcContent' || editingAttribute?.name === 'tm') && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Minimum Value"
                      type="number"
                      value={editingAttribute?.min}
                      onChange={(e) => setEditingAttribute(prev => prev ? {
                        ...prev,
                        min: Number(e.target.value)
                      } : null)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Maximum Value"
                      type="number"
                      value={editingAttribute?.max}
                      onChange={(e) => setEditingAttribute(prev => prev ? {
                        ...prev,
                        max: Number(e.target.value)
                      } : null)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  </Grid>
                </>
              )}
              {(editingAttribute?.name === 'foldScore' || editingAttribute?.name === 'selfMatch') && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Maximum Value"
                    type="number"
                    value={editingAttribute?.max}
                    onChange={(e) => setEditingAttribute(prev => prev ? {
                      ...prev,
                      max: Number(e.target.value)
                    } : null)}
                  />
                </Grid>
              )}
              {editingAttribute?.name === 'specific' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Threshold"
                    type="number"
                    value={editingAttribute?.threshold}
                    onChange={(e) => setEditingAttribute(prev => prev ? {
                      ...prev,
                      threshold: Number(e.target.value)
                    } : null)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>
              )}
              {(editingAttribute?.name === 'mappedGenes' || editingAttribute?.name === 'specific') && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Aligner</InputLabel>
                    <Select
                      value={editingAttribute?.aligner || 'BLAST'}
                      onChange={(e) => setEditingAttribute(prev => prev ? {
                        ...prev,
                        aligner: e.target.value as 'BLAST' | 'Bowtie2' | 'MMseqs2'
                      } : null)}
                    >
                      <MenuItem value="BLAST">BLAST</MenuItem>
                      <MenuItem value="Bowtie2">Bowtie2</MenuItem>
                      <MenuItem value="MMseqs2">MMseqs2</MenuItem>
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

      {/* Part Selection Dialog */}
      <Dialog
        open={showPartSelectionDialog}
        onClose={() => setShowPartSelectionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Select Part</Typography>
            <IconButton onClick={() => setShowPartSelectionDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {selectedCustomType?.probes && 
              Object.entries(selectedCustomType.probes).map(([probeName, probeConfig]) => (
                probeConfig.parts && Object.entries(probeConfig.parts).map(([partName, partConfig]) => (
                  <ListItem
                    key={`${probeName}-${partName}`}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handlePartSelect(probeName, partName)}
                  >
                    <ListItemText
                      primary={partName}
                      secondary={`Part of probe ${probeName}`}
                    />
                  </ListItem>
                ))
              ))}
          </List>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default DesignWorkflow;