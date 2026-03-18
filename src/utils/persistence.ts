import type { PlanetConfig, SavedPlanetEntry } from '../types/studio'

const STORAGE_KEY = 'planet-studio-designs'

function getAll(): Record<string, PlanetConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveAll(data: Record<string, PlanetConfig>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function savePlanet(config: PlanetConfig): void {
  const all = getAll()
  all[config.id] = { ...config, updatedAt: Date.now() }
  saveAll(all)
}

export function loadPlanet(id: string): PlanetConfig | null {
  const all = getAll()
  return all[id] ?? null
}

export function listPlanets(): SavedPlanetEntry[] {
  const all = getAll()
  return Object.values(all)
    .map(({ id, name, updatedAt }) => ({ id, name, updatedAt }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function deletePlanet(id: string): void {
  const all = getAll()
  delete all[id]
  saveAll(all)
}

export function exportPlanetJSON(config: PlanetConfig): string {
  return JSON.stringify(config, null, 2)
}

export function importPlanetJSON(json: string): PlanetConfig {
  return JSON.parse(json) as PlanetConfig
}
