import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Progress,
  Card,
  Tabs,
  Modal,
  Input,
  Select,
  Form,
  message,
  Typography,
  Spin,
  Tooltip,
  Drawer,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PauseCircleOutlined,
} from "@ant-design/icons";
import "./Task.css";
import type { Task } from "../types";
import { statusColors } from "../types";
import ApiService from "../api";
import { useNavigate } from "react-router-dom";
import useTaskStore from "../store/taskStore";

const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { Option } = Select;

const statusIcons = {
  pending: <ClockCircleOutlined />,
  running: <Spin size="small" />,
  completed: <CheckCircleOutlined />,
  failed: <ExclamationCircleOutlined />,
  paused: <PauseCircleOutlined />,
};

const Task: React.FC = () => {
  // Use the task store instead of local state
  const { 
    tasks, 
    isLoading, 
    fetchTasks, 
    deleteTask, 
    pauseTask, 
    resumeTask, 
    setCurrentTask,
    currentTask
  } = useTaskStore();
  
  const [taskModalVisible, setTaskModalVisible] = useState<boolean>(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchText, setSearchText] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch tasks when component mounts
    fetchTasks();
    
    // Set up a periodic refresh timer (every 30 seconds)
    const refreshInterval = setInterval(() => {
      fetchTasks();
    }, 30000);
    
    // Clear interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [fetchTasks]);

  const handleCreateTask = () => {
    // Navigate to design workflow page instead of showing modal
    navigate('/design');
  };

  const handleTaskSubmit = () => {
    form.validateFields().then((values) => {
      // Use ApiService to submit the task
      const taskData = {
        name: values.name,
        description: values.description,
        genome: values.genome,
        probeType: values.target_type,
        parameters: {
          probe_length: values.probe_length,
          tm_range: values.tm_range,
          gc_range: values.gc_range,
          target_type: values.target_type,
        }
      };
      
      console.log('Submitting task data:', JSON.stringify(taskData, null, 2));
      
      // Call the API to submit the task
      ApiService.submitTask(taskData)
        .then((response) => {
          message.success("Task created successfully!");
          setTaskModalVisible(false);
          fetchTasks(); // Refresh task list
        })
        .catch((error) => {
          console.error("Failed to create task", error);
          message.error("Failed to create task, please try again later");
        });
    });
  };

  const handleViewTask = (task: Task) => {
    setCurrentTask(task);
    setDetailDrawerVisible(true);
  };

  const handleDeleteTask = (taskId: string) => {
    Modal.confirm({
      title: "Confirm Delete",
      icon: <ExclamationCircleOutlined />,
      content: "Are you sure you want to delete this task? This action cannot be undone.",
      onOk() {
        deleteTask(taskId)
          .then(() => {
            message.success("Task deleted successfully");
          })
          .catch(error => {
            console.error("Failed to delete task", error);
            message.error("Failed to delete task, please try again later");
          });
      },
    });
  };

  const handlePauseTask = (taskId: string) => {
    pauseTask(taskId)
      .then(() => {
        message.success("Task paused successfully");
      })
      .catch(error => {
        console.error("Failed to pause task", error);
        message.error("Failed to pause task, please try again later");
      });
  };

  const handleResumeTask = (taskId: string) => {
    resumeTask(taskId)
      .then(() => {
        message.success("Task resumed successfully");
      })
      .catch(error => {
        console.error("Failed to resume task", error);
        message.error("Failed to resume task, please try again later");
      });
  };

  const handleDownloadResult = (taskId: string) => {
    // Call API to get the result URL
    ApiService.getJobResult(taskId)
      .then(response => {
        if (response && response.data && response.data.result_url) {
          // Open the result URL in a new tab
          window.open(response.data.result_url, '_blank');
          message.success("Starting to download result file");
        } else {
          message.error("No result file available for this task");
        }
      })
      .catch(error => {
        console.error("Failed to get result URL", error);
        message.error("Failed to download result file, please try again later");
      });
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesTab = activeTab === "all" || task.status === activeTab;
    const matchesSearch =
      task.name.toLowerCase().includes(searchText.toLowerCase()) ||
      task.description.toLowerCase().includes(searchText.toLowerCase()) ||
      task.genome.toLowerCase().includes(searchText.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getTasksStatistics = () => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    const running = tasks.filter((task) => task.status === "running").length;
    const pending = tasks.filter((task) => task.status === "pending").length;
    const failed = tasks.filter((task) => task.status === "failed").length;
    const paused = tasks.filter((task) => task.status === "paused").length;
    
    return { total, completed, running, pending, failed, paused };
  };

  const stats = getTasksStatistics();

  const columns = [
    {
      title: "Task Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Task) => (
        <Space>
          <Text strong>{text}</Text>
          {record.status === "completed" && (
            <Tag color="green">Completed</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text: string) => (
        <Tooltip title={text}>
          <div className="description-cell">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: "Genome",
      dataIndex: "genome",
      key: "genome",
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColors[status as keyof typeof statusColors]} icon={statusIcons[status as keyof typeof statusIcons]}>
          {status === "pending" && "Pending"}
          {status === "running" && "Running"}
          {status === "completed" && "Completed"}
          {status === "failed" && "Failed"}
          {status === "paused" && "Paused"}
        </Tag>
      ),
    },
    {
      title: "Progress",
      dataIndex: "progress",
      key: "progress",
      render: (progress: number, record: Task) => (
        <Progress 
          percent={progress} 
          status={
            record.status === "failed" 
              ? "exception" 
              : record.status === "completed" 
                ? "success" 
                : "active"
          }
          size="small"
        />
      ),
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Actions",
      key: "action",
      render: (_: any, record: Task) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewTask(record)}
          >
            Details
          </Button>
          {record.status === "running" && (
            <Button
              type="text"
              danger
              onClick={() => handlePauseTask(record.id)}
            >
              Pause
            </Button>
          )}
          {record.status === "paused" && (
            <Button
              type="text"
              onClick={() => handleResumeTask(record.id)}
            >
              Resume
            </Button>
          )}
          {record.status === "completed" && record.result_url && (
            <Button
              type="text"
              icon={<FileTextOutlined />}
              onClick={() => handleDownloadResult(record.id)}
            >
              Download
            </Button>
          )}
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTask(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="task-page">
      <div className="page-header">
        <Title level={2}>Task Management</Title>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateTask}
          >
            Create Task
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchTasks}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Row gutter={16} className="statistics-cards">
        <Col span={4}>
          <Card size="small">
            <Statistic title="Total Tasks" value={stats.total} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic 
              title="Completed" 
              value={stats.completed} 
              valueStyle={{ color: '#3f8600' }}
              suffix={<span>/{stats.total}</span>}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic 
              title="Running" 
              value={stats.running} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic 
              title="Pending" 
              value={stats.pending}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic 
              title="Paused" 
              value={stats.paused}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic 
              title="Failed" 
              value={stats.failed} 
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <div className="task-filter">
        <Input
          placeholder="Search tasks"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="All Tasks" key="all" />
        <TabPane tab="Running" key="running" />
        <TabPane tab="Pending" key="pending" />
        <TabPane tab="Completed" key="completed" />
        <TabPane tab="Paused" key="paused" />
        <TabPane tab="Failed" key="failed" />
      </Tabs>

      <Table
        columns={columns}
        dataSource={filteredTasks}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        className="task-table"
      />

      <Modal
        title="Create New Task"
        visible={taskModalVisible}
        onOk={handleTaskSubmit}
        onCancel={() => setTaskModalVisible(false)}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Task Name"
            rules={[{ required: true, message: "Please enter task name" }]}
          >
            <Input placeholder="Please enter task name" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Task Description"
          >
            <Input.TextArea placeholder="Please enter task description" rows={3} />
          </Form.Item>
          <Form.Item
            name="genome"
            label="Select Genome"
            rules={[{ required: true, message: "Please select a genome" }]}
          >
            <Select placeholder="Please select a genome">
              <Option value="Human (hg38)">Human (hg38)</Option>
              <Option value="Mouse (mm10)">Mouse (mm10)</Option>
              <Option value="Rat (rn6)">Rat (rn6)</Option>
              <Option value="E. coli K-12">E. coli K-12</Option>
              <Option value="Rice (IRGSP-1.0)">Rice (IRGSP-1.0)</Option>
              <Option value="S. cerevisiae (R64-1-1)">S. cerevisiae (R64-1-1)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="target_type"
            label="Target Type"
            rules={[{ required: true, message: "Please select target type" }]}
          >
            <Select placeholder="Please select target type">
              <Option value="regions">Chromosome Regions</Option>
              <Option value="genes">Genes</Option>
              <Option value="whole_genome">Whole Genome</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="probe_length"
            label="Probe Length"
            rules={[{ required: true, message: "Please enter probe length" }]}
          >
            <Input type="number" placeholder="e.g., 120" />
          </Form.Item>
          <Form.Item
            name="tm_range"
            label="Melting Temperature Range"
            rules={[{ required: true, message: "Please enter melting temperature range" }]}
          >
            <Input placeholder="e.g., 68-72" />
          </Form.Item>
          <Form.Item
            name="gc_range"
            label="GC Content Range (%)"
            rules={[{ required: true, message: "Please enter GC content range" }]}
          >
            <Input placeholder="e.g., 40-60" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="Task Details"
        placement="right"
        width={600}
        onClose={() => setDetailDrawerVisible(false)}
        visible={detailDrawerVisible}
      >
        {currentTask && (
          <div className="task-detail">
            <Title level={4}>{currentTask.name}</Title>
            <p>{currentTask.description}</p>
            
            <div className="detail-section">
              <Title level={5}>Basic Information</Title>
              <Row gutter={[16, 8]}>
                <Col span={12}><Text strong>Task ID: </Text>{currentTask.id}</Col>
                <Col span={12}><Text strong>Status: </Text>
                  <Tag color={statusColors[currentTask.status]}>
                    {currentTask.status === "pending" && "Pending"}
                    {currentTask.status === "running" && "Running"}
                    {currentTask.status === "completed" && "Completed"}
                    {currentTask.status === "failed" && "Failed"}
                    {currentTask.status === "paused" && "Paused"}
                  </Tag>
                </Col>
                <Col span={12}><Text strong>Created At: </Text>{new Date(currentTask.created_at).toLocaleString()}</Col>
                <Col span={12}><Text strong>Updated At: </Text>{new Date(currentTask.updated_at).toLocaleString()}</Col>
                <Col span={24}>
                  <Text strong>Progress: </Text>
                  <Progress 
                    percent={currentTask.progress} 
                    status={
                      currentTask.status === "failed" 
                        ? "exception" 
                        : currentTask.status === "completed" 
                          ? "success" 
                          : "active"
                    }
                  />
                </Col>
              </Row>
            </div>
            
            <div className="detail-section">
              <Title level={5}>Parameter Settings</Title>
              <Row gutter={[16, 8]}>
                <Col span={12}><Text strong>Genome: </Text>{currentTask.genome}</Col>
                <Col span={12}><Text strong>Probe Type: </Text>{currentTask.parameters.probeType}</Col>
                
                {/* Display appropriate parameters based on probe type */}
                {currentTask.parameters.probeType === 'RCA' || currentTask.parameters.probeType === undefined ? (
                  <>
                    <Col span={12}><Text strong>Target Length: </Text>{currentTask.parameters.minLength || currentTask.parameters.probe_length}</Col>
                    <Col span={12}><Text strong>Overlap: </Text>{currentTask.parameters.overlap}</Col>
                    
                    {currentTask.parameters.geneList && currentTask.parameters.geneList.length > 0 && (
                      <Col span={24}>
                        <Text strong>Target Genes: </Text>
                        {currentTask.parameters.geneList.map((gene: any, index: number) => (
                          <Tag key={index} color="blue">{gene.gene}</Tag>
                        ))}
                      </Col>
                    )}
                    
                    {currentTask.parameters.target_genes && (
                      <Col span={24}>
                        <Text strong>Target Genes: </Text>{currentTask.parameters.target_genes}
                      </Col>
                    )}
                  </>
                ) : currentTask.parameters.probeType === 'DNA-FISH' ? (
                  <>
                    <Col span={12}><Text strong>Pool Length: </Text>{currentTask.parameters.length}</Col>
                    <Col span={12}><Text strong>Overlap: </Text>{currentTask.parameters.overlap}</Col>
                    
                    {currentTask.parameters.poolList && currentTask.parameters.poolList.length > 0 && (
                      <Col span={24}>
                        <Text strong>Pool List: </Text>
                        {currentTask.parameters.poolList.map((pool: any, index: number) => (
                          <div key={index}>
                            <Tag color="green">{pool.name}</Tag> - {pool.location} ({pool.numbers} probes, density: {pool.density})
                          </div>
                        ))}
                      </Col>
                    )}
                  </>
                ) : (
                  // Custom probe type
                  <>
                    <Col span={12}><Text strong>Custom Type: </Text>{currentTask.parameters.customType || "Custom"}</Col>
                    <Col span={12}><Text strong>Target Length: </Text>{currentTask.parameters.minLength}</Col>
                    <Col span={12}><Text strong>Overlap: </Text>{currentTask.parameters.overlap}</Col>
                    
                    {currentTask.parameters.geneList && currentTask.parameters.geneList.length > 0 && (
                      <Col span={24}>
                        <Text strong>Target Genes: </Text>
                        {currentTask.parameters.geneList.map((gene: any, index: number) => (
                          <Tag key={index} color="purple">{gene.gene}</Tag>
                        ))}
                      </Col>
                    )}
                  </>
                )}
                
                {/* Display filters if present */}
                {currentTask.parameters.filters && currentTask.parameters.filters.length > 0 && (
                  <Col span={24}>
                    <Text strong>Filters: </Text>
                    {currentTask.parameters.filters.map((filter: any, index: number) => (
                      <Tag key={index} color="orange">
                        {filter.type}: {typeof filter.value === 'object' 
                          ? `${filter.value.min || 0} - ${filter.value.max || 100}` 
                          : filter.value}
                      </Tag>
                    ))}
                  </Col>
                )}
                
                {/* Display sorts if present */}
                {currentTask.parameters.sorts && currentTask.parameters.sorts.length > 0 && (
                  <Col span={24}>
                    <Text strong>Sorts: </Text>
                    {currentTask.parameters.sorts.map((sort: any, index: number) => (
                      <Tag key={index} color="cyan">{sort.type} {sort.order}</Tag>
                    ))}
                  </Col>
                )}
                
                {/* Display remove overlap if present */}
                {currentTask.parameters.removeOverlap > 0 && (
                  <Col span={24}>
                    <Text strong>Remove Overlap: </Text>{currentTask.parameters.removeOverlap}
                  </Col>
                )}
                
                {/* Legacy parameter display for compatibility */}
                {currentTask.parameters.target_regions && (
                  <Col span={24}><Text strong>Target Regions: </Text>{currentTask.parameters.target_regions}</Col>
                )}
                {currentTask.parameters.probe_length && (
                  <Col span={12}><Text strong>Probe Length: </Text>{currentTask.parameters.probe_length}</Col>
                )}
                {currentTask.parameters.tm_range && (
                  <Col span={12}><Text strong>Melting Temperature Range: </Text>{currentTask.parameters.tm_range}</Col>
                )}
                {currentTask.parameters.gc_range && (
                  <Col span={12}><Text strong>GC Content Range: </Text>{currentTask.parameters.gc_range}</Col>
                )}
              </Row>
            </div>
            
            <div className="detail-actions">
              {currentTask.status === "running" && (
                <Button
                  type="primary"
                  danger
                  onClick={() => {
                    handlePauseTask(currentTask.id);
                    setDetailDrawerVisible(false);
                  }}
                >
                  Pause Task
                </Button>
              )}
              {currentTask.status === "paused" && (
                <Button
                  type="primary"
                  onClick={() => {
                    handleResumeTask(currentTask.id);
                    setDetailDrawerVisible(false);
                  }}
                >
                  Resume Task
                </Button>
              )}
              {currentTask.status === "completed" && currentTask.result_url && (
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={() => handleDownloadResult(currentTask.id)}
                >
                  Download Results
                </Button>
              )}
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  handleDeleteTask(currentTask.id);
                  setDetailDrawerVisible(false);
                }}
              >
                Delete Task
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Task;