/**
 * Mediapipe Hands landmark indices
 *  0  Wrist
 *  4  Thumb tip      3  Thumb IP      2  Thumb MCP
 *  8  Index tip      7  Index DIP     6  Index PIP    5  Index MCP
 * 12  Middle tip    11  Middle DIP   10  Middle PIP   9  Middle MCP
 * 16  Ring tip      15  Ring DIP     14  Ring PIP    13  Ring MCP
 * 20  Pinky tip     19  Pinky DIP    18  Pinky PIP   17  Pinky MCP
 */

export const GESTURE = {
  NONE:    'NONE',
  WRITING: 'WRITING',   // ☝️ index up only
  HOVER:   'HOVER',     // ✌️ index + middle up
  ERASER:  'ERASER',    // ✊ fist (all fingers curled)
}

const fingerTips = [8, 12, 16, 20]  // index, middle, ring, pinky
const fingerPIP  = [6, 10, 14, 18]

function up(lm, tip, pip) {
  return lm[tip].y < lm[pip].y
}

export function detectGesture(lm) {
  if (!lm || lm.length < 21) return GESTURE.NONE

  const states = fingerTips.map((tip, i) => up(lm, tip, fingerPIP[i]))
  const [idxUp, midUp, ringUp, pinkyUp] = states

  if (!idxUp && !midUp && !ringUp && !pinkyUp) return GESTURE.ERASER
  if (idxUp && midUp && !ringUp && !pinkyUp)   return GESTURE.HOVER
  if (idxUp && !midUp && !ringUp && !pinkyUp)  return GESTURE.WRITING
  return GESTURE.NONE
}

/** Returns mirrored canvas coordinates from the index-finger tip landmark */
export function getIndexTip(lm, cw, ch) {
  if (!lm || lm.length < 9) return null
  const tip = lm[8]
  return {
    x: (1 - tip.x) * cw,   // mirror X for natural feel
    y: tip.y * ch,
  }
}

/** Full hand landmarks → mirrored canvas coords array */
export function getLandmarks(lm, cw, ch) {
  return lm.map(p => ({ x: (1 - p.x) * cw, y: p.y * ch }))
}
