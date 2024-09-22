// File: pages/JobsPanel.tsx

import React, { useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Typography, Box } from "@mui/material";

// Define the structure of a Job
export interface Job {
  id: string;
  name: string;
  created_time: string;
  stoped_time: string;
  status: string;
  job_type: string;
}

const JobsPanel: React.FC = () => {
  // State to store submitted jobs
  const [jobs, setJobs] = useState<Job[]>([]);

  // Columns for DataGrid
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 150 },
    { field: "created_time", headerName: "Created Time", width: 200 },
    { field: "stoped_time", headerName: "Stopped Time", width: 200 },
    { field: "name", headerName: "Job Name", width: 250 },
    { field: "status", headerName: "Status", width: 150 },
    { field: "job_type", headerName: "Job Type", width: 150 },
  ];

  // Handler for when a new task is submitted
  const handleTaskSubmit = (newTask: Job) => {
    console.log("New Task Submitted:", newTask); // Debugging line to check task content
    setJobs((prevJobs) => [...prevJobs, newTask]);  // Add new task to jobs list
  };

  return (
    <Box sx={{ padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Job List
      </Typography>

      <div style={{ height: 400, width: "100%" }}>
        <DataGrid 
          rows={jobs} 
          columns={columns} 
          pageSize={5} 
          checkboxSelection 
          getRowId={(row) => row.id}  // Ensure DataGrid uses 'id' as row identifier
        />
      </div>
    </Box>
  );
};

export default JobsPanel;
