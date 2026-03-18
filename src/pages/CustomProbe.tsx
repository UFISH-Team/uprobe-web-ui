import React, { useState, useEffect } from "react";
import yaml from 'js-yaml';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  IconButton, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  Grid,
  Divider,
  Chip,
  Tooltip,
  useMediaQuery,
  Container,
  Card,
  CardContent,
  Alert,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Switch,
  Tab,
  Tabs,
  Snackbar
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import {useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FlipIcon from '@mui/icons-material/Flip';
import ScienceIcon from '@mui/icons-material/Science';
import SettingsIcon from '@mui/icons-material/Settings';
import DnaIcon from '@mui/icons-material/Biotech';
import RefreshIcon from '@mui/icons-material/Refresh';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import HistoryIcon from '@mui/icons-material/History';
import TuneIcon from '@mui/icons-material/Tune';
import FilterListIcon from '@mui/icons-material/FilterList';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import CategoryIcon from '@mui/icons-material/Category';
import ApiService from '../api';

// Styled components
const StyledContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: "0 auto",
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  }
}));

const SequenceDisplay = styled(Box)(({ theme }) => ({
  fontFamily: "monospace",
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.shape.borderRadius,
  overflowX: "auto",
  letterSpacing: "0.1em",
  fontSize: "0.85rem",
  minHeight: "2.5rem",
  display: "flex",
  alignItems: "center",
  border: `1px solid ${theme.palette.grey[200]}`,
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2),
    fontSize: "0.9rem",
  },
}));

const ProbePart = styled(Box, {
  shouldForwardProp: (prop) => prop !== "partType"
})<{ partType: string }>(({ theme, partType }) => {
  const colors: Record<string, string> = {
    target: theme.palette.primary.light,
    barcode: theme.palette.secondary.light,
    fixed: theme.palette.warning.light,
    external: theme.palette.info.light,
    probe: theme.palette.success.light,
  };
  
  return {
    display: "inline-block",
    padding: "2px 8px",
    margin: "0 4px",
    borderRadius: "4px",
    backgroundColor: colors[partType] || theme.palette.grey[300],
  };
});

const SectionTitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const ProbeCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  position: 'relative',
  overflow: 'visible',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
  '&:before': {
    content: '""',
    position: 'absolute',
    left: '50%',
    bottom: -16,
    width: 2,
    height: 16,
    backgroundColor: theme.palette.divider,
    display: 'none',
  },
  '&:not(:last-child):before': {
    display: 'block',
  },
}));

const ProbeCardHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.grey[50],
  borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
}));

const AttributeChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  '& .MuiChip-label': {
    fontSize: '0.75rem',
  }
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3,
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  minWidth: 0,
  [theme.breakpoints.up('sm')]: {
    minWidth: 0,
  },
}));

// Reverse complement function
const reverseComplement = (sequence: string): string => {
  const complementMap: Record<string, string> = {
    'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G',
    'a': 't', 't': 'a', 'g': 'c', 'c': 'g',
    'N': 'N', 'n': 'n'
  };
  
  return sequence
    .split('')
    .reverse()
    .map(base => complementMap[base] || base)
    .join('');
};

// Type definitions
type TargetSource = 'genome' | 'exon' | 'CDS' | 'UTR';
type PartSource = 'target' | 'barcode' | 'fixed' | 'external' | 'probe';
type AlignerType = 'Bowtie2' | 'BLAST' | 'MMseqs2';

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
  kmerCount?: {
    kmer_len?: number;
    aligner?: AlignerType;
    enabled: boolean;
  };
  mappedSites?: {
    aligner?: AlignerType;
    enabled: boolean;
  };
}

interface TargetConfig {
  source: TargetSource;
  sequence: string;
  length: number;
  attributes: TargetAttributes;
}

interface PartAttributes {
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
  kmerCount?: {
    kmer_len?: number;
    aligner?: AlignerType;
    enabled: boolean;
  };
  mappedSites?: {
    aligner?: AlignerType;
    enabled: boolean;
  };
}

interface ProbePart {
  id: string;
  source: PartSource;
  sequence: string;
  startPos?: number | '';
  endPos?: number | '';
  isReverseComplement: boolean;
  label: string;
  sourceProbeId?: string;
  sourceStartPos?: number | '';
  sourceEndPos?: number | '';
  attributes?: PartAttributes; // Add attributes to individual parts
}

interface ProbeAttributes {
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
  kmerCount?: {
    kmer_len?: number;
    aligner?: AlignerType;
    enabled: boolean;
  };
  mappedSites?: {
    aligner?: AlignerType;
    enabled: boolean;
  };
}

interface Probe {
  id: string;
  parts: ProbePart[];
  isComplete: boolean;
  name?: string;
  attributes?: ProbeAttributes; // Add attributes to whole probe
}

interface ProbeGroup {
  id: string;
  name: string;
  probes: Probe[];
  createdAt: Date;
  updatedAt: Date;
  isSaved?: boolean;
  type: string;
  yamlContent: string;
  barcodeCount: number;
  targetLength: number;
  targetConfig?: TargetConfig;
}

interface AttributeValue {
  min?: number;
  max?: number;
  threshold?: number;
}

interface YAMLAttributes {
  gc_content?: AttributeValue;
  fold_score?: { max?: number };
  tm?: AttributeValue;
  self_match?: { max?: number };
  mapped_genes?: { max?: number; aligner?: AlignerType };
  kmer_count?: { kmer_len?: number; aligner?: AlignerType };
  mapped_sites?: { aligner?: AlignerType };
  aligners?: AlignerType[];
}

interface YAMLPartConfig {
  length?: number;
  expr: string;
  attributes?: YAMLAttributes;
}

interface YAMLProbeConfig {
  template: string;
  parts: { [key: string]: YAMLPartConfig };
  attributes?: YAMLAttributes;
}

interface YAMLProbes {
  [key: string]: YAMLProbeConfig;
}

interface YAMLTargetSequence {
  source: string;
  sequence: string;
  length: number;
  attributes: {
    gc_content?: {
      min?: number;
      max?: number;
    };
    fold_score?: {
      max?: number;
    };
    tm?: {
      min?: number;
      max?: number;
    };
    self_match?: {
      max?: number;
    };
    mapped_genes?: {
      max?: number;
      aligner?: AlignerType;
    };
    kmer_count?: {
      kmer_len?: number;
      aligner?: AlignerType;
    };
    mapped_sites?: {
      aligner?: AlignerType;
    };
  };
}

interface YAMLTarget {
  target_sequence: YAMLTargetSequence;
}

// Helper function to create properly typed default attributes
const createDefaultAttributes = (): ProbeAttributes => ({
  gcContent: { min: 40, max: 60, enabled: false },
  foldScore: { max: 40, enabled: false },
  tm: { min: 60, max: 75, enabled: false },
  selfMatch: { max: 4, enabled: false },
  mappedGenes: { max: 5, aligner: 'Bowtie2' as AlignerType, enabled: false },
  kmerCount: { kmer_len: 35, aligner: 'Bowtie2' as AlignerType, enabled: false },
  mappedSites: { aligner: 'Bowtie2' as AlignerType, enabled: false }
});

