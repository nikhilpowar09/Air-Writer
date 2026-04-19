import { useRef, useCallback, useState } from 'react'
import { drawSegment, eraseCircle } from '../utils/canvasUtils'
import { drawShape } from '../utils/shapeDrawer'
import { recognizeChar } from '../utils/charRecognizer'
import { GESTURE } from '../utils/gestureDetector'

const MAX_HISTORY = 20

export function useDrawing({ canvasRef, tool, onStrokeComplete }) {
  const currentRef     = useRef(null)
  const prevGestureRef = useRef(GESTURE.NONE)
  const historyRef     = useRef([])
  const redoRef        = useRef([])
  // Shape drag state
  const shapeStartRef  = useRef(null)
  const shapePreviewRef = useRef(null)

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const snapshot = useCallback(() => {
    const c = canvasRef.current; if (!c) return
    historyRef.current.push(c.toDataURL())
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift()
    redoRef.current = []
    setCanUndo(true); setCanRedo(false)
  }, [canvasRef])

  const restoreDataURL = useCallback((url) => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')
    const img = new Image()
    img.onload = () => { ctx.clearRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0) }
    img.src = url
  }, [canvasRef])

  const undo = useCallback(() => {
    if (!historyRef.current.length) return
    const c = canvasRef.current; if (!c) return
    redoRef.current.push(c.toDataURL())
    restoreDataURL(historyRef.current.pop())
    setCanUndo(historyRef.current.length > 0); setCanRedo(true)
  }, [canvasRef, restoreDataURL])

  const redo = useCallback(() => {
    if (!redoRef.current.length) return
    const c = canvasRef.current; if (!c) return
    historyRef.current.push(c.toDataURL())
    restoreDataURL(redoRef.current.pop())
    setCanUndo(true); setCanRedo(redoRef.current.length > 0)
  }, [canvasRef, restoreDataURL])

  const clearCanvas = useCallback(() => {
    const c = canvasRef.current; if (!c) return
    snapshot()
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
  }, [canvasRef, snapshot])

  const handleGestureUpdate = useCallback(({ gesture, point }) => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')
    const prev = prevGestureRef.current
    const t = tool.current

    // ── Shape drawing mode ─────────────────────────────────────────────────
    if (t.mode === 'shape') {
      if (gesture === GESTURE.WRITING) {
        if (!point) { prevGestureRef.current = gesture; return }
        if (prev !== GESTURE.WRITING) {
          snapshot()
          shapeStartRef.current = point
          shapePreviewRef.current = c.toDataURL() // save bg before preview
        } else if (shapeStartRef.current) {
          // Restore bg, draw preview shape
          const img = new Image()
          img.onload = () => {
            ctx.clearRect(0, 0, c.width, c.height)
            ctx.drawImage(img, 0, 0)
            const sx = shapeStartRef.current
            drawShape(ctx, t.shapeId,
              Math.min(sx.x, point.x), Math.min(sx.y, point.y),
              point.x - sx.x, point.y - sx.y,
              t.color, t.strokeWidth, t.fillShape)
          }
          img.src = shapePreviewRef.current
        }
      } else {
        if (prev === GESTURE.WRITING && shapeStartRef.current) {
          shapeStartRef.current = null
          shapePreviewRef.current = null
        }
      }
      prevGestureRef.current = gesture
      return
    }

    // ── Freehand drawing mode ──────────────────────────────────────────────
    if (gesture === GESTURE.WRITING) {
      if (!point) { prevGestureRef.current = gesture; return }

      if (prev !== GESTURE.WRITING) {
        snapshot()
        currentRef.current = {
          points:  [point],
          color:   t.color,
          width:   t.strokeWidth,
          opacity: t.opacity,
        }
      } else if (currentRef.current) {
        currentRef.current.points.push(point)
        drawSegment(ctx, currentRef.current.points, t.color, t.strokeWidth, t.opacity)
      }

    } else if (gesture === GESTURE.ERASER) {
      if (!point) { prevGestureRef.current = gesture; return }
      if (prev !== GESTURE.ERASER) snapshot()
      eraseCircle(ctx, point.x, point.y, t.eraserRadius)

    } else {
      // Stroke ended — run recognition
      if (currentRef.current && currentRef.current.points.length > 3) {
        const stroke = { ...currentRef.current }
        const result = recognizeChar(stroke.points)
        if (result && onStrokeComplete) {
          onStrokeComplete({ stroke, recognition: result })
        }
      }
      currentRef.current = null
    }

    prevGestureRef.current = gesture
  }, [canvasRef, tool, snapshot, onStrokeComplete])

  // Mouse drawing support
  const mouseStateRef = useRef({ down: false })

  const onMouseDown = useCallback((e, canvasEl) => {
    const t = tool.current
    if (t.mode === 'shape') {
      const r = canvasEl.getBoundingClientRect()
      const pt = { x: e.clientX - r.left, y: e.clientY - r.top }
      snapshot()
      shapeStartRef.current = pt
      shapePreviewRef.current = canvasEl.toDataURL()
      mouseStateRef.current.down = true
      return
    }
    snapshot()
    mouseStateRef.current.down = true
    const r = canvasEl.getBoundingClientRect()
    const pt = { x: e.clientX - r.left, y: e.clientY - r.top }
    currentRef.current = { points: [pt], color: t.color, width: t.strokeWidth, opacity: t.opacity }
  }, [tool, snapshot])

  const onMouseMove = useCallback((e, canvasEl) => {
    if (!mouseStateRef.current.down) return
    const t = tool.current
    const r = canvasEl.getBoundingClientRect()
    const pt = { x: e.clientX - r.left, y: e.clientY - r.top }
    const ctx = canvasEl.getContext('2d')

    if (t.mode === 'shape' && shapeStartRef.current) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
        ctx.drawImage(img, 0, 0)
        const sx = shapeStartRef.current
        drawShape(ctx, t.shapeId,
          Math.min(sx.x, pt.x), Math.min(sx.y, pt.y),
          pt.x - sx.x, pt.y - sx.y,
          t.color, t.strokeWidth, t.fillShape)
      }
      img.src = shapePreviewRef.current
      return
    }

    if (t.mode === 'eraser') {
      eraseCircle(ctx, pt.x, pt.y, t.eraserRadius)
      return
    }

    if (currentRef.current) {
      currentRef.current.points.push(pt)
      drawSegment(ctx, currentRef.current.points, t.color, t.strokeWidth, t.opacity)
    }
  }, [tool])

  const onMouseUp = useCallback(() => {
    if (!mouseStateRef.current.down) return
    mouseStateRef.current.down = false
    const t = tool.current
    if (t.mode !== 'shape' && currentRef.current && currentRef.current.points.length > 3) {
      const stroke = { ...currentRef.current }
      const result = recognizeChar(stroke.points)
      if (result && onStrokeComplete) onStrokeComplete({ stroke, recognition: result })
    }
    currentRef.current = null
    shapeStartRef.current = null
    shapePreviewRef.current = null
  }, [tool, onStrokeComplete])

  return { handleGestureUpdate, undo, redo, clearCanvas, canUndo, canRedo, onMouseDown, onMouseMove, onMouseUp }
}
