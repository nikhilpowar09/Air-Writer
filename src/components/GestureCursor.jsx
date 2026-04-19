import React from 'react'
import { GESTURE } from '../utils/gestureDetector'

export default function GestureCursor({ point, gesture, strokeWidth, color, eraserRadius, mode }) {
  if (!point) return null
  const isEraser = gesture === GESTURE.ERASER || mode === 'eraser'
  const isHover  = gesture === GESTURE.HOVER
  if (gesture === GESTURE.NONE) return null

  const size = isEraser ? eraserRadius * 2 : Math.max(strokeWidth + 10, 16)
  const bColor = isEraser ? '#e63946' : isHover ? '#f9c74f' : color
  const bg     = isEraser ? 'rgba(230,57,70,0.12)' : isHover ? 'rgba(249,199,79,0.10)' : color + '1a'

  return (
    <div className="g-cursor" style={{
      left: point.x, top: point.y,
      width: size, height: size,
      borderColor: bColor,
      background:  bg,
      borderStyle: isHover ? 'dashed' : 'solid',
    }}>
      {isEraser && <span style={{ fontSize: 12 }}>✕</span>}
      {isHover  && <span style={{ fontSize: 11 }}>✌️</span>}
    </div>
  )
}