const convertProbesToYAML = (probes: Probe[], targetLength: number, barcodes: {[key: string]: string}, barcodeLengths: {[key: string]: number}, targetConfig: TargetConfig): string => {
  const yamlProbes: YAMLProbes = {};
  
  // Add barcode configuration  
  const barcodeYaml = {
    barcodes: {
      count: Object.keys(barcodes).length,
      barcodes: Object.fromEntries(
        Object.entries(barcodes).map(([key, sequence]) => [
          key, 
          { 
            length: barcodeLengths[key]
          }
        ])
      )
    }
  };
  
  // Add target configuration
  const targetYaml: YAMLTarget = {
    target_sequence: {
      source: targetConfig.source,
      sequence: targetConfig.sequence,
      length: targetConfig.length,
      attributes: {
        gc_content: targetConfig.attributes.gcContent?.enabled ? {
          min: targetConfig.attributes.gcContent.min,
          max: targetConfig.attributes.gcContent.max
        } : undefined,
        fold_score: targetConfig.attributes.foldScore?.enabled ? {
          max: targetConfig.attributes.foldScore.max
        } : undefined,
        tm: targetConfig.attributes.tm?.enabled ? {
          min: targetConfig.attributes.tm.min,
          max: targetConfig.attributes.tm.max
        } : undefined,
        self_match: targetConfig.attributes.selfMatch?.enabled ? {
          max: targetConfig.attributes.selfMatch.max
        } : undefined,
        mapped_genes: targetConfig.attributes.mappedGenes?.enabled ? {
          max: targetConfig.attributes.mappedGenes.max,
          aligner: targetConfig.attributes.mappedGenes.aligner
        } : undefined,
        kmer_count: targetConfig.attributes.kmerCount?.enabled ? {
          kmer_len: targetConfig.attributes.kmerCount.kmer_len,
          aligner: targetConfig.attributes.kmerCount.aligner
        } : undefined,
        mapped_sites: targetConfig.attributes.mappedSites?.enabled ? {
          aligner: targetConfig.attributes.mappedSites.aligner
        } : undefined
      }
    }
  };
  
  probes.forEach((probe, index) => {
    if (!probe.isComplete) return;  // 这里会跳过未完成的probe
    
    const probeName = probe.name || `probe_${index + 1}`;
    const parts: { [key: string]: YAMLPartConfig } = {};
    let templateParts: string[] = [];
    
    // Add probe-level attributes if any
    const probeAttributes: YAMLAttributes = {};
    if (probe.attributes?.gcContent?.enabled) {
      probeAttributes.gc_content = {
        min: probe.attributes.gcContent.min,
        max: probe.attributes.gcContent.max
      };
    }
    if (probe.attributes?.foldScore?.enabled) {
      probeAttributes.fold_score = {
        max: probe.attributes.foldScore.max
      };
    }
    if (probe.attributes?.tm?.enabled) {
      probeAttributes.tm = {
        min: probe.attributes.tm.min,
        max: probe.attributes.tm.max
      };
    }
    if (probe.attributes?.selfMatch?.enabled) {
      probeAttributes.self_match = {
        max: probe.attributes.selfMatch.max
      };
    }
    if (probe.attributes?.mappedGenes?.enabled) {
      probeAttributes.mapped_genes = {
        max: probe.attributes.mappedGenes.max,
        aligner: probe.attributes.mappedGenes.aligner
      };
    }
    if (probe.attributes?.kmerCount?.enabled) {
      probeAttributes.kmer_count = {
        kmer_len: probe.attributes.kmerCount.kmer_len,
        aligner: probe.attributes.kmerCount.aligner
      };
    }
    if (probe.attributes?.mappedSites?.enabled) {
      probeAttributes.mapped_sites = {
        aligner: probe.attributes.mappedSites.aligner
      };
    }
    
    probe.parts.forEach((part, partIndex) => {
      const partName = `part${partIndex + 1}`;
      templateParts.push(`{${partName}}`);
      
      // Build part configuration
      const partConfig: YAMLPartConfig = {
        length: part.sequence.length,
        expr: ''
      };
      
      // Add part-level attributes if any
      if (part.attributes) {
        partConfig.attributes = {};
        if (part.attributes.gcContent?.enabled) {
          partConfig.attributes.gc_content = {
            min: part.attributes.gcContent.min,
            max: part.attributes.gcContent.max
          };
        }
        if (part.attributes.foldScore?.enabled) {
          partConfig.attributes.fold_score = {
            max: part.attributes.foldScore.max
          };
        }
        if (part.attributes.tm?.enabled) {
          partConfig.attributes.tm = {
            min: part.attributes.tm.min,
            max: part.attributes.tm.max
          };
        }
        if (part.attributes.selfMatch?.enabled) {
          partConfig.attributes.self_match = {
            max: part.attributes.selfMatch.max
          };
        }
        if (part.attributes.mappedGenes?.enabled) {
          partConfig.attributes.mapped_genes = {
            max: part.attributes.mappedGenes.max,
            aligner: part.attributes.mappedGenes.aligner
          };
        }
        if (part.attributes.kmerCount?.enabled) {
          partConfig.attributes.kmer_count = {
            kmer_len: part.attributes.kmerCount.kmer_len,
            aligner: part.attributes.kmerCount.aligner
          };
        }
        if (part.attributes.mappedSites?.enabled) {
          partConfig.attributes.mapped_sites = {
            aligner: part.attributes.mappedSites.aligner
          };
        }
      }
      
      if (part.source === 'target') {
        const start = Number(part.startPos);
        const end = Number(part.endPos);
        partConfig.expr = part.isReverseComplement 
          ? `rc(target_region[${start - 1}:${end}])`
          : `target_region[${start - 1}:${end}]`;
      } else if (part.source === 'barcode') {
        const barcodeName = part.label.split(': ')[1];
        partConfig.expr = `encoding[target]['${barcodeName}']`;
      } else if (part.source === 'fixed') {
        partConfig.expr = `'${part.sequence}'`;
      } else if (part.source === 'probe') {
        const sourceProbe = probes.find(p => p.id === part.sourceProbeId);
        if (sourceProbe) {
          const sourceProbeName = sourceProbe.name || `probe_${probes.findIndex(p => p.id === part.sourceProbeId) + 1}`;
          const start = Number(part.sourceStartPos);
          const end = Number(part.sourceEndPos);
          partConfig.expr = part.isReverseComplement
            ? `rc(${sourceProbeName}[${start - 1}:${end}])`
            : `${sourceProbeName}[${start - 1}:${end}]`;
        }
      }
      
      parts[partName] = partConfig;
    });
    
    yamlProbes[probeName] = {
      template: templateParts.join(''),
      parts: parts,
      attributes: Object.keys(probeAttributes).length > 0 ? probeAttributes : undefined
    };
  });
  
  return `${yaml.dump(barcodeYaml)}\n${yaml.dump(targetYaml)}\nprobes:\n${yaml.dump(yamlProbes)}`;
};

