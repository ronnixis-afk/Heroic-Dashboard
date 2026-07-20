import { fetchRpgAdmin } from '../lib/rpgAdminApi';

export interface TelemetryData {
    avgTokensByPhase: { phase: string; avgTokens: number }[];
    latency: {
        p50: number;
        p95: number;
    };
    interventionRate: number;
}

export interface BehaviorData {
    mock?: boolean;
    topMechanics: { name: string; count: number }[];
    tutorialDropOff: { event: string; count: number }[];
    gmModeRatio: { mode: string; count: number }[];
}

class EngineTelemetryService {
    async getTelemetry(token?: string, userId?: string): Promise<TelemetryData> {
        if (!token) throw new Error('Admin Session Expired. Please Sign In Again.');
        const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        return fetchRpgAdmin<TelemetryData>(`/api/admin/telemetry${query}`, token);
    }

    async getBehavior(token?: string, userId?: string): Promise<BehaviorData> {
        if (!token) throw new Error('Admin Session Expired. Please Sign In Again.');
        const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        return fetchRpgAdmin<BehaviorData>(`/api/analytics/behavior${query}`, token);
    }
}

export const telemetryService = new EngineTelemetryService();
