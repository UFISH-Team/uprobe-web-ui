import React, { useState, useEffect } from "react";
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
  ListItemText
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Theme, useTheme } from '@mui/material/styles';
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

// Styled components
const StyledContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: "0 auto",
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
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
type PartSource = 'target' | 'barcode' | 'fixed' | 'external' | 'probe';

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
  attributeThresholds?: {
    gcContentMin?: number;
    gcContentMax?: number;
    foldScoreMax?: number;
    tmMin?: number;
    tmMax?: number;
    lengthMin?: number;
    lengthMax?: number;
    selfMatchMax?: number;
    nMappedGenesMax?: number;
    aligners?: string[];
    enabledAttributes?: string[];
    [key: string]: any; // Allow for additional custom attribute thresholds
  };
}

interface Probe {
  id: string;
  parts: ProbePart[];
  isComplete: boolean;
  name?: string; // Optional name for the probe
  attributeThresholds?: {
    gcContentMin?: number;
    gcContentMax?: number;
    foldScoreMax?: number;
    tmMin?: number;
    tmMax?: number;
    lengthMin?: number;
    lengthMax?: number;
    selfMatchMax?: number;
    nMappedGenesMax?: number;
    aligners?: string[];
    enabledAttributes?: string[];
    [key: string]: any; // Allow for additional custom attribute thresholds
  };
}

interface ProbeGroup {
  id: string;
  name: string;
  probes: Probe[];
  createdAt: Date;
  updatedAt: Date;
  isSaved?: boolean; // Whether this group is saved to the database
  type: string; // Add type field to identify custom probe types
  yamlContent: string; // Store the YAML content for later use
  barcodeCount: number; // Number of unique barcodes in the probe group
  targetLength: number; // Target sequence length
}

// Add these type definitions before the convertProbesToYAML function
interface YAMLPartConfig {
  length?: number;
  expr: string;
}

interface YAMLProbeConfig {
  template: string;
  parts: { [key: string]: YAMLPartConfig };
}

interface YAMLProbes {
  [key: string]: YAMLProbeConfig;
}

// Add this function before the CustomProbe component
const convertProbesToYAML = (probes: Probe[], targetLength: number, barcodes: {[key: string]: string}): string => {
  const yamlProbes: YAMLProbes = {};
  
  probes.forEach((probe, index) => {
    if (!probe.isComplete) return;
    
    const probeName = probe.name || `probe_${index + 1}`;
    const parts: { [key: string]: YAMLPartConfig } = {};
    let templateParts: string[] = [];
    
    probe.parts.forEach((part, partIndex) => {
      const partName = `part${partIndex + 1}`;
      templateParts.push(`{${partName}}`);
      
      if (part.source === 'target') {
        const start = Number(part.startPos);
        const end = Number(part.endPos);
        parts[partName] = {
          length: end - start + 1,
          expr: part.isReverseComplement 
            ? `rc(target_region[${start - 1}:${end}])`
            : `target_region[${start - 1}:${end}]`
        };
      } else if (part.source === 'barcode') {
        // Extract barcode name from label
        const barcodeName = part.label.split(': ')[1];
        // Get barcode sequence from barcodes state
        const barcodeSequence = barcodes[barcodeName] || part.sequence;
        parts[partName] = {
          length: barcodeSequence.length,
          expr: `encoding[target_region.gene_id]['${barcodeName}']`
        };
      } else if (part.source === 'fixed') {
        parts[partName] = {
          length: part.sequence.length,
          expr: `'${part.sequence}'`
        };
      } else if (part.source === 'probe') {
        const sourceProbe = probes.find(p => p.id === part.sourceProbeId);
        if (sourceProbe) {
          const sourceProbeName = sourceProbe.name || `probe_${probes.findIndex(p => p.id === part.sourceProbeId) + 1}`;
          const start = Number(part.sourceStartPos);
          const end = Number(part.sourceEndPos);
          parts[partName] = {
            length: end - start + 1,
            expr: part.isReverseComplement
              ? `rc(${sourceProbeName}.part${part.sourceStartPos})`
              : `${sourceProbeName}[${start - 1}:${end}]`
          };
        }
      }
    });
    
    yamlProbes[probeName] = {
      template: templateParts.join(''),
      parts: parts
    };
  });
  
  return `target_sequence_length: ${targetLength}\nprobes:\n${Object.entries<YAMLProbeConfig>(yamlProbes)
    .map(([name, config]) => `  ${name}:\n    template: "${config.template}"\n    parts:\n${Object.entries<YAMLPartConfig>(config.parts)
      .map(([partName, partConfig]) => `      ${partName}:\n${Object.entries(partConfig)
        .map(([key, value]) => `        ${key}: ${value}`)
        .join('\n')}`)
      .join('\n')}`)
    .join('\n')}`;
};

