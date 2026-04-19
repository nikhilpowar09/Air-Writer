// ─── Kalman 1-D Filter ───────────────────────────────────────────────────────
export class KalmanFilter1D {
  constructor(R = 0.008, Q = 2) {
    this.R = R   // measurement noise  (lower = trust sensor more)
    this.Q = Q   // process noise      (higher = reacts faster)
    this.P = 1
    this.X = 0
    this.initialized = false
  }

  filter(z) {
    if (!this.initialized) { this.X = z; this.initialized = true; return z }
    this.P += this.Q
    const K = this.P / (this.P + this.R)
    this.X += K * (z - this.X)
    this.P  = (1 - K) * this.P
    return this.X
  }

  reset() { this.initialized = false; this.P = 1 }
}

// ─── Dual-axis Kalman (X + Y) ────────────────────────────────────────────────
export class DualKalman {
  constructor() {
    this.kx = new KalmanFilter1D(0.008, 2)
    this.ky = new KalmanFilter1D(0.008, 2)
  }

  filter(x, y) {
    return { x: this.kx.filter(x), y: this.ky.filter(y) }
  }

  reset() { this.kx.reset(); this.ky.reset() }
}

// ─── Weighted Moving Average (fallback / extra smoothing) ────────────────────
export class WMASmoother {
  constructor(size = 6) {
    this.size = size
    this.buf  = []
    // exponential weights, most-recent = highest
    this.weights = Array.from({ length: size }, (_, i) => Math.pow(1.8, i))
    const sum = this.weights.reduce((a, b) => a + b, 0)
    this.weights = this.weights.map(w => w / sum)
  }

  smooth(x, y) {
    this.buf.push({ x, y })
    if (this.buf.length > this.size) this.buf.shift()
    const n = this.buf.length
    const w = Array.from({ length: n }, (_, i) => Math.pow(1.8, i))
    const ws = w.reduce((a, b) => a + b, 0)
    let sx = 0, sy = 0
    for (let i = 0; i < n; i++) { sx += this.buf[i].x * w[i] / ws; sy += this.buf[i].y * w[i] / ws }
    return { x: sx, y: sy }
  }

  reset() { this.buf = [] }
}
