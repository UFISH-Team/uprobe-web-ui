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
  },
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

const ProbeSegment = styled(Box, {
  shouldForwardProp: (prop) => prop !== "segmentType"
})<{ segmentType: string }>(({ theme, segmentType }) => {
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
    backgroundColor: colors[segmentType] || theme.palette.grey[300],
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
type SegmentSource = 'target' | 'barcode' | 'fixed' | 'external' | 'probe';

interface ProbeSegment {
  id: string;
  source: SegmentSource;
  sequence: string;
  startPos?: number | '';
  endPos?: number | '';
  isReverseComplement: boolean;
  label: string;
  sourceProbeId?: string;
  sourceStartPos?: number | '';
  sourceEndPos?: number | '';
}

interface Probe {
  id: string;
  segments: ProbeSegment[];
  isComplete: boolean;
  name?: string; // Optional name for the probe
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
const convertProbesToYAML = (probes: Probe[], targetLength: number): string => {
  const yamlProbes: YAMLProbes = {};
  
  probes.forEach((probe, index) => {
    if (!probe.isComplete) return;
    
    const probeName = probe.name || `probe_${index + 1}`;
    const parts: { [key: string]: YAMLPartConfig } = {};
    let templateParts: string[] = [];
    
    probe.segments.forEach((segment, segIndex) => {
      const partName = `part${segIndex + 1}`;
      templateParts.push(`{${partName}}`);
      
      if (segment.source === 'target') {
        const start = Number(segment.startPos);
        const end = Number(segment.endPos);
        parts[partName] = {
          length: end - start + 1,
          expr: segment.isReverseComplement 
            ? `rc(target_region[${start - 1}:${end}])`
            : `target_region[${start - 1}:${end}]`
        };
      } else if (segment.source === 'barcode') {
        parts[partName] = {
          expr: `encoding[target_region.gene_id]['${segment.label.split(': ')[1]}']`
        };
      } else if (segment.source === 'fixed') {
        parts[partName] = {
          expr: `'${segment.sequence}'`
        };
      } else if (segment.source === 'probe') {
        const sourceProbe = probes.find(p => p.id === segment.sourceProbeId);
        if (sourceProbe) {
          const sourceProbeName = sourceProbe.name || `probe_${probes.findIndex(p => p.id === segment.sourceProbeId) + 1}`;
          parts[partName] = {
            expr: segment.isReverseComplement
              ? `rc(${sourceProbeName}.part${segment.sourceStartPos})`
              : `${sourceProbeName}[${Number(segment.sourceStartPos) - 1}:${Number(segment.sourceEndPos)}]`
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
    { id: '1', segments: [], isComplete: false }
  ]);
  
  // Probe group state
  const [probeGroup, setProbeGroup] = useState<ProbeGroup>({
    id: Date.now().toString(),
    name: 'New Probe Group',
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
  
 
  // State for new segment
  const [newSegment, setNewSegment] = useState<{
    source: SegmentSource;
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
      probe.segments.length > 0 // Must have segments
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
    return probe.segments.map(segment => segment.sequence).join('');
  };
  
  // Update new segment form
  const handleNewSegmentChange = (field: string, value: any) => {
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
      
      setNewSegment(prev => ({
        ...prev,
        ...resetState,
        [field]: value
      }));
    } else if (field === 'startPos' || field === 'endPos') {
      setNewSegment(prev => {
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
      setNewSegment(prev => {
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
      if (newSegment.externalType === 'barcode' && barcodes[value]) {
        sequence = barcodes[value];
      }
      
      setNewSegment(prev => ({
        ...prev,
        externalName: value,
        sequence
      }));
    } else if (field === 'customFixedSequence') {
      if (value === '' || validateSequence(value)) {
        setNewSegment(prev => ({
          ...prev,
          customFixedSequence: value,
          sequence: value
        }));
      } else {
        showAlert('Invalid sequence. Only A, T, G, C bases are allowed', 'error');
      }
    } else if (field === 'externalType') {
      setNewSegment(prev => ({
        ...prev,
        externalType: value,
        externalName: '',
        customFixedSequence: '',
        sequence: ''
      }));
    } else if (field === 'sourceProbeId') {
      const sequence = getProbeSequenceById(value);
      if (sequence) {
        setNewSegment(prev => ({
          ...prev,
          sourceProbeId: value,
          sequence
        }));
      }
    } else {
      setNewSegment(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  
  // Apply reverse complement
  const toggleReverseComplement = () => {
    setNewSegment(prev => ({
      ...prev,
      isReverseComplement: !prev.isReverseComplement,
      sequence: reverseComplement(prev.sequence)
    }));
  };
  
  // Add segment to current probe
  const addSegmentToProbe = () => {
    if (!newSegment.sequence) {
      showAlert('Please select a sequence first', 'error');
      return;
    }

    if (newSegment.externalType === 'fixed' && !validateSequence(newSegment.customFixedSequence)) {
      showAlert('Invalid fixed sequence. Only A, T, G, C bases are allowed', 'error');
      return;
    }
    
    const segmentId = `probe${probes[activeProbeIndex].id}-segment${probes[activeProbeIndex].segments.length + 1}`;
    
    let segmentLabel = '';
    let source: SegmentSource = newSegment.source;
    let sourceProbeId: string | undefined = undefined;
    
    if (newSegment.source === 'target') {
      segmentLabel = `Target: ${newSegment.startPos}-${newSegment.endPos}`;
    } else if (newSegment.source === 'external') {
      if (newSegment.externalType === 'barcode') {
        segmentLabel = `Barcode: ${newSegment.externalName}`;
        source = 'barcode';
      } else if (newSegment.externalType === 'fixed') {
        segmentLabel = `Fixed: Custom`;
        source = 'fixed';
      }
    } else if (newSegment.source === 'probe') {
      segmentLabel = `Probe: ${newSegment.sourceProbeId} (${newSegment.sourceStartPos}-${newSegment.sourceEndPos})`;
      sourceProbeId = newSegment.sourceProbeId;
    }
    
    const newProbeSegment: ProbeSegment = {
      id: segmentId,
      source,
      sequence: newSegment.sequence,
      isReverseComplement: newSegment.isReverseComplement,
      label: segmentLabel,
      sourceProbeId,
      startPos: newSegment.source === 'target' ? parseInt(newSegment.startPos, 10) : undefined,
      endPos: newSegment.source === 'target' ? parseInt(newSegment.endPos, 10) : undefined,
      sourceStartPos: newSegment.source === 'probe' ? parseInt(newSegment.sourceStartPos, 10) : undefined,
      sourceEndPos: newSegment.source === 'probe' ? parseInt(newSegment.sourceEndPos, 10) : undefined
    };
    
    const updatedProbes = [...probes];
    updatedProbes[activeProbeIndex].segments.push(newProbeSegment);
    setProbes(updatedProbes);
    
    // Reset new segment form
    setNewSegment({
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
    
    showAlert('Segment added successfully!', 'success');
  };
  
  // Remove segment from probe
  const removeSegment = (probeIndex: number, segmentIndex: number) => {
    const updatedProbes = [...probes];
    updatedProbes[probeIndex].segments.splice(segmentIndex, 1);
    setProbes(updatedProbes);
  };
  
  // Mark probe as complete (finalized)
  const completeProbe = (probeIndex: number) => {
    if (probes[probeIndex].segments.length === 0) {
      showAlert('Cannot complete an empty probe. Add at least one segment.', 'error');
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
    
    if (!updatedProbes[probeIndex].isComplete && updatedProbes[probeIndex].segments.length === 0) {
      showAlert('Cannot complete an empty probe. Add at least one segment.', 'error');
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
    const newProbe = { id: newProbeId, segments: [], isComplete: false };
    
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
      probe.id !== probeId && probe.segments.some(segment => 
        segment.sourceProbeId === probeId
      )
    );
    
    if (isUsedByOtherProbes) {
      showAlert('Cannot delete this probe. It is used by other probes as a source.', 'error');
      return;
    }
    
    const updatedProbes = probes.filter((_, i) => i !== index);
    setProbes(updatedProbes);
    
    // Select first probe if current active probe is deleted
    if (activeProbeIndex === index) {
      setActiveProbeIndex(0);
    } else if (activeProbeIndex > index) {
      // Adjust index if deleted probe is before current active probe
      setActiveProbeIndex(activeProbeIndex - 1);
    }
    
    showAlert(`Probe ${probes[index].id} deleted!`, 'info');
  };
  
  // Calculate full sequence of probe
  const getProbeFullSequence = (probe: Probe): string => {
    return probe.segments.map(segment => segment.sequence).join('');
  };
  
  // Validate sequence input to contain only valid bases
  const validateSequence = (sequence: string): boolean => {
    const validBases = /^[ATGCatgc]+$/;
    return validBases.test(sequence);
  };
  
  // Modify the validatePositions function
  const validatePositions = (start: string, end: string, maxLength: number): boolean => {
    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);
    
    if (isNaN(startNum) || isNaN(endNum)) return false;
    if (startNum < 1 || endNum < 1 || startNum > maxLength || endNum > maxLength) {
      showAlert('Position must be within valid range', 'error');
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
      probe.segments.forEach(segment => {
        if (segment.source === 'barcode') {
          barcodeSet.add(segment.label.split(': ')[1]);
        }
      });
    });

    const yamlContent = convertProbesToYAML(probes, targetLength);

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
      handleNewSegmentChange(field, pos);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <StyledContainer>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
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
                  </Box>
                </ProbeCardHeader>
                
                <Collapse in={expandedCards[probe.id]}>
                  <CardContent>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Sequence:
                      </Typography>
                      
                      {probe.segments.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No segments added yet 🧬
                        </Typography>
                      ) : (
                        <>
                          <SequenceDisplay sx={{ mb: 1 }}>
                            {probe.segments.map((segment, idx) => (
                              <ProbeSegment key={idx} segmentType={segment.source}>
                                {segment.sequence}
                              </ProbeSegment>
                            ))}
                          </SequenceDisplay>
                          
                          <Typography variant="caption" display="block">
                            Total Length: {getProbeFullSequence(probe).length} bp
                          </Typography>
                        </>
                      )}
                    </Box>
                    
                    {/* Show list of segments */}
                    {probe.segments.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Segments:
                        </Typography>
                        
                        {probe.segments.map((segment, idx) => (
                          <Box 
                            key={idx}
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
                              {idx + 1}. {segment.label} 
                              {segment.isReverseComplement ? ' (Reverse Complement)' : ''}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              flex: isMobile ? 'none' : 2,
                              fontFamily: 'monospace',
                              mb: isMobile ? 1 : 0,
                              px: 1
                            }}>
                              {segment.sequence}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => removeSegment(index, idx)}
                              color="error"
                              sx={{ alignSelf: isMobile ? 'flex-end' : 'center' }}
                              disabled={probe.isComplete}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
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
                            Add New Segment
                          </Typography>
                        </Box>
                        
                        <Grid container spacing={2} alignItems="flex-start">
                          {/* Source Selection */}
                          <Grid item xs={12} sm={3}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Source</InputLabel>
                              <Select
                                value={newSegment.source}
                                label="Source"
                                onChange={(e) => handleNewSegmentChange('source', e.target.value)}
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
                          {newSegment.source === 'target' && (
                            <>
                              <Grid item xs={6} sm={3}>
                                <TextField
                                  label="Start Position"
                                  type="number"
                                  fullWidth
                                  size="small"
                                  value={newSegment.startPos}
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
                                  value={newSegment.endPos}
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
                          {newSegment.source === 'external' && (
                            <>
                              <Grid item xs={12} sm={3}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>External Type</InputLabel>
                                  <Select
                                    value={newSegment.externalType}
                                    label="External Type"
                                    onChange={(e) => handleNewSegmentChange('externalType', e.target.value)}
                                  >
                                    <MenuItem value="barcode">Barcode</MenuItem>
                                    <MenuItem value="fixed">Fixed Sequence</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              {newSegment.externalType === 'barcode' ? (
                                <Grid item xs={12} sm={6}>
                                  <FormControl fullWidth size="small">
                                    <InputLabel>Select Barcode</InputLabel>
                                    <Select
                                      value={newSegment.externalName}
                                      label="Select Barcode"
                                      onChange={(e) => handleNewSegmentChange('externalName', e.target.value)}
                                    >
                                      {Object.keys(barcodes).map(key => (
                                        <MenuItem key={key} value={key}>{key}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Grid>
                              ) : (
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    label="Enter Fixed Sequence"
                                    fullWidth
                                    size="small"
                                    value={newSegment.customFixedSequence}
                                    onChange={(e) => handleNewSegmentChange('customFixedSequence', e.target.value)}
                                    error={newSegment.customFixedSequence !== '' && !validateSequence(newSegment.customFixedSequence)}
                                    helperText={newSegment.customFixedSequence !== '' && !validateSequence(newSegment.customFixedSequence) ? "Only valid bases (A, T, G, C) allowed" : ""}
                                  />
                                </Grid>
                              )}
                            </>
                          )}

                          {/* Probe Source Selection */}
                          {newSegment.source === 'probe' && (
                            <>
                              <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Select Probe</InputLabel>
                                  <Select
                                    value={newSegment.sourceProbeId}
                                    label="Select Probe"
                                    onChange={(e) => handleNewSegmentChange('sourceProbeId', e.target.value)}
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
                              
                              {newSegment.sourceProbeId && (
                                <>
                                  <Grid item xs={6} sm={3}>
                                    <TextField
                                      label="Start Position"
                                      type="number"
                                      fullWidth
                                      size="small"
                                      value={newSegment.sourceStartPos}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const probe = getProbeById(newSegment.sourceProbeId);
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
                                      value={newSegment.sourceEndPos}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const probe = getProbeById(newSegment.sourceProbeId);
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
                              {newSegment.sequence || '(No sequence selected yet)'}
                            </SequenceDisplay>
                          </Grid>
                          
                          {/* Action Buttons */}
                          <Grid item xs={12} sm={6}>
                            <Tooltip title={newSegment.sequence ? "Reverse and complement the selected sequence" : "Select a sequence first"}>
                              <span>
                                <Button
                                  variant="outlined"
                                  startIcon={<FlipIcon />}
                                  onClick={toggleReverseComplement}
                                  disabled={!newSegment.sequence}
                                  fullWidth
                                >
                                  {newSegment.isReverseComplement ? 'Undo Reverse Complement' : 'Apply Reverse Complement'}
                                </Button>
                              </span>
                            </Tooltip>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <Tooltip title={!newSegment.sequence ? "Select a sequence first" : ""}>
                              <span>
                                <Button
                                  variant="contained"
                                  startIcon={<AddIcon />}
                                  onClick={addSegmentToProbe}
                                  disabled={!newSegment.sequence || (newSegment.externalType === 'fixed' && !validateSequence(newSegment.customFixedSequence))}
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
                backgroundColor: theme.palette.info.light,
                color: theme.palette.info.contrastText
              }}
            >
              <Typography variant="subtitle1" gutterBottom>
                <b>🔍 How to Design Multiple Probes:</b>
              </Typography>
              <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li>Design your first probe by adding segments from target sequence or external sources</li>
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