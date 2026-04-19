import React, { useState } from 'react'
import { SHAPES } from '../utils/shapeDrawer'
import { TEMPLATES } from '../utils/templates'

const PALETTE = [
  '#1a1a2e','#e63946','#f4a261','#f9c74f','#2dc653',
  '#4cc9f0','#7b2d8b','#ff6b9d','#06d6a0','#118ab2',
  '#ffffff','#000000','#ff9500','#c77dff','#40916c',
]

const MODES = [
  { id: 'draw',   icon: '✏️', label: 'Draw'   },
  { id: 'shape',  icon: '⬡',  label: 'Shape'  },
  { id: 'eraser', icon: '⌫',  label: 'Erase'  },
]

export default function Toolbar({
  tool, setTool,
  onUndo, onRedo, canUndo, canRedo,
  onClear,
  onApplyTemplate,
  onExportPDF, onExportPNG,
  gestureMode, onToggleCamera,
  currentGesture, cameraLoading,
  recognitions,
  onClearRecognitions,
}) {
  const [tab, setTab] = useState('tools')   // 'tools' | 'shapes' | 'templates' | 'ocr'

  const gestureInfo = {
    WRITING: { color: '#2dc653', label: 'DRAWING',  icon: '☝️' },
    HOVER:   { color: '#f9c74f', label: 'HOVERING', icon: '✌️' },
    ERASER:  { color: '#e63946', label: 'ERASING',  icon: '✊' },
    NONE:    { color: '#444',    label: 'IDLE',      icon: '·'  },
  }[currentGesture] || { color: '#444', label: 'IDLE', icon: '·' }

  return (
    <aside className="tb">
      {/* ── Logo bar ────────────────────────────────────────── */}
      <div className="tb-logo-bar">
        <div className="tb-logo-icon">✦</div>
        <div>
          <div className="tb-logo-title">Air Writer</div>
          <div className="tb-logo-sub">Gesture Canvas Studio</div>
        </div>
      </div>

      {/* ── Camera ──────────────────────────────────────────── */}
      <div className="tb-cam-section">
        <button
          className={`tb-cam-btn ${gestureMode ? 'cam-on' : ''} ${cameraLoading ? 'cam-loading' : ''}`}
          onClick={onToggleCamera}
          disabled={cameraLoading}
        >
          <span className="cam-led" style={{ background: cameraLoading ? '#f9c74f' : gestureMode ? '#2dc653' : '#555' }} />
          {cameraLoading ? 'Loading model…' : gestureMode ? 'Camera Active' : 'Enable Camera'}
        </button>
        {gestureMode && (
          <div className="gesture-pill" style={{ background: gestureInfo.color + '22', borderColor: gestureInfo.color + '55', color: gestureInfo.color }}>
            <span>{gestureInfo.icon}</span> {gestureInfo.label}
          </div>
        )}
        {!gestureMode && (
          <div className="cam-hint">☝️ Index · ✌️ Hover · ✊ Erase</div>
        )}
      </div>

      {/* ── Tab nav ──────────────────────────────────────────── */}
      <div className="tb-tabs">
        {[
          { id: 'tools',     label: '🖌 Tools'    },
          { id: 'shapes',    label: '⬡ Shapes'   },
          { id: 'templates', label: '📋 Template' },
          { id: 'ocr',       label: `🔤 OCR${recognitions.length ? ` (${recognitions.length})` : ''}` },
        ].map(t => (
          <button key={t.id} className={`tb-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Tools ───────────────────────────────────────── */}
      {tab === 'tools' && (
        <div className="tb-panel">
          {/* Mode */}
          <div className="tb-label">MODE</div>
          <div className="mode-row">
            {MODES.map(m => (
              <button key={m.id}
                className={`mode-btn ${tool.mode === m.id ? 'mode-active' : ''}`}
                onClick={() => setTool(t => ({ ...t, mode: m.id }))}
              >{m.icon} {m.label}</button>
            ))}
          </div>

          {/* Color palette */}
          <div className="tb-label" style={{ marginTop: 14 }}>COLOR</div>
          <div className="palette-grid">
            {PALETTE.map(c => (
              <button key={c} className={`swatch ${tool.color === c ? 'swatch-sel' : ''}`}
                style={{ background: c, outline: c === '#ffffff' ? '1px solid #ccc' : 'none' }}
                onClick={() => setTool(t => ({ ...t, color: c }))}
              />
            ))}
          </div>
          <div className="custom-row">
            <span className="tb-label" style={{ margin: 0, flex: 1 }}>CUSTOM</span>
            <input type="color" value={tool.color}
              onChange={e => setTool(t => ({ ...t, color: e.target.value }))}
              className="color-pick" />
            <div className="color-prev" style={{ background: tool.color }} />
          </div>

          {/* Sliders */}
          {tool.mode !== 'eraser' && <>
            <div className="tb-label" style={{ marginTop: 12 }}>
              STROKE <span className="tb-val">{tool.strokeWidth}px</span>
            </div>
            <input type="range" min="1" max="40" value={tool.strokeWidth} className="slider"
              onChange={e => setTool(t => ({ ...t, strokeWidth: +e.target.value }))} />
            <div className="stroke-bar">
              <div style={{ width: `${Math.min(tool.strokeWidth * 2.4, 100)}%`, height: Math.min(tool.strokeWidth, 18), background: tool.color, borderRadius: 99, transition: 'all .15s' }} />
            </div>
            <div className="tb-label" style={{ marginTop: 10 }}>
              OPACITY <span className="tb-val">{Math.round(tool.opacity * 100)}%</span>
            </div>
            <input type="range" min="0.1" max="1" step="0.05" value={tool.opacity} className="slider"
              onChange={e => setTool(t => ({ ...t, opacity: +e.target.value }))} />
          </>}

          {tool.mode === 'eraser' && <>
            <div className="tb-label" style={{ marginTop: 12 }}>
              ERASER SIZE <span className="tb-val">{tool.eraserRadius}px</span>
            </div>
            <input type="range" min="8" max="80" value={tool.eraserRadius} className="slider"
              onChange={e => setTool(t => ({ ...t, eraserRadius: +e.target.value }))} />
          </>}

          {/* Actions */}
          <div className="tb-label" style={{ marginTop: 14 }}>ACTIONS</div>
          <div className="action-grid">
            <button className="act-btn" onClick={onUndo} disabled={!canUndo}>↩ Undo</button>
            <button className="act-btn" onClick={onRedo} disabled={!canRedo}>↪ Redo</button>
            <button className="act-btn act-danger" onClick={onClear}>🗑 Clear</button>
          </div>

          {/* Export */}
          <div className="tb-label" style={{ marginTop: 14 }}>EXPORT</div>
          <button className="export-btn export-pdf" onClick={onExportPDF}>📄 Download PDF</button>
          <button className="export-btn export-png" onClick={onExportPNG}>🖼 Download PNG</button>
        </div>
      )}

      {/* ── Tab: Shapes ──────────────────────────────────────── */}
      {tab === 'shapes' && (
        <div className="tb-panel">
          <div className="tb-label">SELECT SHAPE</div>
          <div className="shapes-grid">
            {SHAPES.map(s => (
              <button key={s.id}
                className={`shape-btn ${tool.mode === 'shape' && tool.shapeId === s.id ? 'shape-active' : ''}`}
                onClick={() => setTool(t => ({ ...t, mode: 'shape', shapeId: s.id }))}
              >
                <span className="shape-icon">{s.icon}</span>
                <span className="shape-label">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="tb-label" style={{ marginTop: 14 }}>OPTIONS</div>
          <label className="toggle-row">
            <span>Fill shape</span>
            <div className={`toggle ${tool.fillShape ? 'tog-on' : ''}`}
              onClick={() => setTool(t => ({ ...t, fillShape: !t.fillShape }))}>
              <div className="tog-thumb" />
            </div>
          </label>
          <div className="tb-label" style={{ marginTop: 10 }}>
            STROKE <span className="tb-val">{tool.strokeWidth}px</span>
          </div>
          <input type="range" min="1" max="20" value={tool.strokeWidth} className="slider"
            onChange={e => setTool(t => ({ ...t, strokeWidth: +e.target.value }))} />

          <div className="tb-label" style={{ marginTop: 10 }}>COLOR</div>
          <div className="palette-grid">
            {PALETTE.map(c => (
              <button key={c} className={`swatch ${tool.color === c ? 'swatch-sel' : ''}`}
                style={{ background: c, outline: c === '#ffffff' ? '1px solid #ccc' : 'none' }}
                onClick={() => setTool(t => ({ ...t, color: c }))} />
            ))}
          </div>

          <div className="shape-tip">
            ☝️ Drag to draw shape<br/>✌️ Hover to navigate
          </div>
        </div>
      )}

      {/* ── Tab: Templates ───────────────────────────────────── */}
      {tab === 'templates' && (
        <div className="tb-panel">
          <div className="tb-label">BACKGROUND TEMPLATE</div>
          <div className="templates-list">
            {TEMPLATES.map(t => (
              <button key={t.id} className="template-btn"
                onClick={() => onApplyTemplate(t.id)}>
                <span className="template-icon">{t.icon}</span>
                <div>
                  <div className="template-name">{t.label}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="template-warn">
            ⚠️ Applying a template resets the canvas background
          </div>
        </div>
      )}

      {/* ── Tab: OCR Results ─────────────────────────────────── */}
      {tab === 'ocr' && (
        <div className="tb-panel">
          <div className="ocr-header">
            <div className="tb-label">DETECTED CHARACTERS</div>
            {recognitions.length > 0 && (
              <button className="ocr-clear-btn" onClick={onClearRecognitions}>Clear</button>
            )}
          </div>

          {recognitions.length === 0 ? (
            <div className="ocr-empty">
              <div className="ocr-empty-icon">🔤</div>
              <div>Draw a letter or character</div>
              <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>Recognition runs after each stroke</div>
            </div>
          ) : (
            <>
              <div className="ocr-result-string">
                {recognitions.map(r => r.char).join('')}
              </div>
              <div className="ocr-items">
                {recognitions.map((r, i) => (
                  <div key={i} className="ocr-item">
                    <span className="ocr-char">{r.char}</span>
                    <div className="ocr-bar-wrap">
                      <div className="ocr-bar" style={{ width: `${Math.round(r.confidence * 100)}%` }} />
                    </div>
                    <span className="ocr-conf">{Math.round(r.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="tb-footer">Air Writer v2.0 · Mouse or Gesture</div>
    </aside>
  )
}
