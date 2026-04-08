import { useState } from 'react'
import { Eye, EyeOff, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettingsStore } from '@/store'
import { cn } from '@/lib/utils'

export function ProviderSettings() {
  const { providers, activeProviderId, updateProviderKey, setActiveProvider, agentServerUrl, setAgentServerUrl } = useSettingsStore()
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)

  const toggleKey = (id: string) => {
    setShowKeys((s) => ({ ...s, [id]: !s[id] }))
  }

  const handleSave = () => {
    // Persist to localStorage
    localStorage.setItem('opencomet_providers', JSON.stringify(providers))
    localStorage.setItem('opencomet_agent_url', agentServerUrl)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-lg font-semibold text-white/90">Settings</h2>
        <p className="text-[13px] text-white/35 mt-1">Configure providers, API keys, and agent server</p>
      </div>

      <ScrollArea className="flex-1 px-6">
        {/* Agent Server URL */}
        <div className="mb-6">
          <label className="text-[12px] font-medium uppercase tracking-wider text-white/30 mb-2 block">
            Agent Server
          </label>
          <Input
            value={agentServerUrl}
            onChange={(e) => setAgentServerUrl(e.target.value)}
            placeholder="http://localhost:8765"
            className="font-mono text-[13px]"
          />
        </div>

        <Separator className="mb-5" />

        {/* Providers */}
        <label className="text-[12px] font-medium uppercase tracking-wider text-white/30 mb-3 block">
          Model Providers
        </label>

        <div className="space-y-4 pb-6">
          {providers.map((provider) => {
            const isActive = provider.id === activeProviderId
            return (
              <div
                key={provider.id}
                className={cn(
                  'rounded-xl border p-4 transition-all',
                  isActive
                    ? 'border-cyan-500/20 bg-cyan-500/[0.03]'
                    : 'border-white/[0.06] bg-white/[0.015] hover:border-white/[0.1]'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{provider.icon}</span>
                    <span className="text-[14px] font-medium text-white/80">{provider.name}</span>
                    {isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  {!isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveProvider(provider.id)}
                      className="text-[12px]"
                    >
                      Set Active
                    </Button>
                  )}
                </div>

                {provider.id !== 'ollama' && (
                  <div className="flex items-center gap-2">
                    <Input
                      type={showKeys[provider.id] ? 'text' : 'password'}
                      value={provider.apiKey}
                      onChange={(e) => updateProviderKey(provider.id, e.target.value)}
                      placeholder={provider.apiKeyLabel}
                      className="font-mono text-[12px] flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => toggleKey(provider.id)}>
                      {showKeys[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                  </div>
                )}

                {provider.id === 'ollama' && (
                  <div className="text-[12px] text-white/30">
                    Connects to local Ollama at {provider.baseUrl}
                  </div>
                )}

                {/* Model list */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {provider.models.map((m) => (
                    <span
                      key={m.id}
                      className="inline-block rounded-md bg-white/[0.04] px-2 py-1 text-[11px] text-white/35"
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <div className="px-6 py-4 border-t border-white/[0.06]">
        <Button onClick={handleSave} className="w-full">
          {saved ? (
            <span className="flex items-center gap-2">
              <Check size={14} /> Saved
            </span>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  )
}
