/**
 * Auto-detect AZERTY vs QWERTY keyboard layout.
 *
 * Uses the Keyboard Map API (Chromium) with a fallback
 * that listens for the first keydown event.
 */

type Layout = 'azerty' | 'qwerty'

let detectedLayout: Layout = 'qwerty' // safe default

/**
 * Attempt to detect the keyboard layout.
 * Resolves immediately on Chromium via navigator.keyboard,
 * or falls back to first-keydown heuristic.
 */
export async function detectKeyboardLayout(): Promise<Layout> {
  // Primary: Keyboard Map API (Chrome / Edge / Opera)
  try {
    const keyboard = (navigator as any).keyboard
    if (keyboard?.getLayoutMap) {
      const layoutMap = await keyboard.getLayoutMap()
      const wKey = layoutMap.get('KeyW')
      if (wKey === 'z' || wKey === 'Z') {
        detectedLayout = 'azerty'
        return detectedLayout
      }
      detectedLayout = 'qwerty'
      return detectedLayout
    }
  } catch {
    // API not available, fall through
  }

  // Fallback: listen for the first keydown on a letter key
  return new Promise<Layout>((resolve) => {
    const handler = (e: KeyboardEvent) => {
      // Only check letter keys from the ZQSD/WASD cluster
      if (['KeyW', 'KeyA', 'KeyQ', 'KeyZ'].includes(e.code)) {
        // On AZERTY, physical KeyW produces 'z', KeyA produces 'q'
        if (
          (e.code === 'KeyW' && e.key.toLowerCase() === 'z') ||
          (e.code === 'KeyA' && e.key.toLowerCase() === 'q')
        ) {
          detectedLayout = 'azerty'
        } else {
          detectedLayout = 'qwerty'
        }
        window.removeEventListener('keydown', handler)
        resolve(detectedLayout)
      }
    }
    window.addEventListener('keydown', handler)
  })
}

/** Synchronous getter — returns 'qwerty' until detection resolves. */
export function getKeyboardLayout(): Layout {
  return detectedLayout
}
