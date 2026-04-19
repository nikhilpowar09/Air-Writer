/**
 * Stroke-based character recognition using geometric feature analysis.
 * Analyzes bounding box, aspect ratio, stroke direction, loops, and crossings
 * to identify handwritten letters, digits, and symbols.
 */

// Normalize a stroke's points into a 0-1 grid
function normalizeStroke(points) {
  if (!points || points.length < 2) return []
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y
  }
  const w = maxX - minX || 1
  const h = maxY - minY || 1
  return points.map(p => ({ x: (p.x - minX) / w, y: (p.y - minY) / h }))
}

// Resample to fixed N points along the stroke
function resample(points, n = 32) {
  if (points.length === 0) return []
  const total = pathLength(points)
  const interval = total / (n - 1)
  const resampled = [points[0]]
  let dist = 0
  for (let i = 1; i < points.length; i++) {
    const d = dist2(points[i - 1], points[i])
    if (dist + d >= interval) {
      const t = (interval - dist) / d
      const p = { x: points[i-1].x + t*(points[i].x-points[i-1].x), y: points[i-1].y + t*(points[i].y-points[i-1].y) }
      resampled.push(p)
      points = [p, ...points.slice(i)]
      dist = 0; i = 0
    } else { dist += d }
    if (resampled.length >= n - 1) break
  }
  resampled.push(points[points.length - 1])
  return resampled.slice(0, n)
}

function dist2(a, b) { return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2) }
function pathLength(pts) { let l = 0; for (let i=1;i<pts.length;i++) l+=dist2(pts[i-1],pts[i]); return l }

// Direction histogram — 8 bins
function directionHistogram(pts) {
  const hist = new Array(8).fill(0)
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i-1].x, dy = pts[i].y - pts[i-1].y
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) continue
    const angle = Math.atan2(dy, dx) // -π to π
    const bin = Math.round((angle + Math.PI) / (2 * Math.PI) * 8) % 8
    hist[bin] += dist2(pts[i-1], pts[i])
  }
  const sum = hist.reduce((a,b)=>a+b,1)
  return hist.map(v => v/sum)
}

// Count direction reversals (complexity metric)
function countReversals(pts) {
  let reversals = 0
  for (let i = 2; i < pts.length; i++) {
    const dx1 = pts[i-1].x - pts[i-2].x, dx2 = pts[i].x - pts[i-1].x
    const dy1 = pts[i-1].y - pts[i-2].y, dy2 = pts[i].y - pts[i-1].y
    if (dx1 * dx2 < -0.001 || dy1 * dy2 < -0.001) reversals++
  }
  return reversals
}

// Does stroke form a closed-ish loop?
function isLooping(pts) {
  if (pts.length < 8) return false
  return dist2(pts[0], pts[pts.length - 1]) < 0.3
}

// Aspect ratio of bounding box
function aspectRatio(points) {
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity
  for(const p of points){if(p.x<minX)minX=p.x;if(p.x>maxX)maxX=p.x;if(p.y<minY)minY=p.y;if(p.y>maxY)maxY=p.y}
  const w=maxX-minX||1, h=maxY-minY||1
  return w/h
}

// Centroid
function centroid(pts) {
  return { x: pts.reduce((s,p)=>s+p.x,0)/pts.length, y: pts.reduce((s,p)=>s+p.y,0)/pts.length }
}

