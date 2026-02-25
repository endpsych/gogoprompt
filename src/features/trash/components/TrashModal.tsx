/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useEffect } from 'react';
import { 
  X, RotateCcw, Trash2, AlertTriangle, Clock, 
  Folder, FileText, MapPin, Calendar, Layers, 
  Plus, Search, Tag, AlignLeft, Sparkles, CheckCircle2
} from 'lucide-react';
import { useTrash, TrashItem } from '@/features/trash/contexts/TrashContext';
import { useLanguage } from '@/shared/hooks'; 

interface TrashModalProps {
  onClose: () => void;
  onRestore: (item: any) => void;
}

const InspectModal = ({ item, onClose }: { item: TrashItem, onClose: () => void }) => {
  const { t, language } = useLanguage();
  const MODAL_BG = '#18181b';
  const BORDER = '#3f3f46';

  const renderCategoryContents = (category: any) => {
    const contents: JSX.Element[] = [];
    const traverse = (cat: any, depth: number) => {
       if (cat.items) {
         cat.items.forEach((addon: any) => {
            contents.push(
              <div key={`addon-${addon.label}-${Math.random()}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: `${depth * 12}px`, fontSize: '12px', color: '#a1a1aa', padding: '2px 0' }}>
                <Plus size={10} color="#10b981" />
                <span>{addon.label}</span>
              </div>
            );
         });
       }
       if (cat.subCategories) {
         cat.subCategories.forEach((sub: any) => {
            contents.push(
              <div key={`sub-${sub.category || sub.name}-${Math.random()}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: `${depth * 12}px`, fontSize: '12px', color: '#e4e4e7', fontWeight: 600, marginTop: '4px' }}>
                <Folder size={10} color="#f59e0b" />
                <span>{sub.category || sub.name}</span>
              </div>
            );
            traverse(sub, depth + 1);
         });
       }
    };
    traverse(item.data, 0);
    return contents.length > 0 ? contents : <div style={{ color: '#52525b', fontStyle: 'italic', fontSize: '12px' }}>{t.common.none}</div>;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 110000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '500px', maxHeight: '80vh', backgroundColor: MODAL_BG,
          border: `1px solid ${BORDER}`, borderRadius: '12px',
          display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden'
        }}
      >
        <div style={{ padding: '16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#27272a' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#e4e4e7' }}>
              <Search size={16} /> {t.trash.inspect}
           </div>
           <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}><X size={16} /></button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto' }}>
           <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{item.label}</div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#a1a1aa' }}>
                 <span style={{ background: '#3f3f46', padding: '2px 6px', borderRadius: '4px', color: '#fff', fontSize: '10px', fontWeight: 700 }}>
                    {(t.tabs[item.type as keyof typeof t.tabs] || item.type).toUpperCase()}
                 </span>
                 <span>{t.trash.moved.split(':')[0]}: {new Date(item.deletedAt).toLocaleString(language)}</span>
              </div>
           </div>

           {item.type === 'template' && (
             <div style={{ background: '#09090b', padding: '12px', borderRadius: '6px', border: `1px solid ${BORDER}`, color: '#d4d4d8', fontSize: '13px', whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: '300px', overflowY: 'auto' }}>
                {item.data.content}
             </div>
           )}

           {item.type === 'addon' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {item.data.path && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a1a1aa', fontSize: '12px', padding: '8px', background: '#27272a', borderRadius: '6px' }}>
                      <MapPin size={14} />
                      <span style={{ fontWeight: 600, color: '#e4e4e7' }}>{t.glossary.category}:</span>
                      <span>{item.data.path.join(' > ')}</span>
                  </div>
                )}
                <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: '#71717a' }}>
                      <AlignLeft size={14} /> {t.prompts.promptPreview}
                   </div>
                   <div style={{ background: '#09090b', padding: '12px', borderRadius: '6px', border: `1px solid ${BORDER}`, color: '#d4d4d8', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                      {item.data.value}
                   </div>
                </div>
             </div>
           )}

           {(item.type === 'category' || item.type === 'folder') && (
             <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontSize: '12px', fontWeight: 600, color: '#71717a' }}>
                   <Layers size={14} /> {t.prompts.promptStructure}
                </div>
                <div style={{ background: '#27272a', padding: '12px', borderRadius: '8px', border: `1px solid ${BORDER}` }}>
                   {renderCategoryContents(item)}
                </div>
             </div>
           )}
        </div>
        
        <div style={{ padding: '12px 16px', background: '#27272a', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'flex-end' }}>
           <button onClick={onClose} style={{ background: '#3f3f46', border: 'none', color: '#fff', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{t.common.close}</button>
        </div>
      </div>
    </div>
  );
};

