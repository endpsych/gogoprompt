import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Profile {
  id: string;
  name: string;
  description: string;
  icon: string; 
  isActive: boolean;
  createdAt: number;
}

interface ProfileState {
  profiles: Profile[];
  activeProfileId: string | null;
  
  // Actions
  addProfile: (profile: Profile) => void;
  updateProfile: (id: string, updates: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  init: () => void;
}

const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'general',
    name: 'General',
    description: 'Includes all prompts available in the application.',
    icon: 'Layers', 
    isActive: true, 
    createdAt: 0, 
  },
  {
    id: 'assistant',
    name: 'Assistant',
    description: 'General purpose helpful assistant.',
    icon: 'Sparkles',
    isActive: false,
    createdAt: Date.now(),
  },
  {
    id: 'sales',
    name: 'Salesman',
    description: 'Focus on persuasion and negotiation.',
    icon: 'Briefcase',
    isActive: false,
    createdAt: Date.now(),
  },
  {
    id: 'research',
    name: 'Researcher',
    description: 'Focus on factual accuracy and citations.',
    icon: 'Microscope',
    isActive: false,
    createdAt: Date.now(),
  },
  {
    id: 'coder',
    name: 'Developer',
    description: 'Focus on clean code and debugging.',
    icon: 'Code',
    isActive: false,
    createdAt: Date.now(),
  }
];

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: DEFAULT_PROFILES,
      activeProfileId: 'general',

      addProfile: (profile) => set((state) => ({ 
        profiles: [...state.profiles, profile] 
      })),

      updateProfile: (id, updates) => set((state) => ({
        profiles: state.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      })),

      deleteProfile: (id) => set((state) => {
        if (id === 'general') return state; // Prevent deleting General

        return {
          profiles: state.profiles.filter((p) => p.id !== id),
          // If the deleted profile was active, revert to General
          activeProfileId: state.activeProfileId === id ? 'general' : state.activeProfileId
        };
      }),

      setActiveProfile: (id) => set((state) => ({
        activeProfileId: id,
        profiles: state.profiles.map(p => ({
            ...p,
            isActive: p.id === id
        }))
      })),

      init: () => {
        const state = get();
        // Ensure General profile always exists
        const hasGeneral = state.profiles.some(p => p.id === 'general');
        if (!hasGeneral) {
            const generalProfile = DEFAULT_PROFILES.find(p => p.id === 'general')!;
            set(s => ({
                profiles: [generalProfile, ...s.profiles],
                activeProfileId: s.activeProfileId || 'general'
            }));
        }
      },
    }),
    {
      name: 'prompter-profiles-storage', // Unique name for local storage
    }
  )
);