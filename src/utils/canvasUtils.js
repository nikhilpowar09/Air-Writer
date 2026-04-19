/**
 * High-quality canvas drawing utilities.
 */

export function drawStroke(ctx, points, color, width, opacity = 1) {
  if (!points || points.length < 2) return
  ctx.save()
  ctx.globalAlpha  = Math.min(opacity, 1)
  ctx.strokeStyle  = color
  ctx.lineWidth    = width
  ctx.lineCap      = 'round'
  ctx.lineJoin     = 'round'
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y)
  } else {
    for (let i = 1; i < points.length - 1; i++) {
      const mx = (points[i].x + points[i + 1].x) / 2
      const my = (points[i].y + points[i + 1].y) / 2
      ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my)
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
  }
  ctx.stroke()
  ctx.restore()
}

export function drawSegment(ctx, pts, color, width, opacity = 1) {
  if (pts.length < 2) return
  ctx.save()
  ctx.globalAlpha  = Math.min(opacity, 1)
  ctx.strokeStyle  = color
  ctx.lineWidth    = width
  ctx.lineCap      = 'round'
  ctx.lineJoin     = 'round'
  const n = pts.length
  ctx.beginPath()
  if (n >= 3) {
    const i    = n - 2
    const prevM = { x: (pts[i-1].x + pts[i].x) / 2, y: (pts[i-1].y + pts[i].y) / 2 }
    const currM = { x: (pts[i].x + pts[i+1].x) / 2, y: (pts[i].y + pts[i+1].y) / 2 }
    ctx.moveTo(prevM.x, prevM.y)
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, currM.x, currM.y)
  } else {
    ctx.moveTo(pts[0].x, pts[0].y)
    ctx.lineTo(pts[1].x, pts[1].y)
  }
  ctx.stroke()
  ctx.restore()
}

export function eraseCircle(ctx, x, y, radius) {
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,1)'
  ctx.fill()
  ctx.restore()
}

export function drawGrid(ctx, w, h, spacing = 40, color = 'rgba(100,120,160,0.12)') {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth   = 0.5
  for (let x = 0; x <= w; x += spacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = 0; y <= h; y += spacing) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }
  ctx.restore()
}

export function flattenCanvas(canvas, bg = '#ffffff') {
  const off = document.createElement('canvas')
  off.width  = canvas.width
  off.height = canvas.height
  const ctx  = off.getContext('2d')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, off.width, off.height)
  ctx.drawImage(canvas, 0, 0)
  return off
}

export function canvasToBlob(canvas, mime = 'image/png', q = 0.95) {
  return new Promise(res => canvas.toBlob(res, mime, q))
}
