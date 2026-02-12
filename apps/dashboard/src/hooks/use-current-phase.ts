import { useMemo } from 'react';
import { useDemo, PROJECT_PHASES } from '../demo/DemoProvider';

/**
 * Hook to get the current project phase for NovaTech scenario
 * Returns null for non-NovaTech scenarios
 */
export function useCurrentPhase() {
  const { scenario, isDemo } = useDemo();
  
  const currentPhase = useMemo(() => {
    // Only show phase info for NovaTech scenario
    if (!isDemo || scenario !== 'acmetech') {
      return null;
    }
    
    // For demo purposes, we're in the Development phase
    // In a real implementation, this would track based on task completion
    const currentPhaseId = 'development';
    return PROJECT_PHASES.find(p => p.id === currentPhaseId) || null;
  }, [isDemo, scenario]);
  
  const phases = useMemo(() => {
    if (!isDemo || scenario !== 'acmetech') {
      return [];
    }
    return PROJECT_PHASES;
  }, [isDemo, scenario]);
  
  return {
    currentPhase,
    phases,
    isNovaTech: scenario === 'acmetech',
  };
}
