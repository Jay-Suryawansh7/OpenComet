import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Extension {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  icon?: string;
  permissions: string[];
  manifest: ExtensionManifest;
  path?: string;
  installedAt: number;
}

export interface ExtensionManifest {
  manifest_version: 2 | 3;
  name: string;
  version: string;
  description?: string;
  permissions?: string[];
  content_scripts?: ContentScript[];
  background?: {
    service_worker?: string;
    scripts?: string[];
  };
  icons?: Record<string, string>;
}

export interface ContentScript {
  matches: string[];
  js?: string[];
  css?: string[];
  run_at?: 'document_start' | 'document_end' | 'document_idle';
}

interface ExtensionsState {
  extensions: Extension[];
  isLoading: boolean;
  error: string | null;
}

interface ExtensionsActions {
  loadExtension: (path: string) => Promise<Extension | null>;
  loadUnpackedExtension: (manifest: ExtensionManifest, path: string) => Extension | null;
  unloadExtension: (id: string) => void;
  enableExtension: (id: string) => void;
  disableExtension: (id: string) => void;
  removeExtension: (id: string) => void;
  getEnabledExtensions: () => Extension[];
  getContentScripts: () => { matches: string[]; js?: string[]; css?: string[] }[];
}

export const useExtensionsStore = create<ExtensionsState & ExtensionsActions>()(
  persist(
    (set, get) => ({
      extensions: [],
      isLoading: false,
      error: null,

      loadExtension: async (path) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`file://${path}/manifest.json`);
          if (!response.ok) {
            throw new Error('Failed to load manifest.json');
          }
          const manifest = await response.json() as ExtensionManifest;

          if (!manifest.name || !manifest.version) {
            throw new Error('Invalid manifest: missing name or version');
          }

          const extension: Extension = {
            id: `ext-${Date.now()}`,
            name: manifest.name,
            version: manifest.version,
            description: manifest.description || '',
            enabled: true,
            icon: manifest.icons?.['48'] || manifest.icons?.['128'] || undefined,
            permissions: manifest.permissions || [],
            manifest,
            path,
            installedAt: Date.now(),
          };

          set((state) => ({
            extensions: [...state.extensions, extension],
            isLoading: false,
          }));

          return extension;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load extension',
          });
          return null;
        }
      },

      loadUnpackedExtension: (manifest, path) => {
        const extension: Extension = {
          id: `ext-${Date.now()}`,
          name: manifest.name,
          version: manifest.version,
          description: manifest.description || '',
          enabled: true,
          icon: manifest.icons?.['48'] || manifest.icons?.['128'] || undefined,
          permissions: manifest.permissions || [],
          manifest,
          path,
          installedAt: Date.now(),
        };

        set((state) => ({
          extensions: [...state.extensions, extension],
        }));

        return extension;
      },

      unloadExtension: (id) => {
        set((state) => ({
          extensions: state.extensions.map((e) =>
            e.id === id ? { ...e, enabled: false } : e
          ),
        }));
      },

      enableExtension: (id) => {
        set((state) => ({
          extensions: state.extensions.map((e) =>
            e.id === id ? { ...e, enabled: true } : e
          ),
        }));
      },

      disableExtension: (id) => {
        set((state) => ({
          extensions: state.extensions.map((e) =>
            e.id === id ? { ...e, enabled: false } : e
          ),
        }));
      },

      removeExtension: (id) => {
        set((state) => ({
          extensions: state.extensions.filter((e) => e.id !== id),
        }));
      },

      getEnabledExtensions: () => {
        return get().extensions.filter((e) => e.enabled);
      },

      getContentScripts: () => {
        const enabledExtensions = get().getEnabledExtensions();
        const scripts: { matches: string[]; js?: string[]; css?: string[] }[] = [];

        enabledExtensions.forEach((ext) => {
          if (ext.manifest.content_scripts) {
            ext.manifest.content_scripts.forEach((cs) => {
              scripts.push({
                matches: cs.matches || [],
                js: cs.js,
                css: cs.css,
              });
            });
          }
        });

        return scripts;
      },
    }),
    {
      name: 'opencomet-extensions',
      partialize: (state) => ({
        extensions: state.extensions,
      }),
    }
  )
);
