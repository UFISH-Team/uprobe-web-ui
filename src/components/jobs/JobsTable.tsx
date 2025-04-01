import { useEffect, useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef, GridRowsProp, GridRowSelectionModel } from '@mui/x-data-grid';

import useStore from '../../store';
import { Job } from '../../types';

const JobsTable = () => {
  const { jobs, setSelectedJobs, id2Job, refreshJobs } = useStore();
  const [rows, setRows] = useState<GridRowsProp>([]);

  // Define columns outside of render for better performance
  const columns = useMemo<GridColDef[]>(() => [
    { field: 'id', headerName: "ID", width: 300 },
    { field: 'created_time', headerName: "Created time", width: 200 },
    { field: 'stopped_time', headerName: "Stopped time", width: 200 },
    { field: 'name', headerName: "Name", flex: 1, minWidth: 150 },
    { field: 'status', headerName: "Status", width: 120 },
    { field: 'job_type', headerName: "Job type", width: 150 },
  ], []);

  // Fetch jobs on initial load
  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  // Update rows when jobs change
  useEffect(() => {
    const newRows = jobs.map((job) => ({
      id: job.id,
      created_time: job.created_time,
      stopped_time: job.stoped_time, // Using the property name from the API
      name: job.name,
      status: job.status,
      job_type: job.job_type,
    }));
    
    setRows(newRows);
  }, [jobs]);

  // Handle selection changes
  const handleSelectionChange = useCallback((selectionModel: GridRowSelectionModel) => {
    const selectedJobIds = selectionModel as string[];
    const selectedJobs = selectedJobIds
      .map(id => id2Job.get(id))
      .filter((job): job is Job => job !== undefined);
    
    setSelectedJobs(selectedJobs);
  }, [id2Job, setSelectedJobs]);

  return (
    <Box sx={{ height: 750, width: "100%" }}>
      <DataGrid
        checkboxSelection
        rows={rows}
        columns={columns}
        onRowSelectionModelChange={handleSelectionChange}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10 }
          },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
      />
    </Box>
  );
};

export default JobsTable;
