const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const ideaAgentService = {
  async executePlanning(missionId: string, body: any) {
    const res = await fetch(`${API_BASE}/idea-missions/${missionId}/agents/planning/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Agent execution failed');
    return data.data;
  },

  async submitFeedback(missionId: string, messageId: string, payload: { userId: string; rating: 'up'|'down'; reason?: string }) {
    const res = await fetch(`${API_BASE}/idea-missions/${missionId}/messages/${messageId}/feedback`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Feedback failed');
    return data.data;
  },

  async saveMessage(missionId: string, messageId: string, payload: { userId: string; content: string; format?: string; filenameHint?: string; metadata?: any }) {
    const res = await fetch(`${API_BASE}/idea-missions/${missionId}/messages/${messageId}/save`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Save failed');
    return data.data;
  },

  async listArtifacts(missionId: string) {
    const res = await fetch(`${API_BASE}/idea-missions/${missionId}/artifacts`);
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'List artifacts failed');
    return data.data;
  },
  async renameArtifact(missionId: string, artifactId: string, name: string) {
    const res = await fetch(`${API_BASE}/idea-missions/${missionId}/artifacts/${artifactId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Rename failed');
    return data.data;
  },
  async toggleStar(missionId: string, artifactId: string, starred: boolean) {
    const res = await fetch(`${API_BASE}/idea-missions/${missionId}/artifacts/${artifactId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ metadata: { starred } })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Update failed');
    return data.data;
  },
  async deleteArtifact(missionId: string, artifactId: string) {
    const res = await fetch(`${API_BASE}/idea-missions/${missionId}/artifacts/${artifactId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Delete failed');
    return data.data;
  },

  async getChat(missionId: string) {
    const res = await fetch(`${API_BASE}/idea-missions/${missionId}/chat`);
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Get chat failed');
    return data.data;
  },

  async appendChat(missionId: string, message: any) {
    const res = await fetch(`${API_BASE}/idea-missions/${missionId}/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message)
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Append chat failed');
    return data.data;
  },

  async addTextArtifact(missionId: string, payload: { userId: string; name: string; content: string; format?: string; metadata?: any }) {
    const res = await fetch(`${API_BASE}/idea-missions/${missionId}/artifacts/text`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Add artifact failed');
    return data.data;
  }
}


