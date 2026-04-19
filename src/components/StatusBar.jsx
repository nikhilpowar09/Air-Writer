import React from 'react'

export default function StatusBar({ gesture, point, fps, mouseMode, mode, shapeId }) {
  const g = {
    WRITING: { dot: '#2dc653', label: 'DRAWING'  },
    HOVER:   { dot: '#f9c74f', label: 'HOVERING' },
    ERASER:  { dot: '#e63946', label: 'ERASING'  },
    NONE:    { dot: '#aaa',    label: 'IDLE'      },
  }[gesture] || { dot: '#aaa', label: 'IDLE' }

  return (
    <footer className="statusbar">
      <div className="sb-item">
        <div className="sb-dot" style={{ background: g.dot }} />
        <span style={{ color: g.dot }}>{g.label}</span>
      </div>
      {point && <div className="sb-item sb-coords">{Math.round(point.x)}, {Math.round(point.y)}</div>}
      {fps > 0 && <div className="sb-item">{fps} fps</div>}
      <div className="sb-item" style={{ color: '#888' }}>
        Mode: <span style={{ color: '#4cc9f0' }}>{mode}{mode === 'shape' ? ` / ${shapeId}` : ''}</span>
      </div>
      {mouseMode && <div className="sb-item" style={{ color: '#f4a261' }}>🖱 Mouse Mode</div>}
      <div className="sb-hint">☝️ Draw · ✌️ Hover · ✊ Erase · Ctrl+Z Undo</div>
    </footer>
  )
}
