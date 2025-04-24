import React from 'react';
import { Select, Space, Spin } from 'antd';

const { Option } = Select;

interface GenomeSelectorProps {
  genomes: string[];
  selectedGenome: string | null;
  onSelectGenome: (genomeName: string) => void;
  onAddGenome: (genomeName: string) => void;
  onDeleteGenome: (genomeName: string) => void;
  isLoading?: boolean;
}

const GenomeSelector: React.FC<GenomeSelectorProps> = ({
  genomes,
  selectedGenome,
  onSelectGenome,
  onAddGenome,
  onDeleteGenome,
  isLoading = false,
}) => {
  if (isLoading) {
    return <Spin size="large" />;
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Select
        placeholder="Select Genome"
        style={{ width: '100%' }}
        value={selectedGenome || undefined}
        onChange={onSelectGenome}
      >
        {genomes.map((genome) => (
          <Option key={genome} value={genome}>
            {genome}
          </Option>
        ))}
      </Select>
    </Space>
  );
};

export default GenomeSelector;