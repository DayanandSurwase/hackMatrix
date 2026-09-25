import { useEffect, useRef, useState } from 'react';
import { useCase } from '../lib/context/CaseContext';
import { useNavigate, useParams } from '../lib/router';
import { PageHeader, Stepper } from '../components/layout/AppShell';
import { Alert, Badge, Button, Card, Icon, useToast, cx } from '../components/ui';
import { ConfidenceIndicator } from '../components/domain/decision';
import { makeJob, tickJob } from '../lib/api';
import type { ProcessingJob } from '../lib/types';

const CASE = 'case-2025-0417';

/* ------------------------------------------------ New assessment intro */
export function NewAssessment() {
  const navigate = useNavigate();
  return (
    <div className="fp-fade-in mx-auto max-w-2xl">
      <PageHeader title="Start a new assessment" subtitle="We create a private case for your documents, then extract facts and evaluate verified schemes." breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'New assessment' }]} />
      <Card className="p-6">
        <ol className="space-y-4">
          {[
            { t: 'Upload documents', d: 'Aadhaar, project report, certificates — PDF or image.' },
            { t: 'We extract your facts', d: 'Each fact is linked to the document and page it came from.' },
            { t: 'Review & confirm', d: 'You can correct any value before evaluation.' },
            { t: 'See evidence-backed decisions', d: 'Eligible / Not eligible / Needs review, with full proof.' },
          ].map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-050 text-sm font-semibold text-brand">{i + 1}</span>
              <div>
                <p className="text-sm font-medium text-ink">{s.t}</p>
                <p className="text-sm text-muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex items-center gap-3 rounded-[8px] bg-surface-sunken p-3 text-xs text-muted">
          <Icon name="shield" size={16} className="text-accent" />
          Your documents are private to this case. Sensitive identifiers such as Aadhaar are masked in the interface.
        </div>
        <Button className="mt-6 w-full" size="lg" onClick={() => navigate(`/assessment/${CASE}/upload`)}>
          Create case & upload documents <Icon name="arrow" size={16} />
        </Button>
      </Card>
    </div>
  );
}

/* ------------------------------------------------ Upload */
interface UploadRow { id: string; name: string; size: string; type: string; state: 'ready' | 'unsupported' | 'corrupt'; }

