import { useEffect, useRef, useCallback } from 'react'
import { detectGesture, getIndexTip, getLandmarks, GESTURE } from '../utils/gestureDetector'
import { DualKalman } from '../utils/smoother'

export function useHandTracking({ videoRef, canvasWidth, canvasHeight, onGesture }) {
  const handsRef    = useRef(null)
  const streamRef   = useRef(null)   // MediaStream from getUserMedia
  const rafRef      = useRef(null)   // requestAnimationFrame id
  const runningRef  = useRef(false)
  const kalmanRef   = useRef(new DualKalman())

  // ── Process one frame ────────────────────────────────────────────────────
  const processFrame = useCallback(async () => {
    const video = videoRef.current
    const hands = handsRef.current
    if (!runningRef.current || !video || !hands) return
    if (video.readyState >= 2 && video.videoWidth > 0) {
      try {
        await hands.send({ image: video })
      } catch (_) { /* ignore single-frame errors */ }
    }
    rafRef.current = requestAnimationFrame(processFrame)
  }, [videoRef])

  // ── Mediapipe results callback ───────────────────────────────────────────
  const onResults = useCallback((results) => {
    if (!runningRef.current) return
    if (!results.multiHandLandmarks?.length) {
      kalmanRef.current.reset()
      onGesture({ gesture: GESTURE.NONE, point: null, landmarks: null })
      return
    }
    const lm        = results.multiHandLandmarks[0]
    const gesture   = detectGesture(lm)
    const raw       = getIndexTip(lm, canvasWidth, canvasHeight)
    const point     = raw ? kalmanRef.current.filter(raw.x, raw.y) : null
    const landmarks = getLandmarks(lm, canvasWidth, canvasHeight)
    onGesture({ gesture, point, landmarks })
  }, [canvasWidth, canvasHeight, onGesture])

  // ── Start ────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    if (runningRef.current) return

    // 1. Request webcam via native browser API (most reliable)
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Allow camera access in your browser and try again.'
        : err.name === 'NotFoundError'
        ? 'No camera found. Please connect a webcam.'
        : `Camera error: ${err.message}`
      throw new Error(msg)
    }

    streamRef.current = stream

    // 2. Attach stream to video element
    const video = videoRef.current
    if (!video) { stream.getTracks().forEach(t => t.stop()); throw new Error('Video element not ready') }
    video.srcObject = stream
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve
      video.onerror = reject
      setTimeout(reject, 8000, new Error('Video metadata timeout'))
    })
    await video.play().catch(() => {}) // autoplay may already be playing

    // 3. Load Mediapipe Hands (script-tag style — most compatible with Vite)
    if (!handsRef.current) {
      await loadMediapipeScript()
      const Hands = window.Hands  // loaded via CDN script tag
      if (!Hands) throw new Error('Mediapipe Hands failed to load from CDN')

      const hands = new Hands({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}`,
      })
      hands.setOptions({
        maxNumHands:            1,
        modelComplexity:        1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence:  0.6,
      })
      hands.onResults(onResults)
      await hands.initialize()   // pre-warm the WASM model
      handsRef.current = hands
    } else {
      handsRef.current.onResults(onResults)
    }

    // 4. Start frame loop
    runningRef.current = true
    rafRef.current = requestAnimationFrame(processFrame)
  }, [videoRef, onResults, processFrame])

  // ── Stop ─────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    runningRef.current = false
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    kalmanRef.current.reset()
  }, [videoRef])

  useEffect(() => () => stop(), [stop])

  return { start, stop }
}

// ── Load Mediapipe via <script> tag (bypasses Vite ESM issues) ────────────
function loadMediapipeScript() {
  return new Promise((resolve, reject) => {
    if (window.Hands) { resolve(); return }
    const existing = document.getElementById('mediapipe-hands-script')
    if (existing) {
      // Script already inserted, wait for it
      const check = setInterval(() => {
        if (window.Hands) { clearInterval(check); resolve() }
      }, 100)
      setTimeout(() => { clearInterval(check); reject(new Error('Mediapipe script timeout')) }, 20000)
      return
    }
    const script = document.createElement('script')
    script.id  = 'mediapipe-hands-script'
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js'
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      // Give it a tick to finish registering globals
      setTimeout(resolve, 100)
    }
    script.onerror = () => reject(new Error('Failed to load Mediapipe from CDN. Check internet connection.'))
    document.head.appendChild(script)
  })
}