const ConfirmationDialog = ({ 
    type, item, onClose, onConfirm 
}: { 
    type: 'restore' | 'delete' | 'empty_trash', item?: TrashItem, onClose: () => void, onConfirm: () => void 
}) => {
    const { t, interpolate } = useLanguage();
    
    let title = '';
    let message: React.ReactNode = '';
    let confirmLabel = '';
    let mainColor = '#10b981';
    let icon = <RotateCcw size={24} />;

    if (type === 'empty_trash') {
        title = t.trash.emptyTrash; 
        message = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', 
                    color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', 
                    padding: '4px 8px', borderRadius: '4px', 
                    fontSize: '12px', fontWeight: 700, width: 'fit-content' 
                }}>
                    <AlertTriangle size={14} strokeWidth={2.5} />
                    {t.common.warning}
                </div>
                <div style={{ lineHeight: '1.5' }}>
                    {t.trash.emptyTrashConfirm}
                </div>
            </div>
        );
        confirmLabel = t.trash.emptyTrash;
        mainColor = '#ef4444';
        icon = <Trash2 size={24} />;
    } else if (type === 'delete') {
        title = t.trash.deletePermanentlyTitle; 
        message = (
            <>
                {interpolate(t.trash.deletePermanentlyConfirm, { name: item?.label || '' })}
                <br/><br/>
                <span style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{t.common.warning}</span>
                <span style={{ marginLeft: '8px' }}>{t.trash.cannotUndo}</span>
            </>
        );
        confirmLabel = t.trash.deleteForever;
        mainColor = '#ef4444';
        icon = <AlertTriangle size={24} />;
    } else {
        title = t.trash.restore + '?';
        message = interpolate(t.prompts.restoreVersionConfirm || "Restore {name}?", { name: item?.label || '' });
        confirmLabel = t.trash.restore;
        mainColor = '#10b981';
        icon = <RotateCcw size={24} />;
    }
    
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 120000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ 
                width: '400px', backgroundColor: '#18181b', border: '1px solid #3f3f46', 
                borderRadius: '12px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
                display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: mainColor }}>
                    {icon}
                    <span style={{ fontSize: '18px', fontWeight: 700 }}>{title}</span>
                </div>
                
                <div style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.5' }}>
                    {message}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '1px solid #52525b', color: '#e4e4e7', cursor: 'pointer', fontWeight: 600 }}>{t.common.cancel}</button>
                    <button onClick={onConfirm} style={{ padding: '8px 16px', borderRadius: '6px', background: mainColor, border: 'none', color: type === 'restore' ? '#000' : '#fff', cursor: 'pointer', fontWeight: 700 }}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const TrashModal = ({ onClose, onRestore }: TrashModalProps) => {
  const { t, language, interpolate } = useLanguage(); 
  const { trashItems, restoreItem, permanentlyDelete, emptyTrash, getDaysRemaining } = useTrash();
  const [inspectItem, setInspectItem] = useState<TrashItem | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'restore' | 'delete' | 'empty_trash', item?: TrashItem } | null>(null);

  // INTERNAL NOTIFICATION STATE
  const [localToast, setLocalToast] = useState<{ message: string, variant: 'success' | 'danger' } | null>(null);

  // AUTO-HIDE LOCAL TOAST
  useEffect(() => {
    if (localToast) {
      const timer = setTimeout(() => setLocalToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [localToast]);

  const executeAction = () => {
      if (!confirmAction) return;
      const { type, item: actionItem } = confirmAction;

      // Capture action data locally and close window immediately
      setConfirmAction(null);

      if (type === 'restore' && actionItem) {
          const restored = restoreItem(actionItem.id);
          if (restored) {
              onRestore(restored);
              const typeName = t.tabs[actionItem.type as keyof typeof t.tabs] || actionItem.type;
              const msg = (t.trash.restored || "Restored {type} \"{name}\"")
                .replace('{type}', typeName)
                .replace('{name}', actionItem.label);
              setLocalToast({ message: msg, variant: 'success' });
          }
      } else if (type === 'delete' && actionItem) {
          permanentlyDelete(actionItem.id);
          const typeName = t.tabs[actionItem.type as keyof typeof t.tabs] || actionItem.type;
          const msg = `${typeName} 「${actionItem.label}」 を完全に削除しました`;
          setLocalToast({ message: msg, variant: 'danger' });
      } else if (type === 'empty_trash') {
          emptyTrash();
          setLocalToast({ message: t.trash.emptyTrash, variant: 'danger' });
      }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(language, { 
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' 
    });
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'addon': return <Plus size={16} color="#10b981" />; 
      case 'template': return <FileText size={16} color="#a855f7" />;
      case 'category': 
      case 'folder': return <Folder size={16} color="#f59e0b" />;
      case 'variable': 
        return (
          <div style={{ display: 'flex', alignItems: 'center', color: '#ed5e17' }}>
             <span style={{ fontWeight: 800, fontSize: '14px', lineHeight: 1 }}>{'{'}</span>
             <Sparkles size={14} style={{ margin: '0 -1px' }} />
             <span style={{ fontWeight: 800, fontSize: '14px', lineHeight: 1 }}>{'}'}</span>
          </div>
        );
      default: return <FileText size={16} color="#71717a" />;
    }
  };

  const MODAL_BG = '#18181b';
  const BORDER = '#3f3f46';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '700px', height: '600px', backgroundColor: MODAL_BG,
          border: `1px solid ${BORDER}`, borderRadius: '12px',
          display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e4e4e7', fontWeight: 700 }}>
            <Trash2 size={18} /> {t.trash.title}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {trashItems.length > 0 && (
              <button 
                onClick={() => setConfirmAction({ type: 'empty_trash' })} 
                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                {t.trash.emptyTrash}
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}><X size={18} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          {trashItems.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#52525b', gap: '12px' }}>
              <Trash2 size={40} opacity={0.2} />
              <span>{t.trash.emptyState}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {trashItems.map(item => (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'start',
                  padding: '12px', backgroundColor: '#27272a', borderRadius: '8px', border: `1px solid ${BORDER}`
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getItemIcon(item.type)}
                      <span style={{ color: '#e4e4e7', fontWeight: 600, fontSize: '14px' }}>{item.label}</span>
                      <span style={{ fontSize: '9px', backgroundColor: '#3f3f46', padding: '2px 4px', borderRadius: '3px', color: '#a1a1aa', fontWeight: 700 }}>
                        {(t.tabs[item.type as keyof typeof t.tabs] || item.type).toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#71717a', fontSize: '11px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={11} /> 
                        <span>{interpolate(t.trash.moved, { date: formatDate(item.deletedAt) })}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> 
                        <span>{interpolate(t.trash.daysLeft, { count: getDaysRemaining(item.expiresAt) })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                    <button 
                      onClick={() => setInspectItem(item)}
                      title={t.trash.inspect}
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #3b82f6', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', cursor: 'pointer' }}
                    >
                      <Search size={16} />
                    </button>
                    <button 
                      onClick={() => setConfirmAction({ type: 'restore', item })}
                      title={t.trash.restore}
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #10b981', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', cursor: 'pointer' }}
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button 
                      onClick={() => setConfirmAction({ type: 'delete', item })}
                      title={t.trash.deletePermanently}
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* INTERNAL NOTIFICATION UI */}
          {localToast && (
            <div style={{
              marginTop: 'auto', marginBottom: '10px', alignSelf: 'center',
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: localToast.variant === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: localToast.variant === 'success' ? '#10b981' : '#ef4444',
              padding: '10px 20px', borderRadius: '8px', border: `1px solid ${localToast.variant === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              fontSize: '13px', fontWeight: 600, animation: 'fadeInUp 0.3s ease-out'
            }}>
              {localToast.variant === 'success' ? <CheckCircle2 size={16} /> : <Trash2 size={16} />}
              {localToast.message}
            </div>
          )}
        </div>
        
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${BORDER}`, backgroundColor: 'rgba(255,255,255,0.02)', color: '#71717a', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={12} />
          {t.trash.footer}
        </div>
      </div>

      {inspectItem && <InspectModal item={inspectItem} onClose={() => setInspectItem(null)} />}
      
      {confirmAction && (
          <ConfirmationDialog 
              type={confirmAction.type} 
              item={confirmAction.item} 
              onClose={() => setConfirmAction(null)} 
              onConfirm={executeAction} 
          />
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};