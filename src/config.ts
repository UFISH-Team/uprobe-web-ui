// Base API URL for all requests
export const API_BASE_URL = 'http://127.0.0.1:8123';

// App-wide configuration settings
export const CONFIG = {
  // Maximum allowed file size (in bytes)
  MAX_FILE_SIZE: 1024 * 1024 * 100, // 100MB
  
  // Supported file extensions
  SUPPORTED_EXTENSIONS: [
    // Genome files
    '.fa', '.fna', '.fasta',
    // Annotation files
    '.gff', '.gtf',
    // Index files
    '.jf', '.sam', '.bam'
  ],
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 10,
  
  // Notification display time in ms
  NOTIFICATION_DURATION: 3000
};