/**
 * Shape drawing utilities for Air Writer.
 * Each shape function takes (ctx, x, y, w, h, color, strokeWidth) and draws to canvas.
 */

export const SHAPES = [
  { id: 'rect',     label: 'Rectangle', icon: '▭' },
  { id: 'circle',   label: 'Circle',    icon: '○' },
  { id: 'triangle', label: 'Triangle',  icon: '△' },
  { id: 'arrow',    label: 'Arrow',     icon: '→' },
  { id: 'star',     label: 'Star',      icon: '☆' },
  { id: 'diamond',  label: 'Diamond',   icon: '◇' },
  { id: 'line',     label: 'Line',      icon: '╱' },
  { id: 'heart',    label: 'Heart',     icon: '♡' },
]

function applyStyle(ctx, color, strokeWidth, fill = false) {
  ctx.strokeStyle = color
  ctx.lineWidth   = strokeWidth
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'
  if (fill) { ctx.fillStyle = color + '22' }
}

export function drawShape(ctx, shapeId, x, y, w, h, color, strokeWidth, filled = false) {
  ctx.save()
  applyStyle(ctx, color, strokeWidth, filled)
  const cx = x + w / 2, cy = y + h / 2
  const rx = Math.abs(w / 2), ry = Math.abs(h / 2)

  switch (shapeId) {
    case 'rect':
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      if (filled) ctx.fill()
      ctx.stroke()
      break

    case 'circle':
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      if (filled) ctx.fill()
      ctx.stroke()
      break

    case 'triangle':
      ctx.beginPath()
      ctx.moveTo(cx, y)
      ctx.lineTo(x + w, y + h)
      ctx.lineTo(x, y + h)
      ctx.closePath()
      if (filled) ctx.fill()
      ctx.stroke()
      break

    case 'arrow': {
      const headLen = Math.min(Math.abs(w), Math.abs(h)) * 0.3
      const ex = x + w, ey = y + h
      const angle = Math.atan2(h, w)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(ex, ey)
      ctx.moveTo(ex, ey)
      ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI/6), ey - headLen * Math.sin(angle - Math.PI/6))
      ctx.moveTo(ex, ey)
      ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI/6), ey - headLen * Math.sin(angle + Math.PI/6))
      ctx.stroke()
      break
    }

    case 'star': {
      const outerR = Math.min(rx, ry)
      const innerR = outerR * 0.4
      const points = 5
      ctx.beginPath()
      for (let i = 0; i < points * 2; i++) {
        const r     = i % 2 === 0 ? outerR : innerR
        const angle = (i * Math.PI) / points - Math.PI / 2
        const px    = cx + r * Math.cos(angle)
        const py    = cy + r * Math.sin(angle)
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      }
      ctx.closePath()
      if (filled) ctx.fill()
      ctx.stroke()
      break
    }

    case 'diamond':
      ctx.beginPath()
      ctx.moveTo(cx, y)
      ctx.lineTo(x + w, cy)
      ctx.lineTo(cx, y + h)
      ctx.lineTo(x, cy)
      ctx.closePath()
      if (filled) ctx.fill()
      ctx.stroke()
      break

    case 'line':
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + w, y + h)
      ctx.stroke()
      break

    case 'heart': {
      const topY = y + ry * 0.4
      ctx.beginPath()
      ctx.moveTo(cx, y + h * 0.95)
      ctx.bezierCurveTo(x - rx * 0.3, cy + ry * 0.2, x - rx, topY + ry * 0.1, cx - rx * 0.5, topY)
      ctx.bezierCurveTo(cx - rx * 0.1, topY - ry * 0.5, cx, topY - ry * 0.2, cx, topY)
      ctx.bezierCurveTo(cx, topY - ry * 0.2, cx + rx * 0.1, topY - ry * 0.5, cx + rx * 0.5, topY)
      ctx.bezierCurveTo(x + rx * 2, topY + ry * 0.1, x + w + rx * 0.3, cy + ry * 0.2, cx, y + h * 0.95)
      ctx.closePath()
      if (filled) ctx.fill()
      ctx.stroke()
      break
    }

    default: break
  }
  ctx.restore()
}

// Preview a shape in a small preview canvas context
export function previewShape(ctx, shapeId, w, h, color = '#4cc9f0', strokeWidth = 2) {
  const pad = 6
  drawShape(ctx, shapeId, pad, pad, w - pad*2, h - pad*2, color, strokeWidth, true)
}
