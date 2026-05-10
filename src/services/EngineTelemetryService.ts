// src/services/EngineTelemetryService.ts

const RPG_API_URL = import.meta.env.VITE_RPG_API_URL || 'http://localhost:3000';

export interface TelemetryData {
    avgTokensByPhase: { phase: string; avgTokens: number }[];
    latency: {
        p50: number;
        p95: number;
    };
    interventionRate: number;
}

export interface BehaviorData {
    topMechanics: { name: string; count: number }[];
    tutorialDropOff: { event: string; count: number }[];
    gmModeRatio: { mode: string; count: number }[];
}

class EngineTelemetryService {
    async getTelemetry(token?: string, userId?: string): Promise<TelemetryData> {
        const url = new URL(`${RPG_API_URL}/api/admin/telemetry`);
        if (userId) url.searchParams.append('userId', userId);

        const response = await fetch(url.toString(), {
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) throw new Error('Failed to fetch telemetry');
        return response.json();
    }

    async getBehavior(token?: string, userId?: string): Promise<BehaviorData> {
        const url = new URL(`${RPG_API_URL}/api/analytics/behavior`);
        if (userId) url.searchParams.append('userId', userId);

        const response = await fetch(url.toString(), {
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) throw new Error('Failed to fetch behavior data');
        return response.json();
    }
}

export const telemetryService = new EngineTelemetryService();
