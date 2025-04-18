import React from 'react';
import { Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { RcFile, UploadProps } from 'antd/es/upload/interface';

const { Dragger } = Upload;

interface FileUploadProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload, disabled = false }) => {
  const handleUpload: UploadProps['customRequest'] = ({ file }) => {
    if (file instanceof File) {
      onUpload(file);
    }
  };

  const beforeUpload = (file: RcFile) => {
    // Allow the upload to be controlled by customRequest
    return false;
  };

  return (
    <div className="file-upload-container">
      <Dragger
        name="file"
        multiple={false}
        customRequest={handleUpload}
        beforeUpload={beforeUpload}
        disabled={disabled}
        showUploadList={false}
        accept=".txt,.fasta,.fa,.fna,.faa,.ffn,.frn,.gz,.zip, .gtf , .gff"
        style={{ flex: 1 }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag file to this area to upload
        </p>
        <p className="ant-upload-hint">
          Supported formats: .txt, .fasta, .fa, .fna, .faa, .ffn, .frn, .gz, .zip, .gtf, .gff
        </p>
      </Dragger>
    </div>
  );
};

export default FileUpload; 