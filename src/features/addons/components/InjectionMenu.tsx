import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronRight, Lightbulb, FolderPlus, PlusCircle, Edit, Trash2, AlertTriangle, X, Save } from 'lucide-react';
import { useLanguage } from '@/shared/hooks'; 

// --- TYPES ---

export interface AddonItem {
  id?: string;
  label: string;
  value: string;
}

export interface AddonCategory {
  id?: string;
  name?: string;      
  category?: string; 
  items: AddonItem[];
  subCategories?: AddonCategory[];
}

interface InjectionMenuProps {
  categories: AddonCategory[];
  onSelect: (value: string) => void;
  onCreateCategory: (name: string) => void; 
  onCreateSubCategory: (parentCategoryName: string, subCategoryName: string) => void; 
  onCreateAddon: (categoryName: string, label: string, content: string) => void;
  onEdit?: (target: { type: 'category'|'item', id?: string, name: string }) => void;
  onDelete?: (target: { type: 'category'|'item', id?: string, name: string }) => void;
  style?: React.CSSProperties;
  direction?: 'left' | 'right' | 'bottom'; 
}

// --- HELPER HOOK FOR MENU STATE ---
function useMenuState() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const openTimerRef = useRef<NodeJS.Timeout | null>(null);

  const requestOpen = (id: string) => {
    if (id === activeId) return;
    const delay = activeId ? 100 : 0; 
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    openTimerRef.current = setTimeout(() => {
      setActiveId(id);
    }, delay);
  };

  const requestClose = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
  };

  const onEnterSubMenu = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
  };

  const forceClose = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    setActiveId(null);
  };

  return { activeId, requestOpen, requestClose, onEnterSubMenu, forceClose };
}

// --- PORTALS ---

const SubMenuPortal = ({ 
  parentRef, 
  children,
  onMouseEnter,
  onMouseLeave
}: { 
  parentRef: React.RefObject<HTMLDivElement>, 
  children: React.ReactNode,
  onMouseEnter: () => void,
  onMouseLeave: () => void
}) => {
  const [coords, setCoords] = useState<{ top: number, left: number } | null>(null);

  useEffect(() => {
    if (parentRef.current) {
      const rect = parentRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top - 6, 
        left: rect.right - 4 
      });
    }
  }, [parentRef]);

  if (!coords) return null;

  return ReactDOM.createPortal(
    <div 
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        zIndex: 200000, 
        minWidth: '230px',
        maxHeight: '90vh',
        overflowY: 'auto',
        paddingLeft: '12px', 
        paddingTop: '6px',
        paddingBottom: '6px'
      }}
    >
      {children}
    </div>,
    document.body
  );
};

const PreviewPortal = ({ 
  top, left, title, content, accentColor = '#10b981', showQuotes = true
}: { 
  top: number, left: number, title: string, content: string, accentColor?: string, showQuotes?: boolean
}) => {
  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', top: top - 4, left: left + 14, width: '260px',
      backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', 
      boxShadow: '0 20px 40px -5px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.05)', 
      zIndex: 200050, pointerEvents: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ padding: '10px 12px', backgroundColor: `${accentColor}15`, borderBottom: `1px solid ${accentColor}30`, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: accentColor }} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      </div>
      <div style={{ padding: '20px 16px 16px 20px', position: 'relative' }}>
        {showQuotes && <span style={{ position: 'absolute', top: '4px', left: '4px', fontSize: '32px', lineHeight: 1, color: '#3f3f46', fontFamily: 'Georgia, serif', opacity: 0.5 }}>“</span>}
        <div style={{ fontSize: '13px', color: '#e4e4e7', lineHeight: '1.6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontStyle: showQuotes ? 'italic' : 'normal', whiteSpace: 'pre-wrap', maxHeight: '300px', overflow: 'hidden', textOverflow: 'ellipsis', position: 'relative', zIndex: 2 }}>
          {content}
        </div>
        {showQuotes && <span style={{ position: 'absolute', bottom: '-10px', right: '8px', fontSize: '32px', lineHeight: 1, color: '#3f3f46', fontFamily: 'Georgia, serif', opacity: 0.5 }}>”</span>}
      </div>
    </div>,
    document.body
  );
};

