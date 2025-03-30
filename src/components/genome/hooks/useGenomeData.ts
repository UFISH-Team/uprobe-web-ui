import { useState, useCallback } from 'react';
import { useNotification } from './useNotification';
import { API_BASE_URL } from '../../../config';

export const useGenomeData = () => {
  const [genomes, setGenomes] = useState<string[]>([]);
  const [selectedGenome, setSelectedGenome] = useState('');
  const [customGenome, setCustomGenome] = useState('');
  const { showNotification } = useNotification();

  const fetchGenomes = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/genomes`);
      if (!response.ok) throw new Error('Failed to fetch genomes');
      const data = await response.json();
      setGenomes(data);
    } catch (error) {
      console.error('Error fetching genomes:', error);
      showNotification('Failed to load genome list', 'error');
    }
  }, [showNotification]);

  const deleteGenome = useCallback(async () => {
    if (!selectedGenome) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/genomes/${selectedGenome}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showNotification(`Genome '${selectedGenome}' deleted successfully`, 'success');
        setGenomes((prevGenomes) => prevGenomes.filter((genome) => genome !== selectedGenome));
        setSelectedGenome('');
      } else {
        throw new Error('Genome deletion failed');
      }
    } catch (error) {
      console.error('Error deleting genome:', error);
      showNotification(`Error deleting genome: ${selectedGenome}`, 'error');
    }
  }, [selectedGenome, showNotification]);

  return {
    genomes,
    selectedGenome,
    setSelectedGenome,
    customGenome,
    setCustomGenome,
    fetchGenomes,
    deleteGenome
  };
};