const CustomProbe: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Target sequence state
  const [targetLength, setTargetLength] = useState<number>(100);
  const [targetSequence, setTargetSequence] = useState<string>('');
  
  // Probes state
  const [probes, setProbes] = useState<Probe[]>([
    { id: '1', parts: [], isComplete: false }
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
  
  // Predefined barcodes and fixed sequences
  const [barcodes, setBarcodes] = useState<{[key: string]: string}>({
    'BC1': 'ACGTACGTACGT',
    'BC2': 'TGCATGCATGCA',
    'BC3': 'GCTAGCTAGCTA'
  });
  
  // Add state for barcode length
  const [barcodeLength, setBarcodeLength] = useState<number>(12);
  
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
    const newSequence = generateRandomBarcode(barcodeLength);
    const newBarcodeName = `BC${Object.keys(barcodes).length + 1}`;
    setBarcodes(prev => ({
      ...prev,
      [newBarcodeName]: newSequence
    }));
    showAlert(`New barcode ${newBarcodeName} generated!`, 'success');
  };
  
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
    sourceEndPos: '10'
  });
  
  // Generate random sequence as Target when targetLength changes
  useEffect(() => {
    generateRandomSequence(targetLength);
  }, [targetLength]);
  
  const generateRandomSequence = (length: number) => {
    const bases = ['A', 'T', 'G', 'C'];
    let sequence = '';
    for (let i = 0; i < length; i++) {
      sequence += bases[Math.floor(Math.random() * bases.length)];
    }
    setTargetSequence(sequence);
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
    } else {
      setNewPart(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  
  // Apply reverse complement
  const toggleReverseComplement = () => {
    setNewPart(prev => ({
      ...prev,
      isReverseComplement: !prev.isReverseComplement,
      sequence: reverseComplement(prev.sequence)
    }));
  };
  
  // Add this after the toggleReverseComplement function
  const calculateGCContent = (sequence: string): number => {
    if (!sequence) return 0;
    const gcCount = (sequence.match(/[GCgc]/g) || []).length;
    return parseFloat(((gcCount / sequence.length) * 100).toFixed(2));
  };

  // Replace updatePartAttributes function
  const updatePartThresholds = (probeIndex: number, partIndex: number, thresholds: Partial<ProbePart['attributeThresholds']>) => {
    const updatedProbes = [...probes];
    if (!updatedProbes[probeIndex].parts[partIndex].attributeThresholds) {
      updatedProbes[probeIndex].parts[partIndex].attributeThresholds = {};
    }
    updatedProbes[probeIndex].parts[partIndex].attributeThresholds = {
      ...updatedProbes[probeIndex].parts[partIndex].attributeThresholds,
      ...thresholds
    };
    setProbes(updatedProbes);
  };

  // Replace initializePartAttributes function
  const initializePartThresholds = (): NonNullable<ProbePart['attributeThresholds']> => {
    // Default threshold values
    return {
      length: 0, // 固定值，将在添加部分时设置为序列长度
      gcContentMin: 40,
      gcContentMax: 60,
      foldScoreMax: 40,
      tmMin: 60,
      tmMax: 75,
      selfMatchMax: 4,
      nMappedGenesMax: 5,
      aligners: ['BLAST'],
      enabledAttributes: ['length'] // 默认启用length属性
    };
  };

  // Modify addPartToProbe to use thresholds instead of attributes
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
      partLabel = `Target: ${newPart.startPos}-${newPart.endPos}`;
    } else if (newPart.source === 'external') {
      if (newPart.externalType === 'barcode') {
        partLabel = `Barcode: ${newPart.externalName}`;
        source = 'barcode';
      } else if (newPart.externalType === 'fixed') {
        partLabel = `Fixed: Custom`;
        source = 'fixed';
      }
    } else if (newPart.source === 'probe') {
      partLabel = `Probe: ${newPart.sourceProbeId} (${newPart.sourceStartPos}-${newPart.sourceEndPos})`;
      sourceProbeId = newPart.sourceProbeId;
    }
    
    // 初始化属性阈值
    const thresholds = initializePartThresholds();
    // 设置length属性为序列长度
    thresholds.length = newPart.sequence.length;
    
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
      attributeThresholds: thresholds
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
      sourceEndPos: '10'
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
    const newProbe = { id: newProbeId, parts: [], isComplete: false };
    
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
  
  // Modify the validatePositions function
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

  // Modify the saveProbeGroup function
  const saveProbeGroup = () => {
    if (!probeGroup.name.trim()) {
      showAlert('Please enter a name for the probe group', 'error');
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

    const yamlContent = convertProbesToYAML(probes, targetLength, barcodes);

    const updatedGroup: ProbeGroup = {
      ...probeGroup,
      probes: probes,
      updatedAt: new Date(),
      isSaved: true,
      type: 'custom',
      yamlContent: yamlContent,
      barcodeCount: barcodeSet.size,
      targetLength: targetLength
    };

    // Save to localStorage for persistence
    const savedGroups = JSON.parse(localStorage.getItem('savedProbeGroups') || '[]');
    const existingIndex = savedGroups.findIndex((g: ProbeGroup) => g.id === probeGroup.id);
    
    if (existingIndex >= 0) {
      savedGroups[existingIndex] = updatedGroup;
    } else {
      savedGroups.push(updatedGroup);
    }
    
    localStorage.setItem('savedProbeGroups', JSON.stringify(savedGroups));

    setSavedProbeGroups(savedGroups);
    showAlert('Probe group saved successfully!', 'success');
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
      setShowHistory(false);
      showAlert('Probe group loaded successfully!', 'success');
    }
  };

  // Delete probe group from history
  const deleteProbeGroup = (groupId: string) => {
    setSavedProbeGroups(prev => prev.filter(g => g.id !== groupId));
    showAlert('Probe group deleted from history', 'info');
  };

  // Add this function before the CustomProbe component
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
      handleNewPartChange(field, pos);
    }
  };

  // 初始化探针属性阈值
  const initializeProbeThresholds = (): NonNullable<Probe['attributeThresholds']> => {
    // 与部分阈值相同但值略有不同
    return {
      gcContentMin: 35,
      gcContentMax: 65,
      foldScoreMax: 50,
      tmMin: 55,
      tmMax: 80,
      selfMatchMax: 6,
      nMappedGenesMax: 10,
      aligners: ['BLAST'],
      enabledAttributes: [] // 默认不启用任何属性
    };
  };

  // 更新探针阈值
  const updateProbeThresholds = (probeIndex: number, thresholds: Partial<Probe['attributeThresholds']>) => {
    const updatedProbes = [...probes];
    if (!updatedProbes[probeIndex].attributeThresholds) {
      updatedProbes[probeIndex].attributeThresholds = initializeProbeThresholds();
    }
    updatedProbes[probeIndex].attributeThresholds = {
      ...updatedProbes[probeIndex].attributeThresholds,
      ...thresholds
    };
    setProbes(updatedProbes);
  };

  // 探针级别的属性编辑组件
  const ProbeThresholdsEdit = ({ 
    probeIndex, 
    probe,
    onClose
  }: { 
    probeIndex: number; 
    probe: Probe;
    onClose: () => void;
  }) => {
    // 获取初始阈值和启用的属性
    const defaultThresholds = initializeProbeThresholds();
    const initialThresholds = probe.attributeThresholds || defaultThresholds;
    
    const [thresholds, setThresholds] = useState<NonNullable<Probe['attributeThresholds']>>({
      ...defaultThresholds,
      ...initialThresholds
    });
    
    const [enabledAttributes, setEnabledAttributes] = useState<string[]>(
      initialThresholds.enabledAttributes || []
    );
    
    const [availableAligners] = useState(['BLAST', 'Bowtie2', 'MMseqs2', 'Jellyfish']);
    
    // 检查属性是否启用
    const isAttributeEnabled = (attributeName: string): boolean => {
      return enabledAttributes.includes(attributeName);
    };
    
    // 切换属性的启用状态
    const toggleAttribute = (attributeName: string) => {
      if (isAttributeEnabled(attributeName)) {
        setEnabledAttributes(prev => prev.filter(a => a !== attributeName));
      } else {
        setEnabledAttributes(prev => [...prev, attributeName]);
      }
    };
    
    const handleThresholdChange = (name: string, value: any) => {
      setThresholds(prev => ({
        ...prev,
        [name]: value
      }));
    };
    
    const handleSave = () => {
      // 保存时更新启用的属性
      const updatedThresholds = {
        ...thresholds,
        enabledAttributes
      };
      
      updateProbeThresholds(probeIndex, updatedThresholds);
      onClose();
      showAlert('Probe attribute conditions updated successfully!', 'success');
    };

    const handleAlignerChange = (aligner: string) => {
      setThresholds(prev => {
        const currentAligners = prev.aligners || [];
        if (currentAligners.includes(aligner)) {
          return {
            ...prev,
            aligners: currentAligners.filter(a => a !== aligner)
          };
        } else {
          return {
            ...prev,
            aligners: [...currentAligners, aligner]
          };
        }
      });
    };
    
    // AttributeField组件与部分属性编辑复用相同逻辑
    const AttributeField = ({ 
      label, 
      attributeName, 
      children
    }: { 
      label: string; 
      attributeName: string; 
      children: React.ReactNode;
    }) => (
      <Grid item xs={12} sm={6} md={4}>
        <Box sx={{ 
          border: '1px solid', 
          borderColor: isAttributeEnabled(attributeName) ? 'primary.main' : 'divider', 
          borderRadius: 1,
          p: 2,
          position: 'relative',
          backgroundColor: isAttributeEnabled(attributeName) ? 'rgba(25, 118, 210, 0.04)' : 'transparent'
        }}>
          <Box sx={{ 
            position: 'absolute', 
            top: -1, 
            right: 8,
            transform: 'translateY(-50%)',
            zIndex: 1,
            backgroundColor: 'background.paper',
            px: 0.5
          }}>
            <Chip
              label={label}
              size="small"
              color={isAttributeEnabled(attributeName) ? "primary" : "default"}
              onClick={() => toggleAttribute(attributeName)}
              variant={isAttributeEnabled(attributeName) ? "filled" : "outlined"}
            />
          </Box>
          <Box sx={{ 
            opacity: isAttributeEnabled(attributeName) ? 1 : 0.5,
            transition: 'opacity 0.2s'
          }}>
            {children}
          </Box>
        </Box>
      </Grid>
    );
    
    return (
      <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Whole Probe Attribute Conditions
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={onClose}
            startIcon={<CloseIcon />}
          >
            Close
          </Button>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set conditions for the entire probe. Click on the attribute chips to enable/disable specific attributes.
        </Typography>
        
        <Grid container spacing={2}>
          {/* GC Content Range */}
          <AttributeField label="GC Content" attributeName="gcContent">
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField
                  label="Min (%)"
                  type="number"
                  value={thresholds.gcContentMin || ''}
                  onChange={(e) => handleThresholdChange('gcContentMin', parseFloat(e.target.value))}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: <Typography variant="caption">%</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Max (%)"
                  type="number"
                  value={thresholds.gcContentMax || ''}
                  onChange={(e) => handleThresholdChange('gcContentMax', parseFloat(e.target.value))}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: <Typography variant="caption">%</Typography>
                  }}
                />
              </Grid>
            </Grid>
          </AttributeField>
          
          {/* Fold Score */}
          <AttributeField label="Fold Score" attributeName="foldScore">
            <TextField
              label="Maximum Score"
              type="number"
              value={thresholds.foldScoreMax || ''}
              onChange={(e) => handleThresholdChange('foldScoreMax', parseFloat(e.target.value))}
              fullWidth
              size="small"
              helperText="Lower is better stability"
            />
          </AttributeField>
          
          {/* Temperature range */}
          <AttributeField label="Melting Temp" attributeName="temperature">
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField
                  label="Min (°C)"
                  type="number"
                  value={thresholds.tmMin || ''}
                  onChange={(e) => handleThresholdChange('tmMin', parseFloat(e.target.value))}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: <Typography variant="caption">°C</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Max (°C)"
                  type="number"
                  value={thresholds.tmMax || ''}
                  onChange={(e) => handleThresholdChange('tmMax', parseFloat(e.target.value))}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: <Typography variant="caption">°C</Typography>
                  }}
                />
              </Grid>
            </Grid>
          </AttributeField>
          
          {/* Self match */}
          <AttributeField label="Self-Match" attributeName="selfMatch">
            <TextField
              label="Maximum Value"
              type="number"
              value={thresholds.selfMatchMax || ''}
              onChange={(e) => handleThresholdChange('selfMatchMax', parseFloat(e.target.value))}
              fullWidth
              size="small"
              helperText="Lower reduces self-complementarity"
            />
          </AttributeField>
          
          {/* Mapped genes */}
          <AttributeField label="Mapped Genes" attributeName="mappedGenes">
            <TextField
              label="Maximum Count"
              type="number"
              value={thresholds.nMappedGenesMax || ''}
              onChange={(e) => handleThresholdChange('nMappedGenesMax', parseFloat(e.target.value))}
              fullWidth
              size="small"
              helperText="Lower is more specific"
            />
          </AttributeField>
          
          {/* Aligners */}
          <AttributeField label="Aligners" attributeName="aligners">
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableAligners.map((aligner) => (
                <Chip
                  key={aligner}
                  label={aligner}
                  onClick={() => handleAlignerChange(aligner)}
                  color={(thresholds.aligners || []).includes(aligner) ? "primary" : "default"}
                  variant={(thresholds.aligners || []).includes(aligner) ? "filled" : "outlined"}
                  size="small"
                />
              ))}
            </Box>
          </AttributeField>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}/>
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSave}
            >
              Save Probe Attributes
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // 部分级别的属性编辑组件
  const PartThresholdsEdit = ({ 
    probeIndex, 
    partIndex, 
    part,
    onClose
  }: { 
    probeIndex: number; 
    partIndex: number; 
    part: ProbePart;
    onClose: () => void;
  }) => {
    // 获取初始阈值和启用的属性
    const defaultThresholds = initializePartThresholds();
    const initialThresholds = part.attributeThresholds || defaultThresholds;
    
    const [thresholds, setThresholds] = useState<NonNullable<ProbePart['attributeThresholds']>>({
      ...defaultThresholds,
      ...initialThresholds
    });
    
    const [enabledAttributes, setEnabledAttributes] = useState<string[]>(
      initialThresholds.enabledAttributes || []
    );
    
    const [availableAligners] = useState(['BLAST', 'Bowtie2', 'MMseqs2', 'Jellyfish']);
    
    // 检查属性是否启用
    const isAttributeEnabled = (attributeName: string): boolean => {
      return enabledAttributes.includes(attributeName);
    };
    
    // 切换属性的启用状态
    const toggleAttribute = (attributeName: string) => {
      if (isAttributeEnabled(attributeName)) {
        setEnabledAttributes(prev => prev.filter(a => a !== attributeName));
      } else {
        setEnabledAttributes(prev => [...prev, attributeName]);
      }
    };
    
    const handleThresholdChange = (name: string, value: any) => {
      setThresholds(prev => ({
        ...prev,
        [name]: value
      }));
    };
    
    const handleSave = () => {
      // 保存时更新启用的属性
      const updatedThresholds = {
        ...thresholds,
        enabledAttributes
      };
      
      updatePartThresholds(probeIndex, partIndex, updatedThresholds);
      onClose();
      showAlert('Part attribute conditions updated successfully!', 'success');
    };

    const handleAlignerChange = (aligner: string) => {
      setThresholds(prev => {
        const currentAligners = prev.aligners || [];
        if (currentAligners.includes(aligner)) {
          return {
            ...prev,
            aligners: currentAligners.filter(a => a !== aligner)
          };
        } else {
          return {
            ...prev,
            aligners: [...currentAligners, aligner]
          };
        }
      });
    };
    
    // 修改AttributeField组件，添加readOnly属性
    const AttributeField = ({ 
      label, 
      attributeName, 
      children,
      readOnly = false
    }: { 
      label: string; 
      attributeName: string; 
      children: React.ReactNode;
      readOnly?: boolean;
    }) => (
      <Grid item xs={12} sm={6} md={4}>
        <Box sx={{ 
          border: '1px solid', 
          borderColor: isAttributeEnabled(attributeName) ? 'primary.main' : 'divider', 
          borderRadius: 1,
          p: 2,
          position: 'relative',
          backgroundColor: isAttributeEnabled(attributeName) ? 'rgba(25, 118, 210, 0.04)' : 'transparent'
        }}>
          <Box sx={{ 
            position: 'absolute', 
            top: -1, 
            right: 8,
            transform: 'translateY(-50%)',
            zIndex: 1,
            backgroundColor: 'background.paper',
            px: 0.5
          }}>
            <Chip
              label={label}
              size="small"
              color={isAttributeEnabled(attributeName) ? "primary" : "default"}
              onClick={readOnly ? undefined : () => toggleAttribute(attributeName)}
              variant={isAttributeEnabled(attributeName) ? "filled" : "outlined"}
              sx={{ cursor: readOnly ? 'default' : 'pointer' }}
            />
          </Box>
          <Box sx={{ 
            opacity: isAttributeEnabled(attributeName) ? 1 : 0.5,
            transition: 'opacity 0.2s'
          }}>
            {children}
          </Box>
        </Box>
      </Grid>
    );
    
    return (
      <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Part Attribute Conditions
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={onClose}
            startIcon={<CloseIcon />}
          >
            Close
          </Button>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click on the attribute name chips to enable/disable specific attributes. Only enabled attributes will be used for probe design.
        </Typography>
        
        <Grid container spacing={2}>
          {/* Length - 固定值，只读 */}
          <AttributeField label="Length" attributeName="length" readOnly={true}>
            <TextField
              label="Length (bp)"
              type="number"
              value={thresholds.length || ''}
              fullWidth
              size="small"
              InputProps={{
                readOnly: true,
                endAdornment: <Typography variant="caption">bp</Typography>
              }}
            />
          </AttributeField>
          
          {/* GC Content Range */}
          <AttributeField label="GC Content" attributeName="gcContent">
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField
                  label="Min (%)"
                  type="number"
                  value={thresholds.gcContentMin || ''}
                  onChange={(e) => handleThresholdChange('gcContentMin', parseFloat(e.target.value))}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: <Typography variant="caption">%</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Max (%)"
                  type="number"
                  value={thresholds.gcContentMax || ''}
                  onChange={(e) => handleThresholdChange('gcContentMax', parseFloat(e.target.value))}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: <Typography variant="caption">%</Typography>
                  }}
                />
              </Grid>
            </Grid>
          </AttributeField>
          
          {/* Fold Score */}
          <AttributeField label="Fold Score" attributeName="foldScore">
            <TextField
              label="Maximum Score"
              type="number"
              value={thresholds.foldScoreMax || ''}
              onChange={(e) => handleThresholdChange('foldScoreMax', parseFloat(e.target.value))}
              fullWidth
              size="small"
              helperText="Lower is better stability"
            />
          </AttributeField>
          
          {/* Temperature range */}
          <AttributeField label="Melting Temp" attributeName="temperature">
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField
                  label="Min (°C)"
                  type="number"
                  value={thresholds.tmMin || ''}
                  onChange={(e) => handleThresholdChange('tmMin', parseFloat(e.target.value))}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: <Typography variant="caption">°C</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Max (°C)"
                  type="number"
                  value={thresholds.tmMax || ''}
                  onChange={(e) => handleThresholdChange('tmMax', parseFloat(e.target.value))}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: <Typography variant="caption">°C</Typography>
                  }}
                />
              </Grid>
            </Grid>
          </AttributeField>
          
          {/* Self match */}
          <AttributeField label="Self-Match" attributeName="selfMatch">
            <TextField
              label="Maximum Value"
              type="number"
              value={thresholds.selfMatchMax || ''}
              onChange={(e) => handleThresholdChange('selfMatchMax', parseFloat(e.target.value))}
              fullWidth
              size="small"
              helperText="Lower reduces self-complementarity"
            />
          </AttributeField>
          
          {/* Mapped genes */}
          <AttributeField label="Mapped Genes" attributeName="mappedGenes">
            <TextField
              label="Maximum Count"
              type="number"
              value={thresholds.nMappedGenesMax || ''}
              onChange={(e) => handleThresholdChange('nMappedGenesMax', parseFloat(e.target.value))}
              fullWidth
              size="small"
              helperText="Lower is more specific"
            />
          </AttributeField>
          
          {/* Aligners */}
          <AttributeField label="Aligners" attributeName="aligners">
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableAligners.map((aligner) => (
                <Chip
                  key={aligner}
                  label={aligner}
                  onClick={() => handleAlignerChange(aligner)}
                  color={(thresholds.aligners || []).includes(aligner) ? "primary" : "default"}
                  variant={(thresholds.aligners || []).includes(aligner) ? "filled" : "outlined"}
                  size="small"
                />
              ))}
            </Box>
          </AttributeField>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}/>
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSave}
            >
              Save Attributes
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // 添加状态跟踪当前编辑的探针
  const [editingProbeThresholds, setEditingProbeThresholds] = useState<number | null>(null);

  // Add this state for tracking which part is being edited
  const [editingPartInfo, setEditingPartInfo] = useState<{
    probeIndex: number;
    partIndex: number;
  } | null>(null);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <StyledContainer>
        <Typography variant="h3" gutterBottom align="center" sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <DnaIcon color="primary" fontSize="large" />
          Create Your Own Probe Type, Please Follow the Steps!
        </Typography>
        
        {/* Alert for notifications */}
        <Collapse in={alertState.open}>
          <Alert 
            severity={alertState.severity}
            sx={{ mb: 2 }}
            action={
              <IconButton
                size="small"
                onClick={() => setAlertState(prev => ({ ...prev, open: false }))}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {alertState.message}
          </Alert>
        </Collapse>

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
              {savedProbeGroups.map((group) => (
                <ListItem
                  key={group.id}
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        onClick={() => loadProbeGroup(group, true)}
                        sx={{ mr: 1 }}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => deleteProbeGroup(group.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={group.name}
                    secondary={`Created: ${group.createdAt.toLocaleString()} | Probes: ${group.probes.length}`}
                  />
                </ListItem>
              ))}
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
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row', 
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: 2,
            mb: 2 
          }}>
            <TextField
              label="Sequence Length"
              type="number"
              value={targetLength}
              onChange={handleTargetLengthChange}
              size="small"
              InputProps={{ 
                inputProps: { 
                  min: 1,
                  step: 1
                } 
              }}
              sx={{ minWidth: '180px' }}
            />
            <Tooltip title="Generate a new random sequence">
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />}
                onClick={() => generateRandomSequence(targetLength)}
              >
                Regenerate
              </Button>
            </Tooltip>
          </Box>
          
          <Typography variant="subtitle2" gutterBottom>
            Target Sequence ({targetSequence.length} bp):
          </Typography>
          <SequenceDisplay>
            {targetSequence}
          </SequenceDisplay>
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
                    <Typography variant="h6" component="h3">
                      Probe {probe.id}
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
                  
                  <Box>
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

                    <Tooltip title="Edit probe attributes">
                      <IconButton 
                        onClick={() => setEditingProbeThresholds(index)}
                        color="primary"
                        size="small"
                        disabled={!probe.isComplete}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ProbeCardHeader>
                
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
                                borderRadius: 1
                              }}
                            >
                              <Typography variant="body2" sx={{ 
                                flex: isMobile ? 'none' : 1,
                                mb: isMobile ? 1 : 0
                              }}>
                                {idx + 1}. {part.label} 
                                {part.isReverseComplement ? ' (Reverse Complement)' : ''}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                flex: isMobile ? 'none' : 2,
                                fontFamily: 'monospace',
                                mb: isMobile ? 1 : 0,
                                px: 1
                              }}>
                                {part.sequence}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Edit filter conditions">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => setEditingPartInfo({ probeIndex: index, partIndex: idx })}
                                    color="primary"
                                    disabled={probe.isComplete}
                                  >
                                    <SettingsIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <IconButton 
                                  size="small" 
                                  onClick={() => removePart(index, idx)}
                                  color="error"
                                  disabled={probe.isComplete}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                            
                            {/* Display attribute summary */}
                            {part.attributeThresholds && (
                              <Box 
                                sx={{ 
                                  ml: 2, 
                                  mb: 2, 
                                  display: 'flex', 
                                  flexWrap: 'wrap', 
                                  gap: 1,
                                  alignItems: 'center'
                                }}
                              >
                                <Typography variant="caption" color="text.secondary">
                                  Part Attributes:
                                </Typography>
                                {part.attributeThresholds.enabledAttributes && part.attributeThresholds.enabledAttributes.length > 0 ? (
                                  <>
                                    {part.attributeThresholds.enabledAttributes.includes('gcContent') && part.attributeThresholds.gcContentMin !== undefined && part.attributeThresholds.gcContentMax !== undefined && (
                                      <Chip 
                                        size="small" 
                                        label={`GC: ${part.attributeThresholds.gcContentMin}-${part.attributeThresholds.gcContentMax}%`} 
                                        color="primary" 
                                        variant="outlined"
                                      />
                                    )}
                                    {part.attributeThresholds.length !== undefined && (
                                      <Chip 
                                        size="small" 
                                        label={`Length: ${part.attributeThresholds.length} bp`} 
                                        color="success" 
                                        variant="outlined"
                                      />
                                    )}
                                    {part.attributeThresholds.enabledAttributes.includes('temperature') && part.attributeThresholds.tmMin !== undefined && part.attributeThresholds.tmMax !== undefined && (
                                      <Chip 
                                        size="small" 
                                        label={`Tm: ${part.attributeThresholds.tmMin}-${part.attributeThresholds.tmMax}°C`}
                                        color="info" 
                                        variant="outlined"
                                      />
                                    )}
                                    {part.attributeThresholds.enabledAttributes.includes('foldScore') && part.attributeThresholds.foldScoreMax !== undefined && (
                                      <Chip 
                                        size="small" 
                                        label={`Fold: ≤${part.attributeThresholds.foldScoreMax}`}
                                        color="secondary" 
                                        variant="outlined"
                                      />
                                    )}
                                    {part.attributeThresholds.enabledAttributes.includes('selfMatch') && part.attributeThresholds.selfMatchMax !== undefined && (
                                      <Chip 
                                        size="small" 
                                        label={`Self: ≤${part.attributeThresholds.selfMatchMax}`}
                                        color="warning" 
                                        variant="outlined"
                                      />
                                    )}
                                    {part.attributeThresholds.enabledAttributes.includes('mappedGenes') && part.attributeThresholds.nMappedGenesMax !== undefined && (
                                      <Chip 
                                        size="small" 
                                        label={`Genes: ≤${part.attributeThresholds.nMappedGenesMax}`}
                                        color="error" 
                                        variant="outlined"
                                      />
                                    )}
                                    {part.attributeThresholds.enabledAttributes.includes('aligners') && part.attributeThresholds.aligners && part.attributeThresholds.aligners.length > 0 && (
                                      <Tooltip title={part.attributeThresholds.aligners.join(', ')}>
                                        <Chip 
                                          size="small" 
                                          label={`Aligners: ${part.attributeThresholds.aligners.length}`}
                                          color="default" 
                                          variant="outlined"
                                        />
                                      </Tooltip>
                                    )}
                                  </>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">
                                    No active attributes
                                  </Typography>
                                )}
                              </Box>
                            )}
                            
                            {/* Display attribute editor when needed */}
                            {editingPartInfo && 
                             editingPartInfo.probeIndex === index && 
                             editingPartInfo.partIndex === idx && (
                              <PartThresholdsEdit
                                probeIndex={index}
                                partIndex={idx}
                                part={part}
                                onClose={() => setEditingPartInfo(null)}
                              />
                            )}
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
                                    <FormControl size="small" sx={{ width: '30%' }}>
                                      <InputLabel>Barcode</InputLabel>
                                      <Select
                                        value={newPart.externalName}
                                        label="Barcode"
                                        onChange={(e) => handleNewPartChange('externalName', e.target.value)}
                                      >
                                        {Object.keys(barcodes).map(key => (
                                          <MenuItem key={key} value={key}>{key}</MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1 }}>
                                      <TextField
                                        label="Length"
                                        type="number"
                                        value={barcodeLength}
                                        onChange={(e) => setBarcodeLength(Math.max(1, parseInt(e.target.value) || 1))}
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
                              <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Select Probe</InputLabel>
                                  <Select
                                    value={newPart.sourceProbeId}
                                    label="Select Probe"
                                    onChange={(e) => handleNewPartChange('sourceProbeId', e.target.value)}
                                  >
                                    {getCompletedProbes().map(probe => (
                                      <MenuItem key={probe.id} value={probe.id}>
                                        Probe {probe.id} ({getProbeFullSequence(probe).length} bp)
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

                    {/* 探针属性编辑器 */}
                    {editingProbeThresholds === index && (
                      <ProbeThresholdsEdit
                        probeIndex={index}
                        probe={probe}
                        onClose={() => setEditingProbeThresholds(null)}
                      />
                    )}
                    
                    {/* 探针属性摘要显示 */}
                    {probe.attributeThresholds && probe.isComplete && (
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Whole Probe Attributes:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {probe.attributeThresholds.enabledAttributes && probe.attributeThresholds.enabledAttributes.length > 0 ? (
                            <>
                              {probe.attributeThresholds.enabledAttributes.includes('gcContent') && probe.attributeThresholds.gcContentMin !== undefined && probe.attributeThresholds.gcContentMax !== undefined && (
                                <Chip 
                                  size="small" 
                                  label={`GC: ${probe.attributeThresholds.gcContentMin}-${probe.attributeThresholds.gcContentMax}%`} 
                                  color="primary" 
                                  variant="outlined"
                                />
                              )}
                              {probe.attributeThresholds.enabledAttributes.includes('temperature') && probe.attributeThresholds.tmMin !== undefined && probe.attributeThresholds.tmMax !== undefined && (
                                <Chip 
                                  size="small" 
                                  label={`Tm: ${probe.attributeThresholds.tmMin}-${probe.attributeThresholds.tmMax}°C`}
                                  color="info" 
                                  variant="outlined"
                                />
                              )}
                              {probe.attributeThresholds.enabledAttributes.includes('foldScore') && probe.attributeThresholds.foldScoreMax !== undefined && (
                                <Chip 
                                  size="small" 
                                  label={`Fold: ≤${probe.attributeThresholds.foldScoreMax}`}
                                  color="secondary" 
                                  variant="outlined"
                                />
                              )}
                              {probe.attributeThresholds.enabledAttributes.includes('selfMatch') && probe.attributeThresholds.selfMatchMax !== undefined && (
                                <Chip 
                                  size="small" 
                                  label={`Self: ≤${probe.attributeThresholds.selfMatchMax}`}
                                  color="warning" 
                                  variant="outlined"
                                />
                              )}
                              {probe.attributeThresholds.enabledAttributes.includes('mappedGenes') && probe.attributeThresholds.nMappedGenesMax !== undefined && (
                                <Chip 
                                  size="small" 
                                  label={`Genes: ≤${probe.attributeThresholds.nMappedGenesMax}`}
                                  color="error" 
                                  variant="outlined"
                                />
                              )}
                              {probe.attributeThresholds.enabledAttributes.includes('aligners') && probe.attributeThresholds.aligners && probe.attributeThresholds.aligners.length > 0 && (
                                <Tooltip title={probe.attributeThresholds.aligners.join(', ')}>
                                  <Chip 
                                    size="small" 
                                    label={`Aligners: ${probe.attributeThresholds.aligners.length}`}
                                    color="default" 
                                    variant="outlined"
                                  />
                                </Tooltip>
                              )}
                            </>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              No probe-level attributes set
                            </Typography>
                          )}
                        </Box>
                      </Box>
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
                backgroundColor: theme.palette.info.light,
                color: theme.palette.info.contrastText
              }}
            >
              <Typography variant="subtitle1" gutterBottom>
                <b>🔍 How to Design Multiple Probes:</b>
              </Typography>
              <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li>Design your first probe by adding parts from target sequence or external sources</li>
                <li>Click the checkmark button to mark the probe as complete when finished</li>
                <li>Add a new probe using the "Add Probe" button</li>
                <li>When designing subsequent probes, you can use completed probes as sources</li>
                <li>Continue until all desired probes are designed</li>
              </ol>
            </Paper>
      </StyledContainer>
    </Container>
  );
};

export default CustomProbe;