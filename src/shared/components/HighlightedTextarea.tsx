/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { PromptComponent } from '@/types';
import {
  HighlightSettings,
  highlightContent,
  buildStyleFromHighlight,
} from '@/shared/utils/highlighting';

interface HighlightedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  components: PromptComponent[];
  highlightSettings: HighlightSettings;
  getTypeColor: (typeId: string) => string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

export function HighlightedTextarea({
  value,
  onChange,
  placeholder,
  components,
  highlightSettings,
  getTypeColor,
  textareaRef: externalRef,
}: HighlightedTextareaProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || internalRef;
  const backdropRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and backdrop
  const handleScroll = useCallback(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, [textareaRef]);

  // Add scroll listener
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('scroll', handleScroll);
      return () => textarea.removeEventListener('scroll', handleScroll);
    }
  }, [textareaRef, handleScroll]);

  // Get highlighted segments
  const segments = highlightContent(value, components, highlightSettings);

  // Render highlighted content
  const renderHighlightedContent = () => {
    return segments.map((segment, index) => {
      if (segment.type === 'normal') {
        return <span key={index}>{segment.text}</span>;
      }

      if (segment.type === 'variable') {
        const cssStyle = buildStyleFromHighlight(
          highlightSettings.variableStyle,
          highlightSettings.variableColor
        );
        return (
          <span key={index} style={cssStyle} className="highlight-variable">
            {segment.text}
          </span>
        );
      }

      // Component - use the component type's color
      const color = getTypeColor(segment.componentType || 'other');
      const cssStyle = buildStyleFromHighlight(highlightSettings.componentStyle, color);

      return (
        <span key={index} style={cssStyle} className="highlight-component">
          {segment.text}
        </span>
      );
    });
  };

  return (
    <div className="highlighted-textarea-container">
      {/* Backdrop with highlighted text */}
      <div ref={backdropRef} className="highlighted-textarea-backdrop">
        <div className="highlighted-textarea-content">
          {renderHighlightedContent()}
          {/* Add extra space to match textarea padding */}
          <br />
        </div>
      </div>

      {/* Actual textarea (transparent text, visible caret) */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="highlighted-textarea-input"
        spellCheck={false}
      />
    </div>
  );
}

// Read-only highlighted text view (for view mode)
interface HighlightedTextViewProps {
  content: string;
  components: PromptComponent[];
  highlightSettings: HighlightSettings;
  getTypeColor: (typeId: string) => string;
}

export function HighlightedTextView({
  content,
  components,
  highlightSettings,
  getTypeColor,
}: HighlightedTextViewProps) {
  const segments = highlightContent(content, components, highlightSettings);

  return (
    <div className="highlighted-text-view">
      {segments.map((segment, index) => {
        if (segment.type === 'normal') {
          return <span key={index}>{segment.text}</span>;
        }

        if (segment.type === 'variable') {
          const cssStyle = buildStyleFromHighlight(
            highlightSettings.variableStyle,
            highlightSettings.variableColor
          );
          return (
            <span key={index} style={cssStyle} className="highlight-variable">
              {segment.text}
            </span>
          );
        }

        // Component
        const color = getTypeColor(segment.componentType || 'other');
        const cssStyle = buildStyleFromHighlight(highlightSettings.componentStyle, color);

        return (
          <span key={index} style={cssStyle} className="highlight-component">
            {segment.text}
          </span>
        );
      })}
    </div>
  );
}
