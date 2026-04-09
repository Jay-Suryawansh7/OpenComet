import { useState, useEffect, useRef } from 'react';
import { useShortcutsStore, type ShortcutCategory, type QueryShortcut } from '@/store/shortcutsStore';
import { cn } from '@/lib/utils';
import {
  Plus, Edit2, Trash2, Download, Upload,
  Search
} from 'lucide-react';

const CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  research: 'Research',
  writing: 'Writing',
  shopping: 'Shopping',
  travel: 'Travel',
  custom: 'Custom',
};

const CATEGORY_COLORS: Record<ShortcutCategory, string> = {
  research: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  writing: 'bg-green-500/10 text-green-400 border-green-500/20',
  shopping: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  travel: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  custom: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

interface ShortcutsPickerProps {
  onSelect: (prompt: string) => void;
  onClose: () => void;
}

export function ShortcutsPicker({ onSelect, onClose }: ShortcutsPickerProps) {
  const { shortcuts, setPickerOpen } = useShortcutsStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory | 'all'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredShortcuts = shortcuts.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.trigger.toLowerCase().includes(search.toLowerCase()) ||
      s.prompt.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (shortcut: QueryShortcut) => {
    onSelect(shortcut.prompt);
    setPickerOpen(false);
    onClose();
  };

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1d24] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden max-h-[400px]">
      {/* Search */}
      <div className="p-3 border-b border-white/[0.06]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shortcuts..."
            className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[12px] text-white/80 placeholder:text-white/30 focus:outline-none focus:border-cyan-500/30"
          />
        </div>
        
        {/* Category filters */}
        <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-2 py-1 rounded text-[10px] whitespace-nowrap transition-colors',
              selectedCategory === 'all'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'
            )}
          >
            All
          </button>
          {(Object.keys(CATEGORY_LABELS) as ShortcutCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-2 py-1 rounded text-[10px] whitespace-nowrap transition-colors',
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'
              )}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Shortcuts list */}
      <div className="overflow-y-auto max-h-[280px] p-2">
        {filteredShortcuts.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[12px] text-white/40">No shortcuts found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredShortcuts.map((shortcut) => (
              <button
                key={shortcut.id}
                onClick={() => handleSelect(shortcut)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
              >
                <span className="text-[16px]">{shortcut.icon || '📝'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-white/80 truncate">
                      {shortcut.name}
                    </span>
                    <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-cyan-400/70">
                      {shortcut.trigger}
                    </code>
                  </div>
                  <p className="text-[11px] text-white/40 truncate mt-0.5">
                    {shortcut.prompt.substring(0, 60)}...
                  </p>
                </div>
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[9px] border',
                  CATEGORY_COLORS[shortcut.category]
                )}>
                  {CATEGORY_LABELS[shortcut.category]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ShortcutEditorProps {
  shortcut?: QueryShortcut;
  onSave: () => void;
  onCancel: () => void;
}

export function ShortcutEditor({ shortcut, onSave, onCancel }: ShortcutEditorProps) {
  const { addShortcut, updateShortcut } = useShortcutsStore();
  const [name, setName] = useState(shortcut?.name || '');
  const [trigger, setTrigger] = useState(shortcut?.trigger || '');
  const [prompt, setPrompt] = useState(shortcut?.prompt || '');
  const [category, setCategory] = useState<ShortcutCategory>(shortcut?.category || 'custom');
  const [icon, setIcon] = useState(shortcut?.icon || '📝');

  const handleSave = () => {
    if (!name.trim() || !trigger.trim() || !prompt.trim()) return;

    const promptWithQuery = prompt.includes('{query}')
      ? prompt
      : `${prompt}\n\n{query}`;

    if (shortcut) {
      updateShortcut(shortcut.id, { name, trigger, prompt: promptWithQuery, category, icon });
    } else {
      addShortcut({ name, trigger, prompt: promptWithQuery, category, icon });
    }
    onSave();
  };

  return (
    <div className="bg-[#1a1d24] border border-white/[0.1] rounded-xl p-4 max-w-md mx-auto">
      <h3 className="text-[14px] font-medium text-white/80 mb-4">
        {shortcut ? 'Edit Shortcut' : 'New Shortcut'}
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-[11px] text-white/50 mb-1">Icon</label>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[12px] text-white/80 focus:outline-none focus:border-cyan-500/30"
            placeholder="📝"
          />
        </div>

        <div>
          <label className="block text-[11px] text-white/50 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[12px] text-white/80 focus:outline-none focus:border-cyan-500/30"
            placeholder="My Shortcut"
          />
        </div>

        <div>
          <label className="block text-[11px] text-white/50 mb-1">Trigger (e.g., /research)</label>
          <input
            type="text"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[12px] text-white/80 focus:outline-none focus:border-cyan-500/30"
            placeholder="/shortcut"
          />
        </div>

        <div>
          <label className="block text-[11px] text-white/50 mb-1">Prompt Template</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[12px] text-white/80 focus:outline-none focus:border-cyan-500/30 resize-none"
            rows={4}
            placeholder="Your prompt template. Use {query} for user input."
          />
          <p className="text-[10px] text-white/30 mt-1">Use {'{query}'} where user input will be inserted</p>
        </div>

        <div>
          <label className="block text-[11px] text-white/50 mb-1">Category</label>
          <div className="flex gap-1">
            {(Object.keys(CATEGORY_LABELS) as ShortcutCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-2 py-1 rounded text-[10px] transition-colors',
                  category === cat
                    ? CATEGORY_COLORS[cat]
                    : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'
                )}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-[12px] text-white/60 hover:text-white/80 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || !trigger.trim() || !prompt.trim()}
          className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-50 text-[12px] text-cyan-400 rounded-lg transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export function ShortcutsManager() {
  const { shortcuts, deleteShortcut, exportShortcuts, importShortcuts } = useShortcutsStore();
  const [editingShortcut, setEditingShortcut] = useState<QueryShortcut | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleExport = () => {
    const data = exportShortcuts();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opencomet-shortcuts.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        try {
          const data = JSON.parse(text) as QueryShortcut[];
          importShortcuts(data);
        } catch {
          console.error('Invalid shortcuts file');
        }
      }
    };
    input.click();
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-medium text-white/80">Query Shortcuts</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImport}
            className="p-1.5 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/60 transition-colors"
            title="Import shortcuts"
          >
            <Upload size={14} />
          </button>
          <button
            onClick={handleExport}
            className="p-1.5 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/60 transition-colors"
            title="Export shortcuts"
          >
            <Download size={14} />
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg text-[11px] text-cyan-400 transition-colors"
          >
            <Plus size={12} />
            Add
          </button>
        </div>
      </div>

      {(isAdding || editingShortcut) && (
        <div className="mb-4">
          <ShortcutEditor
            shortcut={editingShortcut || undefined}
            onSave={() => {
              setIsAdding(false);
              setEditingShortcut(null);
            }}
            onCancel={() => {
              setIsAdding(false);
              setEditingShortcut(null);
            }}
          />
        </div>
      )}

      <div className="space-y-2">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.id}
            className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            <span className="text-[18px]">{shortcut.icon || '📝'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-white/80">
                  {shortcut.name}
                </span>
                <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-cyan-400/70">
                  {shortcut.trigger}
                </code>
                <span className="text-[10px] text-white/30">
                  Used {shortcut.usageCount}x
                </span>
              </div>
              <p className="text-[11px] text-white/40 truncate">
                {shortcut.prompt.substring(0, 80)}...
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEditingShortcut(shortcut)}
                className="p-1.5 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/60 transition-colors"
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={() => deleteShortcut(shortcut.id)}
                className="p-1.5 rounded hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
