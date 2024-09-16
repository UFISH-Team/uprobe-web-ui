import React, { useState, useEffect } from "react";
import { Snackbar, Alert, TextField, Box, Typography, Button, Select, MenuItem, InputLabel, FormControl, Grid, Divider, Menu, IconButton, IconButtonProps } from "@mui/material";
import { styled } from "@mui/system";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import FilterListIcon from '@mui/icons-material/FilterList';  // Icon for Filters
import SortIcon from '@mui/icons-material/Sort';              // Icon for Sorts
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';  // Icon for Remove Overlap
import Papa from 'papaparse';
import yaml from 'js-yaml';  // 引入 js-yaml 用于生成 YAML 文件

import '../../App.css'

import axios from 'axios';  

// 样式设置
const Container = styled(Box)({
  padding: "30px",
  maxWidth: "1400px",
  margin: "0 auto",
  borderRadius: "8px",
  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
});

const Section = styled(Box)({
  marginBottom: "40px",
});

const DesignWorkflow = () => {
  const [taskName, setTaskName] = useState("");
  const [probeType, setProbeType] = useState("RCA");
  const [species, setSpecies] = useState("");  // 初始物种为空
  const [speciesOptions, setSpeciesOptions] = useState<string[]>([]); // 用于存储从后端获取的物种列表

  const [barcodeOptions, setBarcodeOptions] = useState<string[]>([]); // 存储后端返回的条码列表
  const [geneList, setGeneList] = useState([{ gene: "", barcode1: "", barcode2: "" }]);

  const [filters, setFilters] = useState<any[]>([]);
  const [sorts, setSorts] = useState<any[]>([]);
  const [removeOverlap, setRemoveOverlap] = useState(0);

  // 过滤已选过的过滤器或排序选项
  const isFilterSelected = (type: string) => filters.some(filter => filter.type === type);
  const isSortSelected = (type: string, order: "↑" | "↓") =>
  sorts.some(sort => sort.type === type && sort.order === order);


  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // 提示状态管理
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<"success" | "error">("success");

  // 获取物种列表的 API 调用
  useEffect(() => {
    const fetchGenomes = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8123/genomes");  
        setSpeciesOptions(response.data);  // 
      } catch (error) {
        console.error("Error fetching genomes:", error);
      }
    };
    fetchGenomes();  // 调用函数
  }, []);

  // 获取后端的条码列表
  useEffect(() => {
    const fetchBarcodes = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8123/workflow/barcodes-list");
        setBarcodeOptions(response.data);  // 将条码列表存储在状态中
      } catch (error) {
        console.error("Error fetching barcodes:", error);
      }
    };

    fetchBarcodes();  // 调用获取条码的函数
  }, []);

    // 根据条码获取对应序列
  const getBarcodeSequence = async (barcode: string) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8123/workflow/barcodes/${barcode}`);
      return response.data[barcode];  // 返回条码对应的序列
    } catch (error) {
      console.error(`Error fetching sequence for ${barcode}:`, error);
      return null;
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, section: string) => {
    setMenuAnchor(event.currentTarget);
    setActiveSection(section);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // 探针参数设置
  const [minLength, setMinLength] = useState(40);
  const [overlap, setOverlap] = useState(35);
  const [partLengths, setPartLengths] = useState({ part1: 13, part2: 13, part3: 13 });

  // 更新探针参数输入
  const handlePartLengthChange = (part: string, length: number) => {
    setPartLengths(prevLengths => ({
      ...prevLengths,
      [part]: length,
    }));
  };

   // 处理 geneList 中某一行的变更
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

 
  const addFilterOption = (option: string) => {
    if (!isFilterSelected(option)) {  // 检查是否已选过
      setFilters([...filters, { type: option, value: "" }]);
      handleMenuClose();
    }
  };

  const addSortOption = (option: string, isAscending: boolean) => {
    const order = isAscending ? "↑" : "↓";
    if (!isSortSelected(option, order)) {  // 检查是否已选过
      setSorts([...sorts, { type: option, order }]);
      handleMenuClose();
    }
  };

  const updateFilterValue = (index: number, value: any) => {
    const updatedFilters = filters.map((filter, i) => (i === index ? { ...filter, value } : filter));
    setFilters(updatedFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };


  const removeSort = (index: number) => {
    setSorts(sorts.filter((_, i) => i !== index));
  };

    // 更新 removeOverlap
  const updateRemoveOverlap = (value: number) => {
    setRemoveOverlap(value);
  };

  // 动态生成 YAML 文件
  const generateYaml = async () => {
    const barcodeSet = {};
  
    // 动态获取 Barcode 1 和 Barcode 2 的序列
    for (let item of geneList) {
      const barcode1Sequence = await getBarcodeSequence(item.barcode1);
      const barcode2Sequence = await getBarcodeSequence(item.barcode2);
  
      if (barcode1Sequence && barcode2Sequence) {
        barcodeSet[item.barcode1] = barcode1Sequence;
        barcodeSet[item.barcode2] = barcode2Sequence;
      }
    }
  
    const yamlContent = {
      name: taskName,
      description: `Protocol for designing probe for ${probeType} experiment with double barcodes`,
      genome: species,
      targets: geneList.map(gene => gene.gene),
      barcode_set: barcodeSet,  // 动态生成的 barcode_set
      encoding: geneList.reduce((acc, item) => {
        acc[item.gene] = {
          barcode1: item.barcode1,
          barcode2: item.barcode2,
        };
        return acc;
      }, {}),
      extracts: {
        target_region: {
          source: "targets",
          min_length: minLength,
          overlap: overlap,
          template: "{part1}{part2}N{part3}",
          parts: {
            part1: { length: partLengths.part1, source: "target_region[0:length]" },
            part2: { length: partLengths.part2, source: "target_region[len(part1):len(part1)+length]" },
            part3: { length: partLengths.part3, source: "target_region[-length:]" },
          },
        },
      },
      probes: {
        circle_probe: {
          template: "{part1}{part1}{part3}",
          parts: {
            part1: { length: "extracts:target_region:parts:part1:length", source: "rc(target_region:part1)" },
            part2: { template: "{barcode1}N{barcode2}" },
            part3: { length: "extracts:target_region:parts:part3:length", source: "rc(target_region:part3)" },
          },
        amp_probe: {
          template: "{part1}N{part3}",
          parts:{
            part1: { source: "rc(target_region:part1)" },
            part2: { source: "rc(target_region:part3)" },
          }
        }
        },
      },
      attributes: {
        n_mapped_genes: { target: "target_region", type: "n_mapped_genes", aligner: "bowtie2", similarity_threshold_ratio: 0.75 },
        target_gc_content: { target: "target_region", type: "gc_content" },
        tm1: { target: "target_region:part1", type: "annealing_temperature"},
        tm2: { target: "target_region:part2", type: "annealing_temperature"},
        tm3: { target: "target_region:part3", type: "annealing_temperature"},
        target_fold_score: { target: "target_region", type: "fold_score"},
        circle_fold_score: { target: "circle_probe", type: "fold_score"},
        amp_fold_score: { target: "amp_probe", type: "fold_score"},
        circle_self_match: { target: "circle_probe", type: "self_match"},
        amp_self_match: { target: "amp_probe", type: "self_match"},
        target_blocks: { target: "target_region", type: "blocks"}
      },
      post_process: {
        filters: filters.reduce((acc, filter) => {
          acc[filter.type] = filter.value;
          return acc;
        }, {}),
        sorts: {
          is_ascending: sorts.filter(sort => sort.order === "↑").map(sort => sort.type),
          is_descending: sorts.filter(sort => sort.order === "↓").map(sort => sort.type),
        },
        remove_overlap: removeOverlap || undefined,  // 如果 removeOverlap 为 0 则不显示
      },
    };
  
    return yaml.dump(yamlContent);  // 生成 YAML 字符串
  };


  // 提交任务到后端
  const submitTask = async () => {

    // 输入验证
    if (!taskName || !probeType || !species || geneList.some(gene => !gene.gene)) {
      setAlertSeverity("error");
      setAlertMessage("Please fill in all required fields before submitting.");
      setAlertOpen(true);
      return;
    }

    const yamlFile = await generateYaml();  // 生成 YAML 文件内容
    
    // 创建 Blob 对象，将 YAML 文件作为 Blob
    const blob = new Blob([yamlFile], { type: 'text/yaml' });

    // 使用 FormData 上传文件
    const formData = new FormData();
    formData.append("file", blob, "workflow.yaml");  // 将文件添加到 FormData 中

    try {
      await axios.post("http://127.0.0.1:8123/workflow/submit-task", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // 提示成功消息
      setAlertSeverity("success");
      setAlertMessage("Task submitted successfully!");
      setAlertOpen(true);
    } catch (error) {
      // 提示错误消息
      setAlertSeverity("error");
      setAlertMessage("Error submitting task: " + (error as string));
      setAlertOpen(true);
    }
  };

  // 关闭提示
  const handleAlertClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlertOpen(false);
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
            <MenuItem value="Pi-FISH">Pi-FISH</MenuItem>
          </Select>
        </FormControl>

        
        {/* Probe Parameters Section */}
        <Section>
        <Typography variant="body1" sx={{ mt: 4, mb: 2 }}>⚙️ Probe Parameters</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2}}>
          Please enter the parameters for your probes. 
          Total length of the target sequence design, sequence overlap, and length of each part.
        </Typography>

        {/* 第一行：Target length 和 Overlap */}
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
              placeholder="Enter overlap value between sequence" 
              fullWidth
              type="number"
              value={overlap}  
              onChange={(e) => setOverlap(Number(e.target.value))}  
            />
          </Grid>
        </Grid>

        {/* 第二行：part1, part2, part3 */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={4}>
            <TextField 
              label="Part 1 length" 
              placeholder="Enter part1 length" 
              fullWidth
              type="number"
              value={partLengths.part1}  
              onChange={(e) => handlePartLengthChange("part1", Number(e.target.value))}  
            />
          </Grid>

          <Grid item xs={4}>
            <TextField 
              label="Part 2 length" 
              placeholder="Enter part2 length" 
              fullWidth
              type="number"
              value={partLengths.part2}  
              onChange={(e) => handlePartLengthChange("part2", Number(e.target.value))}  
            />
          </Grid>

          <Grid item xs={4}>
            <TextField 
              label="Part 3 length" 
              placeholder="Enter part3 length" 
              fullWidth
              type="number"
              value={partLengths.part3}  
              onChange={(e) => handlePartLengthChange("part3", Number(e.target.value))}  
            />
          </Grid>
        </Grid>
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

            {/* Barcode 1 动态加载条码列表 */}
            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel>Barcode 1</InputLabel>
                <Select
                  value={item.barcode1}
                  onChange={(e) => handleGeneListChange(index, "barcode1", e.target.value)}
                >
                  {barcodeOptions.map((barcode, idx) => (
                    <MenuItem key={idx} value={barcode}>
                      {barcode}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Barcode 2 动态加载条码列表 */}
            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel>Barcode 2</InputLabel>
                <Select
                  value={item.barcode2}
                  onChange={(e) => handleGeneListChange(index, "barcode2", e.target.value)}
                >
                  {barcodeOptions.map((barcode, idx) => (
                    <MenuItem key={idx} value={barcode}>
                      {barcode}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 删除基因行 */}
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
                  {filter.type === "tm" ? (
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
                      type="number"
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
                onChange={(e) => updateRemoveOverlap(Number(e.target.value))}
              />
            </Box>
          )}
        </Box>

        {/* Menu for Filters and Sorts, dynamically disabling selected options */}
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
          {activeSection === "filters" && (
            <>
              <MenuItem disabled={isFilterSelected("n_mapped_genes")} onClick={() => addFilterOption("n_mapped_genes")}>
                n_mapped_genes
              </MenuItem>
              <MenuItem disabled={isFilterSelected("tm")} onClick={() => addFilterOption("tm")}>Tm</MenuItem>
              <MenuItem disabled={isFilterSelected("target_fold_score")} onClick={() => addFilterOption("target_fold_score")}>
                target_fold_score
              </MenuItem>
              <MenuItem disabled={isFilterSelected("gc_content")} onClick={() => addFilterOption("gc_content")}>
                gc_content
              </MenuItem>
            </>
          )}

          {activeSection === "sorts" && (
            <>
              <MenuItem disabled={isSortSelected("tm", "↑")} onClick={() => addSortOption("tm", true)}>
                Tm (↑)
              </MenuItem>
              <MenuItem disabled={isSortSelected("tm", "↓")} onClick={() => addSortOption("tm", false)}>
                Tm (↓)
              </MenuItem>
              <MenuItem disabled={isSortSelected("n_mapped_genes", "↑")} onClick={() => addSortOption("n_mapped_genes", true)}>
                n_mapped_genes (↑)
              </MenuItem>
              <MenuItem disabled={isSortSelected("n_mapped_genes", "↓")} onClick={() => addSortOption("n_mapped_genes", false)}>
                n_mapped_genes (↓)
              </MenuItem>
              <MenuItem disabled={isSortSelected("target_blocks", "↑")} onClick={() => addSortOption("target_blocks", true)}>
                target_blocks (↑)
              </MenuItem>
              <MenuItem disabled={isSortSelected("target_blocks", "↓")} onClick={() => addSortOption("target_blocks", false)}>
                target_blocks (↓)
              </MenuItem>
              <MenuItem disabled={isSortSelected("target_fold_score", "↑")} onClick={() => addSortOption("target_fold_score", true)}>
                target_fold_score (↑)
              </MenuItem>
              <MenuItem disabled={isSortSelected("target_fold_score", "↓")} onClick={() => addSortOption("target_fold_score", false)}>
                target_fold_score (↓)
              </MenuItem>
              <MenuItem disabled={isSortSelected("target_gc_content", "↑")} onClick={() => addSortOption("target_gc_content", true)}>
                target_gc_content (↑)
              </MenuItem>
              <MenuItem disabled={isSortSelected("target_gc_content", "↓")} onClick={() => addSortOption("target_gc_content", false)}>
                target_gc_content (↓)
              </MenuItem>
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
            onClick={submitTask}  // 提交任务
          >
            Submit Task
          </Button>
        </Box>

      {/* 提示框 */}
      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={handleAlertClose}
      >
        <Alert onClose={handleAlertClose} severity={alertSeverity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DesignWorkflow;
