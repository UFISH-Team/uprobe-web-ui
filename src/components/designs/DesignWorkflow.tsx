import React, { useState, useEffect } from "react";
import { TextField, Box, Typography, Button, Select, MenuItem, InputLabel, FormControl, Grid, Divider, Menu, IconButton, IconButtonProps } from "@mui/material";
import { styled } from "@mui/system";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import FilterListIcon from '@mui/icons-material/FilterList';  // Icon for Filters
import SortIcon from '@mui/icons-material/Sort';              // Icon for Sorts
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';  // Icon for Remove Overlap
import Papa from 'papaparse';

import '../../App.css'

import axios from 'axios';  

// 样式设置
const Container = styled(Box)({
  padding: "20px",
  maxWidth: "1200px",
  margin: "0 auto",
  borderRadius: "8px",
  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
});

const Section = styled(Box)({
  marginBottom: "40px",
});

const DesignWorkflow = () => {
  const [taskName, setTaskName] = useState("");
  const [probeType, setProbeType] = useState("");
  const [species, setSpecies] = useState("");  // 初始物种为空
  const [speciesOptions, setSpeciesOptions] = useState<string[]>([]); // 用于存储从后端获取的物种列表

  const [geneList, setGeneList] = useState([{ gene: "", barcode1: "", barcode2: "" }]);

  const [filters, setFilters] = useState<any[]>([]);
  const [sorts, setSorts] = useState<any[]>([]);
  const [removeOverlap, setRemoveOverlap] = useState(0);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // 获取物种列表的 API 调用
  useEffect(() => {
    const fetchGenomes = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8123/genomes");  // 获取物种列表的 API 请求
        setSpeciesOptions(response.data);  // 设置物种选项
      } catch (error) {
        console.error("Error fetching genomes:", error);
      }
    };
    fetchGenomes();  // 调用函数
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, section: string) => {
    setMenuAnchor(event.currentTarget);
    setActiveSection(section);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // 处理输入变化
  const handleGeneListChange = (index: number, field: string, value: string) => {
    const updatedGeneList = geneList.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setGeneList(updatedGeneList);
  };

  // 添加新的 gene barcode 行
  const addGeneRow = () => {
    setGeneList([...geneList, { gene: "", barcode1: "", barcode2: "" }]);
  };

  // 删除 gene barcode 行
  const removeGeneRow = (index: number) => {
    setGeneList(geneList.filter((_, i) => i !== index));
  };

  // 上传文件解析 gene barcode list
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      Papa.parse(file, {
        complete: (result) => {
          const parsedData = result.data as string[][];
          const formattedData = parsedData.map(([gene, barcode1, barcode2]) => ({
            gene,
            barcode1,
            barcode2,
          }));
          setGeneList(formattedData);
        },
        header: false,
        skipEmptyLines: true,
      });
    }
  };

  // 添加过滤器选项
  const addFilterOption = (option: string) => {
    setFilters([...filters, { type: option, value: "" }]);
    handleMenuClose();
  };

  const updateFilterValue = (index: number, value: any) => {
    const updatedFilters = filters.map((filter, i) => (i === index ? { ...filter, value } : filter));
    setFilters(updatedFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  // 添加排序选项
  const addSortOption = (option: string, isAscending: boolean) => {
    setSorts([...sorts, { type: option, order: isAscending ? "↑" : "↓" }]);
    handleMenuClose();
  };

  const removeSort = (index: number) => {
    setSorts(sorts.filter((_, i) => i !== index));
  };

  return (
    <Container>
      <Box textAlign="center">
        <Typography variant="h5" sx={{ mt: 2 }} gutterBottom>
        Ready to craft your perfect workflow? 🎨
        </Typography>
    </Box>

      {/* Task Name */}
      <Section>
        <Typography variant="body1" sx={{mt: 4, mb:2 }}>📝 Task Name</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Give your task a unique name to easily identify it.
            </Typography>
        <TextField
        fullWidth
          label="Task Name"
          placeholder="Enter the task name"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
        />

        <Typography variant="body1" sx={{mt: 4, mb:2 }}>🌍 Species Option</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Choose the species genome to design your probes.
            </Typography>
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

        {/* Probe Type */}
        <Typography variant="body1" sx={{mt: 4, mb:2 }}>🔬 Probe Type</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        We offer basic probe types such as RCA and Pi-FISH. You can choose from the existing options or customize your design.
            </Typography>
        <FormControl fullWidth>
          <InputLabel id="probe-type-label">Probe Type</InputLabel>
          <Select
            labelId="probe-type-label"
            value={probeType}
            onChange={(e) => setProbeType(e.target.value)}
          >
            <MenuItem value="RCA">RCA</MenuItem>
            <MenuItem value="Double Hybridization">Double Hybridization</MenuItem>
          </Select>
        </FormControl>

        
        {/* Probe Parameters Section */}
    <   Section>
        <Typography variant="body1" sx={{ mt: 4, mb: 2 }}>⚙️ Probe Parameters</Typography>
        <Box display="flex" justifyContent="space-between" sx={{ gap: 4 }}>
            <TextField 
                label="Target length" 
                placeholder="Enter target sequence length" 
                InputProps={{ sx: { width: '300px', fontSize: '16px' } }}  // 设置宽度
                sx={{ fontSize: '16px' }}  // 设置字体大小
            />
            
            <TextField 
                label="part1" 
                placeholder="Enter part1 length" 
                InputProps={{ sx: { width: '250px', fontSize: '16px' } }}  // 设置宽度
            />
            
            <TextField 
                label="part2" 
                placeholder="Enter part2 length" 
                InputProps={{ sx: { width: '250px', fontSize: '16px' } }}  // 设置宽度
            />
            
            <TextField 
                label="part3" 
                placeholder="Enter part3 length" 
                InputProps={{ sx: { width: '250px', fontSize: '16px' } }}  // 设置宽度
            />
            </Box>

      </Section>

      {/* Gene Barcode Map */}
        <Typography variant="body1" sx={{mt: 4, mb:2 }}>🔢 Gene Barcode Map</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Manually input gene names and select the corresponding barcodes, or directly upload xxx.csv in the format: gene, barcode1, barcode2.
            </Typography>

        {geneList.map((item, index) => (
          <Grid container spacing={2} key={index} alignItems="center">
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Gene"
                value={item.gene}
                onChange={(e) => handleGeneListChange(index, "gene", e.target.value)}
              />
            </Grid>
            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel>Barcode 1</InputLabel>
                <Select
                  value={item.barcode1}
                  onChange={(e) => handleGeneListChange(index, "barcode1", e.target.value)}
                >
                  <MenuItem value="A-488">A-488</MenuItem>
                  <MenuItem value="A-594">A-594</MenuItem>
                  <MenuItem value="B-488">B-488</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel>Barcode 2</InputLabel>
                <Select
                  value={item.barcode2}
                  onChange={(e) => handleGeneListChange(index, "barcode2", e.target.value)}
                >
                  <MenuItem value="A-488">A-488</MenuItem>
                  <MenuItem value="A-594">A-594</MenuItem>
                  <MenuItem value="B-488">B-488</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <IconButton onClick={() => removeGeneRow(index)}>
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addGeneRow}
          sx={{ mt: 2 }}
        >
          Add Gene
        </Button>

        <Button
          variant="outlined"
          component="label"
          startIcon={<UploadIcon />}
          sx={{ mt: 2, ml: 2 }}
        >
          Upload Gene List
          <input
            type="file"
            hidden
            onChange={handleFileUpload}
          />
        </Button>
      </Section>

      {/* Post Process Section */}
      <Section>
      <Typography variant="body1" sx={{mt: 4, mb:2 }}>🧹 Post Process</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
      Set filtering parameters, thresholds, sorting (ascending or descending), and whether to remove overlap between probes.
            </Typography>

        <Box display="flex" flexDirection="column">
          {/* Filters */}
          <Button
            variant="outlined"
            sx={{ width: '15%' }}
            onClick={(e) => handleMenuClick(e, "filters")}
            startIcon={<FilterListIcon />}  // Added icon
          >
            Filters
          </Button>

          {/* Show Filter Input */}
          {filters.length > 0 && filters.map((filter, index) => (
            <Box key={index} mt={2}>
              <Grid container spacing={2}>
                <Grid item xs={10}>
                  <Typography>{filter.type}</Typography>
                  {filter.type === "Tm" ? (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Min"
                          type="number"
                          value={filter.value.min || ""}
                          onChange={(e) => updateFilterValue(index, { ...filter.value, min: +e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Max"
                          type="number"
                          value={filter.value.max || ""}
                          onChange={(e) => updateFilterValue(index, { ...filter.value, max: +e.target.value })}
                        />
                      </Grid>
                    </Grid>
                  ) : (
                    <TextField
                      fullWidth
                      label={`Enter ${filter.type}`}
                      value={filter.value}
                      onChange={(e) => updateFilterValue(index, e.target.value)}
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
            onClick={(e) => handleMenuClick(e, "sorts")}
            startIcon={<SortIcon />}  // Added icon
          >
           Sorts
          </Button>

          {/* Show Sort Input */}
          {sorts.length > 0 && sorts.map((sort, index) => (
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
            onClick={(e) => handleMenuClick(e, "remove_overlap")}
            startIcon={<RemoveCircleIcon />}  // Added icon
          >
           Remove Overlap
          </Button>

          {/* Show Remove Overlap Input */}
          {activeSection === "remove_overlap" && (
            <Box mt={2}>
              <TextField
                fullWidth
                type="number"
                label="Location Interval"
                value={removeOverlap}
                onChange={(e) => setRemoveOverlap(+e.target.value)}
              />
            </Box>
          )}
        </Box>

        {/* Menu for Filters, Sorts, and Remove Overlap */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          {activeSection === "filters" && (
            <>
              <MenuItem onClick={() => addFilterOption("n_mapped_genes")}>n_mapped_genes</MenuItem>
              <MenuItem onClick={() => addFilterOption("tm")}>Tm</MenuItem>
              <MenuItem onClick={() => addFilterOption("target_fold_score")}>target_fold_score</MenuItem>
              <MenuItem onClick={() => addFilterOption("gc_content")}>gc_content</MenuItem>
            </>
          )}

          {activeSection === "sorts" && (
            <>
              <MenuItem onClick={() => addSortOption("n_trans", true)}>n_trans (↑)</MenuItem>
              <MenuItem onClick={() => addSortOption("n_trans", false)}>n_trans (↓)</MenuItem>
              <MenuItem onClick={() => addSortOption("target_gc_content", true)}>target_gc_content (↑)</MenuItem>
              <MenuItem onClick={() => addSortOption("target_gc_content", false)}>target_gc_content (↓)</MenuItem>
            </>
          )}
        </Menu>
      </Section>

      <Divider />

      {/* Submit Button */}
      <Box display="flex" justifyContent="center" alignItems="center" mt={4}>
        <Button
            variant="contained"
            color="primary"
            onClick={() => console.log({ taskName, probeType, geneList, filters, sorts, removeOverlap })}
        >
            Submit Task
        </Button>
        </Box>

    </Container>
  );
};

export default DesignWorkflow;
