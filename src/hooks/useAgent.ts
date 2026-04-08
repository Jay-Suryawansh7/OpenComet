import { useState, useCallback } from 'react'
import { useChatStore, useSettingsStore, Message } from '../store'

const DEFAULT_SERVER_URL = 'http://localhost:8765'

export function useAgent() {
  const { addMessage, setLoading, setAgentStatus, setCurrentUrl } = useChatStore()
  const { agentServerUrl, apiKey } = useSettingsStore()
  
  const [error, setError] = useState<string | null>(null)
  
  const sendMessage = useCallback(async (content: string) => {
    const serverUrl = agentServerUrl || DEFAULT_SERVER_URL
    
    // Add user message
    addMessage({ role: 'user', content })
    setLoading(true)
    setAgentStatus('thinking')
    setError(null)
    
    try {
      const response = await fetch(`${serverUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({ message: content })
      })
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Add assistant response
      addMessage({ role: 'assistant', content: data.response })
      setAgentStatus('ready')
      
      // Update current URL if provided
      if (data.url) {
        setCurrentUrl(data.url)
      }
      
      return data.response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      addMessage({ 
        role: 'system', 
        content: `Error: ${errorMessage}. Make sure the agent server is running at ${serverUrl}` 
      })
      setAgentStatus('idle')
      return null
    } finally {
      setLoading(false)
    }
  }, [agentServerUrl, apiKey, addMessage, setLoading, setAgentStatus, setCurrentUrl])
  
  const clearChat = useCallback(async () => {
    const serverUrl = agentServerUrl || DEFAULT_SERVER_URL
    
    try {
      await fetch(`${serverUrl}/clear`, { method: 'POST' })
    } catch {
      // Ignore errors on clear
    }
  }, [agentServerUrl])
  
  const checkServerHealth = useCallback(async () => {
    const serverUrl = agentServerUrl || DEFAULT_SERVER_URL
    
    try {
      const response = await fetch(`${serverUrl}/health`)
      return response.ok
    } catch {
      return false
    }
  }, [agentServerUrl])
  
  return {
    sendMessage,
    clearChat,
    checkServerHealth,
    error
  }
}