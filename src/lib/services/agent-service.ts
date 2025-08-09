const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export const agentService = {
  async listMissionPresets(missionId: string) {
    const r = await fetch(`${API_BASE}/idea-missions/${missionId}/agents/presets`)
    const j = await r.json(); if (!r.ok || j.success === false) throw new Error(j.error || 'List presets failed');
    return j.data
  },
  async saveMissionPreset(missionId: string, preset: any) {
    const r = await fetch(`${API_BASE}/idea-missions/${missionId}/agents/presets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(preset) })
    const j = await r.json(); if (!r.ok || j.success === false) throw new Error(j.error || 'Save preset failed');
    return j.data
  },
  async deleteMissionPreset(missionId: string, presetId: string) {
    const r = await fetch(`${API_BASE}/idea-missions/${missionId}/agents/presets/${presetId}`, { method: 'DELETE' })
    const j = await r.json(); if (!r.ok || j.success === false) throw new Error(j.error || 'Delete preset failed');
    return j.data
  },
  async reorderMissionPresets(missionId: string, ids: string[]) {
    const r = await fetch(`${API_BASE}/idea-missions/${missionId}/agents/presets/order`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: ids }) })
    const j = await r.json(); if (!r.ok || j.success === false) throw new Error(j.error || 'Reorder presets failed');
    return j.data
  }
}


