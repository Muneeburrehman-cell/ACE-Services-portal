'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { DeadlineCountdown } from '@/components/ui/DeadlineCountdown';
import { FileUploader } from '@/components/ui/FileUploader';

export default function EngineerProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [rfis, setRfis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // RFI Modal State
  const [showRfiModal, setShowRfiModal] = useState(false);
  const [rfiTitle, setRfiTitle] = useState('');
  const [rfiQuestion, setRfiQuestion] = useState('');
  const [rfiAttachmentName, setRfiAttachmentName] = useState('');
  const [rfiSubmitting, setRfiSubmitting] = useState(false);

  // Mark Delivered State
  const [markingDelivered, setMarkingDelivered] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const p = await api.get<any>(`/projects/${id}`);
      setProject(p);
      setDeliverables(p.deliverables ?? []);
      setRfis(p.rfis ?? []);
      if (p.status === 'assigned') {
        api.patch(`/projects/${id}/status-in-progress`).catch(() => {});
      }
    } catch {
      showToast('Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function downloadFile(fileId: string, type: 'intake' | 'deliverable' = 'intake') {
    try {
      const res = await api.get<any>(`/files/${fileId}/download-url?type=${type}`);
      window.open(res.url, '_blank');
    } catch {
      showToast('Failed to download file');
    }
  }

  async function handleCreateRfi(e: React.FormEvent) {
    e.preventDefault();
    if (!rfiTitle.trim() || !rfiQuestion.trim()) return;
    setRfiSubmitting(true);
    try {
      await api.post(`/projects/${id}/rfis`, {
        title: rfiTitle,
        question: rfiQuestion,
        attachmentName: rfiAttachmentName || undefined,
      });
      setShowRfiModal(false);
      setRfiTitle('');
      setRfiQuestion('');
      setRfiAttachmentName('');
      showToast('RFI submitted to Administrator ✓');
      await loadProject();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit RFI');
    } finally {
      setRfiSubmitting(false);
    }
  }

  async function handleMarkDelivered() {
    if (deliverables.length === 0) {
      alert('Please upload at least one completed deliverable file before submitting.');
      return;
    }
    if (!confirm('Mark deliverables complete and submit to administrator for client dispatch?')) return;
    setMarkingDelivered(true);
    try {
      await api.patch(`/projects/${id}/mark-delivered`, {});
      showToast('Deliverables marked complete! Admin notified.');
      await loadProject();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete project');
    } finally {
      setMarkingDelivered(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-2xl shimmer border border-zinc-800" />
        ))}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="glass-card text-center py-16 text-zinc-400">
        <p className="text-lg font-bold">Project not found or not assigned to your account</p>
        <button onClick={() => router.back()} className="btn-secondary text-xs mt-4">
          Back to Work Queue
        </button>
      </div>
    );
  }

  const canUpload = !['delivered', 'sent_to_client'].includes(project.status);
  const isEstimation = (project.projectType || 'estimation') === 'estimation';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs animate-scale-in">
          {toast}
        </div>
      )}

      {/* Back navigation */}
      <button onClick={() => router.back()} className="btn-ghost text-xs group cursor-pointer">
        <svg className="w-4 h-4 text-zinc-400 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Work Queue
      </button>

      {/* Header Banner */}
      <div className="glass-card p-6 border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-1.5">
            <span className="font-mono text-2xl font-bold text-yellow-400">
              {project.referenceNumber}
            </span>
            <StatusBadge status={project.status} />
            {project.priority && <PriorityBadge priority={project.priority} />}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isEstimation ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              {isEstimation ? '📐 Cost Estimation Desk' : '🏛️ Design & Drafting Desk'}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Engineering workspace · Confidential client data protected
          </p>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase font-semibold">Internal Due Date</p>
          <DeadlineCountdown deadline={project.internalDeadline} />
        </div>
      </div>

      {/* Scope & Instructions */}
      <div className="glass-card p-6 border-zinc-800 space-y-4">
        <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
          Project Scope & Production Instructions
        </h3>

        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Scope Description</p>
          <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap bg-zinc-950/60 p-4 rounded-xl border border-zinc-800">
            {project.scopeDescription}
          </p>
        </div>

        {project.adminInstructions && (
          <div>
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-1.5">Admin Guidelines</p>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap bg-yellow-400/5 border border-yellow-400/20 p-4 rounded-xl">
              {project.adminInstructions}
            </p>
          </div>
        )}
      </div>

      {/* Project Intake Drawings */}
      <div className="glass-card p-6 border-zinc-800 space-y-4">
        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Client Blueprint & Specification Files ({project.files?.length ?? 0})
        </h3>

        {(!project.files || project.files.length === 0) ? (
          <p className="text-zinc-500 text-xs italic py-2">No drawing files attached to this project.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {project.files.map((file: any) => (
              <div
                key={file.id}
                className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-3 group hover:border-zinc-700 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-yellow-300 transition-colors">
                    {file.originalName}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => downloadFile(file.id, 'intake')}
                  className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5 cursor-pointer"
                >
                  Download ⬇️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RFI (Request for Information) Desk ── */}
      <div className="glass-card p-6 border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-sm">
              ❓
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Requests for Information (RFI)</h3>
              <p className="text-xs text-zinc-400">Ask the administrator or client for missing drawings or scope clarifications</p>
            </div>
          </div>

          <button
            onClick={() => setShowRfiModal(true)}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer"
          >
            + Raise New RFI
          </button>
        </div>

        {rfis.length === 0 ? (
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center">
            <p className="text-xs text-zinc-500">No RFIs raised yet. If you have questions about dimensions or schedules, click Raise New RFI.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rfis.map((rfi: any) => {
              const isPending = rfi.status === 'pending';
              const isForwarded = rfi.status === 'forwarded_to_client';
              const isAnswered = rfi.status === 'answered';

              return (
                <div key={rfi.id} className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2.5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-100">{rfi.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isPending ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          isForwarded ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {rfi.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 whitespace-pre-wrap">{rfi.question}</p>
                      {rfi.attachmentName && (
                        <p className="text-xs text-yellow-300 font-mono mt-1 flex items-center gap-1">
                          📎 Attached: {rfi.attachmentName}
                        </p>
                      )}
                      <p className="text-[10px] text-zinc-500 mt-1.5">
                        Submitted: {new Date(rfi.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Admin Answer */}
                  {rfi.adminAnswer ? (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
                      <p className="font-bold text-emerald-300 mb-0.5">Admin / Client Answer:</p>
                      <p className="whitespace-pre-wrap">{rfi.adminAnswer}</p>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-zinc-800/40 text-[11px] text-zinc-400 italic">
                      {isForwarded ? 'Forwarded to client via email. Awaiting client reply.' : 'Awaiting review by Administrator.'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Deliverables Upload & Completion ── */}
      <div className="glass-card p-6 border-zinc-800 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Deliverables</h3>
            <p className="text-xs text-zinc-400">Upload Excel material takeoffs, CAD sheets, and final calculation reports</p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            {deliverables.length} Deliverable{deliverables.length !== 1 ? 's' : ''}
          </span>
        </div>

        {canUpload && (
          <FileUploader
            projectId={project.id}
            fileType="deliverable"
            onUpload={(file) => {
              setDeliverables(prev => [...prev, file]);
              showToast(`Uploaded ${file.originalName}`);
              loadProject();
            }}
          />
        )}

        {!canUpload && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-semibold">
            Delivered ✓
          </div>
        )}

        {deliverables.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Uploaded Files</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {deliverables.map((d: any) => (
                <div key={d.id} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-semibold text-emerald-300 truncate">{d.originalName}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{(d.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={() => downloadFile(d.id, 'deliverable')}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
                  >
                    ⬇️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Submit Button */}
        {canUpload && (
          <div className="pt-4 border-t border-zinc-800 flex justify-end">
            <button
              onClick={handleMarkDelivered}
              disabled={markingDelivered || deliverables.length === 0}
              className="btn-primary text-xs py-3 px-8 font-bold cursor-pointer shadow-lg shadow-yellow-400/20"
            >
              {markingDelivered ? 'Submitting...' : 'Complete & Submit to Admin for Dispatch ✓'}
            </button>
          </div>
        )}
      </div>

      {/* ── Raise RFI Modal ── */}
      {showRfiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card max-w-lg w-full p-6 space-y-5 border-zinc-700 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <p className="text-xs font-mono text-yellow-400 font-semibold">{project.referenceNumber}</p>
                <h3 className="text-base font-bold text-white mt-0.5">Raise Request for Information (RFI)</h3>
              </div>
              <button
                onClick={() => setShowRfiModal(false)}
                className="text-zinc-500 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRfi} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  RFI Subject / Title *
                </label>
                <input
                  type="text"
                  required
                  value={rfiTitle}
                  onChange={(e) => setRfiTitle(e.target.value)}
                  className="input text-sm"
                  placeholder="e.g. Missing Structural Sheet S-102 or Foundation Specs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Detailed Question / Clarification *
                </label>
                <textarea
                  required
                  rows={4}
                  value={rfiQuestion}
                  onChange={(e) => setRfiQuestion(e.target.value)}
                  className="input text-xs resize-none"
                  placeholder="Please specify which dimension, schedule, or trade specification needs confirmation..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Supporting Document Reference (Optional)
                </label>
                <input
                  type="text"
                  value={rfiAttachmentName}
                  onChange={(e) => setRfiAttachmentName(e.target.value)}
                  className="input text-sm"
                  placeholder="e.g. Sheet A-201 Section 4"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRfiModal(false)}
                  className="btn-secondary flex-1 py-2.5 text-xs text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rfiSubmitting}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold text-center cursor-pointer"
                >
                  {rfiSubmitting ? 'Submitting...' : 'Send RFI to Admin ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
