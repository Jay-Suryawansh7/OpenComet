import { useEffect, useCallback } from 'react';
import { useChatStore, useSettingsStore, useAgentMonitorStore } from '@/store';

export function useAgent() {
  const { messages, isLoading, agentStatus, sendMessage, clearMessages, initialize } = useChatStore();
  const { loadSettings } = useSettingsStore();
  const { refreshStatus } = useAgentMonitorStore();

  useEffect(() => {
    const init = async () => {
      await initialize();
      await loadSettings();
    };
    init();
  }, [initialize, loadSettings]);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const handleSend = useCallback(async (content: string) => {
    return sendMessage(content);
  }, [sendMessage]);

  const handleClear = useCallback(async () => {
    clearMessages();
  }, [clearMessages]);

  return {
    messages,
    isLoading,
    agentStatus,
    sendMessage: handleSend,
    clearChat: handleClear,
    error: agentStatus === 'error' ? 'Agent error occurred' : null
  };
}

export function useConversations() {
  const { loadConversations, loadConversation, createConversation, deleteConversation, currentConversationId } = useChatStore();

  return {
    loadConversations,
    loadConversation,
    createConversation,
    deleteConversation,
    currentConversationId
  };
}

export function useSettings() {
  const store = useSettingsStore();
  return {
    providers: store.providers,
    activeProviderId: store.activeProviderId,
    activeModelId: store.activeModelId,
    temperature: store.temperature,
    agentServerUrl: store.agentServerUrl,
    sidebarCollapsed: store.sidebarCollapsed,
    setActiveProvider: store.setActiveProvider,
    setActiveModel: store.setActiveModel,
    updateProviderKey: store.updateProviderKey,
    setTemperature: store.setTemperature,
    setAgentServerUrl: store.setAgentServerUrl,
    toggleSidebar: store.toggleSidebar,
    getActiveProvider: store.getActiveProvider,
    getActiveModel: store.getActiveModel
  };
}

export function useAgentStatus() {
  const { agentStates, currentTask, refreshStatus } = useAgentMonitorStore();
  return {
    agentStates,
    currentTask,
    refreshStatus
  };
}