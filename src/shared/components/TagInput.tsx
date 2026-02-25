/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useRef, useEffect } from 'react';


interface TagInputProps {
  existingTags: string[];
  allTags: string[];
  onAddTag: (tag: string) => void;
  getTagColor: (tag: string) => string;
}

export function TagInput({ existingTags, allTags, onAddTag, getTagColor }: TagInputProps) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Update suggestions when input changes
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Inline filtering logic for consistency
    const lowerInput = value.toLowerCase();
    const newSuggestions = allTags.filter(
      (tag) => tag.toLowerCase().includes(lowerInput) && !existingTags.includes(tag)
    );

    setSuggestions(newSuggestions);
    setShowSuggestions(newSuggestions.length > 0);
    setHighlightedIndex(0);
  }, [value, existingTags, allTags]);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim(); // Case sensitivity handled by parent usually, or normalize here
    if (trimmedTag && !existingTags.includes(trimmedTag)) {
      onAddTag(trimmedTag);
    }
    setValue('');
    setShowSuggestions(false);
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Navigation inside suggestions
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Cycle down
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        // Cycle up
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
      // Support Tab and Right Arrow for "Autocomplete" selection
      if (e.key === 'Tab' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (suggestions[highlightedIndex]) {
            handleAddTag(suggestions[highlightedIndex]);
        }
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (suggestions[highlightedIndex]) {
            handleAddTag(suggestions[highlightedIndex]);
        }
        return;
      }
    }

    // Standard Enter behavior if no suggestions active or specific match
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value.trim()) {
        handleAddTag(value);
      }
    }
    
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(0);
    }
  };

  return (
    <div className="tag-input-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
      <input
        ref={inputRef}
        className="tag-input"
        placeholder="Add tag..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
        // Apply basic inline styles to ensure it looks correct even without external CSS
        style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#a1a1aa', // Zinc-400
            fontSize: '12px',
            minWidth: '80px'
        }}
      />
      
      {showSuggestions && (
        <div 
            className="tag-suggestions" 
            ref={suggestionsRef}
            style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: '#18181b', // Zinc-950
                border: '1px solid #3f3f46', // Zinc-700
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                zIndex: 100,
                minWidth: '150px',
                maxHeight: '200px',
                overflowY: 'auto'
            }}
        >
          {suggestions.map((tag, index) => (
            <div
              key={tag}
              onClick={() => handleAddTag(tag)}
              onMouseEnter={() => setHighlightedIndex(index)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                color: '#e4e4e7', // Zinc-200
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                // Apply highlight background if index matches
                backgroundColor: index === highlightedIndex ? '#3f3f46' : 'transparent'
              }}
            >
              <div
                className="tag-suggestion-dot"
                style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: getTagColor(tag) 
                }}
              />
              {tag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}