export function Upload() {
  const { id = CASE } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [drag, setDrag] = useState(false);
  const [rows, setRows] = useState<UploadRow[]>([
    { id: '1', name: 'aadhaar_front.pdf', size: '410 KB', type: 'Aadhaar card', state: 'ready' },
    { id: '2', name: 'project_report.pdf', size: '1.2 MB', type: 'Project report', state: 'ready' },
    { id: '3', name: 'school_certificate.jpg', size: '820 KB', type: 'Education certificate', state: 'ready' },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next: UploadRow[] = Array.from(files).map((f, i) => {
      const ok = /\.(pdf|png|jpe?g)$/i.test(f.name);
      return {
        id: Date.now() + '-' + i,
        name: f.name,
        size: (f.size / 1024).toFixed(0) + ' KB',
        type: ok ? 'Detecting…' : 'Unsupported type',
        state: ok ? 'ready' : 'unsupported',
      };
    });
    setRows((r) => [...r, ...next]);
    if (next.some((n) => n.state === 'unsupported')) toast({ tone: 'error', msg: 'Some files were rejected — only PDF and images are supported.' });
    else toast({ tone: 'success', msg: `${next.length} file(s) added.` });
  };

  const valid = rows.filter((r) => r.state === 'ready').length;

  return (
    <div className="fp-fade-in">
      <Stepper current="upload" caseId={id} />
      <PageHeader title="Upload documents" subtitle="Add the documents that prove your identity, income and project details. We accept PDF and scanned images." breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Upload' }]} />

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        className={cx(
          'flex flex-col items-center justify-center rounded-[var(--radius)] border-2 border-dashed px-6 py-12 text-center transition-colors',
          drag ? 'border-brand bg-brand-050' : 'border-line-strong bg-surface',
        )}
      >
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-050 text-brand"><Icon name="upload" size={22} /></span>
        <p className="text-sm font-medium text-ink">Drag & drop files here</p>
        <p className="mt-1 text-sm text-muted">PDF, PNG or JPG · up to 20 MB each</p>
        <input ref={inputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <Button variant="secondary" className="mt-4" onClick={() => inputRef.current?.click()}>Browse files</Button>
      </div>

      {rows.length > 0 && (
        <div className="mt-6 space-y-2.5">
          {rows.map((r) => (
            <Card key={r.id} className="flex items-center gap-3 p-3">
              <span className="flex h-10 w-9 items-center justify-center rounded border border-line bg-surface-sunken text-faint"><Icon name="file" size={18} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{r.name}</p>
                <p className="text-xs text-muted">{r.size} · {r.type}</p>
              </div>
              {r.state === 'ready' ? (
                <Badge tone="pass" icon={<Icon name="check" size={12} />}>Ready</Badge>
              ) : (
                <Badge tone="fail" icon={<Icon name="x" size={12} />}>{r.state === 'unsupported' ? 'Unsupported' : 'Corrupt file'}</Badge>
              )}
              <button onClick={() => setRows((s) => s.filter((x) => x.id !== r.id))} className="rounded p-1.5 text-faint hover:bg-surface-sunken hover:text-fail" aria-label="Remove"><Icon name="x" size={16} /></button>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted">{valid} document{valid !== 1 ? 's' : ''} ready to process</p>
        <Button disabled={valid === 0} onClick={() => navigate(`/assessment/${id}/processing`)}>
          Process documents <Icon name="arrow" size={16} />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------ Processing */
export function Processing() {
  const { id = CASE } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<ProcessingJob>(() => makeJob(id));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (job.status === 'COMPLETED' || failed) return;
    const t = setTimeout(() => setJob((j) => tickJob(j)), 900);
    return () => clearTimeout(t);
  }, [job, failed]);

  const done = job.status === 'COMPLETED';

  return (
    <div className="fp-fade-in mx-auto max-w-2xl">
      <Stepper current="processing" caseId={id} />
      <PageHeader title="Processing documents" subtitle="Extraction runs in the background. This does not block your session — you can return to it anytime." breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Processing' }]} />

      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cx('flex h-9 w-9 items-center justify-center rounded-full', done ? 'bg-pass-050 text-pass' : 'bg-brand-050 text-brand')}>
              <Icon name={done ? 'check' : 'clock'} size={18} className={done ? '' : 'fp-pulse'} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{failed ? 'Processing failed' : done ? 'Processing complete' : 'Processing…'}</p>
              <p className="font-mono text-xs text-muted">job {job.jobId} · {job.status}</p>
            </div>
          </div>
          <span className="font-display text-2xl font-bold text-ink">{job.progress}%</span>
        </div>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-surface-sunken">
          <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${job.progress}%` }} />
        </div>

        <ol className="space-y-3">
          {job.steps.map((s) => (
            <li key={s.key} className="flex items-center gap-3">
              <span className={cx('flex h-6 w-6 items-center justify-center rounded-full text-xs',
                s.state === 'done' && 'bg-pass text-white',
                s.state === 'active' && 'bg-brand text-white fp-pulse',
                s.state === 'pending' && 'border border-line-strong text-faint',
                s.state === 'failed' && 'bg-fail text-white',
              )}>
                {s.state === 'done' ? <Icon name="check" size={13} /> : s.state === 'active' ? <Icon name="clock" size={13} /> : ''}
              </span>
              <span className={cx('text-sm', s.state === 'pending' ? 'text-faint' : 'text-ink-700')}>{s.label}</span>
            </li>
          ))}
        </ol>

        {failed ? (
          <div className="mt-6">
            <Alert tone="error" title="A document could not be processed" action={<Button size="sm" variant="secondary" onClick={() => { setFailed(false); setJob(makeJob(id)); }}>Retry</Button>}>
              OCR could not read one scanned page reliably. You can retry, or continue — affected facts will be flagged as low confidence.
            </Alert>
          </div>
        ) : (
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setFailed(true)} className="text-xs text-faint underline hover:text-muted">Simulate a processing failure</button>
            <Button disabled={!done} onClick={() => navigate(`/assessment/${id}/extraction`)}>
              Review extracted facts <Icon name="arrow" size={16} />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------ Extraction review */
const GROUP_LABELS: Record<string, string> = { identity: 'Identity & demographic', economic: 'Economic', business: 'Business / project', evidence: 'Eligibility evidence' };

export function ExtractionReview() {
  const { id = CASE } = useParams();
  const { activeCase, updateFact } = useCase();
  const navigate = useNavigate();
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  if (!activeCase) return null;
  const groups = ['identity', 'economic', 'business', 'evidence'] as const;
  const lowConf = activeCase.facts.filter((f) => f.confidence < 0.7).length;

  return (
    <div className="fp-fade-in">
      <Stepper current="extraction" caseId={id} />
      <PageHeader title="Review extracted information" subtitle="Every fact is linked to its source document and page. Correct anything that looks wrong before we evaluate your eligibility." breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Review facts' }]} />

      {lowConf > 0 && (
        <div className="mb-5">
          <Alert tone="warning" title={`${lowConf} field(s) extracted with low confidence`}>
            Low-confidence values are highlighted. Confirm or correct them — uncertain facts can route a scheme to “Needs review”.
          </Alert>
        </div>
      )}

      <div className="space-y-6">
        {groups.map((g) => {
          const facts = activeCase.facts.filter((f) => f.group === g);
          if (!facts.length) return null;
          return (
            <Card key={g} className="overflow-hidden">
              <div className="border-b border-line bg-surface-sunken/50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted">{GROUP_LABELS[g]}</div>
              <div className="divide-y divide-line">
                {facts.map((f) => (
                  <div key={f.factId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="w-32 shrink-0 text-sm font-medium text-ink">{f.label}</div>
                    <div className="flex-1 min-w-[140px]">
                      {editing === f.factId ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            className="w-full rounded-[6px] border border-brand px-2.5 py-1.5 text-sm text-ink outline-none"
                          />
                          <Button size="sm" onClick={() => { updateFact(f.factId, draft); setEditing(null); toast({ tone: 'success', msg: `${f.label} updated` }); }}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <span className="text-sm text-ink">{f.value}{f.unit ? ` ${f.unit}` : ''}</span>
                      )}
                    </div>
                    <ConfidenceIndicator value={f.confidence} />
                    <div className="w-40 shrink-0 text-xs text-muted">
                      {f.source ? (
                        <span className="inline-flex items-center gap-1"><Icon name="doc" size={12} className="text-faint" />{f.source.documentName} · p.{f.source.page}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-review"><Icon name="alert" size={12} /> No source</span>
                      )}
                    </div>
                    {f.editable && editing !== f.factId && (
                      <button onClick={() => { setEditing(f.factId); setDraft(f.value); }} className="rounded p-1.5 text-faint hover:bg-surface-sunken hover:text-brand" aria-label={`Edit ${f.label}`}>
                        <Icon name="edit" size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted">Confirm these facts to run the deterministic rule engine.</p>
        <Button onClick={() => navigate(`/assessment/${id}/schemes`)}>Confirm & find schemes <Icon name="arrow" size={16} /></Button>
      </div>
    </div>
  );
}
