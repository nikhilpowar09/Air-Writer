/**
 * Canvas templates — draw background patterns on the canvas
 */

export const TEMPLATES = [
  { id: 'blank',    label: 'Blank',       icon: '⬜' },
  { id: 'lined',    label: 'Lined',       icon: '☰' },
  { id: 'grid',     label: 'Grid',        icon: '⊞' },
  { id: 'dotted',   label: 'Dotted',      icon: '⁚' },
  { id: 'music',    label: 'Music Staff', icon: '♫' },
  { id: 'isometric',label: 'Isometric',  icon: '◈' },
]

export function applyTemplate(canvas, templateId) {
  const ctx = canvas.getContext('2d')
  const w = canvas.width, h = canvas.height

  // Clear to white
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  switch (templateId) {
    case 'blank':
      break

    case 'lined': {
      const spacing = 36
      ctx.strokeStyle = '#b0c4de'
      ctx.lineWidth = 1
      // Red margin line
      ctx.strokeStyle = '#ffb3b3'
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(80, 0); ctx.lineTo(80, h); ctx.stroke()
      // Blue lines
      ctx.strokeStyle = '#a8d0f0'
      ctx.lineWidth = 0.8
      for (let y = spacing * 2; y < h; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
      break
    }

    case 'grid': {
      const spacing = 30
      ctx.strokeStyle = '#d0dce8'
      ctx.lineWidth = 0.6
      for (let x = 0; x < w; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }
      for (let y = 0; y < h; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
      // Darker every 5th line
      ctx.strokeStyle = '#b0bec8'
      ctx.lineWidth = 0.9
      for (let x = 0; x < w; x += spacing * 5) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }
      for (let y = 0; y < h; y += spacing * 5) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
      break
    }

    case 'dotted': {
      const spacing = 28
      ctx.fillStyle = '#b0bcc8'
      for (let x = spacing; x < w; x += spacing) {
        for (let y = spacing; y < h; y += spacing) {
          ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill()
        }
      }
      break
    }

    case 'music': {
      const staffSpacing = 10
      const groupGap = 70
      ctx.strokeStyle = '#555577'
      ctx.lineWidth = 1
      let y = 60
      while (y < h - 20) {
        for (let i = 0; i < 5; i++) {
          ctx.beginPath(); ctx.moveTo(40, y + i * staffSpacing); ctx.lineTo(w - 40, y + i * staffSpacing); ctx.stroke()
        }
        y += groupGap
      }
      // Treble clef placeholder text
      ctx.fillStyle = '#8888aa'
      ctx.font = 'bold 18px serif'
      ctx.fillText('𝄞', 44, 68)
      break
    }

    case 'isometric': {
      const size = 30
      const h2 = size * Math.sqrt(3) / 2
      ctx.strokeStyle = '#c0cce0'
      ctx.lineWidth = 0.6
      // Horizontal
      for (let row = 0; row * h2 < h; row++) {
        const yy = row * h2
        ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke()
      }
      // Diagonal /
      for (let col = -Math.ceil(h / h2); col < Math.ceil(w / size) + Math.ceil(h / h2); col++) {
        const startX = col * size
        ctx.beginPath(); ctx.moveTo(startX, 0); ctx.lineTo(startX + (h / h2) * size / 2, h); ctx.stroke()
      }
      // Diagonal \
      for (let col = -Math.ceil(h / h2); col < Math.ceil(w / size) + Math.ceil(h / h2); col++) {
        const startX = col * size
        ctx.beginPath(); ctx.moveTo(startX, 0); ctx.lineTo(startX - (h / h2) * size / 2, h); ctx.stroke()
      }
      break
    }

    default: break
  }
}

// Get the background image data URL for a template (to preserve under drawings)
export function getTemplateDataURL(canvas) {
  return canvas.toDataURL('image/png')
}