// --- MODALS ---

const InputModal = ({ 
  title, placeholder, onClose, onConfirm, t 
}: { 
  title: string, placeholder: string, onClose: () => void, onConfirm: (val: string) => void, t: any
}) => {
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  const handleConfirm = (e?: any) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (val.trim()) { onClose(); onConfirm(val.trim()); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') handleConfirm(e);
    if (e.key === 'Escape') onClose();
  };

  return ReactDOM.createPortal(
    <div 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200100 }}
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', width: '380px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', overflow: 'hidden' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
            <FolderPlus size={18} />
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '24px 20px' }}>
          {/* TRANSLATED */}
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#71717a', marginBottom: '8px', textTransform: 'uppercase' }}>{t.components.componentName}</label>
          <input
            ref={inputRef} value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#27272a', border: '1px solid #3f3f46', color: '#e4e4e7', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ padding: '16px 20px', backgroundColor: '#27272a', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          {/* TRANSLATED */}
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>{t.common.cancel}</button>
          <button onClick={handleConfirm} disabled={!val.trim()} style={{ padding: '8px 16px', borderRadius: '6px', cursor: val.trim() ? 'pointer' : 'not-allowed', background: '#f59e0b', border: 'none', color: '#18181b', fontSize: '13px', fontWeight: 600, opacity: val.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Save size={14} /> {t.common.create}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const CreateAddonModal = ({ 
  onClose, onConfirm, t 
}: { 
  onClose: () => void, onConfirm: (label: string, content: string) => void, t: any 
}) => {
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');
  const labelRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (labelRef.current) labelRef.current.focus(); }, []);

  const handleConfirm = (e?: any) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (label.trim() && content.trim()) { onClose(); onConfirm(label.trim(), content.trim()); }
  };

  return ReactDOM.createPortal(
    <div 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200100 }}
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', width: '450px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', overflow: 'hidden' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
            <PlusCircle size={18} />
            {/* TRANSLATED */}
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t.prompts.newComponent}</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            {/* TRANSLATED */}
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#71717a', marginBottom: '8px', textTransform: 'uppercase' }}>{t.components.componentName}</label>
            <input
              ref={labelRef} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Concise"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#27272a', border: '1px solid #3f3f46', color: '#e4e4e7', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            {/* TRANSLATED */}
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#71717a', marginBottom: '8px', textTransform: 'uppercase' }}>{t.components.componentContent}</label>
            <textarea
              value={content} onChange={(e) => setContent(e.target.value)} placeholder="e.g. Keep it short and to the point."
              style={{ width: '100%', height: '80px', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#27272a', border: '1px solid #3f3f46', color: '#e4e4e7', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
            />
          </div>
        </div>
        <div style={{ padding: '16px 20px', backgroundColor: '#27272a', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          {/* TRANSLATED */}
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>{t.common.cancel}</button>
          <button onClick={handleConfirm} disabled={!label.trim() || !content.trim()} style={{ padding: '8px 16px', borderRadius: '6px', cursor: label.trim() && content.trim() ? 'pointer' : 'not-allowed', background: '#10b981', border: 'none', color: '#18181b', fontSize: '13px', fontWeight: 600, opacity: label.trim() && content.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Save size={14} /> {t.common.save}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- RECURSIVE CATEGORY ITEM ---

const CategoryItem = ({ 
  category, isOpen, onRequestOpen, onRequestClose, onEnterSubMenu, 
  onSelect, onCreateSubCategory, onCreateAddon, onContextMenu, t // Added t prop
}: { 
  category: AddonCategory, isOpen: boolean, 
  onRequestOpen: () => void, onRequestClose: () => void, onEnterSubMenu: () => void,
  onSelect: (val: string) => void,
  onCreateSubCategory: (parent: string, child: string) => void, 
  onCreateAddon: (name: string, label: string, content: string) => void,
  onContextMenu: (e: React.MouseEvent, type: 'category' | 'item', name: string, id?: string) => void,
  t: any
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const subMenuState = useMenuState();
  const [previewState, setPreviewState] = useState<{ id: string, value: string, top: number, left: number } | null>(null);
  
  const [activeModal, setActiveModal] = useState<'subcat' | 'addon' | null>(null);

  const displayName = category.name || category.category || "Untitled";
  const MENU_BORDER = '#27272a'; 
  const GREEN_ACCENT = '#10b981'; 
  const AMBER_ACCENT = '#f59e0b';
  const TEXT_NORMAL = '#a1a1aa';
  const HOVER_BG = 'rgba(16, 185, 129, 0.15)'; 
  const TEXT_HOVER = '#ffffff';

  const handleMouseLeave = () => {
    if (!activeModal) {
      onRequestClose();
    }
  };

  return (
    <div 
      ref={itemRef} onMouseEnter={onRequestOpen} onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => onContextMenu(e, 'category', displayName, category.id)}
      style={{ position: 'relative', backgroundColor: isOpen ? '#27272a' : 'transparent', borderRadius: '4px', cursor: 'pointer', marginBottom: '2px', transition: 'background-color 0.15s' }}
    >
      <div style={{ padding: '8px 12px', fontSize: '12px', color: isOpen ? '#fff' : TEXT_NORMAL, fontWeight: isOpen ? 600 : 400, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {displayName}
        <ChevronRight size={12} color={isOpen ? '#fff' : '#52525b'} />
      </div>

      {isOpen && (
        <SubMenuPortal parentRef={itemRef} onMouseEnter={onEnterSubMenu} onMouseLeave={handleMouseLeave}>
          <div style={{ backgroundColor: '#18181b', border: `1px solid ${MENU_BORDER}`, borderRadius: '8px', boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.7)', display: 'flex', flexDirection: 'column', padding: '4px' }}>
            
            {/* Actions */}
            <div 
              onClick={(e) => { e.stopPropagation(); setActiveModal('subcat'); }}
              style={{ padding: '8px 12px', fontSize: '12px', color: AMBER_ACCENT, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '4px', marginBottom: '2px' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)'; subMenuState.forceClose(); setPreviewState(null); }} 
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {/* TRANSLATED */}
              <FolderPlus size={14} /> {t.prompts.newSubCategory}
            </div>

            <div 
              onClick={(e) => { e.stopPropagation(); setActiveModal('addon'); }}
              style={{ padding: '8px 12px', fontSize: '12px', color: GREEN_ACCENT, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '4px', marginBottom: '4px', borderBottom: `1px solid ${MENU_BORDER}` }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)'; subMenuState.forceClose(); setPreviewState(null); }}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {/* TRANSLATED */}
              <PlusCircle size={14} /> {t.prompts.newComponent}
            </div>

            {/* Recursion */}
            {category.subCategories && category.subCategories.length > 0 && (
               <div style={{ marginBottom: '4px', borderBottom: category.items.length > 0 ? `1px solid ${MENU_BORDER}` : 'none' }}>
                 {category.subCategories.map((sub, idx) => (
                   <CategoryItem 
                      key={sub.id || idx} category={sub} 
                      isOpen={subMenuState.activeId === (sub.id || sub.name || String(idx))}
                      onRequestOpen={() => { subMenuState.requestOpen(sub.id || sub.name || String(idx)); setPreviewState(null); }}
                      onRequestClose={subMenuState.requestClose} onEnterSubMenu={subMenuState.onEnterSubMenu}
                      onSelect={onSelect} 
                      onCreateSubCategory={onCreateSubCategory} 
                      onCreateAddon={onCreateAddon} 
                      onContextMenu={onContextMenu}
                      t={t} 
                   />
                 ))}
               </div>
            )}

            {/* Items */}
            {category.items.length === 0 && (!category.subCategories || category.subCategories.length === 0) ? (
              <div style={{ padding: '12px', color: '#52525b', fontSize: '12px', fontStyle: 'italic', textAlign: 'center' }}>Empty folder</div>
            ) : (
              category.items.map((item, idx) => {
                const uniqueItemId = item.id || item.label || String(idx);
                const isHovered = previewState?.id === uniqueItemId;
                return (
                  <div key={uniqueItemId} style={{ position: 'relative', width: '100%' }} onContextMenu={(e) => onContextMenu(e, 'item', item.label, item.id)}>
                    <button
                      onClick={() => onSelect(item.value)}
                      onMouseEnter={(e) => {
                        subMenuState.forceClose(); 
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPreviewState({ id: uniqueItemId, value: item.value, top: rect.top, left: rect.right });
                      }}
                      onMouseLeave={() => setPreviewState(null)}
                      style={{ textAlign: 'left', padding: '8px 12px', background: isHovered ? HOVER_BG : 'transparent', border: 'none', borderLeft: isHovered ? `3px solid ${GREEN_ACCENT}` : '3px solid transparent', color: isHovered ? TEXT_HOVER : TEXT_NORMAL, fontSize: '12px', cursor: 'pointer', whiteSpace: 'normal', lineHeight: '1.4', borderRadius: '0 4px 4px 0', transition: 'all 0.1s ease-out', width: '100%', fontWeight: 400, paddingLeft: isHovered ? '13px' : '12px' }}
                    >
                      {item.label}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </SubMenuPortal>
      )}

      {/* INTERNAL MODALS - Using local state now */}
      {activeModal === 'subcat' && (
        <InputModal 
          title={t.prompts.newSubCategory} placeholder="e.g. Emails"
          onClose={() => setActiveModal(null)}
          onConfirm={(name) => onCreateSubCategory(displayName, name)}
          t={t}
        />
      )}
      {activeModal === 'addon' && (
        <CreateAddonModal 
          onClose={() => setActiveModal(null)}
          onConfirm={(label, content) => onCreateAddon(displayName, label, content)}
          t={t}
        />
      )}

      {previewState && <PreviewPortal top={previewState.top} left={previewState.left} title="Component Content" content={previewState.value} accentColor="#10b981" showQuotes={true} />}
    </div>
  );
};

// --- MAIN MENU ---

export function InjectionMenu({ 
  categories, onSelect, onCreateCategory, onCreateSubCategory, onCreateAddon, onEdit, onDelete, style, 
}: InjectionMenuProps) {
  const { t } = useLanguage(); 
  const rootMenuState = useMenuState();
  const [isCustomHovered, setIsCustomHovered] = useState(false);
  const [isNewCatHovered, setIsNewCatHovered] = useState(false);
  const [customPreviewState, setCustomPreviewState] = useState<{ top: number, left: number } | null>(null);
  
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; type: 'category'|'item'; name: string; id?: string; } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category'|'item'; name: string; id?: string; } | null>(null);

  const MENU_BORDER = '#27272a'; 
  const CUSTOM_HOVER_BG = 'rgba(59, 130, 246, 0.15)';
  const NEW_CAT_HOVER_BG = 'rgba(245, 158, 11, 0.15)'; 

  const handleContextMenu = (e: React.MouseEvent, type: 'category' | 'item', name: string, id?: string) => {
    e.preventDefault(); e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type, name, id });
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <style>{` .deck-mode-injection-menu ::-webkit-scrollbar { width: 4px; } .deck-mode-injection-menu ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 2px; } `}</style>

      <div 
        className="deck-mode-injection-menu" onClick={(e) => e.stopPropagation()}
        style={{ position: 'absolute', top: '0', marginTop: '8px', backgroundColor: '#18181b', border: `1px solid ${MENU_BORDER}`, borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)', zIndex: 1000, minWidth: '150px', display: 'flex', flexDirection: 'column', padding: '4px', ...style }}
      >
        {/* TRANSLATED TITLE */}
        <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${MENU_BORDER}`, marginBottom: '4px' }}>{t.prompts.componentsMenu}</div>

        <div 
          onClick={() => onSelect('__BESPOKE__')}
          style={{ padding: '8px 12px', fontSize: '12px', color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '4px', marginBottom: '2px', backgroundColor: isCustomHovered ? CUSTOM_HOVER_BG : 'transparent', transition: 'background-color 0.15s' }}
          onMouseEnter={(e) => { setIsNewCatHovered(false); setIsCustomHovered(true); rootMenuState.forceClose(); const rect = e.currentTarget.getBoundingClientRect(); setCustomPreviewState({ top: rect.top, left: rect.right }); }}
          onMouseLeave={() => { setIsCustomHovered(false); setCustomPreviewState(null); }}
        >
          {/* TRANSLATED */}
          <Lightbulb size={14} /> {t.prompts.customComponent}
        </div>

        <div style={{ position: 'relative', marginBottom: '4px', borderBottom: `1px solid ${MENU_BORDER}`, paddingBottom: '4px' }}>
          <div 
            onClick={() => setShowCreateCategory(true)} 
            style={{ padding: '8px 12px', fontSize: '12px', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '4px', backgroundColor: isNewCatHovered ? NEW_CAT_HOVER_BG : 'transparent', transition: 'background-color 0.15s' }}
            onMouseEnter={() => { setIsCustomHovered(false); setIsNewCatHovered(true); rootMenuState.forceClose(); setCustomPreviewState(null); }}
            onMouseLeave={() => setIsNewCatHovered(false)}
          >
            {/* TRANSLATED */}
            <FolderPlus size={14} /> {t.prompts.newCategory}
          </div>
        </div>
        
        <div className="injection-menu-scroll" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {categories.map((cat, idx) => (
            <CategoryItem 
              key={cat.id || idx} category={cat} 
              isOpen={rootMenuState.activeId === (cat.id || cat.name || String(idx))}
              onRequestOpen={() => { rootMenuState.requestOpen(cat.id || cat.name || String(idx)); setCustomPreviewState(null); }}
              onRequestClose={rootMenuState.requestClose} onEnterSubMenu={rootMenuState.onEnterSubMenu}
              onSelect={onSelect} 
              onCreateSubCategory={onCreateSubCategory}
              onCreateAddon={onCreateAddon}
              onContextMenu={handleContextMenu}
              t={t} // Pass translation
            />
          ))}
        </div>
      </div>

      {customPreviewState && <PreviewPortal top={customPreviewState.top} left={customPreviewState.left} title={t.prompts.customComponent} content={t.prompts.customComponentTooltip} accentColor="#3b82f6" showQuotes={false} />}

      {showCreateCategory && <InputModal title={t.prompts.newCategory} placeholder="e.g. Marketing" onClose={() => setShowCreateCategory(false)} onConfirm={onCreateCategory} t={t} />}

      {contextMenu && ReactDOM.createPortal(
        <div className="deck-context-menu" style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 200005, minWidth: '130px', padding: '4px', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { if(onEdit) onEdit({ type: contextMenu.type, id: contextMenu.id, name: contextMenu.name }); setContextMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', color: '#e4e4e7', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: '4px', fontSize: '13px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3f3f46'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Edit size={13} /> {t.common.edit}</button>
          <button onClick={() => { setDeleteTarget({ type: contextMenu.type, name: contextMenu.name, id: contextMenu.id }); setContextMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: '4px', fontSize: '13px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Trash2 size={13} /> {t.common.delete}</button>
        </div>, document.body
      )}
      
      {/* DELETE CONFIRMATION - TRANSLATED */}
      {deleteTarget && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200010 }} onClick={() => setDeleteTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', width: '350px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b', marginBottom: '12px' }}>
                <AlertTriangle size={24} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{t.variables.deleteTitle}</h3>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px' }}>
                {t.variables.deleteConfirm.replace('{{variable}}', deleteTarget.name).replace('variable', deleteTarget.type === 'category' ? 'category' : 'component')}
                <br/><br/>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>{t.common.warning}</span>: {t.trash.footer}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={() => setDeleteTarget(null)} style={{ background: 'transparent', border: '1px solid #52525b', color: '#e4e4e7', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>{t.common.cancel}</button>
                <button onClick={() => { if(onDelete) onDelete(deleteTarget); setDeleteTarget(null); }} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>{t.variables.moveToTrash}</button>
            </div>
          </div>
        </div>, document.body
      )}
    </>
  );
}