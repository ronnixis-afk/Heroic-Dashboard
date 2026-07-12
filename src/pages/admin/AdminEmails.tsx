import React, { useEffect, useState } from 'react';
import { Mail, History, Send, Loader2 } from 'lucide-react';
import { PageHeader, StatusBanner, EmptyState, PageLoader } from '../../components/ui';
import { cn } from '../../lib/utils';
import {
  getTemplateLabel,
  useEmails,
  type EmailContentSections,
  type EmailTemplate,
} from '../../hooks/useEmails';

const EMPTY_SECTIONS: EmailContentSections = {
  documentTitle: '',
  preheader: '',
  eyebrow: '',
  heading: '',
  body: '',
  ctaLabel: '',
  stats: [],
  layout: 'standard',
};

function sectionsFromTemplate(template: EmailTemplate | undefined): EmailContentSections {
  if (!template?.sections) return { ...EMPTY_SECTIONS };
  return {
    documentTitle: template.sections.documentTitle || '',
    preheader: template.sections.preheader || '',
    eyebrow: template.sections.eyebrow || '',
    heading: template.sections.heading || '',
    body: template.sections.body || '',
    ctaLabel: template.sections.ctaLabel || '',
    stats: template.sections.stats || [],
    layout: template.sections.layout || 'standard',
  };
}

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
    setTemplateEnabled,
    sendTest,
  } = useEmails();

  const [selectedKey, setSelectedKey] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [sections, setSections] = useState<EmailContentSections>(EMPTY_SECTIONS);
  const [enabled, setEnabled] = useState(true);
  const [threshold, setThreshold] = useState(100);
  const [togglingEnabled, setTogglingEnabled] = useState(false);

  useEffect(() => {
    if (!templates.length) return;
    const current = templates.find((t) => t.key === selectedKey) || templates[0];
    setSelectedKey(current.key);
    setSubject(current.subject);
    setSections(sectionsFromTemplate(current));
    setEnabled(current.enabled);
  }, [templates, selectedKey]);

  useEffect(() => {
    setThreshold(creditsLowThreshold);
  }, [creditsLowThreshold]);

  const selectTemplate = (template: EmailTemplate) => {
    setSelectedKey(template.key);
    setSubject(template.subject);
    setSections(sectionsFromTemplate(template));
    setEnabled(template.enabled);
    setStatus(null);
  };

  const updateSection = <K extends keyof EmailContentSections>(
    key: K,
    value: EmailContentSections[K]
  ) => {
    setSections((prev) => ({ ...prev, [key]: value }));
  };

  const updateStat = (index: number, field: 'label' | 'value', value: string) => {
    setSections((prev) => {
      const stats = [...(prev.stats || [])];
      if (!stats[index]) return prev;
      stats[index] = { ...stats[index], [field]: value };
      return { ...prev, stats };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKey) return;
    await saveTemplate({
      key: selectedKey,
      subject,
      sections,
      enabled,
      creditsLowThreshold: threshold,
    });
  };

  const handleToggleEnabled = async () => {
    if (!selectedKey || togglingEnabled) return;
    const nextEnabled = !enabled;
    setTogglingEnabled(true);
    setEnabled(nextEnabled);
    try {
      await setTemplateEnabled(selectedKey, nextEnabled);
    } catch {
      setEnabled(!nextEnabled);
    } finally {
      setTogglingEnabled(false);
    }
  };

  const isFeedbackAdmin = sections.layout === 'feedback_admin';
  const showCta = !isFeedbackAdmin;
  const showStats = !isFeedbackAdmin && (sections.stats?.length || 0) > 0;

  if (loading) {
    return <PageLoader label="Loading Email Templates..." />;
  }

  return (
    <div className="page">
      <PageHeader
        title="Email Templates"
        description="Edit transactional email copy, enable or disable sends, and review recent delivery logs."
      />

      {status && (
        <StatusBanner
          type={status.type}
          message={status.msg}
          onDismiss={() => setStatus(null)}
        />
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          <div className="card p-3.5">
            <h2 className="section-title mb-3 flex items-center gap-2">
              <Mail className="text-brand-accent" size={14} />
              Templates
            </h2>
            <div className="space-y-1.5">
              {templates.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => selectTemplate(template)}
                  className={cn(
                    'select-row',
                    selectedKey === template.key ? 'select-row-active' : 'select-row-idle'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{getTemplateLabel(template.key)}</span>
                    <span className={template.enabled ? 'badge-success' : 'badge-danger'}>
                      {template.enabled ? 'Enabled' : 'Disabled'}
                    </span>
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
            <p className="help-text mt-1.5">
              Warn players when their balance drops below this amount. Saved with the template form.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <form onSubmit={handleSave} className="card p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="section-title flex items-center gap-2">
                <Mail className="text-brand-accent" size={14} />
                {getTemplateLabel(selectedKey)}
                <span className={enabled ? 'badge-success' : 'badge-danger'}>
                  {enabled ? 'Enabled' : 'Disabled'}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                {togglingEnabled && (
                  <Loader2
                    size={14}
                    className="animate-spin text-brand-accent"
                    aria-label="Updating Template Status"
                  />
                )}
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-busy={togglingEnabled}
                  disabled={togglingEnabled || !selectedKey}
                  onClick={() => void handleToggleEnabled()}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none disabled:opacity-60',
                    enabled
                      ? 'border-emerald-500/40 bg-emerald-500/80'
                      : 'border-brand-primary/50 bg-brand-bg'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
                <span className="text-xs text-brand-text-muted whitespace-nowrap">
                  {enabled ? 'Sending On' : 'Sending Off'}
                </span>
              </div>
            </div>

            <div>
              <label className="input-label">Subject Line</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="input-label">Inbox Preview Text</label>
              <input
                type="text"
                required
                value={sections.preheader}
                onChange={(e) => updateSection('preheader', e.target.value)}
                className="input-field"
              />
              <p className="help-text mt-1.5">
                Short snippet shown after the subject in most inboxes.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="input-label">Eyebrow Label</label>
                <input
                  type="text"
                  required
                  value={sections.eyebrow}
                  onChange={(e) => updateSection('eyebrow', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Headline</label>
                <input
                  type="text"
                  required
                  value={sections.heading}
                  onChange={(e) => updateSection('heading', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {!isFeedbackAdmin && (
              <div>
                <label className="input-label">Body Copy</label>
                <textarea
                  value={sections.body}
                  onChange={(e) => updateSection('body', e.target.value)}
                  rows={4}
                  className="input-field !h-auto py-2 leading-relaxed"
                  placeholder="Write the email body. Use a blank line for a new paragraph."
                />
              </div>
            )}

            {isFeedbackAdmin && (
              <div className="callout">
                From, type, category, and the feedback message are filled in automatically for each submission.
              </div>
            )}

            {showStats && (
              <div className="space-y-2">
                <label className="input-label">Stat Chips</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(sections.stats || []).map((stat, index) => (
                    <div key={index} className="rounded-md border border-brand-primary/40 bg-brand-bg p-2.5 space-y-2">
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => updateStat(index, 'label', e.target.value)}
                        className="input-field"
                        placeholder="Label"
                        aria-label={`Stat ${index + 1} Label`}
                      />
                      <input
                        type="text"
                        value={stat.value}
                        onChange={(e) => updateStat(index, 'value', e.target.value)}
                        className="input-field"
                        placeholder="Value"
                        aria-label={`Stat ${index + 1} Value`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showCta && (
              <div>
                <label className="input-label">Button Label</label>
                <input
                  type="text"
                  value={sections.ctaLabel || ''}
                  onChange={(e) => updateSection('ctaLabel', e.target.value)}
                  className="input-field"
                  placeholder="Enter The Realms"
                />
              </div>
            )}

            <p className="help-text">
              Placeholders: {'{{productName}}'}, {'{{credits}}'}, {'{{tier}}'}, {'{{planName}}'},{' '}
              {'{{feedbackType}}'}, {'{{feedbackCategory}}'}, {'{{email}}'}
            </p>

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={saving || !selectedKey} className="btn-primary">
                {saving ? 'Saving...' : 'Save Template'}
              </button>
              <button
                type="button"
                disabled={testing || !selectedKey}
                onClick={() => void sendTest(selectedKey)}
                className="btn-secondary"
              >
                <Send size={12} />
                {testing ? 'Sending...' : 'Send Test To Me'}
              </button>
            </div>
          </form>

          <div className="card p-3.5">
            <h2 className="section-title mb-3 flex items-center gap-2">
              <History className="text-brand-text-muted" size={14} />
              Recent Sends
            </h2>
            {logs.length === 0 ? (
              <EmptyState
                compact
                icon={History}
                title="No Email Sends Logged Yet"
                description="Test sends and live deliveries will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table min-w-[640px]">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Template</th>
                      <th>To</th>
                      <th>Status</th>
                      <th>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="text-brand-text-muted whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td>{getTemplateLabel(log.templateKey)}</td>
                        <td>{log.toEmail}</td>
                        <td>
                          <span
                            className={cn(
                              log.status === 'sent' || log.status === 'delivered'
                                ? 'badge-success'
                                : log.status === 'failed' || log.status === 'bounced'
                                  ? 'badge-danger'
                                  : 'badge-muted'
                            )}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="text-brand-text-muted break-all">
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
