import React, { useState } from 'react';
import '../../App.css'; // Stylesheet
import { Slider, Select, Input, Button, Radio, Row, Col, Upload, Switch, message, InputNumber } from 'antd'; // Import Ant Design components
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
const { Option } = Select;

interface GeneBarcode {
    gene: string;
    barcode: { forward: string; reverse?: string };
    type: string; // "single-end" or "paired-end"
    isValidGene: boolean; // Whether the gene matches the selected genome
    sequence: string; // If gene is not valid, allow user to enter sequence
}

const alignmentOptions = ['Bowtie2', 'BLAST', 'MMseqs2']; // Alignment options

const DesignWorkflow: React.FC = () => {
    const [probeType, setProbeType] = useState<string>('');  // State for probe type selection
    const [genome, setGenome] = useState<string>('');  // State for genome selection
    const [geneBarcodeList, setGeneBarcodeList] = useState<GeneBarcode[]>([]); // State for gene and barcode list
    const [selectedAlignmentTool, setSelectedAlignmentTool] = useState<string>(''); // State for selected alignment tool
    const [useTm, setUseTm] = useState<boolean>(false); // Whether to use Tm calculation
    const [useFoldingScore, setUseFoldingScore] = useState<boolean>(false); // Whether to use RNA Folding Score
    const [useSelfMatchingScore, setUseSelfMatchingScore] = useState<boolean>(false); // Whether to use Self-Matching Score
    const [tmValue, setTmValue] = useState<number>(50);  // State for Tm slider
    const [foldingScore, setFoldingScore] = useState<number>(30);  // State for Folding score slider
    const [selfMatchingScore, setSelfMatchingScore] = useState<number>(20);  // State for Self-matching score slider
    const [existingBarcodes] = useState<string[]>(['barcode1', 'barcode2', 'barcode3']); // Example of existing barcodes
    const validGenesForGenome = { human: ['BRCA1', 'TP53'], mouse: ['Pten', 'Trp53'] }; // Example of valid genes per genome

    // Handle probe type selection
    const handleProbeTypeChange = (value: string) => {
        setProbeType(value);
    };

    // Handle genome selection
    const handleGenomeChange = (value: string) => {
        setGenome(value);
        // Reset gene list if genome changes
        setGeneBarcodeList(geneBarcodeList.map(item => ({ ...item, isValidGene: true, sequence: '' })));
    };

    // Handle adding a new gene-barcode pair
    const handleAddGeneBarcode = () => {
        setGeneBarcodeList([
            ...geneBarcodeList,
            { gene: '', barcode: { forward: '', reverse: '' }, type: 'single-end', isValidGene: true, sequence: '' },
        ]);
    };

    // Handle alignment tool selection (single choice)
    const handleAlignmentToolChange = (e: any) => {
        setSelectedAlignmentTool(e.target.value);
    };

    // Form validation for gene input
    const validateGene = (gene: string) => {
        const regex = /^[A-Za-z0-9_-]+$/;
        return regex.test(gene) && gene.length > 0;
    };

    // Handle gene list upload
    const handleGeneUpload = (file: any) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const content = e.target.result;
            const genes = content.split('\n').map((gene: string) => gene.trim());
            const newGeneBarcodeList = genes.map((gene: string) => ({
                gene: gene,
                barcode: { forward: '', reverse: '' },
                type: 'single-end',
                isValidGene: (validGenesForGenome[genome as keyof typeof validGenesForGenome]?.includes(gene) || false),
                sequence: '',
            }));
            setGeneBarcodeList([...geneBarcodeList, ...newGeneBarcodeList]);
        };
        reader.readAsText(file);
        return false; // Prevent upload action
    };

    // Handle form submission (for the final submit button)
    const handleSubmit = () => {
        message.success('Task submitted successfully!');
    };

    return (
        <div className="probe-container">
            <h1>Probe Design Workflow</h1>

            <div className="workflow-grid">                
                {/* Task Name Input */}
                <div className="workflow-step">
                    <h2>Task Name:</h2>
                    <Input placeholder="Enter task name" />

                    {/* Probe Type Selection */}
                    <p>Probe Type</p>
                    <Select 
                        value={probeType} 
                        onChange={handleProbeTypeChange} 
                        placeholder="Select probe type" 
                        style={{ width: 200 }}
                    >
                        <Option value="RCA">RCA</Option>
                        <Option value="Pi-FISH">Pi-FISH</Option>
                    </Select>
                    {/* probe each part params */}
                </div>

                {/* Target Details */}
                <div className="workflow-step">
                    <h2>Target Details</h2>

                    {/* Genome Selection */}
                    <p>Select Genome</p>
                    <Select 
                        value={genome} 
                        onChange={handleGenomeChange} 
                        placeholder="Select genome" 
                        style={{ width: 300 }}
                    >
                        <Option value="human">Human</Option>
                        <Option value="mouse">Mouse</Option>
                        <Option value="zebrafish">Zebrafish</Option>
                        <Option value="drosophila">Drosophila</Option>
                    </Select>

                    {/* Gene and Barcode List */}
                    <div className="mapping-header">
                        <p>Gene and Barcode Mapping</p>
                        <Upload 
                            beforeUpload={handleGeneUpload} 
                            accept=".txt,.csv"
                            showUploadList={false}
                        >
                            <Button icon={<UploadOutlined />}>Import Gene List</Button>
                        </Upload>
                    </div>

                    {/* Gene and Barcode List */}
                    {geneBarcodeList.map((item, index) => (
                        <Row key={index} gutter={16} style={{ marginBottom: '10px' }}>
                            <Col span={6}>
                                <Input 
                                    placeholder="Enter gene"
                                    value={item.gene}
                                    onChange={(e) => {
                                        const updatedList = [...geneBarcodeList];
                                        const gene = e.target.value;
                                        const isValid = validGenesForGenome[genome]?.includes(gene) || false;
                                        
                                        // Update gene and its validity
                                        updatedList[index].gene = gene;
                                        updatedList[index].isValidGene = isValid;

                                        setGeneBarcodeList(updatedList);
                                    }} 
                                    status={!validateGene(item.gene) ? 'error' : ''}
                                />
                                {!validateGene(item.gene) && <p style={{ color: 'red' }}>Invalid gene name</p>}
                            </Col>

                            {/* If gene is not valid for the selected genome, show sequence input */}
                            {!item.isValidGene && (
                                <Col span={12}>
                                    <Input 
                                        placeholder="Enter sequence for design" 
                                        value={item.sequence} 
                                        onChange={(e) => {
                                            const updatedList = [...geneBarcodeList];
                                            updatedList[index].sequence = e.target.value;
                                            setGeneBarcodeList(updatedList);
                                        }} 
                                        style={{ width: '100%' }}
                                    />
                                    <p style={{ color: 'orange' }}>Gene not found in selected genome. Please provide a sequence.</p>
                                </Col>
                            )}

                            <Col span={8}>
                                {item.type === 'single-end' ? (
                                    <Select
                                        value={item.barcode.forward}
                                        onChange={(value) => {
                                            const updatedList = [...geneBarcodeList];
                                            updatedList[index].barcode.forward = value;
                                            setGeneBarcodeList(updatedList);
                                        }}
                                        placeholder="Select or enter barcode"
                                        style={{ width: '100%' }}
                                        dropdownRender={menu => (
                                            <>
                                                {menu}
                                                <Input
                                                    style={{ marginTop: 8 }}
                                                    placeholder="Enter new barcode"
                                                    onPressEnter={e => {
                                                        const newBarcode = e.currentTarget.value;
                                                        const updatedList = [...geneBarcodeList];
                                                        updatedList[index].barcode.forward = newBarcode;
                                                        setGeneBarcodeList(updatedList);
                                                        e.currentTarget.value = '';
                                                    }}
                                                />
                                            </>
                                        )}
                                    >
                                        {existingBarcodes.map(barcode => (
                                            <Option key={barcode} value={barcode}>
                                                {barcode}
                                            </Option>
                                        ))}
                                    </Select>
                                ) : (
                                    <>
                                        <Select
                                            value={item.barcode.forward}
                                            onChange={(value) => {
                                                const updatedList = [...geneBarcodeList];
                                                updatedList[index].barcode.forward = value;
                                                setGeneBarcodeList(updatedList);
                                            }}
                                            placeholder="Forward barcode"
                                            style={{ width: '100%', marginBottom: 8 }}
                                            dropdownRender={menu => (
                                                <>
                                                    {menu}
                                                    <Input
                                                        style={{ marginTop: 8 }}
                                                        placeholder="Enter new forward barcode"
                                                        onPressEnter={e => {
                                                            const newBarcode = e.currentTarget.value;
                                                            const updatedList = [...geneBarcodeList];
                                                            updatedList[index].barcode.forward = newBarcode;
                                                            setGeneBarcodeList(updatedList);
                                                            e.currentTarget.value = '';
                                                        }}
                                                    />
                                                </>
                                            )}
                                        >
                                            {existingBarcodes.map(barcode => (
                                                <Option key={barcode} value={barcode}>
                                                    {barcode}
                                                </Option>
                                            ))}
                                        </Select>
                                        <Select
                                            value={item.barcode.reverse}
                                            onChange={(value) => {
                                                const updatedList = [...geneBarcodeList];
                                                updatedList[index].barcode.reverse = value;
                                                setGeneBarcodeList(updatedList);
                                            }}
                                            placeholder="Reverse barcode"
                                            style={{ width: '100%' }}
                                            dropdownRender={menu => (
                                                <>
                                                    {menu}
                                                    <Input
                                                        style={{ marginTop: 8 }}
                                                        placeholder="Enter new reverse barcode"
                                                        onPressEnter={e => {
                                                            const newBarcode = e.currentTarget.value;
                                                            const updatedList = [...geneBarcodeList];
                                                            updatedList[index].barcode.reverse = newBarcode;
                                                            setGeneBarcodeList(updatedList);
                                                            e.currentTarget.value = '';
                                                        }}
                                                    />
                                                </>
                                            )}
                                        >
                                            {existingBarcodes.map(barcode => (
                                                <Option key={barcode} value={barcode}>
                                                    {barcode}
                                                </Option>
                                            ))}
                                        </Select>
                                    </>
                                )}
                            </Col>
                            <Col span={4}>
                                <Radio.Group 
                                    value={item.type} 
                                    onChange={(e) => {
                                        const updatedList = [...geneBarcodeList];
                                        updatedList[index].type = e.target.value;
                                        setGeneBarcodeList(updatedList);
                                    }}
                                >
                                    <Radio value="single-end">Single-end</Radio>
                                    <Radio value="paired-end">Paired-end</Radio>
                                </Radio.Group>
                            </Col>
                            <Col span={4}>
                                <Button 
                                    type="primary" 
                                    danger 
                                    icon={<DeleteOutlined />} 
                                    onClick={() => {
                                        const updatedList = geneBarcodeList.filter((_, i) => i !== index);
                                        setGeneBarcodeList(updatedList);
                                    }}
                                    style={{ backgroundColor: 'gray', color: 'white', fontSize: '12px', padding: '4px 8px' }} // 增加字体和内边距
                                >
                                    Remove
                                </Button>
                            </Col>
                        </Row>
                    ))}

                    <Button type="primary" onClick={handleAddGeneBarcode}>
                        Add Gene and Barcode
                    </Button>
                </div>

                {/* Attributes Selection */}
                <div className="workflow-step">
                    <h2>Attributes</h2>
                    
                    <Row gutter={100}> {/* 使用 Row 和 Col 进行布局 */}
                        {/* Tm */}
                        <Col>
                            <div>
                                <p>Tm</p>
                                <Switch checked={useTm} onChange={(checked) => setUseTm(checked)} />
                                {useTm && (
                                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                                        <Slider
                                            min={0}
                                            max={100}
                                            value={tmValue}
                                            onChange={(value: number) => setTmValue(value)}
                                            style={{ width: 200, marginRight: '10px' }}
                                        />
                                        <InputNumber
                                            min={0}
                                            max={100}
                                            value={tmValue}
                                            onChange={(value: number | null) => setTmValue(value || 0)}
                                        />
                                    </div>
                                )}
                            </div>
                        </Col>

                        {/* RNA Folding */}
                        <Col>
                            <div>
                                <p>RNA Folding</p>
                                <Switch checked={useFoldingScore} onChange={(checked) => setUseFoldingScore(checked)} />
                                {useFoldingScore && (
                                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                                        <Slider
                                            min={0}
                                            max={100}
                                            value={foldingScore}
                                            onChange={(value: number) => setFoldingScore(value)}
                                            style={{ width: 200, marginRight: '10px' }}
                                        />
                                        <InputNumber
                                            min={0}
                                            max={100}
                                            value={foldingScore}
                                            onChange={(value: number | null) => setFoldingScore(value || 0)}
                                        />
                                    </div>
                                )}
                            </div>
                        </Col>

                        {/* Self-Matching */}
                        <Col>
                            <div>
                                <p>Self-Matching</p>
                                <Switch checked={useSelfMatchingScore} onChange={(checked) => setUseSelfMatchingScore(checked)} />
                                {useSelfMatchingScore && (
                                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                                        <Slider
                                            min={0}
                                            max={100}
                                            value={selfMatchingScore}
                                            onChange={(value: number) => setSelfMatchingScore(value)}
                                            style={{ width: 200, marginRight: '10px' }}
                                        />
                                        <InputNumber
                                            min={0}
                                            max={100}
                                            value={selfMatchingScore}
                                            onChange={(value: number | null) => setSelfMatchingScore(value || 0)}
                                        />
                                    </div>
                                )}
                            </div>
                        </Col>

                        {/* Alignment Tools */}
                        <Col>
                            <div>
                                <p>Alignment Tools</p>
                                <Radio.Group onChange={handleAlignmentToolChange} value={selectedAlignmentTool}>
                                    {alignmentOptions.map(tool => (
                                        <Radio key={tool} value={tool}>
                                            {tool}
                                        </Radio>
                                    ))}
                                </Radio.Group>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* Task Submission */}
                <div>
                    <Button type="primary" onClick={handleSubmit}>
                        Submit Task
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DesignWorkflow;
