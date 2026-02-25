/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React from 'react';
import ReactDOM from 'react-dom';
// import { X } from 'lucide-react'; // Optional if needed

interface UsageTooltipProps {
  rect: DOMRect;
  stats: {
    useCount: number;
    lastUsed: string | null;
  };
  onClose: () => void;
}

export function UsageTooltip({ rect, stats, onClose }: UsageTooltipProps) {
  const TOOLTIP_WIDTH = 220; // Must match CSS width below
  
  // Calculate position: Below the cell, centered horizontally
  // We constrain 'left' so it doesn't go off-screen to the left
  let left = rect.left + (rect.width / 2) - (TOOLTIP_WIDTH / 2);
  if (left < 10) left = 10; 
  
  // We calculate top to be just below the element
  const top = rect.bottom + 8; // 8px vertical gap

  return ReactDOM.createPortal(
    <div 
      className="usage-tooltip-portal"
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 999999,
        animation: 'fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .usage-tooltip-card {
          background-color: #18181b;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05);
          width: 220px;
          overflow: visible; /* Changed to visible so arrow can protrude */
          position: relative;
        }
        /* Arrow pointing UP */
        .usage-tooltip-card::before {
          content: '';
          position: absolute;
          top: -6px; /* Move outside top border */
          left: 50%;
          width: 10px;
          height: 10px;
          background-color: #18181b;
          /* Top and Left borders form the upward point when rotated */
          border-top: 1px solid #3f3f46;
          border-left: 1px solid #3f3f46;
          transform: translateX(-50%) rotate(45deg);
          z-index: 10;
        }
        .ut-header {
          padding: 10px 14px;
          border-bottom: 1px solid #27272a;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,0.02);
          border-radius: 8px 8px 0 0;
        }
        .ut-title {
          font-size: 11px;
          font-weight: 700;
          color: #a1a1aa;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ut-body {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ut-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }
        .ut-label {
          color: #e4e4e7;
        }
        .ut-val-highlight {
          color: #eab308; /* Yellow/Gold */
          font-weight: 700;
        }
        .ut-val-dim {
          color: #a1a1aa;
        }
      `}</style>

      <div className="usage-tooltip-card">
        <div className="ut-header">
          <span className="ut-title">Usage History</span>
        </div>
        
        <div className="ut-body">
          <div className="ut-row">
            <span className="ut-label">Total Deployments:</span>
            <span className="ut-val-highlight">{stats.useCount}</span>
          </div>
          
          {stats.lastUsed && (
            <div className="ut-row">
              <span className="ut-label">Last Used:</span>
              <span className="ut-val-dim">
                {new Date(stats.lastUsed).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}