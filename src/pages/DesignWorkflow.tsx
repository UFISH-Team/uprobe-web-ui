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
  Paper,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardHeader,
  Collapse
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Papa from 'papaparse';
import useDesignStore from '../store/designStore';
import ApiService from '../api';
import { CustomProbeType, extractParametersFromYaml } from '../types';

import { Container, Section } from '../style';

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
    geneMap: true,
    postProcess: true
  });

  const {
    // State
    taskName,
    probeType,
    species,
    geneList,
    minLength,
    overlap,
    dnaFishParams,
    filters,
    sorts,
    removeOverlap,
    isSubmitting,
    progress,
    downloadUrl,
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
    addFilter,
    removeFilter,
    updateFilter,
    addSort,
    removeSort,
    setRemoveOverlap,
    setAlert,
    submitTask,
    navigateToJobs,
  } = useDesignStore();

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

  // Add this useEffect to load custom probe types
  useEffect(() => {
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
          targetLength: group.targetLength
        }));
      setCustomProbeTypes(customTypes);
    };

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

  const handleGeneCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results: Papa.ParseResult<Record<string, string>>) => {
          const parsedData = results.data.map((row) => ({
            gene: row['gene'],
            barcode1: row['barcode1'],
            barcode2: row['barcode2'],
          }));
          setGeneList(parsedData);
        },
      });
    }
  };

  const handlePoolCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results: Papa.ParseResult<Record<string, string>>) => {
          const parsedData = results.data.map((row) => ({
            name: row['name'],
            location: row['location'],
            numbers: Number(row['numbers']),
            density: Number(row['density']),
          }));
          setDnaFishParams({ poolList: parsedData });
        },
      });
    }
  };

  const handleAlertClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlert(false, '', 'success');
  };

  const isFilterSelected = (type: string) => filters.some(filter => filter.type === type);
  const isSortSelected = (type: string, order: '↑' | '↓') =>
    sorts.some(sort => sort.type === type && sort.order === order);

  // Modify the handleProbeTypeSelect function
  const handleProbeTypeSelect = (type: string) => {
    setProbeType(type);
    setShowCustomProbeTypes(false);
    if (type !== 'RCA' && type !== 'DNA-FISH') {
      const customType = customProbeTypes.find(t => t.name === type);
      if (customType) {
        const parameters = extractParametersFromYaml(customType.yamlContent);
        if (parameters) {
          const updatedCustomType = {
            ...customType,
            targetLength: parameters.targetLength,
            barcodeCount: parameters.barcodeCount
          };
          setSelectedCustomType(updatedCustomType);
          // Set default target length from YAML or custom type
          if (customType.targetLength) {
            setMinLength(customType.targetLength);
          } else if (parameters.targetLength) {
            setMinLength(parameters.targetLength);
          } else {
            // If no target length in YAML or custom type, use default value
            setMinLength(100);
          }
          // Set default overlap if specified in YAML
          if (parameters.overlap) {
            setOverlap(parameters.overlap);
          } else {
            // If no overlap in YAML, use default value
            setOverlap(20);
          }
        } else {
          setSelectedCustomType(customType);
          // Set default values if YAML parsing fails
          if (customType.targetLength) {
            setMinLength(customType.targetLength);
          } else {
            setMinLength(100);
          }
          setOverlap(20);
        }
      } else {
        setSelectedCustomType(null);
        // Set default values if custom type not found
        setMinLength(100);
        setOverlap(20);
      }
    } else {
      setSelectedCustomType(null);
      // Set default values for RCA and DNA-FISH
      if (type === 'RCA') {
        setMinLength(100); // Default RCA target length
        setOverlap(20); // Default RCA overlap
      } else if (type === 'DNA-FISH') {
        setMinLength(50); // Default DNA-FISH target length
        setOverlap(10); // Default DNA-FISH overlap
      }
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Container>
      <Box textAlign="center" mb={4}>
        <Typography variant="h5" sx={{ mt: 2 }} gutterBottom>
          Ready to craft your perfect workflow? 🎨
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Follow the steps below to design your probe workflow
        </Typography>
      </Box>

      <Stepper activeStep={-1} alternativeLabel sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Task Name</StepLabel>
        </Step>
        <Step>
          <StepLabel>Species</StepLabel>
        </Step>
        <Step>
          <StepLabel>Probe Type</StepLabel>
        </Step>
        <Step>
          <StepLabel>Target Parameters</StepLabel>
        </Step>
        <Step>
          <StepLabel>Gene Map</StepLabel>
        </Step>
        <Step>
          <StepLabel>Post Process</StepLabel>
        </Step>
      </Stepper>

      {/* Task Name */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="📝 Task Name" 
          subheader="Give your task a unique name to easily identify it."
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
          subheader="Choose the species genome to design your probes."
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
          subheader="Choose from existing probe types or use a custom design from history."
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
                      {type.name} (Custom)
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
          </CardContent>
        </Collapse>
      </Card>

      {/* Target Parameters */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="⚙️ Target Parameters" 
          subheader="Set the target sequence length and overlap parameters."
          action={
            <IconButton onClick={() => toggleSection('targetParams')}>
              {expandedSections.targetParams ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
        />
        <Collapse in={expandedSections.targetParams}>
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={6}>
                <TextField
                  label="Target length"
                  placeholder="Enter target sequence length"
                  fullWidth
                  type="number"
                  value={minLength}
                  onChange={(e) => setMinLength(Number(e.target.value))}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Overlap"
                  placeholder="Enter overlap value"
                  fullWidth
                  type="number"
                  value={overlap}
                  onChange={(e) => setOverlap(Number(e.target.value))}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Collapse>
      </Card>

      {/* Gene Barcode Map or Pool List */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title={probeType === 'RCA' ? '🔢 RCA Gene Barcode Map' : 
                 probeType === 'DNA-FISH' ? '🔢 DNA-FISH Pool List' : 
                 '🔢 Custom Probe Gene Map'} 
          subheader={probeType === 'RCA' ? 
            'Manually input gene names and select the corresponding barcodes.' :
            probeType === 'DNA-FISH' ? 
            'Provide pool list for DNA-FISH including name, location(chr:start-end), numbers, and density.' :
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
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AddIcon />}
                  sx={{ mb: 2 }}
                >
                  Upload genelist csv
                  <input
                    type="file"
                    hidden
                    accept=".csv"
                    onChange={handleGeneCsvUpload}
                  />
                </Button>

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

                    <Grid item xs={3}>
                      <FormControl fullWidth>
                        <InputLabel>Barcode 1</InputLabel>
                        <Select
                          value={item.barcode1 || ''}
                          onChange={(e) => updateGene(index, 'barcode1', e.target.value)}
                        >
                          {barcodeOptions.map((barcode, idx) => (
                            <MenuItem key={idx} value={barcode}>
                              {barcode}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={3}>
                      <FormControl fullWidth>
                        <InputLabel>Barcode 2</InputLabel>
                        <Select
                          value={item.barcode2 || ''}
                          onChange={(e) => updateGene(index, 'barcode2', e.target.value)}
                        >
                          {barcodeOptions.map((barcode, idx) => (
                            <MenuItem key={idx} value={barcode}>
                              {barcode}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

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

            {probeType === 'DNA-FISH' && (
              <>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AddIcon />}
                  sx={{ mb: 2 }}
                >
                  Upload poollist csv
                  <input
                    type="file"
                    hidden
                    accept=".csv"
                    onChange={handlePoolCsvUpload}
                  />
                </Button>
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
                    <Grid item xs={2}>
                      <IconButton onClick={() => removePool(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addPool}
                  sx={{ mt: 2 }}
                >
                  Add Pool
                </Button>
              </>
            )}

            {probeType !== 'RCA' && probeType !== 'DNA-FISH' && selectedCustomType && (
              <>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AddIcon />}
                  sx={{ mb: 2 }}
                >
                  Upload genelist csv
                  <input
                    type="file"
                    hidden
                    accept=".csv"
                    onChange={handleGeneCsvUpload}
                  />
                </Button>

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
                    {Array.from({ length: selectedCustomType?.barcodeCount || 0 }).map((_, barcodeIndex) => (
                      <Grid item xs={3} key={barcodeIndex}>
                        <FormControl fullWidth>
                          <InputLabel>Barcode {barcodeIndex + 1}</InputLabel>
                          <Select
                            value={item[`barcode${barcodeIndex + 1}`] || ''}
                            onChange={(e) => updateGene(index, `barcode${barcodeIndex + 1}`, e.target.value)}
                          >
                            {barcodeOptions.map((barcode, idx) => (
                              <MenuItem key={idx} value={barcode}>
                                {barcode}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    ))}
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

      {/* Post Process Section */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="🧹 Post Process" 
          subheader="Set filtering parameters, thresholds, sorting (ascending or descending), and whether to remove overlap between probes."
          action={
            <IconButton onClick={() => toggleSection('postProcess')}>
              {expandedSections.postProcess ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
        />
        <Collapse in={expandedSections.postProcess}>
          <CardContent>
            <Box display="flex" flexDirection="column">
              {/* Filters */}
              <Button
                variant="outlined"
                sx={{ width: '15%' }}
                onClick={(e) => handleMenuClick(e, 'filters')}
                startIcon={<FilterListIcon />}
              >
                Filters
              </Button>

              {/* Show Filter Input */}
              {filters.length > 0 &&
                filters.map((filter, index) => (
                  <Box key={index} mt={2}>
                    <Grid container spacing={2}>
                      <Grid item xs={10}>
                        <Typography>{filter.type}</Typography>
                        {filter.type === 'tm' ? (
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                label="Min"
                                type="number"
                                value={filter.value.min || ''}
                                onChange={(e) =>
                                  updateFilter(index, { ...filter.value, min: +e.target.value })
                                }
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                label="Max"
                                type="number"
                                value={filter.value.max || ''}
                                onChange={(e) =>
                                  updateFilter(index, { ...filter.value, max: +e.target.value })
                                }
                              />
                            </Grid>
                          </Grid>
                        ) : (
                          <TextField
                            fullWidth
                            label={`Enter ${filter.type}`}
                            type="number"
                            value={filter.value}
                            onChange={(e) => updateFilter(index, e.target.value)}
                          />
                        )}
                      </Grid>
                      <Grid item xs={2}>
                        <IconButton onClick={() => removeFilter(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))}

              {/* Sorts */}
              <Button
                variant="outlined"
                sx={{ mt: 2, width: '15%' }}
                onClick={(e) => handleMenuClick(e, 'sorts')}
                startIcon={<SortIcon />}
              >
                Sorts
              </Button>

              {/* Show Sort Input */}
              {sorts.length > 0 &&
                sorts.map((sort, index) => (
                  <Box key={index} mt={2}>
                    <Grid container spacing={2}>
                      <Grid item xs={10}>
                        <Typography>{`${sort.type} (${sort.order})`}</Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <IconButton onClick={() => removeSort(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))}

              {/* Remove Overlap */}
              <Button
                variant="outlined"
                sx={{ mt: 2, width: '15%' }}
                onClick={(e) => handleMenuClick(e, 'remove_overlap')}
                startIcon={<RemoveCircleIcon />}
              >
                Remove Overlap
              </Button>

              {/* Show Remove Overlap Input */}
              {activeSection === 'remove_overlap' && (
                <Box mt={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Location Interval"
                    value={removeOverlap}
                    onChange={(e) => setRemoveOverlap(Number(e.target.value))}
                  />
                </Box>
              )}
            </Box>

            {/* Menu for Filters and Sorts, dynamically disabling selected options */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
              {activeSection === 'filters' && (
                <>
                  <MenuItem
                    disabled={isFilterSelected('n_mapped_genes')}
                    onClick={() => {
                      addFilter({ type: 'n_mapped_genes', value: '' });
                      handleMenuClose();
                    }}
                  >
                    n_mapped_genes
                  </MenuItem>
                  <MenuItem
                    disabled={isFilterSelected('tm')}
                    onClick={() => {
                      addFilter({ type: 'tm', value: { min: '', max: '' } });
                      handleMenuClose();
                    }}
                  >
                    Tm
                  </MenuItem>
                  <MenuItem
                    disabled={isFilterSelected('target_fold_score')}
                    onClick={() => {
                      addFilter({ type: 'target_fold_score', value: '' });
                      handleMenuClose();
                    }}
                  >
                    target_fold_score
                  </MenuItem>
                  <MenuItem
                    disabled={isFilterSelected('gc_content')}
                    onClick={() => {
                      addFilter({ type: 'gc_content', value: '' });
                      handleMenuClose();
                    }}
                  >
                    gc_content
                  </MenuItem>
                </>
              )}

              {activeSection === 'sorts' && (
                <>
                  <MenuItem
                    disabled={isSortSelected('tm', '↑')}
                    onClick={() => {
                      addSort({ type: 'tm', order: '↑' });
                      handleMenuClose();
                    }}
                  >
                    Tm (↑)
                  </MenuItem>
                  <MenuItem
                    disabled={isSortSelected('tm', '↓')}
                    onClick={() => {
                      addSort({ type: 'tm', order: '↓' });
                      handleMenuClose();
                    }}
                  >
                    Tm (↓)
                  </MenuItem>
                  <MenuItem
                    disabled={isSortSelected('n_mapped_genes', '↑')}
                    onClick={() => {
                      addSort({ type: 'n_mapped_genes', order: '↑' });
                      handleMenuClose();
                    }}
                  >
                    n_mapped_genes (↑)
                  </MenuItem>
                  <MenuItem
                    disabled={isSortSelected('n_mapped_genes', '↓')}
                    onClick={() => {
                      addSort({ type: 'n_mapped_genes', order: '↓' });
                      handleMenuClose();
                    }}
                  >
                    n_mapped_genes (↓)
                  </MenuItem>
                  <MenuItem
                    disabled={isSortSelected('target_blocks', '↑')}
                    onClick={() => {
                      addSort({ type: 'target_blocks', order: '↑' });
                      handleMenuClose();
                    }}
                  >
                    target_blocks (↑)
                  </MenuItem>
                  <MenuItem
                    disabled={isSortSelected('target_blocks', '↓')}
                    onClick={() => {
                      addSort({ type: 'target_blocks', order: '↓' });
                      handleMenuClose();
                    }}
                  >
                    target_blocks (↓)
                  </MenuItem>
                  <MenuItem
                    disabled={isSortSelected('target_fold_score', '↑')}
                    onClick={() => {
                      addSort({ type: 'target_fold_score', order: '↑' });
                      handleMenuClose();
                    }}
                  >
                    target_fold_score (↑)
                  </MenuItem>
                  <MenuItem
                    disabled={isSortSelected('target_fold_score', '↓')}
                    onClick={() => {
                      addSort({ type: 'target_fold_score', order: '↓' });
                      handleMenuClose();
                    }}
                  >
                    target_fold_score (↓)
                  </MenuItem>
                  <MenuItem
                    disabled={isSortSelected('target_gc_content', '↑')}
                    onClick={() => {
                      addSort({ type: 'target_gc_content', order: '↑' });
                      handleMenuClose();
                    }}
                  >
                    target_gc_content (↑)
                  </MenuItem>
                  <MenuItem
                    disabled={isSortSelected('target_gc_content', '↓')}
                    onClick={() => {
                      addSort({ type: 'target_gc_content', order: '↓' });
                      handleMenuClose();
                    }}
                  >
                    target_gc_content (↓)
                  </MenuItem>
                </>
              )}
            </Menu>
          </CardContent>
        </Collapse>
      </Card>

      {/* Custom Probe Types Dialog */}
      <Dialog
        open={showCustomProbeTypes}
        onClose={() => setShowCustomProbeTypes(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Custom Probe Types</Typography>
            <IconButton onClick={() => setShowCustomProbeTypes(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {customProbeTypes.map((type) => (
              <ListItem
                key={type.id}
                secondaryAction={
                  <Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleProbeTypeSelect(type.name)}
                      sx={{ mr: 1 }}
                    >
                      Select
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => {
                        const updatedTypes = customProbeTypes.filter(t => t.id !== type.id);
                        setCustomProbeTypes(updatedTypes);
                        localStorage.setItem('savedProbeGroups', 
                          JSON.stringify(JSON.parse(localStorage.getItem('savedProbeGroups') || '[]')
                            .filter((g: any) => g.id !== type.id)));
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                }
              >
                <ListItemText
                  primary={type.name}
                  secondary={`Created: ${type.createdAt.toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      <Divider sx={{ my: 4 }} />

      {/* Submit button and progress bar */}
      <Box display="flex" justifyContent="center" alignItems="center" mt={4}>
        <Button
          variant="contained"
          color={isSubmitting ? 'secondary' : 'primary'}
          onClick={submitTask}
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

      {/* Download button */}
      {downloadUrl && (
        <Box display="flex" justifyContent="center" alignItems="center" mt={4} gap={2}>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = 'result.zip';
              link.click();
            }}
          >
            Download .zip
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={navigateToJobs}
          >
            View in Jobs Panel
          </Button>
        </Box>
      )}

      {/* Alert */}
      <Snackbar open={alertOpen} autoHideDuration={6000} onClose={handleAlertClose}>
        <Alert onClose={handleAlertClose} severity={alertSeverity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DesignWorkflow;