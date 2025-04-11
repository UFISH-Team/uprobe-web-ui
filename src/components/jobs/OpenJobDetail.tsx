import React from 'react';
import Button from '@mui/material/Button';

import JobDetailDialog from './JobDetailDialog';
import useJobStore from '../../store/jobStore';


const OpenJobDetail = () => {

  const { selectedJobs } = useJobStore((state) => state)
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false)

  return (
    <>
      {(selectedJobs.length == 1) &&
        <JobDetailDialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          job={selectedJobs[0]}
        />
      }

      <Button
        disabled={selectedJobs.length != 1}
        onClick={() => {setDetailDialogOpen(true)}}
      >detail</Button>
    </>
  )
}


export default OpenJobDetail
