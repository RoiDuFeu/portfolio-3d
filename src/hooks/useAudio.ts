import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

/**
 * Placeholder audio system using a synthetic oscillator.
 * Generates a rhythmic beat pattern that drives the music planet's visuals.
 * When real audio is available, swap OscillatorNode for MediaElementSource.
 */
export function useAudio() {
  const rafRef = useRef<number>(0)
  const contextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const startedRef = useRef(false)

  const startPlaceholderAudio = () => {
    if (startedRef.current) return
    startedRef.current = true

    const ctx = new AudioContext()
    contextRef.current = ctx

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyserRef.current = analyser
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)

    // Create a simple rhythmic pattern
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(80, ctx.currentTime)

    lfo.type = 'square'
    lfo.frequency.setValueAtTime(2, ctx.currentTime) // 120 BPM
    lfoGain.gain.setValueAtTime(0.5, ctx.currentTime)

    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)

    gain.gain.setValueAtTime(0.3, ctx.currentTime)

    osc.connect(gain)
    gain.connect(analyser)
    // Don't connect to destination — silent placeholder, visual only
    // To hear it: analyser.connect(ctx.destination)

    osc.start()
    lfo.start()

    // Start analysis loop
    const analyze = () => {
      if (!analyserRef.current || !dataArrayRef.current) return

      analyserRef.current.getByteFrequencyData(dataArrayRef.current)

      const lowFreqSum = dataArrayRef.current.slice(0, 20).reduce((a, b) => a + b, 0)
      const beat = lowFreqSum / (20 * 255)
      const totalEnergy =
        dataArrayRef.current.reduce((a, b) => a + b, 0) /
        (dataArrayRef.current.length * 255)

      useStore.getState().setAudioData(beat, totalEnergy)
      useStore.getState().setFrequencies(dataArrayRef.current)

      rafRef.current = requestAnimationFrame(analyze)
    }

    analyze()
  }

  useEffect(() => {
    // Defer AudioContext creation to first user interaction (browser policy)
    const handleInteraction = () => {
      startPlaceholderAudio()
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('scroll', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }

    window.addEventListener('click', handleInteraction)
    window.addEventListener('scroll', handleInteraction)
    window.addEventListener('keydown', handleInteraction)

    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('scroll', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      cancelAnimationFrame(rafRef.current)
      contextRef.current?.close()
    }
  }, [])
}
