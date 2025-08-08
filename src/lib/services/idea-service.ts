import { MissionStatus } from '@/lib/types';

export interface IdeaMissionDTO {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: MissionStatus | string;
  documentGroupIds: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const ideaService = {
  async list(userId?: string): Promise<IdeaMissionDTO[]> {
    const url = new URL(`${API_BASE}/idea-missions`);
    if (userId) url.searchParams.set('userId', userId);
    const res = await fetch(url.toString());
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Failed to fetch idea missions');
    return data.data;
  },

  async get(id: string): Promise<IdeaMissionDTO> {
    const res = await fetch(`${API_BASE}/idea-missions/${id}`);
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Failed to fetch idea mission');
    return data.data;
  },

  async create(params: { userId: string; title: string; description?: string; documentGroupId?: string; documentGroupIds?: string[]; }): Promise<IdeaMissionDTO> {
    const res = await fetch(`${API_BASE}/idea-missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Failed to create idea mission');
    return data.data;
  },

  async update(id: string, updates: Partial<{ title: string; description: string; status: MissionStatus | string; documentGroupIds: string[]; }>): Promise<IdeaMissionDTO> {
    const res = await fetch(`${API_BASE}/idea-missions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Failed to update idea mission');
    return data.data;
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/idea-missions/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Failed to delete idea mission');
  }
};


