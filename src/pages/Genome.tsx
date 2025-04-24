import React, { useEffect, useState } from 'react';
import {
  Typography,
  Space,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Table,
  Tag,
  Modal,
  Spin,
  Tooltip,
  message,
  Divider,
  Badge,
  Empty
} from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  FileOutlined,
  FileTextOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useGenomeData } from '../hooks/useGenomeData';
import FileUpload from '../components/genome/FileUpload';
import GenomeSelector from '../components/genome/GenomeSelector';
import './Genome.css';

const { confirm } = Modal;
const { Title, Text } = Typography;

const Genome: React.FC = () => {
  const {
    genomes,
    selectedGenome,
    genomeFiles,
    isLoading,
    setSelectedGenome,
    fetchGenomes,
    fetchGenomeFiles,
    uploadGenomeFile,
    deleteGenomeFile,
    downloadGenomeFile,
    addGenome,
    deleteGenome,
  } = useGenomeData();

  const [searchText, setSearchText] = useState<string>('');
  const [addGenomeModalVisible, setAddGenomeModalVisible] = useState<boolean>(false);
  const [newGenomeName, setNewGenomeName] = useState<string>('');

  useEffect(() => {
    fetchGenomes();
  }, [fetchGenomes]);

  useEffect(() => {
    if (selectedGenome) {
      fetchGenomeFiles(selectedGenome);
    }
  }, [selectedGenome, fetchGenomeFiles]);

  const handleFileUpload = async (file: File) => {
    if (!selectedGenome) {
      message.error('Please select a genome first');
      return;
    }
    await uploadGenomeFile(selectedGenome, file);
  };

  const handleFileDelete = async (fileName: string) => {
    if (!selectedGenome) return;
    
    confirm({
      title: 'Are you sure you want to delete this file?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      onOk() {
        return deleteGenomeFile(selectedGenome, fileName);
      },
    });
  };

  const handleFileDownload = async (fileName: string) => {
    if (!selectedGenome) return;
    await downloadGenomeFile(selectedGenome, fileName);
  };

  const handleAddGenome = () => {
    if (newGenomeName.trim()) {
      addGenome(newGenomeName.trim());
      setNewGenomeName('');
      setAddGenomeModalVisible(false);
    } else {
      message.error('Genome name cannot be empty');
    }
  };

  const handleDeleteGenomeConfirm = () => {
    if (!selectedGenome) return;
    
    confirm({
      title: 'Are you sure you want to delete this genome?',
      icon: <ExclamationCircleOutlined />,
      content: 'All associated files will also be deleted. This action cannot be undone.',
      onOk() {
        return deleteGenome(selectedGenome);
      },
    });
  };

  // Statistics for the dashboard
  const getGenomeStats = () => {
    const totalGenomes = genomes.length;
    const totalFiles = genomeFiles.length;
    const filesByType = genomeFiles.reduce((acc, file) => {
      const type = file.split('.').pop() || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const fastaFiles = Object.entries(filesByType)
      .filter(([type]) => ['fasta', 'fa', 'fna', 'faa', 'ffn', 'frn'].includes(type))
      .reduce((sum, [, count]) => sum + count, 0);
      
    const otherFiles = totalFiles - fastaFiles;
    
    return {
      totalGenomes,
      totalFiles,
      fastaFiles,
      otherFiles,
    };
  };

  const stats = getGenomeStats();

  // Get file type color
  const getFileTypeColor = (type: string): string => {
    const typeMap: Record<string, string> = {
      'fasta': 'green',
      'fa': 'green',
      'fna': 'green',
      'faa': 'green', 
      'ffn': 'green',
      'frn': 'green',
      'gtf': 'orange',
      'gff': 'orange',
      'gz': 'blue',
      'zip': 'blue',
      'txt': 'purple',
    };
    
    return typeMap[type.toLowerCase()] || 'default';
  };

  // Table columns for file list
  const columns = [
    {
      title: 'File Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => {
        const fileIcon = record.type.match(/fa|fasta|fna|faa|ffn|frn/i) ? (
          <FileTextOutlined style={{ marginRight: 8 }} />
        ) : (
          <FileOutlined style={{ marginRight: 8 }} />
        );
        
        return (
          <Tooltip title={text}>
            <div className="file-name">
              {fileIcon}
              {text}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (text: string) => (
        <Tag color={getFileTypeColor(text)}>
          {text.toUpperCase() || 'Unknown'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleFileDownload(record.name)}
          >
            Download
          </Button>
          <Button
            type="primary"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleFileDelete(record.name)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // Convert genomeFiles to table data format
  const fileTableData = genomeFiles
    .filter(fileName => fileName.toLowerCase().includes(searchText.toLowerCase()))
    .map(fileName => ({
      key: fileName,
      name: fileName,
      type: fileName.split('.').pop() || 'Unknown',
    }));

  return (
    <div className="genome-page">
      <div className="page-header">
        <div>
          <Title level={2}>
            <DatabaseOutlined /> Genome Management
          </Title>
          <Text type="secondary">Manage your genome references and associated files</Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddGenomeModalVisible(true)}
          >
            Add Genome
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchGenomes}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Row gutter={16} className="statistics-cards">
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="Total Genomes" 
              value={stats.totalGenomes} 
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="Total Files" 
              value={stats.totalFiles}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="FASTA Files" 
              value={stats.fastaFiles} 
              valueStyle={{ color: '#3f8600' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="Other Files" 
              value={stats.otherFiles}
              valueStyle={{ color: '#1890ff' }}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row 
        gutter={{ xs: 8, sm: 16, md: 24 }} 
        className="genome-content"
      >
        <Col span={6}>
          <div className="left-column">
            <Card 
              title={
                <span>
                  <DatabaseOutlined /> Genome Selection
                </span>
              } 
              className="genome-card"
            >
              {genomes.length === 0 && !isLoading ? (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                  description="No genomes available" 
                />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <GenomeSelector
                    genomes={genomes}
                    selectedGenome={selectedGenome}
                    onSelectGenome={setSelectedGenome}
                    onAddGenome={addGenome}
                    onDeleteGenome={deleteGenome}
                    isLoading={isLoading}
                  />
                  
                  {selectedGenome && (
                    <>
                      <Divider plain>Selected Genome</Divider>
                      <div className="genome-info">
                        <Badge status="processing" text={selectedGenome} />
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">
                            {genomeFiles.length} file(s) available
                          </Text>
                        </div>
                        <Button 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={handleDeleteGenomeConfirm}
                          style={{ marginTop: 16 }}
                        >
                          Delete Genome
                        </Button>
                      </div>
                    </>
                  )}
                </Space>
              )}
            </Card>
            
            <Card 
              title={
                <span>
                  <UploadOutlined /> Upload Files
                </span>
              } 
              className="genome-card upload-card" 
              style={{ marginTop: 16 }}
            >
              <FileUpload
                onUpload={handleFileUpload}
                disabled={!selectedGenome || isLoading}
              />
              
              {!selectedGenome && (
                <div className="upload-warning">
                  <Text type="warning">
                    <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                    Please select a genome first
                  </Text>
                </div>
              )}
            </Card>
          </div>
        </Col>
        
        <Col span={18}>
          <Card className="files-card">
            <div className="card-header">
              <div>
                <Title level={4}>
                  <FileOutlined /> Files
                </Title>
                {selectedGenome && (
                  <Text type="secondary">
                    Files for genome: <Text strong>{selectedGenome}</Text>
                  </Text>
                )}
              </div>
              <Input
                placeholder="Search files"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
            </div>
            
            {isLoading ? (
              <div className="loading-container">
                <Spin size="large" />
              </div>
            ) : (
              <>
                {!selectedGenome ? (
                  <div className="empty-state">
                    <Empty 
                      description="Please select a genome to view files" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  </div>
                ) : genomeFiles.length === 0 ? (
                  <div className="empty-state">
                    <Empty 
                      description="No files available for this genome" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  </div>
                ) : (
                  <Table
                    columns={columns}
                    dataSource={fileTableData}
                    pagination={{ pageSize: 10 }}
                    className="file-table"
                    bordered
                    size="middle"
                    loading={isLoading}
                  />
                )}
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* Add Genome Modal */}
      <Modal
        title={
          <span>
            <DatabaseOutlined /> Add New Genome
          </span>
        }
        open={addGenomeModalVisible}
        onOk={handleAddGenome}
        onCancel={() => {
          setAddGenomeModalVisible(false);
          setNewGenomeName('');
        }}
      >
        <Input 
          placeholder="Enter genome name"
          value={newGenomeName}
          onChange={(e) => setNewGenomeName(e.target.value)}
          onPressEnter={handleAddGenome}
          prefix={<DatabaseOutlined />}
        />
      </Modal>
    </div>
  );
};

export default Genome;