import { useCallback } from 'react';
import { agentService } from '@/db/agent-service';

export function useAgentService() {
  const setMemoryEnabled = useCallback((enabled: boolean) => {
    agentService.setMemoryEnabled(enabled);
  }, []);

  const isMemoryEnabled = useCallback(() => {
    return agentService.isMemoryEnabled();
  }, []);

  const getMemoryStats = useCallback(async () => {
    return agentService.getMemoryStats();
  }, []);

  const clearAllMemories = useCallback(async () => {
    await agentService.clearAllMemories();
  }, []);

  const clearBrowsingHistory = useCallback(async () => {
    await agentService.clearBrowsingHistory();
  }, []);

  const forgetMemory = useCallback(async (memoryId: string) => {
    await agentService.forgetMemory(memoryId);
  }, []);

  const getMemories = useCallback(async (limit: number = 20) => {
    return agentService.getMemories(limit);
  }, []);

  const searchMemories = useCallback(async (query: string) => {
    return agentService.searchMemories(query);
  }, []);

  return {
    setMemoryEnabled,
    isMemoryEnabled,
    getMemoryStats,
    clearAllMemories,
    clearBrowsingHistory,
    forgetMemory,
    getMemories,
    searchMemories,
  };
}
