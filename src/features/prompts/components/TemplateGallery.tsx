/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  FileText,
  ChevronRight,
  Check
} from 'lucide-react';
import { 
  TEMPLATE_CATEGORIES, 
  PromptTemplate, 
  TemplateCategory,
  searchTemplates,
  getTemplatesByCategory,
  getTemplatesByLanguage,
  getTemplateCounts
} from '@/shared/utils/templates';
import { useLanguage } from '@/shared/hooks';

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTemplate: (title: string, content: string, tags: string[]) => void;
}

export function TemplateGallery({ isOpen, onClose, onAddTemplate }: TemplateGalleryProps) {
  const { language, t } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [addedTemplates, setAddedTemplates] = useState<Set<string>>(new Set());

  // Get templates for current language
  const languageTemplates = useMemo(() => getTemplatesByLanguage(language), [language]);
  const templateCounts = useMemo(() => getTemplateCounts(language), [language]);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    if (search) {
      return searchTemplates(search, language);
    } else if (selectedCategory) {
      return getTemplatesByCategory(selectedCategory, language);
    }
    return languageTemplates;
  }, [search, selectedCategory, language, languageTemplates]);

  // Group templates by category for display
  const groupedTemplates = useMemo(() => {
    if (search || selectedCategory) {
      return { [selectedCategory || 'search']: filteredTemplates };
    }
    
    const groups: Record<string, PromptTemplate[]> = {};
    TEMPLATE_CATEGORIES.forEach(cat => {
      const templates = getTemplatesByCategory(cat.id, language);
      if (templates.length > 0) {
        groups[cat.id] = templates;
      }
    });
    return groups;
  }, [filteredTemplates, search, selectedCategory, language]);

  // Get category label based on language
  const getCategoryLabel = (categoryId: TemplateCategory): string => {
    return t.templateGallery.categories[categoryId];
  };

  const handleAddTemplate = (template: PromptTemplate) => {
    onAddTemplate(template.title, template.content, template.tags);
    setAddedTemplates(prev => new Set(prev).add(template.id));
  };

  const handleCategoryClick = (categoryId: TemplateCategory) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    setSearch('');
    setSelectedTemplate(null);
  };

  const handleBackToList = () => {
    setSelectedTemplate(null);
  };

  if (!isOpen) return null;

  return (
    <div className="template-gallery-overlay" onClick={onClose}>
      <div className="template-gallery" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="template-gallery-header">
          <h2>
            <FileText size={20} />
            {t.templateGallery.title}
          </h2>
          <button className="template-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="template-search">
          <Search size={16} />
          <input
            type="text"
            placeholder={t.templateGallery.searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedCategory(null);
              setSelectedTemplate(null);
            }}
          />
          {search && (
            <button className="template-search-clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="template-gallery-body">
          {/* Category Sidebar */}
          <div className="template-categories">
            <button
              className={`template-category-btn ${!selectedCategory && !search ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(null);
                setSearch('');
                setSelectedTemplate(null);
              }}
            >
              <span className="category-icon">📋</span>
              <span>{t.templateGallery.allTemplates}</span>
              <span className="category-count">{languageTemplates.length}</span>
            </button>
            
            {TEMPLATE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`template-category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.id)}
              >
                <span className="category-icon">{cat.icon}</span>
                <span>{getCategoryLabel(cat.id)}</span>
                <span className="category-count">
                  {templateCounts[cat.id]}
                </span>
              </button>
            ))}
          </div>

          {/* Template List / Detail */}
          <div className="template-content">
            {selectedTemplate ? (
              // Template Detail View
              <div className="template-detail">
                <button className="template-back-btn" onClick={handleBackToList}>
                  <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                  {t.common.back}
                </button>
                
                <div className="template-detail-header">
                  <h3>{selectedTemplate.title}</h3>
                  <p className="template-detail-desc">{selectedTemplate.description}</p>
                  <div className="template-detail-tags">
                    {selectedTemplate.tags.map(tag => (
                      <span key={tag} className="template-tag">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="template-detail-content">
                  <h4>{t.templateGallery.templateContent}</h4>
                  <pre>{selectedTemplate.content}</pre>
                </div>

                <div className="template-detail-actions">
                  {addedTemplates.has(selectedTemplate.id) ? (
                    <button className="template-added-btn" disabled>
                      <Check size={16} />
                      {t.templateGallery.addedToLibrary}
                    </button>
                  ) : (
                    <button 
                      className="template-add-btn"
                      onClick={() => handleAddTemplate(selectedTemplate)}
                    >
                      <Plus size={16} />
                      {t.templateGallery.addToPrompts}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              // Template List View
              <div className="template-list">
                {search && filteredTemplates.length === 0 ? (
                  <div className="template-empty">
                    <p>{t.templateGallery.noResults.replace('{query}', search)}</p>
                  </div>
                ) : (
                  Object.entries(groupedTemplates).map(([category, templates]) => (
                    <div key={category} className="template-group">
                      {!search && !selectedCategory && (
                        <h3 className="template-group-title">
                          {TEMPLATE_CATEGORIES.find(c => c.id === category)?.icon}{' '}
                          {getCategoryLabel(category as TemplateCategory)}
                        </h3>
                      )}
                      <div className="template-grid">
                        {templates.map(template => (
                          <div 
                            key={template.id} 
                            className={`template-card ${addedTemplates.has(template.id) ? 'added' : ''}`}
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <div className="template-card-header">
                              <h4>{template.title}</h4>
                              {addedTemplates.has(template.id) && (
                                <span className="template-card-added">
                                  <Check size={12} />
                                </span>
                              )}
                            </div>
                            <p className="template-card-desc">{template.description}</p>
                            <div className="template-card-tags">
                              {template.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="template-tag-sm">{tag}</span>
                              ))}
                              {template.tags.length > 3 && (
                                <span className="template-tag-more">+{template.tags.length - 3}</span>
                              )}
                            </div>
                            <button 
                              className="template-card-add"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddTemplate(template);
                              }}
                              disabled={addedTemplates.has(template.id)}
                            >
                              {addedTemplates.has(template.id) ? (
                                <Check size={14} />
                              ) : (
                                <Plus size={14} />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="template-gallery-footer">
          <span className="template-hint">
            💡 {t.templateGallery.variablesHint}
          </span>
        </div>
      </div>
    </div>
  );
}
