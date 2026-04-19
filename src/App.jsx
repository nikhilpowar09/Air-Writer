import React, { useRef, useState, useCallback, useEffect } from 'react'
import Toolbar       from './components/Toolbar.jsx'
import WebcamPIP     from './components/WebcamPIP.jsx'
import GestureCursor from './components/GestureCursor.jsx'
import StatusBar     from './components/StatusBar.jsx'
import { useHandTracking } from './hooks/useHandTracking.js'
import { useDrawing }      from './hooks/useDrawing.js'
import { GESTURE }         from './utils/gestureDetector.js'
import { applyTemplate }   from './utils/templates.js'
import { flattenCanvas, canvasToBlob, eraseCircle } from './utils/canvasUtils.js'
import { saveAs } from 'file-saver'
import './App.css'

const TOOLBAR_W = 256

function getCanvasSize() {
  return { w: window.innerWidth - TOOLBAR_W, h: window.innerHeight - 40 }
}

export default function App() {
  const canvasRef  = useRef(null)
  const videoRef   = useRef(null)

  const [cw, setCw] = useState(() => getCanvasSize().w)
  const [ch, setCh] = useState(() => getCanvasSize().h)

  const [gestureMode,    setGestureMode]    = useState(false)
  const [currentGesture, setCurrentGesture] = useState(GESTURE.NONE)
  const [fingerPoint,    setFingerPoint]    = useState(null)
  const [landmarks,      setLandmarks]      = useState(null)
  const [fps,            setFps]            = useState(0)
  const [loading,        setLoading]        = useState(false)
  const [loadingMsg,     setLoadingMsg]     = useState('Starting…')
  const [toast,          setToast]          = useState(null)
  const [recognitions,   setRecognitions]   = useState([])

  const fpsRef    = useRef({ n: 0, t: Date.now() })
  const toastRef  = useRef(null)

  // ── Tool state ────────────────────────────────────────────────────────────
  const [tool, _setTool] = useState({
    mode:        'draw',
    color:       '#1a1a2e',
    strokeWidth: 4,
    opacity:     1,
    eraserRadius:30,
    shapeId:     'rect',
    fillShape:   false,
  })
  const toolRef = useRef(tool)
  const setTool = useCallback(updater => {
    _setTool(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      toolRef.current = next
      return next
    })
  }, [])

  // ── OCR stroke callback ───────────────────────────────────────────────────
  const onStrokeComplete = useCallback(({ recognition }) => {
    if (!recognition) return
    setRecognitions(prev => [...prev.slice(-19), recognition])
  }, [])

  const { handleGestureUpdate, undo, redo, clearCanvas, canUndo, canRedo,
          onMouseDown: hookMouseDown, onMouseMove: hookMouseMove, onMouseUp: hookMouseUp }
    = useDrawing({ canvasRef, tool: toolRef, onStrokeComplete })

  // ── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => { const { w, h } = getCanvasSize(); setCw(w); setCh(h) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── Gesture callback ──────────────────────────────────────────────────────
  const onGesture = useCallback(({ gesture, point, landmarks }) => {
    setCurrentGesture(gesture)
    setFingerPoint(point)
    setLandmarks(landmarks)
    fpsRef.current.n++
    const now = Date.now()
    if (now - fpsRef.current.t >= 1000) { setFps(fpsRef.current.n); fpsRef.current = { n: 0, t: now } }

    // Override gesture if tool is eraser mode
    const effectiveGesture = toolRef.current.mode === 'eraser'
      ? (gesture === GESTURE.WRITING ? GESTURE.ERASER : gesture)
      : gesture

    handleGestureUpdate({ gesture: effectiveGesture, point })
  }, [handleGestureUpdate])

  const { start: startTracking, stop: stopTracking } =
    useHandTracking({ videoRef, canvasWidth: cw, canvasHeight: ch, onGesture })

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'ok', ms = 3500) => {
    setToast({ msg, type }); clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), ms)
  }, [])

  // ── Camera ────────────────────────────────────────────────────────────────
  const toggleCamera = useCallback(async () => {
    if (gestureMode) {
      stopTracking(); setGestureMode(false)
      setCurrentGesture(GESTURE.NONE); setFingerPoint(null); setLandmarks(null); setFps(0)
      showToast('Camera stopped', 'ok', 2000)
      return
    }
    setLoading(true); setLoadingMsg('Requesting camera…')
    try {
      setLoadingMsg('Loading hand model (first load ~12 MB)…')
      await startTracking()
      setGestureMode(true)
      showToast('✅ Camera active! Show your hand ☝️')
    } catch (err) {
      console.error(err)
      const m = err.message || ''
      if (m.includes('permission') || m.includes('denied') || m.includes('NotAllowed'))
        showToast('🔒 Allow camera: click the padlock icon in address bar → Allow → Refresh', 'err', 9000)
      else if (m.includes('NotFound') || m.includes('no camera'))
        showToast('📷 No webcam found. Connect a camera and try again.', 'err', 6000)
      else
        showToast(`❌ ${m}`, 'err', 6000)
    } finally { setLoading(false) }
  }, [gestureMode, startTracking, stopTracking, showToast])

  // ── Templates ─────────────────────────────────────────────────────────────
  const handleApplyTemplate = useCallback((id) => {
    const c = canvasRef.current; if (!c) return
    applyTemplate(c, id)
    showToast(`Template applied: ${id}`, 'ok', 2000)
  }, [showToast])

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExportPDF = useCallback(async () => {
    const c = canvasRef.current; if (!c) return
    showToast('Generating PDF…', 'ok', 8000)
    try {
      const { jsPDF } = await import('jspdf')
      const flat = flattenCanvas(c, '#ffffff')
      const imgData = flat.toDataURL('image/jpeg', 0.92)
      const orient  = c.width > c.height ? 'landscape' : 'portrait'
      const pdf = new jsPDF({ orientation: orient, unit: 'px', format: [c.width, c.height] })
      pdf.addImage(imgData, 'JPEG', 0, 0, c.width, c.height)
      pdf.save(`air-writer-${Date.now()}.pdf`)
      showToast('✅ PDF downloaded!')
    } catch (e) { showToast(`❌ PDF failed: ${e.message}`, 'err') }
  }, [showToast])

  const handleExportPNG = useCallback(async () => {
    const c = canvasRef.current; if (!c) return
    showToast('Saving PNG…', 'ok', 4000)
    try {
      const blob = await canvasToBlob(c, 'image/png')
      saveAs(blob, `air-writer-${Date.now()}.png`)
      showToast('✅ PNG downloaded!')
    } catch (e) { showToast(`❌ PNG failed: ${e.message}`, 'err') }
  }, [showToast])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const h = e => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key === 'z') { e.preventDefault(); undo() }
      if (ctrl && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [undo, redo])

  // ── Mouse events ──────────────────────────────────────────────────────────
  const onMouseDown = useCallback(e => {
    if (gestureMode || e.button === 2) return
    hookMouseDown(e, canvasRef.current)
  }, [gestureMode, hookMouseDown])

  const onMouseMove = useCallback(e => {
    if (gestureMode) return
    hookMouseMove(e, canvasRef.current)
  }, [gestureMode, hookMouseMove])

  const onMouseUp = useCallback(() => {
    if (gestureMode) return
    hookMouseUp()
  }, [gestureMode, hookMouseUp])

  const onContextMenu = useCallback(e => {
    if (gestureMode) return
    e.preventDefault()
    const r   = canvasRef.current.getBoundingClientRect()
    const ctx = canvasRef.current.getContext('2d')
    eraseCircle(ctx, e.clientX - r.left, e.clientY - r.top, toolRef.current.eraserRadius)
  }, [gestureMode])

  return (
    <div className="app">
      <Toolbar
        tool={tool} setTool={setTool}
        onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo}
        onClear={clearCanvas}
        onApplyTemplate={handleApplyTemplate}
        onExportPDF={handleExportPDF}
        onExportPNG={handleExportPNG}
        gestureMode={gestureMode} onToggleCamera={toggleCamera}
        currentGesture={currentGesture} cameraLoading={loading}
        recognitions={recognitions}
        onClearRecognitions={() => setRecognitions([])}
      />

      <main className="canvas-area">
        <canvas
          ref={canvasRef}
          width={cw} height={ch}
          className="draw-canvas"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onContextMenu={onContextMenu}
          style={{ cursor: gestureMode ? 'none' : tool.mode === 'eraser' ? 'cell' : 'crosshair' }}
        />

        {gestureMode && fingerPoint && (
          <GestureCursor
            point={fingerPoint}
            gesture={currentGesture}
            strokeWidth={tool.strokeWidth}
            color={tool.color}
            eraserRadius={tool.eraserRadius}
            mode={tool.mode}
          />
        )}

        {loading && (
          <div className="loading-veil">
            <div className="loading-ring" />
            <div className="loading-text">{loadingMsg}</div>
          </div>
        )}

        {!gestureMode && !loading && (
          <div className="canvas-hint">
            <div className="ch-icon">✍️</div>
            <div className="ch-title">Click & drag to draw</div>
            <div className="ch-sub">Right-click to erase · Enable camera for gesture control</div>
          </div>
        )}
      </main>

      <StatusBar
        gesture={currentGesture}
        point={fingerPoint}
        fps={gestureMode ? fps : 0}
        mouseMode={!gestureMode}
        mode={tool.mode}
        shapeId={tool.shapeId}
      />

      {/* Video always in DOM */}
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

      {gestureMode && (
        <WebcamPIP
          videoRef={videoRef}
          gesture={currentGesture}
          landmarks={landmarks}
          canvasWidth={cw}
          canvasHeight={ch}
        />
      )}

      {toast && (
        <div className={`toast ${toast.type === 'err' ? 'toast-err' : ''}`}>{toast.msg}</div>
      )}
    </div>
  )
}
