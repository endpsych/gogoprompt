// src/hooks/useAppPrompts.ts

import { useMemo } from 'react';
import { usePromptStore } from '@/stores';
import { useProfileStore } from '@/stores/profileStore';
import { Prompt, PromptSortOrder, FilterMode } from '@/types';

interface UseAppPromptsResult {
    allTags: string[];
    sidebarFilteredPrompts: Prompt[];
    sortedPrompts: Prompt[];
    categories: any[];
}

export function useAppPrompts(
    search: string,
    activeTagFilters: string[],
    filterMode: FilterMode,
    promptSortOrder: PromptSortOrder
): UseAppPromptsResult {
    // 1. Access Stores
    const allPrompts = usePromptStore((state) => state.prompts);
    const activeProfileId = useProfileStore((state) => state.activeProfileId);

    // 2. FILTER BY PROFILE (The "Master" Filter)
    const profileFilteredPrompts = useMemo(() => {
        // "General" (or null) shows EVERYTHING
        if (!activeProfileId || activeProfileId === 'general') {
            return allPrompts;
        }
        // Specific Profile: Only show prompts linked to this profile
        return allPrompts.filter((p) => p.profileIds?.includes(activeProfileId));
    }, [allPrompts, activeProfileId]);

    // 3. GET ALL TAGS (Scoped to the current profile view)
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        profileFilteredPrompts.forEach((p) => p.tags.forEach((t) => tags.add(t)));
        return Array.from(tags).sort();
    }, [profileFilteredPrompts]);

    // 4. FILTER BY SEARCH & TAGS (For Sidebar List)
    const sidebarFilteredPrompts = useMemo(() => {
        let results = profileFilteredPrompts;

        // Tag Filter
        if (activeTagFilters.length > 0) {
            results = results.filter((p) => {
                if (filterMode === 'AND') return activeTagFilters.every((tag) => p.tags.includes(tag));
                return activeTagFilters.some((tag) => p.tags.includes(tag));
            });
        }

        // Search Filter
        if (search.trim()) {
            const q = search.toLowerCase();
            results = results.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.content.toLowerCase().includes(q) ||
                    p.tags.some((t) => t.toLowerCase().includes(q))
            );
        }

        return sortPromptsList(results, promptSortOrder);
    }, [profileFilteredPrompts, search, activeTagFilters, filterMode, promptSortOrder]);

    // 5. DECK MODE LIST (Profile Filtered + Sorted, but NOT Search filtered)
    // Deck Mode usually maintains its own search state, so we pass the full profile list
    const sortedPrompts = useMemo(() => {
        return sortPromptsList(profileFilteredPrompts, promptSortOrder);
    }, [profileFilteredPrompts, promptSortOrder]);

    const categories: any[] = []; // Placeholder

    return {
        allTags,
        sidebarFilteredPrompts,
        sortedPrompts,
        categories
    };
}

// --- HELPER: Sort Logic ---
function sortPromptsList(prompts: Prompt[], sortOrder: PromptSortOrder): Prompt[] {
    return [...prompts].sort((a, b) => {
        switch (sortOrder) {
            case 'alphabetical':
                return a.title.localeCompare(b.title);
            case 'alphabetical-desc':
                return b.title.localeCompare(a.title);
            case 'created-newest':
                return (b.createdAt || 0) - (a.createdAt || 0);
            case 'created-oldest':
                return (a.createdAt || 0) - (b.createdAt || 0);
            case 'last-used-newest':
                return (b.lastUsed || 0) - (a.lastUsed || 0);
            case 'last-used-oldest':
                return (a.lastUsed || 0) - (b.lastUsed || 0);
            case 'most-used':
                return (b.useCount || 0) - (a.useCount || 0);
            case 'least-used':
                return (a.useCount || 0) - (b.useCount || 0);
            case 'word-count-desc':
                return (b.content.split(/\s+/).length) - (a.content.split(/\s+/).length);
            case 'word-count-asc':
                return (a.content.split(/\s+/).length) - (b.content.split(/\s+/).length);
            case 'variable-count-desc':
                return ((b.content.match(/\{\{([^}]+)\}\}/g) || []).length) - ((a.content.match(/\{\{([^}]+)\}\}/g) || []).length);
            case 'variable-count-asc':
                return ((a.content.match(/\{\{([^}]+)\}\}/g) || []).length) - ((b.content.match(/\{\{([^}]+)\}\}/g) || []).length);
            case 'custom':
                return (a.customOrder || 0) - (b.customOrder || 0);
            default: 
                return (b.createdAt || 0) - (a.createdAt || 0);
        }
    });
}