import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { fetchRpgAdmin } from '../lib/rpgAdminApi';

export type EmailTemplate = {
  key: string;
  subject: string;
  htmlBody: string;
  enabled: boolean;
  updatedAt: string;
  createdAt: string;
};

export type EmailSendLog = {
  id: string;
  userId: string | null;
  toEmail: string;
  templateKey: string;
  dedupeKey: string;
  resendId: string | null;
  status: string;
  error: string | null;
  createdAt: string;
};

type TemplatesResponse = {
  templates: EmailTemplate[];
  creditsLowThreshold: number;
};

type LogsResponse = {
  logs: EmailSendLog[];
};

const TEMPLATE_LABELS: Record<string, string> = {
  welcome: 'Welcome (Free Trial)',
  subscription_purchase: 'Subscription Purchase',
  credits_low: 'Credits Running Low',
  feedback_received: 'Feedback Thank-You',
  feedback_admin: 'Feedback Admin Alert',
};

export function getTemplateLabel(key: string): string {
  return TEMPLATE_LABELS[key] || key;
}

export function useEmails() {
  const { getToken } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailSendLog[]>([]);
  const [creditsLowThreshold, setCreditsLowThreshold] = useState(100);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [templatesData, logsData] = await Promise.all([
        fetchRpgAdmin<TemplatesResponse>('/api/admin/emails/templates', getToken),
        fetchRpgAdmin<LogsResponse>('/api/admin/emails/logs?limit=50', getToken),
      ]);
      setTemplates(templatesData.templates || []);
      setCreditsLowThreshold(templatesData.creditsLowThreshold ?? 100);
      setLogs(logsData.logs || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to Load Email Settings.';
      console.error('[Emails] Load error:', err);
      setStatus({ type: 'error', msg: message });
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveTemplate = async (input: {
    key: string;
    subject: string;
    htmlBody: string;
    enabled: boolean;
    creditsLowThreshold: number;
  }) => {
    setSaving(true);
    setStatus(null);
    try {
      const result = await fetchRpgAdmin<TemplatesResponse & { success: boolean }>(
        '/api/admin/emails/templates',
        getToken,
        {
          method: 'PUT',
          body: JSON.stringify(input),
        }
      );
      setTemplates(result.templates || []);
      setCreditsLowThreshold(result.creditsLowThreshold ?? input.creditsLowThreshold);
      setStatus({ type: 'success', msg: 'Email Template Saved Successfully.' });
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to Save Email Template.';
      setStatus({ type: 'error', msg: message });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async (templateKey: string) => {
    setTesting(true);
    setStatus(null);
    try {
      const result = await fetchRpgAdmin<{ success: boolean; to: string; status: string }>(
        '/api/admin/emails/test',
        getToken,
        {
          method: 'POST',
          body: JSON.stringify({ templateKey }),
        }
      );
      setStatus({
        type: 'success',
        msg: `Test Email Sent to ${result.to} (${result.status}).`,
      });
      const logsData = await fetchRpgAdmin<LogsResponse>('/api/admin/emails/logs?limit=50', getToken);
      setLogs(logsData.logs || []);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to Send Test Email.';
      setStatus({ type: 'error', msg: message });
      throw err;
    } finally {
      setTesting(false);
    }
  };

  return {
    templates,
    logs,
    creditsLowThreshold,
    loading,
    saving,
    testing,
    status,
    setStatus,
    reload: load,
    saveTemplate,
    sendTest,
  };
}
