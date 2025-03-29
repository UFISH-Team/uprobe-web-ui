import React, { useState, useEffect } from "react";
import { Snackbar, Alert, TextField, Box, Typography, Button, Select, MenuItem, InputLabel, FormControl, Grid, Divider, Menu, IconButton, LinearProgress } from "@mui/material";
import { styled } from "@mui/system";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
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


const DesignWorkflow: React.FC = () => {
  const [taskName, setTaskName] = useState("");
  const [probeType, setProbeType] = useState("RCA");
  const [species, setSpecies] = useState("");  // 初始物种为空
  const [speciesOptions, setSpeciesOptions] = useState<string[]>([]); // 用于存储从后端获取的物种列表

  const [dnaFishParams, setDnaFishParams] = useState({
    length: 70,
    overlap: 20,
    poolList: [{ name: "", location: "", numbers: 8000, density: 0.00005 }],
  });
  

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

  const [isSubmitting, setIsSubmitting] = useState(false); // 控制按钮状态
  const [progress, setProgress] = useState(0);             // 控制进度条显示
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);  // 存储下载文件的URL


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
        const response = await axios.get("http://127.0.0.1:8123/workflow/barcodes_list");
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

    // 解析并更新基因列表的CSV上传处理函数
  const handleGeneCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const parsedData = results.data.map((row: any) => ({
            gene: row["gene"],
            barcode1: row["barcode1"],
            barcode2: row["barcode2"],
          }));
          setGeneList(parsedData);
        },
      });
    }
  };

  // 解析并更新池列表的CSV上传处理函数
  const handlePoolCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const parsedData = results.data.map((row: any) => ({
            name: row["name"],
            location: row["location"],
            numbers: Number(row["numbers"]),
            density: Number(row["density"]),
          }));
          setDnaFishParams((prev) => ({
            ...prev,
            poolList: parsedData,
          }));
        },
      });
    }
  };


  // Handle pool list changes for DNA-FISH
  const handlePoolChange = (index: number, field: string, value: any) => {
    const updatedPoolList = dnaFishParams.poolList.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setDnaFishParams(prev => ({ ...prev, poolList: updatedPoolList }));
  };

  // Add a new row to pool list
  const addPoolRow = () => {
    setDnaFishParams(prev => ({
      ...prev,
      poolList: [...prev.poolList, { name: "", location: "", numbers: 0, density: 0 }],
    }));
  };

  // Remove a row from pool list
  const removePoolRow = (index: number) => {
    setDnaFishParams(prev => ({
      ...prev,
      poolList: prev.poolList.filter((_, i) => i !== index),
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
  
    if (probeType === "RCA") {
      // For RCA: dynamically get Barcode sequences
      for (let item of geneList) {
        const barcode1Sequence = await getBarcodeSequence(item.barcode1);
        const barcode2Sequence = await getBarcodeSequence(item.barcode2);
  
        if (barcode1Sequence && barcode2Sequence) {
          barcodeSet[item.barcode1] = barcode1Sequence;
          barcodeSet[item.barcode2] = barcode2Sequence;
        }
      }
    }
  
      const yamlContent = {
        name: taskName,
        probetype: probeType,
        genome: species,
        targets: probeType === "RCA" ? geneList.map(gene => gene.gene) : undefined,
        ...(probeType === "RCA" && {
          barcode_set: barcodeSet,
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
        }),
        ...(probeType === "DNA-FISH" && {
          probes: {
            fish_probe: {
              length: dnaFishParams.length,
              overlap: dnaFishParams.overlap,
            },
          },
          pool_list: dnaFishParams.poolList.map(pool => ({
            name: pool.name,
            location: pool.location,
            numbers: pool.numbers,
            density: pool.density,
          })),
        }),
      };
    
      return yaml.dump(yamlContent);
    };
    
  // 提交任务到后端
  const submitTask = async () => {
    // 输入验证
    if (!taskName || !probeType || !species || (
      probeType === 'RCA' && geneList.some(gene => !gene.gene)
    ) || (
      probeType === 'DNA-FISH' && dnaFishParams.poolList.some(pool => 
        !pool.name || !pool.location || pool.numbers === 0 || pool.density === 0
      )
    )) {
      setAlertSeverity("error");
      setAlertMessage("Please fill in all required fields before submitting.");
      setAlertOpen(true);
      return;
    }


      // 设置提交按钮为处理中状态
    setIsSubmitting(true);
    setProgress(30);  // 初始进度

    // Generate the YAML content based on the task details
    const yamlFile = await generateYaml();  // 生成 YAML 文件内容
    
    // 创建 Blob 对象，将 YAML 文件作为 Blob
    const blob = new Blob([yamlFile], { type: 'text/yaml' });

    // 使用 FormData 上传文件
    const formData = new FormData();
    formData.append("file", blob, "workflow.yaml");  // 将文件添加到 FormData 中

    try {
      // 根据探针类型选择不同的 API 端点
      let apiUrl = "";

      if (probeType === 'RCA') {
        apiUrl = "http://127.0.0.1:8123/workflow/design_rca";
      } else if (probeType === 'DNA-FISH') {
        apiUrl = "http://127.0.0.1:8123/workflow/design_dnafish";
      }

        // 设置进度条更新
      setProgress(60);  // 中间进度

        // 发送请求，接收.zip文件
      const response = await axios.post(apiUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',  // 指定返回文件类型为 Blob
      });

      setProgress(90);

      // 生成 Blob URL 用于下载
      const fileData = response.data;
      const downloadBlob = new Blob([fileData], { type: 'application/zip' });
      const url = URL.createObjectURL(downloadBlob);  // 创建 URL
      setDownloadUrl(url);  // 将生成的 URL 保存到状态中


      //设置进度条完成
      setProgress(100);
      // 提示任务成功
      setAlertSeverity("success");
      setAlertMessage("Task submitted successfully! You can now download the result.");
      setAlertOpen(true);

    } catch (error) {
      // 任务失败时的错误提示
      setAlertSeverity("error");
      setAlertMessage("Error submitting task: " + (error as Error).message);
      setAlertOpen(true);
    } finally {
      setIsSubmitting(false);  // 恢复按钮状态
      setProgress(0);  // 重置进度条
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
        We offer basic probe types such as RCA and DNA-FISH. You can choose from the existing options or customize your design.
            </Typography>
        <FormControl fullWidth>
          <InputLabel id="probe-type-label">Probe Type</InputLabel>
          <Select
            labelId="probe-type-label"
            value={probeType}
            onChange={(e) => setProbeType(e.target.value)}
          >
            <MenuItem value="RCA">RCA</MenuItem>
            <MenuItem value="DNA-FISH">DNA-FISH</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="body1" sx={{ mt: 4, mb: 2 }}>⚙️ Probe Parameters</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {probeType === 'RCA' 
            ? "Enter the parameters for RCA probes."
            : "Enter the length and overlap for DNA-FISH probes."
          }
        </Typography>

        {probeType === 'RCA' && (
          <>
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
          </>
        )}

        {probeType === 'DNA-FISH' && (
          <Grid container spacing={4}>
            <Grid item xs={6}>
              <TextField 
                label="Probe Length" 
                placeholder="Enter probe length" 
                fullWidth
                type="number"
                value={dnaFishParams.length}
                onChange={(e) => setDnaFishParams(prev => ({ ...prev, length: Number(e.target.value) }))}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField 
                label="Overlap" 
                placeholder="Enter overlap value" 
                fullWidth
                type="number"
                value={dnaFishParams.overlap}
                onChange={(e) => setDnaFishParams(prev => ({ ...prev, overlap: Number(e.target.value) }))}
              />
            </Grid>
          </Grid>
        )}
      </Section>


      {/* Gene Barcode Map or Pool List depending on probe type */}
      <Section>
      <Typography variant="body1" sx={{ mt: 4, mb: 2 }}>
        {probeType === 'RCA' ? "🔢 RCA Gene Barcode Map" : "🔢 DNA-FISH Pool List"}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        {probeType === 'RCA' 
          ? "Manually input gene names and select the corresponding barcodes."
          : "Provide pool list for DNA-FISH including name, location(chr:start-end), numbers, and density."
        }
      </Typography>

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
              onChange={(e) => handleGeneCsvUpload(e)}
            />
          </Button>

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
            onChange={(e) => handlePoolCsvUpload(e)}
          />
        </Button>
          {dnaFishParams.poolList.map((pool, index) => (
            <Grid container spacing={2} key={index} >
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Name"
                  value={pool.name}
                  onChange={(e) => handlePoolChange(index, "name", e.target.value)}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Location"
                  value={pool.location}
                  onChange={(e) => handlePoolChange(index, "location", e.target.value)}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  fullWidth
                  label="Numbers"
                  type="number"
                  value={pool.numbers}
                  onChange={(e) => handlePoolChange(index, "numbers", Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  fullWidth
                  label="Density"
                  type="number"
                  value={pool.density}
                  onChange={(e) => handlePoolChange(index, "density", Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={2}>
                <IconButton onClick={() => removePoolRow(index)}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addPoolRow}
            sx={{ mt: 2 }}
          >
            Add Pool
          </Button>
        </>
      )}
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

      {/* 提交任务的按钮与进度条 */}
      <Box display="flex" justifyContent="center" alignItems="center" mt={4}>
        <Button
          variant="contained"
          color={isSubmitting ? "secondary" : "primary"}
          onClick={submitTask}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Designing..." : "Submit Task"}
        </Button>
      </Box>

      {/* 显示进度条 */}
      {isSubmitting && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}

      {/* 下载按钮：仅在生成了下载链接时显示 */}
      {downloadUrl && (
        <Box display="flex" justifyContent="center" alignItems="center" mt={4}>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              const link = document.createElement('a');
              link.href = downloadUrl;  // 使用生成的下载链接
              link.download = 'result.zip';  // 指定下载的文件名
              link.click();  // 触发下载
            }}
          >
            Download .zip
          </Button>
        </Box>
      )}

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