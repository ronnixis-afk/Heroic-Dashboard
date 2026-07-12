import React, { useEffect, useState } from 'react';
import { Mail, History, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageHeader } from '../../components/ui';
import { cn } from '../../lib/utils';
import { getTemplateLabel, useEmails, type EmailTemplate } from '../../hooks/useEmails';

export default function AdminEmails() {
  const {
    templates,
    logs,
    creditsLowThreshold,
    loading,
    saving,
    testing,
    status,
    setStatus,
    saveTemplate,
    sendTest,
  } = useEmails();

  const [selectedKey, setSelectedKey] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [threshold, setThreshold] = useState(100);

  useEffect(() => {
    if (!templates.length) return;
    const current =
      templates.find((t) => t.key === selectedKey) || templates[0];
    setSelectedKey(current.key);
    setSubject(current.subject);
    setHtmlBody(current.htmlBody);
    setEnabled(current.enabled);
  }, [templates, selectedKey]);

  useEffect(() => {
    setThreshold(creditsLowThreshold);
  }, [creditsLowThreshold]);

  const selectTemplate = (template: EmailTemplate) => {
    setSelectedKey(template.key);
    setSubject(template.subject);
    setHtmlBody(template.htmlBody);
    setEnabled(template.enabled);
    setStatus(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKey) return;
    await saveTemplate({
      key: selectedKey,
      subject,
      htmlBody,
      enabled,
      creditsLowThreshold: threshold,
    });
  };

  if (loading) {
    return (
      <div className="page flex h-[50vh] flex-col items-center justify-center text-brand-text-muted italic gap-2 animate-pulse">
        <div className="h-6 w-6 rounded-full shimmer opacity-50" />
        <p className="text-xs">Loading Email Templates...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title="Email Templates" />

      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              'mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm',
              status.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
            )}
          >
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {status.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          <div className="card p-3.5">
            <h2 className="section-title mb-3 flex items-center gap-2">
              <Mail className="text-brand-accent" size={16} />
              Templates
            </h2>
            <div className="space-y-1.5">
              {templates.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => selectTemplate(template)}
                  className={cn(
                    'w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                    selectedKey === template.key
                      ? 'border-brand-accent/40 bg-brand-accent/10 text-brand-text'
                      : 'border-brand-primary/30 bg-brand-bg text-brand-text-muted hover:border-brand-accent/20 hover:text-brand-text'
                  )}
                >
                  <div className="font-medium">{getTemplateLabel(template.key)}</div>
                  <div className="mt-0.5 text-[11px] opacity-70">
                    {template.enabled ? 'Enabled' : 'Disabled'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-3.5">
            <label className="input-label">Credits Low Threshold</label>
            <input
              type="number"
              min={0}
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10) || 0)}
              className="input-field"
            />
            <p className="mt-2 text-[11px] text-brand-text-muted">
              Warn players when their balance drops below this amount. Saved with the template form.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <form onSubmit={handleSave} className="card p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="section-title flex items-center gap-2">
                <Mail className="text-brand-accent" size={16} />
                {getTemplateLabel(selectedKey)}
              </h2>
              <label className="flex items-center gap-2 text-sm text-brand-text-muted">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-brand-primary"
                />
                Enabled
              </label>
            </div>

            <div>
              <label className="input-label">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="input-label">Html Body</label>
              <textarea
                required
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                rows={16}
                className="input-field font-mono text-xs leading-relaxed"
              />
              <p className="mt-2 text-[11px] text-brand-text-muted">
                Placeholders: {'{{productName}}'}, {'{{siteUrl}}'}, {'{{email}}'}, {'{{credits}}'},{' '}
                {'{{tier}}'}, {'{{planName}}'}, {'{{feedbackType}}'}, {'{{feedbackCategory}}'},{' '}
                {'{{feedbackMessage}}'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={saving || !selectedKey} className="btn-primary">
                {saving ? 'Saving...' : 'Save Template'}
              </button>
              <button
                type="button"
                disabled={testing || !selectedKey}
                onClick={() => void sendTest(selectedKey)}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Send size={14} />
                {testing ? 'Sending...' : 'Send Test To Me'}
              </button>
            </div>
          </form>

          <div className="card p-3.5">
            <h2 className="section-title mb-3 flex items-center gap-2">
              <History className="text-brand-accent" size={16} />
              Recent Sends
            </h2>
            {logs.length === 0 ? (
              <p className="text-sm text-brand-text-muted italic">No Email Sends Logged Yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wide text-brand-text-muted">
                    <tr>
                      <th className="pb-2 pr-3 font-medium">When</th>
                      <th className="pb-2 pr-3 font-medium">Template</th>
                      <th className="pb-2 pr-3 font-medium">To</th>
                      <th className="pb-2 pr-3 font-medium">Status</th>
                      <th className="pb-2 font-medium">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-primary/20">
                    {logs.map((log) => (
                      <tr key={log.id} className="align-top">
                        <td className="py-2 pr-3 text-brand-text-muted whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 pr-3">{getTemplateLabel(log.templateKey)}</td>
                        <td className="py-2 pr-3">{log.toEmail}</td>
                        <td className="py-2 pr-3 capitalize">{log.status}</td>
                        <td className="py-2 text-brand-text-muted text-xs break-all">
                          {log.error || log.resendId || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
