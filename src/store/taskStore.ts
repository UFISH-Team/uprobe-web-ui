import { create } from 'zustand';
import ApiService from '../api';
import { Task } from '../types';

interface TaskState {
  // State
  tasks: Task[];
  isLoading: boolean;
  currentTask: Task | null;
  
  // Actions
  fetchTasks: () => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  pauseTask: (taskId: string) => Promise<void>;
  resumeTask: (taskId: string) => Promise<void>;
  refreshTaskList: () => void;
  setCurrentTask: (task: Task | null) => void;
}

const useTaskStore = create<TaskState>((set, get) => ({
  // Initial state
  tasks: [],
  isLoading: false,
  currentTask: null,
  
  // Actions
  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const response = await ApiService.getAllJobs();
      
      if (response && response.data) {
        // Transform the job data into the Task format
        const apiTasks: Task[] = response.data.map((job: any) => ({
          id: job.job_id || job.id,
          name: job.name || 'Unnamed Task',
          description: job.description || `${job.probeType || ''} design task`,
          status: mapJobStatusToTaskStatus(job.status),
          progress: calculateProgress(job.status, job.progress),
          created_at: job.created_at || job.createdAt || new Date().toISOString(),
          updated_at: job.updated_at || job.updatedAt || new Date().toISOString(),
          genome: job.genome || job.species || 'Unknown',
          parameters: {
            probeType: job.probeType,
            minLength: job.minLength,
            overlap: job.overlap,
            ...job.parameters
          },
          result_url: job.result_url || ''
        }));
        
        set({ tasks: apiTasks, isLoading: false });
      } else {
        set({ tasks: [], isLoading: false });
      }
    } catch (error) {
      console.error("Failed to fetch task data", error);
      set({ isLoading: false });
    }
  },
  
  deleteTask: async (taskId: string) => {
    try {
      await ApiService.removeJob(taskId);
      
      // Update the tasks list after deletion
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId)
      }));
      
      return Promise.resolve();
    } catch (error) {
      console.error("Failed to delete task", error);
      return Promise.reject(error);
    }
  },
  
  pauseTask: async (taskId: string) => {
    try {
      await ApiService.cancelJob(taskId);
      
      // Update the task status in the state
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, status: "paused" } : task
        )
      }));
      
      return Promise.resolve();
    } catch (error) {
      console.error("Failed to pause task", error);
      return Promise.reject(error);
    }
  },
  
  resumeTask: async (taskId: string) => {
    try {
      await ApiService.reRunJob(taskId);
      
      // Update the task status in the state
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, status: "running" } : task
        )
      }));
      
      return Promise.resolve();
    } catch (error) {
      console.error("Failed to resume task", error);
      return Promise.reject(error);
    }
  },
  
  refreshTaskList: () => {
    get().fetchTasks();
  },
  
  setCurrentTask: (task: Task | null) => {
    set({ currentTask: task });
  }
}));

// Helper function to map job status to task status
const mapJobStatusToTaskStatus = (jobStatus: string): "pending" | "running" | "completed" | "failed" | "paused" => {
  switch (jobStatus?.toLowerCase()) {
    case 'pending': 
      return 'pending';
    case 'running': 
      return 'running';
    case 'completed': 
    case 'success':
    case 'succeeded':
      return 'completed';
    case 'failed': 
    case 'error':
      return 'failed';
    case 'paused': 
    case 'stopped':
      return 'paused';
    default:
      return 'pending';
  }
};

// Helper function to calculate task progress
const calculateProgress = (status: string, progress: number | undefined): number => {
  if (progress !== undefined) {
    return progress;
  }
  
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'success':
    case 'succeeded':
      return 100;
    case 'failed':
    case 'error':
      return 0;
    case 'running':
      return 50; // Default for running if no progress provided
    default:
      return 0;
  }
};

export default useTaskStore; 