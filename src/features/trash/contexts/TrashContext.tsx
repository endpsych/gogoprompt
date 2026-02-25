import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// --- Types ---

export type TrashItemType = 'prompt' | 'profile' | 'addon' | 'category' | 'template' | 'folder' | 'component' | 'glossary' | 'other';

export interface TrashItem {
  id: string;             
  originalId: string;     
  type: TrashItemType;
  label: string;          
  data: any;              
  deletedAt: number;      
  expiresAt: number;      
  origin?: string;        
}

interface TrashContextType {
  trashItems: TrashItem[];
  moveToTrash: (item: Omit<TrashItem, 'id' | 'deletedAt' | 'expiresAt'>) => void;
  restoreItem: (id: string) => TrashItem | null;
  permanentlyDelete: (id: string) => void;
  emptyTrash: () => void;
  getDaysRemaining: (expiresAt: number) => number;
  reloadTrash: () => void;
}

const TRASH_STORAGE_KEY = 'app_global_trash_v1';
const RETENTION_DAYS = 90;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const TrashContext = createContext<TrashContextType | undefined>(undefined);

export const TrashProvider = ({ children }: { children: ReactNode }) => {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);

  const loadFromStorage = useCallback(() => {
    const saved = localStorage.getItem(TRASH_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: TrashItem[] = JSON.parse(saved);
        const now = Date.now();
        const validItems = parsed.filter(item => item.expiresAt > now);
        setTrashItems(validItems);
      } catch (e) {
        console.error("Failed to parse trash storage", e);
      }
    }
  }, []);

  useEffect(() => {
    loadFromStorage();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TRASH_STORAGE_KEY) {
        loadFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadFromStorage]);

  const saveToStorage = (items: TrashItem[]) => {
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(items));
    setTrashItems(items);
  };

  const moveToTrash = (item: Omit<TrashItem, 'id' | 'deletedAt' | 'expiresAt'>) => {
    const now = Date.now();
    const newItem: TrashItem = {
      ...item,
      id: `trash_${now}_${Math.random().toString(36).substr(2, 9)}`,
      deletedAt: now,
      expiresAt: now + (RETENTION_DAYS * MS_PER_DAY)
    };
    
    setTrashItems(prev => {
      const newItems = [newItem, ...prev];
      localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(newItems));
      return newItems;
    });
  };

  const restoreItem = (id: string) => {
    const itemToRestore = trashItems.find(i => i.id === id);
    if (!itemToRestore) return null;

    const newItems = trashItems.filter(i => i.id !== id);
    saveToStorage(newItems);
    return itemToRestore;
  };

  const permanentlyDelete = (id: string) => {
    const newItems = trashItems.filter(i => i.id !== id);
    saveToStorage(newItems);
  };

  const emptyTrash = () => {
    saveToStorage([]);
  };

  const getDaysRemaining = (expiresAt: number) => {
    const diff = expiresAt - Date.now();
    return Math.max(0, Math.ceil(diff / MS_PER_DAY));
  };

  return (
    <TrashContext.Provider value={{ 
      trashItems, 
      moveToTrash, 
      restoreItem, 
      permanentlyDelete, 
      emptyTrash,
      getDaysRemaining,
      reloadTrash: loadFromStorage
    }}>
      {children}
    </TrashContext.Provider>
  );
};

export const useTrash = () => {
  const context = useContext(TrashContext);
  if (!context) {
    throw new Error('useTrash must be used within a TrashProvider');
  }
  return context;
};