const CustomProbe: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Target sequence state
  const [targetLength, setTargetLength] = useState<number>(50);
  const [targetSequence, setTargetSequence] = useState<string>('');
  const [targetConfig, setTargetConfig] = useState<TargetConfig>({
    source: 'genome',
    sequence: '',
    length: 100,
    attributes: {
      gcContent: { min: 40, max: 60, enabled: false },
      foldScore: { max: 40, enabled: false },
      tm: { min: 60, max: 75, enabled: false },
      selfMatch: { max: 4, enabled: false },
      mappedGenes: { max: 5, aligner: 'Bowtie2' as AlignerType, enabled: false },
      kmerCount: { kmer_len: 35, aligner: 'Bowtie2' as AlignerType, enabled: false },
      mappedSites: { aligner: 'Bowtie2' as AlignerType, enabled: false }
    }
  });

  // Available aligners
  const availableAligners: AlignerType[] = ['BLAST', 'Bowtie2', 'MMseqs2'];
  
  // Probes state
  const [probes, setProbes] = useState<Probe[]>([
    { 
      id: '1', 
      parts: [], 
      isComplete: false,
      attributes: {
        gcContent: { min: 40, max: 60, enabled: false },
        foldScore: { max: 40, enabled: false },
        tm: { min: 60, max: 75, enabled: false },
        selfMatch: { max: 4, enabled: false },
        mappedGenes: { max: 5, aligner: 'BLAST', enabled: false },
        kmerCount: { kmer_len: 15, aligner: 'BLAST', enabled: false },
        mappedSites: { aligner: 'BLAST', enabled: false }
      }
    }
  ]);
  
  // Probe group state
  const [probeGroup, setProbeGroup] = useState<ProbeGroup>({
    id: Date.now().toString(),
    name: `Probe_${Math.floor(Math.random() * 10000)}`,
    probes: probes,
    createdAt: new Date(),
    updatedAt: new Date(),
    type: 'custom',
    yamlContent: '',
    barcodeCount: 0,
    targetLength: 0
  });
  
  // History state
  const [savedProbeGroups, setSavedProbeGroups] = useState<ProbeGroup[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  
  // For design panel
  const [activeProbeIndex, setActiveProbeIndex] = useState<number>(0);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    '1': true
  });
  
  // Alert state
  const [alertState, setAlertState] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Tab state for probe attributes
  const [attributeTab, setAttributeTab] = useState<number>(0);
  const [showAttributes, setShowAttributes] = useState<Record<string, boolean>>({});
  
  // Simple barcode state for backward compatibility and YAML export
  const [barcodes, setBarcodes] = useState<{[key: string]: string}>({
  });
  
  // Barcode length management
  const [barcodeLengths, setBarcodeLengths] = useState<{[key: string]: number}>({
  });
  
  const [defaultBarcodeLength, setDefaultBarcodeLength] = useState<number>(12);
  
  // State for editing part attributes
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [editingProbeId, setEditingProbeId] = useState<string | null>(null);
  const [editingTargetAttributes, setEditingTargetAttributes] = useState<boolean>(false);
  
  // State for new part
  const [newPart, setNewPart] = useState<{
    source: PartSource;
    sequence: string;
    startPos: string;
    endPos: string;
    isReverseComplement: boolean;
    externalType: string;
    externalName: string;
    customFixedSequence: string;
    sourceProbeId: string;
    sourceStartPos: string;
    sourceEndPos: string;
    attributes?: PartAttributes;
  }>({
    source: 'target',
    sequence: '',
    startPos: '1',
    endPos: '10',
    isReverseComplement: false,
    externalType: 'barcode',
    externalName: '',
    customFixedSequence: '',
    sourceProbeId: '',
    sourceStartPos: '1',
    sourceEndPos: '10',
    attributes: {
      gcContent: { min: 40, max: 60, enabled: false },
      foldScore: { max: 40, enabled: false },
      tm: { min: 60, max: 75, enabled: false },
      selfMatch: { max: 4, enabled: false },
      mappedGenes: { max: 5, aligner: 'BLAST', enabled: false },
      kmerCount: { kmer_len: 15, aligner: 'BLAST', enabled: false },
      mappedSites: { aligner: 'BLAST', enabled: false }
    }
  });
  
  // Generate random sequence as Target when targetLength changes
  useEffect(() => {
    generateRandomSequence(targetLength);
  }, [targetLength]);

  // Load saved probe groups on mount
  useEffect(() => {
    const loadSavedGroups = async () => {
      try {
        const groups = await ApiService.getCustomProbes();
        setSavedProbeGroups(groups);
      } catch (error) {
        console.error('Failed to load saved probes:', error);
        showAlert('Failed to load saved probes', 'error');
      }
    };
    loadSavedGroups();
  }, []);
  
  const generateRandomSequence = (length: number) => {
    const bases = ['A', 'T', 'G', 'C'];
    let sequence = '';
    for (let i = 0; i < length; i++) {
      sequence += bases[Math.floor(Math.random() * bases.length)];
    }
    setTargetSequence(sequence);
    setTargetConfig(prev => ({
      ...prev,
      sequence,
      length
    }));
  };
  
  // Add function to generate random barcode
  const generateRandomBarcode = (length: number) => {
    const bases = ['A', 'C', 'G', 'T'];
    let sequence = '';
    for (let i = 0; i < length; i++) {
      sequence += bases[Math.floor(Math.random() * bases.length)];
    }
    return sequence;
  };
  
  // Add function to add new barcode
  const addNewBarcode = () => {
    const newSequence = generateRandomBarcode(defaultBarcodeLength);
    const newBarcodeName = `BC${Object.keys(barcodes).length + 1}`;
    setBarcodes(prev => ({
      ...prev,
      [newBarcodeName]: newSequence
    }));
    setBarcodeLengths(prev => ({
      ...prev,
      [newBarcodeName]: defaultBarcodeLength
    }));
    showAlert(`New barcode ${newBarcodeName} generated!`, 'success');
  };
  
  // Modify the handleTargetLengthChange function
  const handleTargetLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const length = parseInt(e.target.value, 10);
    if (!isNaN(length)) {
      setTargetLength(length);
      generateRandomSequence(length);
      if (length < 10 || length > 1000) {
        showAlert('Recommended sequence length is between 10 and 1000 base pairs', 'warning');
      }
    }
  };
  
  // Handle expanding/collapsing probe cards
  const toggleExpandCard = (probeId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [probeId]: !prev[probeId]
    }));
  };
  
  // Get completed probes for selection
  const getCompletedProbes = () => {
    return probes.filter(probe => 
      probe.id !== probes[activeProbeIndex].id && // Not the current probe
      probe.isComplete && // Must be complete
      probe.parts.length > 0 // Must have parts
    );
  };
  
  // Get probe by id
  const getProbeById = (probeId: string) => {
    return probes.find(p => p.id === probeId);
  };
  
  // Get probe sequence by id
  const getProbeSequenceById = (probeId: string): string => {
    const probe = getProbeById(probeId);
    if (!probe) return '';
    return probe.parts.map(part => part.sequence).join('');
  };
  
  // Update new part form
  const handleNewPartChange = (field: string, value: any) => {
    if (field === 'source') {
      // Reset related fields based on source type
      const resetState = {
        sequence: '',
        startPos: '1',
        endPos: Math.min(10, targetSequence.length).toString(),
        isReverseComplement: false,
        externalType: 'barcode',
        externalName: '',
        customFixedSequence: '',
        sourceProbeId: '',
        sourceStartPos: '1',
        sourceEndPos: '10'
      };
      
      setNewPart(prev => ({
        ...prev,
        ...resetState,
        [field]: value
      }));
    } else if (field === 'startPos' || field === 'endPos') {
      setNewPart(prev => {
        const newState = { ...prev, [field]: value };
        if (newState.source === 'target' && newState.startPos && newState.endPos) {
          const start = parseInt(newState.startPos, 10);
          const end = parseInt(newState.endPos, 10);
          if (!isNaN(start) && !isNaN(end) && validatePositions(start.toString(), end.toString(), targetSequence.length)) {
            newState.sequence = targetSequence.substring(start - 1, end);
          }
        }
        return newState;
      });
    } else if (field === 'sourceStartPos' || field === 'sourceEndPos') {
      setNewPart(prev => {
        const newState = { ...prev, [field]: value };
        if (newState.source === 'probe' && newState.sourceProbeId && newState.sourceStartPos && newState.sourceEndPos) {
          const probe = getProbeById(newState.sourceProbeId);
          if (probe) {
            const fullSequence = getProbeFullSequence(probe);
            const start = parseInt(newState.sourceStartPos, 10);
            const end = parseInt(newState.sourceEndPos, 10);
            if (!isNaN(start) && !isNaN(end) && validatePositions(start.toString(), end.toString(), fullSequence.length)) {
              newState.sequence = fullSequence.substring(start - 1, end);
            }
          }
        }
        return newState;
      });
    } else if (field === 'externalName') {
      let sequence = '';
      if (newPart.externalType === 'barcode' && barcodes[value]) {
        sequence = barcodes[value];
      }
      
      setNewPart(prev => ({
        ...prev,
        externalName: value,
        sequence
      }));
    } else if (field === 'customFixedSequence') {
      if (value === '' || validateSequence(value)) {
        setNewPart(prev => ({
          ...prev,
          customFixedSequence: value,
          sequence: value
        }));
      } else {
        showAlert('Invalid sequence. Only A, T, G, C bases are allowed', 'error');
      }
    } else if (field === 'externalType') {
      setNewPart(prev => ({
        ...prev,
        externalType: value,
        externalName: '',
        customFixedSequence: '',
        sequence: ''
      }));
    } else if (field === 'sourceProbeId') {
      const sequence = getProbeSequenceById(value);
      if (sequence) {
        setNewPart(prev => ({
          ...prev,
          sourceProbeId: value,
          sequence
        }));
      }
    } else if (field.startsWith('attributes.')) {
      // Handle attribute changes
      const [_, attributeType, property] = field.split('.');
      setNewPart(prev => {
        const updatedAttributes = { ...prev.attributes };
        if (attributeType === 'gcContent') {
          updatedAttributes.gcContent = {
            ...updatedAttributes.gcContent,
            [property]: property === 'enabled' ? value : Number(value),
            enabled: property === 'enabled' ? value : (updatedAttributes.gcContent?.enabled || false)
          };
        } else if (attributeType === 'foldScore') {
          updatedAttributes.foldScore = {
            ...updatedAttributes.foldScore,
            [property]: property === 'enabled' ? value : Number(value),
            enabled: property === 'enabled' ? value : (updatedAttributes.foldScore?.enabled || false)
          };
        } else if (attributeType === 'tm') {
          updatedAttributes.tm = {
            ...updatedAttributes.tm,
            [property]: property === 'enabled' ? value : Number(value),
            enabled: property === 'enabled' ? value : (updatedAttributes.tm?.enabled || false)
          };
        } else if (attributeType === 'selfMatch') {
          updatedAttributes.selfMatch = {
            ...updatedAttributes.selfMatch,
            [property]: property === 'enabled' ? value : Number(value),
            enabled: property === 'enabled' ? value : (updatedAttributes.selfMatch?.enabled || false)
          };
        } else if (attributeType === 'mappedGenes') {
          updatedAttributes.mappedGenes = {
            ...updatedAttributes.mappedGenes,
            [property]: property === 'enabled' ? value : 
                        property === 'aligner' ? value : Number(value),
            enabled: property === 'enabled' ? value : (updatedAttributes.mappedGenes?.enabled || false)
          };
        } else if (attributeType === 'kmerCount') {
          updatedAttributes.kmerCount = {
            ...updatedAttributes.kmerCount,
            [property]: property === 'enabled' ? value : 
                        property === 'aligner' ? value : Number(value),
            enabled: property === 'enabled' ? value : (updatedAttributes.kmerCount?.enabled || false)
          };
        } else if (attributeType === 'mappedSites') {
          updatedAttributes.mappedSites = {
            ...updatedAttributes.mappedSites,
            [property]: property === 'enabled' ? value : value,
            enabled: property === 'enabled' ? value : (updatedAttributes.mappedSites?.enabled || false)
          };
        }
        return {
          ...prev,
          attributes: updatedAttributes
        };
      });
    } else {
      setNewPart(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  
  // Update probe attributes
  const handleProbeAttributeChange = (probeIndex: number, field: string, value: any) => {
    const [attributeType, property] = field.split('.');
    setProbes(prev => {
      const updatedProbes = [...prev];
      const probe = { ...updatedProbes[probeIndex] };
      
      if (!probe.attributes) {
        probe.attributes = {
          gcContent: { min: 40, max: 60, enabled: false },
          foldScore: { max: 40, enabled: false },
          tm: { min: 60, max: 75, enabled: false },
          selfMatch: { max: 4, enabled: false },
          mappedGenes: { max: 5, aligner: 'BLAST', enabled: false },
          kmerCount: { kmer_len: 15, aligner: 'BLAST', enabled: false },
        mappedSites: { aligner: 'BLAST', enabled: false }
        };
      }
      
      if (attributeType === 'gcContent') {
        probe.attributes.gcContent = {
          ...probe.attributes.gcContent,
          [property]: property === 'enabled' ? value : Number(value),
          enabled: property === 'enabled' ? value : (probe.attributes.gcContent?.enabled || false)
        };
      } else if (attributeType === 'foldScore') {
        probe.attributes.foldScore = {
          ...probe.attributes.foldScore,
          [property]: property === 'enabled' ? value : Number(value),
          enabled: property === 'enabled' ? value : (probe.attributes.foldScore?.enabled || false)
        };
      } else if (attributeType === 'tm') {
        probe.attributes.tm = {
          ...probe.attributes.tm,
          [property]: property === 'enabled' ? value : Number(value),
          enabled: property === 'enabled' ? value : (probe.attributes.tm?.enabled || false)
        };
      } else if (attributeType === 'selfMatch') {
        probe.attributes.selfMatch = {
          ...probe.attributes.selfMatch,
          [property]: property === 'enabled' ? value : Number(value),
          enabled: property === 'enabled' ? value : (probe.attributes.selfMatch?.enabled || false)
        };
      } else if (attributeType === 'mappedGenes') {
        probe.attributes.mappedGenes = {
          ...probe.attributes.mappedGenes,
          [property]: property === 'enabled' ? value : 
                     property === 'aligner' ? value : Number(value),
          enabled: property === 'enabled' ? value : (probe.attributes.mappedGenes?.enabled || false)
        };
      } else if (attributeType === 'kmerCount') {
        probe.attributes.kmerCount = {
          ...probe.attributes.kmerCount,
          [property]: property === 'enabled' ? value : 
                     property === 'aligner' ? value : Number(value),
          enabled: property === 'enabled' ? value : (probe.attributes.kmerCount?.enabled || false)
        };
      } else if (attributeType === 'mappedSites') {
        probe.attributes.mappedSites = {
          ...probe.attributes.mappedSites,
          [property]: property === 'enabled' ? value : value,
          enabled: property === 'enabled' ? value : (probe.attributes.mappedSites?.enabled || false)
        };
      }
      
      updatedProbes[probeIndex] = probe;
      return updatedProbes;
    });
  };
  
  // Update part attributes
  const handlePartAttributeChange = (probeIndex: number, partIndex: number, field: string, value: any) => {
    const [attributeType, property] = field.split('.');
    setProbes(prev => {
      const updatedProbes = [...prev];
      const updatedParts = [...updatedProbes[probeIndex].parts];
      const part = { ...updatedParts[partIndex] };
      
      if (!part.attributes) {
        part.attributes = {
          gcContent: { min: 40, max: 60, enabled: false },
          foldScore: { max: 40, enabled: false },
          tm: { min: 60, max: 75, enabled: false },
          selfMatch: { max: 4, enabled: false },
          mappedGenes: { max: 5, aligner: 'BLAST', enabled: false },
          kmerCount: { kmer_len: 15, aligner: 'BLAST', enabled: false },
        mappedSites: { aligner: 'BLAST', enabled: false }
        };
      }
      
      if (attributeType === 'gcContent') {
        part.attributes.gcContent = {
          ...part.attributes.gcContent,
          [property]: property === 'enabled' ? value : Number(value),
          enabled: property === 'enabled' ? value : (part.attributes.gcContent?.enabled || false)
        };
      } else if (attributeType === 'foldScore') {
        part.attributes.foldScore = {
          ...part.attributes.foldScore,
          [property]: property === 'enabled' ? value : Number(value),
          enabled: property === 'enabled' ? value : (part.attributes.foldScore?.enabled || false)
        };
      } else if (attributeType === 'tm') {
        part.attributes.tm = {
          ...part.attributes.tm,
          [property]: property === 'enabled' ? value : Number(value),
          enabled: property === 'enabled' ? value : (part.attributes.tm?.enabled || false)
        };
      } else if (attributeType === 'selfMatch') {
        part.attributes.selfMatch = {
          ...part.attributes.selfMatch,
          [property]: property === 'enabled' ? value : Number(value),
          enabled: property === 'enabled' ? value : (part.attributes.selfMatch?.enabled || false)
        };
      } else if (attributeType === 'mappedGenes') {
        part.attributes.mappedGenes = {
          ...part.attributes.mappedGenes,
          [property]: property === 'enabled' ? value : 
                     property === 'aligner' ? value : Number(value),
          enabled: property === 'enabled' ? value : (part.attributes.mappedGenes?.enabled || false)
        };
      } else if (attributeType === 'kmerCount') {
        part.attributes.kmerCount = {
          ...part.attributes.kmerCount,
          [property]: property === 'enabled' ? value : 
                     property === 'aligner' ? value : Number(value),
          enabled: property === 'enabled' ? value : (part.attributes.kmerCount?.enabled || false)
        };
      } else if (attributeType === 'mappedSites') {
        part.attributes.mappedSites = {
          ...part.attributes.mappedSites,
          [property]: property === 'enabled' ? value : value,
          enabled: property === 'enabled' ? value : (part.attributes.mappedSites?.enabled || false)
        };
      }
      
      updatedParts[partIndex] = part;
      updatedProbes[probeIndex].parts = updatedParts;
      return updatedProbes;
    });
  };
  
  // Apply reverse complement
  const toggleReverseComplement = () => {
    setNewPart(prev => ({
      ...prev,
      isReverseComplement: !prev.isReverseComplement,
      sequence: reverseComplement(prev.sequence)
    }));
  };
  
  // Add part to probe
  const addPartToProbe = () => {
    if (!newPart.sequence) {
      showAlert('Please select a sequence first', 'error');
      return;
    }

    if (newPart.externalType === 'fixed' && !validateSequence(newPart.customFixedSequence)) {
      showAlert('Invalid fixed sequence. Only A, T, G, C bases are allowed', 'error');
      return;
    }
    
    const partId = `probe${probes[activeProbeIndex].id}-part${probes[activeProbeIndex].parts.length + 1}`;
    
    let partLabel = '';
    let source: PartSource = newPart.source;
    let sourceProbeId: string | undefined = undefined;
    
    if (newPart.source === 'target') {
      partLabel = `target: ${newPart.startPos}-${newPart.endPos}`;
    } else if (newPart.source === 'external') {
      if (newPart.externalType === 'barcode') {
        partLabel = `barcode: ${newPart.externalName}`;
        source = 'barcode';
      } else if (newPart.externalType === 'fixed') {
        partLabel = `fixed: custom`;
        source = 'fixed';
      }
    } else if (newPart.source === 'probe') {
      partLabel = `probe: ${newPart.sourceProbeId} (${newPart.sourceStartPos}-${newPart.sourceEndPos})`;
      sourceProbeId = newPart.sourceProbeId;
    }
    
    const newProbePart: ProbePart = {
      id: partId,
      source,
      sequence: newPart.sequence,
      isReverseComplement: newPart.isReverseComplement,
      label: partLabel,
      sourceProbeId,
      startPos: newPart.source === 'target' ? parseInt(newPart.startPos, 10) : undefined,
      endPos: newPart.source === 'target' ? parseInt(newPart.endPos, 10) : undefined,
      sourceStartPos: newPart.source === 'probe' ? parseInt(newPart.sourceStartPos, 10) : undefined,
      sourceEndPos: newPart.source === 'probe' ? parseInt(newPart.sourceEndPos, 10) : undefined,
      attributes: newPart.attributes // Include attributes with the part
    };
    
    const updatedProbes = [...probes];
    updatedProbes[activeProbeIndex].parts.push(newProbePart);
    setProbes(updatedProbes);
    
    // Reset new part form
    setNewPart({
      source: 'target',
      sequence: '',
      startPos: '1',
      endPos: '10',
      isReverseComplement: false,
      externalType: 'barcode',
      externalName: '',
      customFixedSequence: '',
      sourceProbeId: '',
      sourceStartPos: '1',
      sourceEndPos: '10',
      attributes: {
        gcContent: { min: 40, max: 60, enabled: false },
        foldScore: { max: 40, enabled: false },
        tm: { min: 60, max: 75, enabled: false },
        selfMatch: { max: 4, enabled: false },
        mappedGenes: { max: 5, aligner: 'BLAST', enabled: false },
        kmerCount: { kmer_len: 15, aligner: 'BLAST', enabled: false },
        mappedSites: { aligner: 'BLAST', enabled: false }
      }
    });
    
    showAlert('Part added successfully!', 'success');
  };
  
  // Remove part from probe
  const removePart = (probeIndex: number, partIndex: number) => {
    const updatedProbes = [...probes];
    updatedProbes[probeIndex].parts.splice(partIndex, 1);
    setProbes(updatedProbes);
  };
  
  // Mark probe as complete (finalized)
  const completeProbe = (probeIndex: number) => {
    if (probes[probeIndex].parts.length === 0) {
      showAlert('Cannot complete an empty probe. Add at least one part.', 'error');
      return;
    }
    
    const updatedProbes = [...probes];
    updatedProbes[probeIndex].isComplete = true;
    setProbes(updatedProbes);
    
    showAlert(`Probe ${probes[probeIndex].id} design completed!`, 'success');
  };
  
  // Toggle probe completion status
  const toggleProbeCompletion = (probeIndex: number) => {
    const updatedProbes = [...probes];
    
    if (!updatedProbes[probeIndex].isComplete && updatedProbes[probeIndex].parts.length === 0) {
      showAlert('Cannot complete an empty probe. Add at least one part.', 'error');
      return;
    }
    
    updatedProbes[probeIndex].isComplete = !updatedProbes[probeIndex].isComplete;
    setProbes(updatedProbes);
    
    const status = updatedProbes[probeIndex].isComplete ? 'completed' : 'reopened for editing';
    showAlert(`Probe ${probes[probeIndex].id} design ${status}!`, 
      updatedProbes[probeIndex].isComplete ? 'success' : 'info');
  };
  
  // Add new probe
  const addProbe = () => {
    const newProbeId = (parseInt(probes[probes.length - 1].id) + 1).toString();
    const newProbe: Probe = { 
      id: newProbeId, 
      parts: [], 
      isComplete: false,
      attributes: createDefaultAttributes()
    };
    
    setProbes([...probes, newProbe]);
    setActiveProbeIndex(probes.length);
    
    // Expand the new probe card
    setExpandedCards(prev => ({
      ...prev,
      [newProbeId]: true
    }));
    
    showAlert('New probe added!', 'info');
  };
  
  // Remove probe
  const removeProbe = (index: number) => {
    if (probes.length <= 1) {
      showAlert('Cannot delete the only probe.', 'error');
      return;
    }
    
    // Check if any other probe uses this probe as a source
    const probeId = probes[index].id;
    const isUsedByOtherProbes = probes.some(probe => 
      probe.id !== probeId && probe.parts.some(part => 
        part.sourceProbeId === probeId
      )
    );
    
    if (isUsedByOtherProbes) {
      showAlert('Cannot delete this probe. It is used by other probes as a source.', 'error');
      return;
    }
    
    const deletedProbeId = probes[index].id;
    const updatedProbes = probes.filter((_, i) => i !== index);
    setProbes(updatedProbes);
    
    // Select first probe if current active probe is deleted
    if (activeProbeIndex === index) {
      setActiveProbeIndex(0);
    } else if (activeProbeIndex > index) {
      // Adjust index if deleted probe is before current active probe
      setActiveProbeIndex(activeProbeIndex - 1);
    }
    
    showAlert(`Probe ${deletedProbeId} deleted!`, 'info');
  };
  
  // Calculate full sequence of probe
  const getProbeFullSequence = (probe: Probe): string => {
    return probe.parts.map(part => part.sequence).join('');
  };
  
  // Validate sequence input to contain only valid bases
  const validateSequence = (sequence: string): boolean => {
    if (!sequence) {
      showAlert('Sequence cannot be empty', 'error');
      return false;
    }
    
    const validBases = /^[ATGCatgc]+$/;
    if (!validBases.test(sequence)) {
      showAlert('Sequence can only contain A, T, G, C bases (case insensitive)', 'error');
      return false;
    }
    
    return true;
  };
  
  // Validate positions
  const validatePositions = (start: string, end: string, maxLength: number): boolean => {
    if (!start || !end) {
      showAlert('Start and end positions cannot be empty', 'error');
      return false;
    }

    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);
    
    if (isNaN(startNum) || isNaN(endNum)) {
      showAlert('Start and end positions must be valid numbers', 'error');
      return false;
    }
    
    if (startNum < 1 || endNum < 1 || startNum > maxLength || endNum > maxLength) {
      showAlert(`Position must be between 1 and ${maxLength}`, 'error');
      return false;
    }
    
    if (startNum > endNum) {
      showAlert('Start position must be less than or equal to end position', 'error');
      return false;
    }
    
    return true;
  };

  // Show alert message
  const showAlert = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setAlertState({
      open: true,
      message,
      severity
    });
    
    // Auto close after 5 seconds
    setTimeout(() => {
      setAlertState(prev => ({ ...prev, open: false }));
    }, 5000);
  };
  
  // Handle probe group name change
  const handleProbeGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProbeGroup(prev => ({
      ...prev,
      name: e.target.value,
      updatedAt: new Date()
    }));
  };

  // Save probe group
  const saveProbeGroup = async () => {
    if (!probeGroup.name.trim()) {
      showAlert('Please enter a name for the probe group', 'error');
      return;
    }

    // Check for incomplete probes
    const incompleteProbes = probes.filter(probe => !probe.isComplete);
    if (incompleteProbes.length > 0) {
      showAlert(`Cannot save probe group. ${incompleteProbes.length} probe(s) are not marked as complete.`, 'error');
      return;
    }

    // Count unique barcodes
    const barcodeSet = new Set<string>();
    probes.forEach(probe => {
      probe.parts.forEach(part => {
        if (part.source === 'barcode') {
          barcodeSet.add(part.label.split(': ')[1]);
        }
      });
    });

    const yamlContent = convertProbesToYAML(probes, targetLength, barcodes, barcodeLengths, targetConfig);

    const updatedGroup: ProbeGroup = {
      ...probeGroup,
      probes: probes,
      updatedAt: new Date(),
      isSaved: true,
      type: 'custom',
      yamlContent: yamlContent,
      barcodeCount: barcodeSet.size,
      targetLength: targetLength,
      targetConfig: targetConfig
    };

    try {
      await ApiService.saveCustomProbe(updatedGroup);
      const groups = await ApiService.getCustomProbes();
      setSavedProbeGroups(groups);
      setProbeGroup(updatedGroup);
      showAlert('Probe group saved successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to save probe group:', error);
      showAlert(error?.response?.data?.detail || 'Failed to save probe group', 'error');
    }
  };

  // Load probe group from history
  const loadProbeGroup = (group: ProbeGroup, downloadYaml: boolean = false) => {
    if (downloadYaml) {
      const blob = new Blob([group.yamlContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${group.name.replace(/\s+/g, '_')}.yaml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showAlert('YAML file downloaded successfully!', 'success');
    } else {
      setProbeGroup(group);
      setProbes(group.probes);
      if (group.targetConfig) {
        setTargetConfig(group.targetConfig);
        setTargetLength(group.targetConfig.length);
        setTargetSequence(group.targetConfig.sequence);
      }
      setShowHistory(false);
      showAlert('Probe group loaded successfully!', 'success');
    }
  };

  // Delete probe group from history
  const deleteProbeGroup = async (groupId: string) => {
    try {
      await ApiService.deleteCustomProbe(groupId);
      const updatedGroups = savedProbeGroups.filter(g => g.id !== groupId);
      setSavedProbeGroups(updatedGroups);
      showAlert('Probe group deleted from history', 'info');
    } catch (error: any) {
      console.error('Failed to delete probe group:', error);
      showAlert(error?.response?.data?.detail || 'Failed to delete probe group', 'error');
    }
  };

  // Handle position change
  const handlePositionChange = (
    field: 'startPos' | 'endPos' | 'sourceStartPos' | 'sourceEndPos',
    value: string,
    maxLength: number
  ) => {
    const pos = parseInt(value, 10);
    if (!isNaN(pos) && pos > 0) {
      if (pos > maxLength) {
        showAlert(`Position cannot exceed sequence length (${maxLength})`, 'warning');
      }
      handleNewPartChange(field, pos.toString());
    } else {
      handleNewPartChange(field, '');
    }
  };
  
  // Probe name change
  const handleProbeNameChange = (probeIndex: number, name: string) => {
    const updatedProbes = [...probes];
    updatedProbes[probeIndex].name = name;
    setProbes(updatedProbes);
  };
  
  // Toggle edit part attributes
  const toggleEditPartAttributes = (partId: string | null) => {
    setEditingPartId(partId);
  };

  // Render attributes form
  const renderAttributesForm = (attributes: any, onChange: (field: string, value: any) => void) => {
    return (
      <Box>
        <StyledTabs 
          value={attributeTab} 
          onChange={(_, newValue) => setAttributeTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <StyledTab label="GC Content" icon={<FormatColorTextIcon fontSize="small" />} />
          <StyledTab label="Fold Score" icon={<TuneIcon fontSize="small" />} />
          <StyledTab label="Temperature" icon={<TuneIcon fontSize="small" />} />
          <StyledTab label="Self Match" icon={<TuneIcon fontSize="small" />} />
          <StyledTab label="Mapping" icon={<CategoryIcon fontSize="small" />} />
          <StyledTab label="K-mer Count" icon={<FilterListIcon fontSize="small" />} />
          <StyledTab label="Mapped Sites" icon={<CategoryIcon fontSize="small" />} />
        </StyledTabs>
        
        {/* GC Content Tab */}
        {attributeTab === 0 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">GC Content Check</Typography>
              <Switch
                checked={attributes.gcContent?.enabled}
                onChange={(e) => onChange('gcContent.enabled', e.target.checked)}
                size="small"
              />
            </Box>
            {attributes.gcContent?.enabled && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Min %"
                    type="number"
                    value={attributes.gcContent?.min}
                    onChange={(e) => onChange('gcContent.min', e.target.value)}
                    size="small"
                    fullWidth
                    InputProps={{
                      endAdornment: <Typography variant="caption">%</Typography>
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Max %"
                    type="number"
                    value={attributes.gcContent?.max}
                    onChange={(e) => onChange('gcContent.max', e.target.value)}
                    size="small"
                    fullWidth
                    InputProps={{
                      endAdornment: <Typography variant="caption">%</Typography>
                    }}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        )}
        
        {/* Fold Score Tab */}
        {attributeTab === 1 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">Fold Score Check</Typography>
              <Switch
                checked={attributes.foldScore?.enabled}
                onChange={(e) => onChange('foldScore.enabled', e.target.checked)}
                size="small"
              />
            </Box>
            {attributes.foldScore?.enabled && (
              <TextField
                label="Maximum Score"
                type="number"
                value={attributes.foldScore?.max}
                onChange={(e) => onChange('foldScore.max', e.target.value)}
                size="small"
                fullWidth
              />
            )}
          </Box>
        )}
        
        {/* Temperature Tab */}
        {attributeTab === 2 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">Melting Temperature Check</Typography>
              <Switch
                checked={attributes.tm?.enabled}
                onChange={(e) => onChange('tm.enabled', e.target.checked)}
                size="small"
              />
            </Box>
            {attributes.tm?.enabled && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Min °C"
                    type="number"
                    value={attributes.tm?.min}
                    onChange={(e) => onChange('tm.min', e.target.value)}
                    size="small"
                    fullWidth
                    InputProps={{
                      endAdornment: <Typography variant="caption">°C</Typography>
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Max °C"
                    type="number"
                    value={attributes.tm?.max}
                    onChange={(e) => onChange('tm.max', e.target.value)}
                    size="small"
                    fullWidth
                    InputProps={{
                      endAdornment: <Typography variant="caption">°C</Typography>
                    }}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        )}
        
        {/* Self Match Tab */}
        {attributeTab === 3 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">Self Match Check</Typography>
              <Switch
                checked={attributes.selfMatch?.enabled}
                onChange={(e) => onChange('selfMatch.enabled', e.target.checked)}
                size="small"
              />
            </Box>
            {attributes.selfMatch?.enabled && (
              <TextField
                label="Maximum Value"
                type="number"
                value={attributes.selfMatch?.max}
                onChange={(e) => onChange('selfMatch.max', e.target.value)}
                size="small"
                fullWidth
              />
            )}
          </Box>
        )}
        
        {/* Mapped Genes Tab */}
        {attributeTab === 4 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">Mapped Genes Check</Typography>
              <Switch
                checked={attributes.mappedGenes?.enabled}
                onChange={(e) => onChange('mappedGenes.enabled', e.target.checked)}
                size="small"
              />
            </Box>
            {attributes.mappedGenes?.enabled && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Maximum Count"
                    type="number"
                    value={attributes.mappedGenes?.max}
                    onChange={(e) => onChange('mappedGenes.max', e.target.value)}
                    size="small"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Aligner</InputLabel>
                    <Select
                      value={attributes.mappedGenes?.aligner}
                      label="Aligner"
                      onChange={(e) => onChange('mappedGenes.aligner', e.target.value)}
                    >
                      {availableAligners.map((aligner) => (
                        <MenuItem key={aligner} value={aligner}>
                          {aligner}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}
          </Box>
        )}
        
        {/* K-mer Count Tab */}
        {attributeTab === 5 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">K-mer Count Check</Typography>
              <Switch
                checked={attributes.kmerCount?.enabled}
                onChange={(e) => onChange('kmerCount.enabled', e.target.checked)}
                size="small"
              />
            </Box>
            {attributes.kmerCount?.enabled && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="K-mer Length"
                    type="number"
                    value={attributes.kmerCount?.kmer_len}
                    onChange={(e) => onChange('kmerCount.kmer_len', e.target.value)}
                    size="small"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Aligner</InputLabel>
                    <Select
                      value={attributes.kmerCount?.aligner}
                      label="Aligner"
                      onChange={(e) => onChange('kmerCount.aligner', e.target.value)}
                    >
                      {availableAligners.map((aligner) => (
                        <MenuItem key={aligner} value={aligner}>
                          {aligner}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}
          </Box>
        )}
        
        {/* Mapped Sites Tab */}
        {attributeTab === 6 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">Mapped Sites Check</Typography>
              <Switch
                checked={attributes.mappedSites?.enabled}
                onChange={(e) => onChange('mappedSites.enabled', e.target.checked)}
                size="small"
              />
            </Box>
            {attributes.mappedSites?.enabled && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Aligner</InputLabel>
                    <Select
                      value={attributes.mappedSites?.aligner}
                      label="Aligner"
                      onChange={(e) => onChange('mappedSites.aligner', e.target.value)}
                    >
                      {availableAligners.map((aligner) => (
                        <MenuItem key={aligner} value={aligner}>
                          {aligner}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <StyledContainer>
        {/* Fixed Snackbar for alerts */}
        <Snackbar
          open={alertState.open}
          autoHideDuration={5000}
          onClose={() => setAlertState(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            '& .MuiSnackbarContent-root': {
              width: '100%',
              maxWidth: '600px',
              margin: '0 auto',
            }
          }}
        >
          <Alert 
            severity={alertState.severity}
            onClose={() => setAlertState(prev => ({ ...prev, open: false }))}
            sx={{ width: '100%' }}
          >
            {alertState.message}
          </Alert>
        </Snackbar>

        <Typography variant="h3" gutterBottom align="center" sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <DnaIcon color="primary" fontSize="large" />
          Create Your Own Probe Type
        </Typography>
        
        {/* History Dialog */}
        <Dialog
          open={showHistory}
          onClose={() => setShowHistory(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Saved Probe Groups</Typography>
              <IconButton onClick={() => setShowHistory(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <List>
              {savedProbeGroups.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  No saved probe groups found
                </Typography>
              ) : (
                savedProbeGroups.map((group) => (
                  <ListItem
                    key={group.id}
                    secondaryAction={
                      <Box>
                        <Tooltip title="Download YAML">
                          <IconButton
                            edge="end"
                            onClick={() => loadProbeGroup(group, true)}
                            sx={{ mr: 1 }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Load group">
                          <IconButton
                            edge="end"
                            onClick={() => loadProbeGroup(group)}
                            color="primary"
                            sx={{ mr: 1 }}
                          >
                            <SaveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete group">
                          <IconButton
                            edge="end"
                            onClick={() => deleteProbeGroup(group.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={group.name}
                      secondary={`Created: ${new Date(group.createdAt).toLocaleString()} | Probes: ${group.probes.length} | Target: ${group.targetLength} bp`}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </DialogContent>
        </Dialog>
        
        {/* Target sequence section */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 4, 
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2
          }}
        >
          <SectionTitle>
            <ScienceIcon color="primary" />
            <Typography variant="h5" component="h2">
              Target Sequence
            </Typography>
          </SectionTitle>
          
          <Grid container spacing={2} justifyContent="center">
            {/* Source Selection */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Source Type</InputLabel>
                <Select
                  value={targetConfig.source}
                  label="Source Type"
                  onChange={(e) => setTargetConfig(prev => ({
                    ...prev,
                    source: e.target.value as TargetSource
                  }))}
                >
                  <MenuItem value="genome">Genome</MenuItem>
                  <MenuItem value="exon">Exon</MenuItem>
                  <MenuItem value="CDS">CDS</MenuItem>
                  <MenuItem value="UTR">UTR</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Sequence Length */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="Sequence Length"
                type="number"
                value={targetLength}
                onChange={handleTargetLengthChange}
                size="small"
                fullWidth
                InputProps={{ 
                  inputProps: { 
                    min: 1,
                    step: 1
                  } 
                }}
              />
            </Grid>

            {/* Regenerate Button and Attributes Button */}
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Generate a new random sequence">
                  <Button 
                    variant="outlined" 
                    startIcon={<RefreshIcon />}
                    onClick={() => generateRandomSequence(targetLength)}
                  >
                    Regenerate
                  </Button>
                </Tooltip>
                
                <Tooltip title="Edit target attributes">
                  <Button
                    variant="outlined"
                    startIcon={<TuneIcon />}
                    onClick={() => setEditingTargetAttributes(true)}
                    color="primary"
                  >
                    Attributes
                  </Button>
                </Tooltip>
              </Box>
            </Grid>

            {/* Sequence Display */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Target Sequence ({targetSequence.length} bp):
              </Typography>
              <SequenceDisplay>
                {targetSequence}
              </SequenceDisplay>
            </Grid>
            
            {/* Display active target attributes as chips */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1, gap: 0.5 }}>
                {Object.entries(targetConfig.attributes).map(([key, attr]) => {
                  if (attr?.enabled) {
                    switch(key) {
                      case 'gcContent':
                        return (
                          <AttributeChip 
                            key={key}
                            size="small" 
                            label={`GC: ${attr.min}%-${attr.max}%`} 
                            color="primary" 
                            variant="outlined"
                          />
                        );
                      case 'foldScore':
                        return (
                          <AttributeChip 
                            key={key}
                            size="small" 
                            label={`Fold: max ${attr.max}`} 
                            color="secondary" 
                            variant="outlined"
                          />
                        );
                      case 'tm':
                        return (
                          <AttributeChip 
                            key={key}
                            size="small" 
                            label={`Tm: ${attr.min}°C-${attr.max}°C`} 
                            color="error" 
                            variant="outlined"
                          />
                        );
                      case 'selfMatch':
                        return (
                          <AttributeChip 
                            key={key}
                            size="small" 
                            label={`Self: max ${attr.max}`} 
                            color="warning" 
                            variant="outlined"
                          />
                        );
                      case 'mappedGenes':
                        return (
                          <AttributeChip 
                            key={key}
                            size="small" 
                            label={`Map: max ${attr.max}${attr.aligner ? ` (${attr.aligner})` : ''}`} 
                            color="info" 
                            variant="outlined"
                          />
                        );
                      case 'kmerCount':
                        return (
                          <AttributeChip 
                            key={key}
                            size="small" 
                            label={`Kmer: ${attr.kmer_len}${attr.aligner ? ` (${attr.aligner})` : ''}`} 
                            color="success" 
                            variant="outlined"
                          />
                        );
                      case 'mappedSites':
                        return (
                          <AttributeChip 
                            key={key}
                            size="small" 
                            label={`Sites${attr.aligner ? ` (${attr.aligner})` : ''}`} 
                            color="info" 
                            variant="outlined"
                          />
                        );
                      default:
                        return null;
                    }
                  }
                  return null;
                })}
                {!Object.values(targetConfig.attributes).some(attr => attr?.enabled) && (
                  <Typography variant="caption" color="text.secondary">
                    No attributes configured
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
          
          {/* Target Attributes Dialog */}
          <Dialog
            open={editingTargetAttributes}
            onClose={() => setEditingTargetAttributes(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Target Sequence Attributes</Typography>
                <IconButton onClick={() => setEditingTargetAttributes(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              {renderAttributesForm(targetConfig.attributes, (field, value) => {
                setTargetConfig(prev => {
                  const newConfig = { ...prev };
                  const [attributeType, property] = field.split('.');
                  
                  if (attributeType === 'gcContent') {
                    newConfig.attributes.gcContent = {
                      ...newConfig.attributes.gcContent,
                      [property]: property === 'enabled' ? value : Number(value),
                      enabled: property === 'enabled' ? value : (newConfig.attributes.gcContent?.enabled || false)
                    };
                  } else if (attributeType === 'foldScore') {
                    newConfig.attributes.foldScore = {
                      ...newConfig.attributes.foldScore,
                      [property]: property === 'enabled' ? value : Number(value),
                      enabled: property === 'enabled' ? value : (newConfig.attributes.foldScore?.enabled || false)
                    };
                  } else if (attributeType === 'tm') {
                    newConfig.attributes.tm = {
                      ...newConfig.attributes.tm,
                      [property]: property === 'enabled' ? value : Number(value),
                      enabled: property === 'enabled' ? value : (newConfig.attributes.tm?.enabled || false)
                    };
                  } else if (attributeType === 'selfMatch') {
                    newConfig.attributes.selfMatch = {
                      ...newConfig.attributes.selfMatch,
                      [property]: property === 'enabled' ? value : Number(value),
                      enabled: property === 'enabled' ? value : (newConfig.attributes.selfMatch?.enabled || false)
                    };
                  } else if (attributeType === 'mappedGenes') {
                    newConfig.attributes.mappedGenes = {
                      ...newConfig.attributes.mappedGenes,
                      [property]: property === 'enabled' ? value : 
                                  property === 'aligner' ? value : Number(value),
                      enabled: property === 'enabled' ? value : (newConfig.attributes.mappedGenes?.enabled || false)
                    };
                  } else if (attributeType === 'kmerCount') {
                    newConfig.attributes.kmerCount = {
                      ...newConfig.attributes.kmerCount,
                      [property]: property === 'enabled' ? value : 
                                  property === 'aligner' ? value : Number(value),
                      enabled: property === 'enabled' ? value : (newConfig.attributes.kmerCount?.enabled || false)
                    };
                  } else if (attributeType === 'mappedSites') {
                    newConfig.attributes.mappedSites = {
                      ...newConfig.attributes.mappedSites,
                      [property]: property === 'enabled' ? value : value,
                      enabled: property === 'enabled' ? value : (newConfig.attributes.mappedSites?.enabled || false)
                    };
                  }
                  
                  return newConfig;
                });
              })}
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  onClick={() => setEditingTargetAttributes(false)}
                  variant="contained"
                >
                  Done
                </Button>
              </Box>
            </DialogContent>
          </Dialog>
        </Paper>
        
        {/* Probe design section */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 0
          }}>
            <SectionTitle sx={{ mb: 0 }}>
              <SettingsIcon color="primary" />
              <Typography variant="h5" component="h2">
                Probe Type Design
              </Typography>
            </SectionTitle>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={() => setShowHistory(true)}
              >
                History
              </Button>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={addProbe}
              >
                Add Probe
              </Button>
            </Box>
          </Box>

          {/* Probe Group Name */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Probe Group Name"
              value={probeGroup.name}
              onChange={handleProbeGroupNameChange}
              onFocus={() => {
                if (probeGroup.name.startsWith('Probe_')) {
                  setProbeGroup(prev => ({
                    ...prev,
                    name: ''
                  }));
                }
              }}
              size="small"
              sx={{ mb: 1 }}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={saveProbeGroup}
              disabled={!probeGroup.name.trim()}
            >
              Save Probe Group
            </Button>
          </Box>
          
          {/* Probes overview section */}
          <Box sx={{ mb: 4 }}>
            {probes.map((probe, index) => (
              <ProbeCard key={probe.id} variant="outlined">
                <ProbeCardHeader>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DnaIcon color={probe.isComplete ? "success" : "primary"} fontSize="small" />
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" component="h3">
                          Probe_{index + 1}
                          {probe.name && ` - ${probe.name}`}
                        </Typography>
                        {probe.isComplete && (
                          <Chip 
                            size="small" 
                            color="success" 
                            icon={<CheckCircleIcon />} 
                            label="Completed" 
                          />
                        )}
                      </Box>
                      {!probe.isComplete && (
                        <TextField
                          placeholder="Probe name (optional)"
                          variant="standard"
                          size="small"
                          value={probe.name || ''}
                          onChange={(e) => handleProbeNameChange(index, e.target.value)}
                          sx={{ width: '170px' }}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Box>
                    <Tooltip title="Probe Attributes">
                      <IconButton 
                        onClick={() => setEditingProbeId(probe.id)}
                        color="primary"
                        size="small"
                      >
                        <TuneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={probe.isComplete ? "Reopen for editing" : "Mark as complete"}>
                      <IconButton 
                        onClick={() => toggleProbeCompletion(index)}
                        color={probe.isComplete ? "default" : "success"}
                        size="small"
                      >
                        {probe.isComplete ? 
                          <SettingsIcon fontSize="small" /> : 
                          <CheckCircleIcon fontSize="small" />
                        }
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={expandedCards[probe.id] ? "Collapse" : "Expand"}>
                      <IconButton 
                        onClick={() => toggleExpandCard(probe.id)}
                        size="small"
                      >
                        {expandedCards[probe.id] ? 
                          <ExpandLessIcon fontSize="small" /> : 
                          <ExpandMoreIcon fontSize="small" />
                        }
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Delete probe">
                      <IconButton 
                        onClick={() => removeProbe(index)}
                        color="error"
                        size="small"
                        disabled={probes.length <= 1}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ProbeCardHeader>
                
                {/* Probe Attributes Dialog */}
                <Dialog
                  open={editingProbeId === probe.id}
                  onClose={() => setEditingProbeId(null)}
                  maxWidth="sm"
                  fullWidth
                >
                  <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">Probe Attributes</Typography>
                      <IconButton onClick={() => setEditingProbeId(null)}>
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  </DialogTitle>
                  <DialogContent>
                    {renderAttributesForm(probe.attributes || createDefaultAttributes(), 
                      (field, value) => handleProbeAttributeChange(index, field, value))}
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        onClick={() => setEditingProbeId(null)}
                        variant="contained"
                      >
                        Done
                      </Button>
                    </Box>
                  </DialogContent>
                </Dialog>
                
                <Collapse in={expandedCards[probe.id]}>
                  <CardContent>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Sequence:
                      </Typography>
                      
                      {probe.parts.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No parts added yet 🧬
                        </Typography>
                      ) : (
                        <>
                          <SequenceDisplay sx={{ mb: 1 }}>
                            {probe.parts.map((part, idx) => (
                              <ProbePart key={idx} partType={part.source}>
                                {part.sequence}
                              </ProbePart>
                            ))}
                          </SequenceDisplay>
                          
                          <Typography variant="caption" display="block">
                            Total Length: {getProbeFullSequence(probe).length} bp
                          </Typography>
                          
                          {/* Display active attributes as chips */}
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
                            {probe.attributes?.gcContent?.enabled && (
                              <AttributeChip 
                                size="small" 
                                label={`GC: ${probe.attributes.gcContent.min}%-${probe.attributes.gcContent.max}%`} 
                                color="primary" 
                                variant="outlined"
                              />
                            )}
                            {probe.attributes?.foldScore?.enabled && (
                              <AttributeChip 
                                size="small" 
                                label={`Fold: max ${probe.attributes.foldScore.max}`} 
                                color="secondary" 
                                variant="outlined"
                              />
                            )}
                            {probe.attributes?.tm?.enabled && (
                              <AttributeChip 
                                size="small" 
                                label={`Tm: ${probe.attributes.tm.min}°C-${probe.attributes.tm.max}°C`} 
                                color="error" 
                                variant="outlined"
                              />
                            )}
                            {probe.attributes?.selfMatch?.enabled && (
                              <AttributeChip 
                                size="small" 
                                label={`Self: max ${probe.attributes.selfMatch.max}`} 
                                color="warning" 
                                variant="outlined"
                              />
                            )}
                            {probe.attributes?.mappedGenes?.enabled && (
                              <AttributeChip 
                                size="small" 
                                label={`Map: max ${probe.attributes.mappedGenes.max}`} 
                                color="info" 
                                variant="outlined"
                              />
                            )}
                            {probe.attributes?.kmerCount?.enabled && (
                              <AttributeChip 
                                size="small" 
                                label={`Kmer: ${probe.attributes.kmerCount.kmer_len}`} 
                                color="success" 
                                variant="outlined"
                              />
                            )}
                            {probe.attributes?.mappedSites?.enabled && (
                              <AttributeChip 
                                size="small" 
                                label={`Sites`} 
                                color="info" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </>
                      )}
                    </Box>
                    
                    {/* Show list of parts */}
                    {probe.parts.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Parts:
                        </Typography>
                        
                        {probe.parts.map((part, idx) => (
                          <Box key={idx}>
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                flexDirection: isMobile ? 'column' : 'row',
                                alignItems: isMobile ? 'flex-start' : 'center', 
                                mb: 1,
                                p: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.light, 0.05),
                                }
                              }}
                            >
                              <Box sx={{ 
                                flex: isMobile ? 'none' : 1,
                                mb: isMobile ? 1 : 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5
                              }}>
                                <Typography variant="body2">
                                  Part_{idx + 1}: {part.label} 
                                  {part.isReverseComplement ? ' (Reverse Complement)' : ''}
                                </Typography>
                                
                                {/* Part attributes */}
                                {part.attributes && (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {Object.entries(part.attributes).map(([key, attr]) => {
                                      if (attr?.enabled) {
                                        switch(key) {
                                          case 'gcContent':
                                            return (
                                              <Chip 
                                                key={key}
                                                size="small" 
                                                label={`GC: ${attr.min}%-${attr.max}%`} 
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                              />
                                            );
                                          case 'foldScore':
                                            return (
                                              <Chip 
                                                key={key}
                                                size="small" 
                                                label={`Fold: max ${attr.max}`} 
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                              />
                                            );
                                          case 'tm':
                                            return (
                                              <Chip 
                                                key={key}
                                                size="small" 
                                                label={`Tm: ${attr.min}°C-${attr.max}°C`} 
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                              />
                                            );
                                          case 'selfMatch':
                                            return (
                                              <Chip 
                                                key={key}
                                                size="small" 
                                                label={`Self: max ${attr.max}`} 
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                              />
                                            );
                                          case 'mappedGenes':
                                            return (
                                              <Chip 
                                                key={key}
                                                size="small" 
                                                label={`Map: ${attr.max}`} 
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                              />
                                            );
                                          case 'kmerCount':
                                            return (
                                              <Chip 
                                                key={key}
                                                size="small" 
                                                label={`Kmer: ${attr.kmer_len}`} 
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                              />
                                            );
                                          case 'mappedSites':
                                            return (
                                              <Chip 
                                                key={key}
                                                size="small" 
                                                label={`Sites`} 
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                              />
                                            );
                                          default:
                                            return null;
                                        }
                                      }
                                      return null;
                                    })}
                                    {!Object.values(part.attributes).some(attr => attr?.enabled) && (
                                      <Typography variant="caption" color="text.secondary">
                                        No attributes
                                      </Typography>
                                    )}
                                  </Box>
                                )}
                              </Box>
                              
                              <Typography variant="body2" sx={{ 
                                flex: isMobile ? 'none' : 2,
                                fontFamily: 'monospace',
                                mb: isMobile ? 1 : 0,
                                px: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {part.sequence}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                {!probe.isComplete && (
                                  <>
                                    <Tooltip title="Edit Part Attributes">
                                      <IconButton 
                                        size="small" 
                                        onClick={() => toggleEditPartAttributes(part.id)}
                                        color="primary"
                                      >
                                        <TuneIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => removePart(index, idx)}
                                      color="error"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Box>
                            </Box>
                            
                            {/* Part attributes dialog */}
                            <Dialog
                              open={editingPartId === part.id}
                              onClose={() => toggleEditPartAttributes(null)}
                              maxWidth="sm"
                              fullWidth
                            >
                              <DialogTitle>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="h6">Edit Part Attributes</Typography>
                                  <IconButton onClick={() => toggleEditPartAttributes(null)}>
                                    <CloseIcon />
                                  </IconButton>
                                </Box>
                              </DialogTitle>
                              <DialogContent>
                                {renderAttributesForm(part.attributes || {
                                  gcContent: { min: 40, max: 60, enabled: false },
                                  foldScore: { max: 40, enabled: false },
                                  tm: { min: 60, max: 75, enabled: false },
                                  selfMatch: { max: 4, enabled: false },
                                  mappedGenes: { max: 5, aligner: 'BLAST' as AlignerType, enabled: false },
                                  kmerCount: { kmer_len: 15, aligner: 'BLAST' as AlignerType, enabled: false },
                                  mappedSites: { aligner: 'BLAST' as AlignerType, enabled: false }
                                }, (field, value) => handlePartAttributeChange(index, idx, field, value))}
                                
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                  <Button 
                                    onClick={() => toggleEditPartAttributes(null)}
                                    variant="contained"
                                  >
                                    Done
                                  </Button>
                                </Box>
                              </DialogContent>
                            </Dialog>
                          </Box>
                        ))}
                      </Box>
                    )}
                    
                    {/* Design interface - only if probe is not complete */}
                    {!probe.isComplete && index === activeProbeIndex && (
                      <>
                        <Divider sx={{ my: 2 }}/>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <AddIcon color="primary" fontSize="small" />
                          <Typography variant="subtitle1">
                            Add New Part
                          </Typography>
                        </Box>
                        
                        <Grid container spacing={2} alignItems="flex-start">
                          {/* Source Selection */}
                          <Grid item xs={12} sm={3}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Source</InputLabel>
                              <Select
                                value={newPart.source}
                                label="Source"
                                onChange={(e) => handleNewPartChange('source', e.target.value)}
                              >
                                <MenuItem value="target">Target </MenuItem>
                                <MenuItem value="external">External </MenuItem>
                                {getCompletedProbes().length > 0 && (
                                  <MenuItem value="probe">Existing Probe</MenuItem>
                                )}
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* Region Selection */}
                          {newPart.source === 'target' && (
                            <>
                              <Grid item xs={6} sm={3}>
                                <TextField
                                  label="Start Position"
                                  type="number"
                                  fullWidth
                                  size="small"
                                  value={newPart.startPos}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                    handlePositionChange('startPos', e.target.value, targetSequence.length)
                                  }
                                  InputProps={{ 
                                    inputProps: { 
                                      min: 1,
                                      step: 1
                                    } 
                                  }}
                                />
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <TextField
                                  label="End Position"
                                  type="number"
                                  fullWidth
                                  size="small"
                                  value={newPart.endPos}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                    handlePositionChange('endPos', e.target.value, targetSequence.length)
                                  }
                                  InputProps={{ 
                                    inputProps: { 
                                      min: 1,
                                      step: 1
                                    } 
                                  }}
                                />
                              </Grid>
                            </>
                          )}

                          {/* External Sequence Selection */}
                          {newPart.source === 'external' && (
                            <>
                              <Grid item xs={12} sm={3}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>External Type</InputLabel>
                                  <Select
                                    value={newPart.externalType}
                                    label="External Type"
                                    onChange={(e) => handleNewPartChange('externalType', e.target.value)}
                                  >
                                    <MenuItem value="barcode">Barcode</MenuItem>
                                    <MenuItem value="fixed">Fixed Sequence</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              {newPart.externalType === 'barcode' ? (
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
                                    <FormControl size="small" sx={{ flexGrow: 1 }}>
                                      <InputLabel>Barcode</InputLabel>
                                      <Select
                                        value={newPart.externalName}
                                        label="Barcode"
                                        onChange={(e) => handleNewPartChange('externalName', e.target.value)}
                                      >
                                        {Object.keys(barcodes).map(key => (
                                          <MenuItem key={key} value={key}>
                                            {key} ({barcodeLengths[key] || 12}bp)
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexGrow: 1 }}>
                                      <TextField
                                        label="Length"
                                        type="number"
                                        value={defaultBarcodeLength}
                                        onChange={(e) => {
                                          const newLength = Math.max(1, parseInt(e.target.value) || 1);
                                          setDefaultBarcodeLength(newLength);
                                        }}
                                        size="small"
                                        fullWidth
                                        InputProps={{ 
                                          inputProps: { 
                                            min: 1,
                                            step: 1
                                          } 
                                        }}
                                      />
                                      <Tooltip title="Generate new barcode">
                                        <IconButton 
                                          onClick={addNewBarcode}
                                          color="primary"
                                          size="small"
                                        >
                                          <AddIcon />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                </Grid>
                              ) : (
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    label="Enter Fixed Sequence"
                                    fullWidth
                                    size="small"
                                    value={newPart.customFixedSequence}
                                    onChange={(e) => handleNewPartChange('customFixedSequence', e.target.value)}
                                    error={newPart.customFixedSequence !== '' && !validateSequence(newPart.customFixedSequence)}
                                    helperText={newPart.customFixedSequence !== '' && !validateSequence(newPart.customFixedSequence) ? "Only valid bases (A, T, G, C) allowed" : ""}
                                  />
                                </Grid>
                              )}
                            </>
                          )}

                          {/* Probe Source Selection */}
                          {newPart.source === 'probe' && (
                            <>
                              <Grid item xs={12} sm={3}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Select Probe</InputLabel>
                                  <Select
                                    value={newPart.sourceProbeId}
                                    label="Select Probe"
                                    onChange={(e) => handleNewPartChange('sourceProbeId', e.target.value)}
                                  >
                                    {getCompletedProbes().map(probe => (
                                      <MenuItem key={probe.id} value={probe.id}>
                                        Probe_{probe.id} ({getProbeFullSequence(probe).length} bp)
                                      </MenuItem>
                                    ))}
                                  </Select>
                                  <FormHelperText>
                                    Only completed probes are available as sources
                                  </FormHelperText>
                                </FormControl>
                              </Grid>
                              
                              {newPart.sourceProbeId && (
                                <>
                                  <Grid item xs={6} sm={3}>
                                    <TextField
                                      label="Start Position"
                                      type="number"
                                      fullWidth
                                      size="small"
                                      value={newPart.sourceStartPos}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const probe = getProbeById(newPart.sourceProbeId);
                                        if (probe) {
                                          const maxPos = getProbeFullSequence(probe).length;
                                          handlePositionChange('sourceStartPos', e.target.value, maxPos);
                                        }
                                      }}
                                      InputProps={{ 
                                        inputProps: { 
                                          min: 1,
                                          step: 1
                                        } 
                                      }}
                                    />
                                  </Grid>
                                  <Grid item xs={6} sm={3}>
                                    <TextField
                                      label="End Position"
                                      type="number"
                                      fullWidth
                                      size="small"
                                      value={newPart.sourceEndPos}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const probe = getProbeById(newPart.sourceProbeId);
                                        if (probe) {
                                          const maxPos = getProbeFullSequence(probe).length;
                                          handlePositionChange('sourceEndPos', e.target.value, maxPos);
                                        }
                                      }}
                                      InputProps={{ 
                                        inputProps: { 
                                          min: 1,
                                          step: 1
                                        } 
                                      }}
                                    />
                                  </Grid>
                                </>
                              )}
                            </>
                          )}
                          
                          {/* Selected Sequence Display */}
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2">
                                Selected Sequence:
                              </Typography>
                              <Tooltip title="This is the sequence that will be added to your probe">
                                <HelpOutlineIcon fontSize="small" color="action" />
                              </Tooltip>
                            </Box>
                            <SequenceDisplay sx={{ mb: 1 }}>
                              {newPart.sequence || '(No sequence selected yet)'}
                            </SequenceDisplay>
                          </Grid>
                          
                          {/* Action Buttons */}
                          <Grid item xs={12} sm={6}>
                            <Tooltip title={newPart.sequence ? "Reverse and complement the selected sequence" : "Select a sequence first"}>
                              <span>
                                <Button
                                  variant="outlined"
                                  startIcon={<FlipIcon />}
                                  onClick={toggleReverseComplement}
                                  disabled={!newPart.sequence}
                                  fullWidth
                                >
                                  {newPart.isReverseComplement ? 'Undo Reverse Complement' : 'Apply Reverse Complement'}
                                </Button>
                              </span>
                            </Tooltip>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <Tooltip title={!newPart.sequence ? "Select a sequence first" : ""}>
                              <span>
                                <Button
                                  variant="contained"
                                  startIcon={<AddIcon />}
                                  onClick={addPartToProbe}
                                  disabled={!newPart.sequence || (newPart.externalType === 'fixed' && !validateSequence(newPart.customFixedSequence))}
                                  fullWidth
                                  color="success"
                                >
                                  Add to Probe
                                </Button>
                              </span>
                            </Tooltip>
                          </Grid>
                        </Grid>
                      </>
                    )}
                  </CardContent>
                </Collapse>
              </ProbeCard>
            ))}
          </Box>
        </Paper>
        
         {/* Instructions for probe design flow */}
         <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                mt: 3, 
                backgroundColor: alpha(theme.palette.info.light, 0.1),
                borderColor: theme.palette.info.main
              }}
            >
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: theme.palette.info.dark }}>
                🔍 How to Design Your Probe Type:
              </Typography>
              <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li>Configure target sequence attributes by clicking the "Configure Target Attributes" button</li>
                <li>Design each probe by adding parts from the target sequence or external sources</li>
                <li>Set attributes for individual parts and whole probes using the attribute buttons</li>
                <li>Click the checkmark button to mark a probe as complete when finished</li>
                <li>Add new probes using the "Add Probe" button at the top</li>
                <li>Use completed probes as sources for new probes to create complex designs</li>
                <li>Name and save your probe group when finished</li>
              </ol>
            </Paper>
      </StyledContainer>
    </Container>
  );
};

export default CustomProbe;
