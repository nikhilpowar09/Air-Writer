import React, { useState, useRef, useEffect } from 'react'

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
]

const PIP_W = 240
const PIP_H = 180

export default function WebcamPIP({ videoRef, gesture, landmarks, canvasWidth, canvasHeight }) {
  const [pos, setPos]           = useState({ x: 20, y: 80 })
  const [collapsed, setCollapsed] = useState(false)
  const dragRef                 = useRef(null)
  const pipCanvasRef            = useRef(null)   // renders BOTH video frame + skeleton
  const rafRef                  = useRef(null)

  // ── Draw loop: copy video frame + skeleton onto our pip canvas ────────────
  useEffect(() => {
    if (collapsed) {
      cancelAnimationFrame(rafRef.current)
      return
    }

    const draw = () => {
      const canvas = pipCanvasRef.current
      const video  = videoRef.current
      if (!canvas) { rafRef.current = requestAnimationFrame(draw); return }

      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, PIP_W, PIP_H)

      // 1. Draw mirrored video frame
      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        ctx.save()
        ctx.translate(PIP_W, 0)
        ctx.scale(-1, 1)   // mirror horizontally
        ctx.drawImage(video, 0, 0, PIP_W, PIP_H)
        ctx.restore()
      } else {
        // No feed yet — draw placeholder
        ctx.fillStyle = '#111118'
        ctx.fillRect(0, 0, PIP_W, PIP_H)
        ctx.fillStyle = 'rgba(255,255,255,0.15)'
        ctx.font = '11px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('Waiting for video…', PIP_W / 2, PIP_H / 2)
      }

      // 2. Draw hand skeleton overlay (landmarks are in canvas coords, remap to PIP)
      if (landmarks && landmarks.length === 21) {
        const sx = PIP_W / canvasWidth
        const sy = PIP_H / canvasHeight

        const gesColor = {
          WRITING: '#4cc9f0',
          HOVER:   '#ffd166',
          ERASER:  '#ff4d6d',
          NONE:    'rgba(255,255,255,0.5)',
        }[gesture] || 'rgba(255,255,255,0.5)'

        // Connections
        ctx.strokeStyle = gesColor
        ctx.lineWidth   = 1.5
        ctx.globalAlpha = 0.75
        HAND_CONNECTIONS.forEach(([a, b]) => {
          const pA = landmarks[a], pB = landmarks[b]
          ctx.beginPath()
          ctx.moveTo(pA.x * sx, pA.y * sy)
          ctx.lineTo(pB.x * sx, pB.y * sy)
          ctx.stroke()
        })

        // Joints
        ctx.globalAlpha = 1
        landmarks.forEach((p, i) => {
          const r = i === 8 ? 6 : i === 0 ? 4 : 2.5
          ctx.beginPath()
          ctx.arc(p.x * sx, p.y * sy, r, 0, Math.PI * 2)
          ctx.fillStyle = i === 8 ? gesColor : 'rgba(255,255,255,0.85)'
          ctx.fill()
        })

        // Index tip glow ring
        const tip = landmarks[8]
        ctx.beginPath()
        ctx.arc(tip.x * sx, tip.y * sy, 10, 0, Math.PI * 2)
        ctx.strokeStyle = gesColor
        ctx.lineWidth   = 1.5
        ctx.globalAlpha = 0.4
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [videoRef, landmarks, gesture, canvasWidth, canvasHeight, collapsed])

  // ── Drag ─────────────────────────────────────────────────────────────────
  const onMouseDown = (e) => {
    e.preventDefault()
    dragRef.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
    const up   = () => { dragRef.current = null; window.removeEventListener('mouseup', up); window.removeEventListener('mousemove', move) }
    const move = (ev) => {
      if (!dragRef.current) return
      setPos({ x: dragRef.current.px + ev.clientX - dragRef.current.mx, y: dragRef.current.py + ev.clientY - dragRef.current.my })
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const gestureLabel = {
    WRITING: { text: '☝️ DRAWING',  color: '#4cc9f0' },
    HOVER:   { text: '✌️ HOVERING', color: '#ffd166' },
    ERASER:  { text: '✊ ERASING',  color: '#ff4d6d' },
    NONE:    { text: '· NO HAND',   color: '#555570' },
  }[gesture] || { text: '· NO HAND', color: '#555570' }

  return (
    <div className="pip" style={{ left: pos.x, top: pos.y }}>
      <div className="pip-header" onMouseDown={onMouseDown} style={{ cursor: 'grab' }}>
        <span>📷 Live Feed</span>
        <button className="pip-collapse" onClick={() => setCollapsed(v => !v)}>
          {collapsed ? '▼' : '▲'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="pip-body">
            {/* Single canvas renders both video + skeleton — no extra <video> element */}
            <canvas
              ref={pipCanvasRef}
              width={PIP_W}
              height={PIP_H}
              className="pip-canvas"
            />
          </div>
          <div className="pip-badge" style={{ color: gestureLabel.color }}>
            {gestureLabel.text}
          </div>
        </>
      )}
    </div>
  )
}