// Main recognition function
export function recognizeChar(rawPoints) {
  if (!rawPoints || rawPoints.length < 4) return null

  const norm = normalizeStroke(rawPoints)
  const pts  = resample(norm, 32)
  const hist = directionHistogram(pts)
  const ar   = aspectRatio(rawPoints)
  const loop = isLooping(norm)
  const rev  = countReversals(pts)
  const cen  = centroid(pts)
  const start = pts[0], end = pts[pts.length-1]

  // Horizontal / vertical dominant motion
  const hMove = hist[0] + hist[4]         // left-right
  const vMove = hist[2] + hist[6]         // up-down
  const diagR = hist[1] + hist[5]         // diagonal /
  const diagL = hist[3] + hist[7]         // diagonal \

  const goesRight = hist[0] > 0.2
  const goesLeft  = hist[4] > 0.2
  const goesDown  = hist[2] > 0.2
  const goesUp    = hist[6] > 0.2

  const startTop    = start.y < 0.35
  const startBottom = start.y > 0.65
  const startLeft   = start.x < 0.35
  const startRight  = start.x > 0.65
  const endTop      = end.y < 0.35
  const endLeft     = end.x < 0.35
  const endRight    = end.x > 0.65
  const endBottom   = end.y > 0.65

  const totalPath = pathLength(pts)
  const boundDiag = Math.sqrt(ar > 1 ? 1 + 1/ar/ar : ar*ar + 1)
  const efficiency = boundDiag / (totalPath || 1)  // straight=high, loopy=low

  // ── Shape primitives ──────────────────────────────────────────────────────
  if (loop && ar > 0.6 && ar < 1.6 && rev < 6) return { char: 'O', confidence: 0.85 }
  if (loop && ar < 0.6 && rev < 6)              return { char: 'O', confidence: 0.75 }

  // Mostly vertical — I or l
  if (vMove > 0.55 && hMove < 0.25 && !loop) {
    if (ar < 0.35) return { char: 'I', confidence: 0.80 }
    return { char: 'l', confidence: 0.72 }
  }

  // Mostly horizontal — minus / dash
  if (hMove > 0.60 && vMove < 0.20 && !loop) return { char: '-', confidence: 0.85 }

  // Diagonal up-right — /
  if (diagR > 0.55 && !loop) return { char: '/', confidence: 0.80 }
  // Diagonal down-right — \
  if (diagL > 0.55 && !loop) return { char: '\\', confidence: 0.80 }

  // ── Letters ───────────────────────────────────────────────────────────────

  // V — starts top-left, goes down-right then up-right
  if (startTop && endTop && !loop && goesDown && cen.y > 0.45 && rev < 5 && ar > 0.5)
    return { char: 'V', confidence: 0.72 }

  // U — starts top, goes down, curves, comes back up
  if (startTop && endTop && !loop && goesDown && goesUp && cen.y > 0.5 && rev < 8 && ar < 1.5)
    return { char: 'U', confidence: 0.70 }

  // C / G — loop opened on right side
  if (!loop && ar > 0.5 && ar < 1.4 && goesDown && cen.x < 0.55 && endRight && !goesRight)
    return { char: 'C', confidence: 0.65 }

  // L — goes down then right
  if (startTop && !loop && goesDown && goesRight && endRight && endBottom && !goesUp && rev < 5)
    return { char: 'L', confidence: 0.72 }

  // J — goes right then down, hooks left at bottom
  if (startTop && !loop && goesRight && goesDown && goesLeft && endBottom && rev < 6)
    return { char: 'J', confidence: 0.65 }

  // T — mostly horizontal with downward center
  if (hMove > 0.35 && vMove > 0.25 && startTop && rev < 8 && ar > 0.7)
    return { char: 'T', confidence: 0.60 }

  // S — complex curve, two direction changes, roughly balanced
  if (!loop && rev >= 6 && rev < 14 && Math.abs(ar - 0.6) < 0.3 && goesRight && goesLeft)
    return { char: 'S', confidence: 0.60 }

  // Z — starts top-left, goes right, diagonal down-left, goes right again
  if (startTop && startLeft && endRight && endBottom && !loop && goesRight && goesLeft && rev < 10)
    return { char: 'Z', confidence: 0.60 }

  // N — tall, multiple direction changes, mostly vertical-ish
  if (ar < 0.9 && !loop && rev >= 4 && rev < 10 && vMove > 0.3)
    return { char: 'N', confidence: 0.55 }

  // M — wide, starts left top, multiple peaks
  if (ar > 1.0 && !loop && rev >= 4 && startTop && endTop && vMove > 0.3)
    return { char: 'M', confidence: 0.55 }

  // W — wide, starts top, goes down-up-down-up, ends top
  if (ar > 0.9 && startTop && endTop && !loop && goesDown && rev >= 5)
    return { char: 'W', confidence: 0.55 }

  // A — triangular, closed or nearly closed at top
  if (!loop && rev >= 3 && ar < 1.2 && cen.y > 0.45 && startBottom && endBottom)
    return { char: 'A', confidence: 0.60 }

  // D — mostly loop on right side
  if (loop && ar > 0.5 && ar < 1.2 && !goesLeft && rev < 8)
    return { char: 'D', confidence: 0.60 }

  // P / B — loop on upper part
  if (!loop && rev >= 4 && startTop && startLeft && endBottom && endLeft && goesRight)
    return { char: 'P', confidence: 0.55 }

  // E — starts left top, horizontal bars
  if (startTop && startLeft && !loop && goesRight && goesDown && rev >= 4 && ar > 0.6)
    return { char: 'E', confidence: 0.55 }

  // F — like E but no bottom bar
  if (startTop && startLeft && !loop && goesRight && goesDown && rev < 6 && ar > 0.5)
    return { char: 'F', confidence: 0.50 }

  // H — two verticals with crossbar — complex
  if (!loop && rev >= 4 && vMove > 0.3 && hMove > 0.2 && ar > 0.5 && ar < 1.5)
    return { char: 'H', confidence: 0.50 }

  // K — starts top-left, vertical then diagonal branches
  if (startTop && startLeft && !loop && vMove > 0.2 && diagR > 0.15 && diagL > 0.15)
    return { char: 'K', confidence: 0.50 }

  // X — two crossing diagonals
  if (!loop && diagR > 0.2 && diagL > 0.2 && rev >= 2)
    return { char: 'X', confidence: 0.55 }

  // Digits
  // 1 — vertical
  if (vMove > 0.5 && ar < 0.4 && !loop) return { char: '1', confidence: 0.70 }

  // 0 — loop, roughly square
  if (loop && Math.abs(ar - 1) < 0.5) return { char: '0', confidence: 0.72 }

  // 7 — horizontal then diagonal down
  if (startTop && endBottom && hMove > 0.25 && diagL > 0.25 && !loop && rev < 5)
    return { char: '7', confidence: 0.60 }

  // Symbols
  if (loop && ar > 1.8) return { char: '~', confidence: 0.65 }

  return null   // unrecognized
}

export function recognizeFromStrokes(strokesArray) {
  const results = []
  for (const stroke of strokesArray) {
    const r = recognizeChar(stroke.points)
    if (r) results.push({ ...r, stroke })
  }
  return results
}
