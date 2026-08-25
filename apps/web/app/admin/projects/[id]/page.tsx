'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { DeadlineCountdown } from '@/components/ui/DeadlineCountdown';
import { FileUploader } from '@/components/ui/FileUploader';

const PIPELINE_STAGES = [
  { key: 'received',       label: 'Received',    step: 1 },
  { key: 'assigned',       label: 'Assigned',    step: 2 },
  { key: 'in_progress',    label: 'In Progress', step: 3 },
  { key: 'delivered',      label: 'Delivered',   step: 4 },
  { key: 'sent_to_client', label: 'Dispatched',  step: 5 },
];

export default function AdminProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [showAssign, setShowAssign] = useState(false);
  const [showDeliver, setShowDeliver] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [invoice, setInvoice] = useState('');
  const [merchantFeePercent, setMerchantFeePercent] = useState<number>(0);
  const [decidedPrice, setDecidedPrice] = useState<number>(0);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState('');

  // RFI answering & forwarding
  const [answeringRfiId, setAnsweringRfiId] = useState<string | null>(null);
  const [adminAnswerText, setAdminAnswerText] = useState<string>('');
  const [rfiActionLoading, setRfiActionLoading] = useState(false);

  // File management
  const [showAdminUpload, setShowAdminUpload] = useState(false);

  const assignForm = useForm();
  const deliverForm = useForm();

  const loadProject = useCallback(async () => {
    try {
      const p = await api.get<any>(`/projects/${id}`);
      setProject(p);
      setInvoice(p.invoice ?? '');
      setDecidedPrice(Number(p.decidedPrice) || 0);
      setMerchantFeePercent(Number(p.merchantFeePercent) || 0);
    } catch (err: any) {
      showToast(err.message || 'Failed to load project', 'error');
    }
  }, [id]);

  useEffect(() => {
    loadProject();
    api.get<any>('/users/engineers').then(setEngineers).catch(() => {});
  }, [loadProject]);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function onAssign(data: any) {
    setError('');
    try {
      await api.patch(`/projects/${id}/assign`, data);
      await loadProject();
      setShowAssign(false);
      showToast('Project assigned successfully to engineer');
    } catch (e: any) {
      setError(e.message || 'Failed to assign project');
    }
  }

  async function openDeliver() {
    setError('');
    try {
      const p = await api.get<any>(`/delivery/${id}/preview`);
      setPreview(p);
      deliverForm.setValue('to', p.to);
      deliverForm.setValue('subject', p.subject);
      deliverForm.setValue('body', p.body);
      deliverForm.setValue('deliveryMethod', p.deliveryMethod || 'attachment');
      deliverForm.setValue('invoice', p.invoice ?? invoice ?? '');
      setShowDeliver(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to load delivery preview', 'error');
    }
  }

  async function onSend(data: any) {
    setError('');
    setSendLoading(true);
    try {
      const res = await api.post<any>(`/delivery/${id}/send`, {
        ...data,
        merchantFeePercent,
      });
      await loadProject();
      setShowDeliver(false);
      showToast(`Deliverables successfully emailed to ${res.sentTo || project.clientEmail}!`);
    } catch (e: any) {
      setError(e.message || 'Email delivery failed');
    } finally {
      setSendLoading(false);
    }
  }

  function recalculateInvoice(price: number, feePct: number) {
    const feeAmt = Number((price * (feePct / 100)).toFixed(2));
    const totalDue = Number((price + feeAmt).toFixed(2));

    const generated = `=======================================================
               OFFICIAL INVOICE & BREAKDOWN
=======================================================
Client Company:   ${project.clientCompanyName || project.clientName}
Attention:        ${project.clientContactPerson || 'Project Management'}
Project Ref:      ${project.referenceNumber}
Service Type:     ${project.projectType === 'design_drafting' ? 'CAD Architectural Design & Drafting' : 'Construction Takeoff & Cost Estimation'}

Scope Summary:
${project.scopeDescription}

-------------------------------------------------------
FINANCIAL BREAKDOWN
-------------------------------------------------------
Base Project Fee:             $${price.toFixed(2)}
Merchant / Processing Fee:    ${feePct > 0 ? `${feePct}% ($${feeAmt.toFixed(2)})` : '$0.00'}
-------------------------------------------------------
TOTAL AMOUNT DUE:             $${totalDue.toFixed(2)}
=======================================================`;

    setInvoice(generated);
  }

  async function saveInvoiceAndMerchantFee(e: React.FormEvent) {
    e.preventDefault();
    setInvoiceLoading(true);
    try {
      await api.patch(`/projects/${id}/merchant-fee`, {
        merchantFeePercent,
      });
      await api.patch(`/projects/${id}/status`, {
        status: project.status,
        decidedPrice,
      });
      await loadProject();
      setShowInvoice(false);
      showToast('Invoice & merchant fees saved successfully');
    } catch (e: any) {
      showToast('Failed to save invoice', 'error');
    } finally {
      setInvoiceLoading(false);
    }
  }

  async function deleteFile(fileId: string) {
    if (!confirm('Are you sure you want to remove this file from the project?')) return;
    try {
      await api.delete(`/projects/${id}/files/${fileId}`);
      showToast('File removed successfully');
      await loadProject();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove file', 'error');
    }
  }

  async function handleAnswerRfi(rfiId: string) {
    if (!adminAnswerText.trim()) return;
    setRfiActionLoading(true);
    try {
      await api.patch(`/projects/${id}/rfis/${rfiId}/answer`, {
        adminAnswer: adminAnswerText,
      });
      setAnsweringRfiId(null);
      setAdminAnswerText('');
      showToast('Answer sent to engineer');
      await loadProject();
    } catch (err: any) {
      showToast(err.message || 'Failed to answer RFI', 'error');
    } finally {
      setRfiActionLoading(false);
    }
  }

  async function handleForwardRfiToClient(rfiId: string) {
    if (!confirm(`Forward this RFI to client (${project.clientEmail}) via email?`)) return;
    setRfiActionLoading(true);
    try {
      await api.post(`/projects/${id}/rfis/${rfiId}/forward-client`, {});
      showToast(`RFI forwarded to client (${project.clientEmail})`);
      await loadProject();
    } catch (err: any) {
      showToast(err.message || 'Failed to forward RFI', 'error');
    } finally {
      setRfiActionLoading(false);
    }
  }

  async function deleteProject() {
    if (!confirm(`Permanently delete project ${project.referenceNumber}?\n\nThis will remove all associated drawings, files, deliverables, and histories. This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/projects/${id}`);
      showToast(`Project ${project.referenceNumber} permanently deleted.`);
      setTimeout(() => router.push('/admin/dashboard'), 800);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete project', 'error');
    }
  }

  async function downloadFile(fileId: string, type: 'intake' | 'deliverable') {
    try {
      const r = await api.get<any>(`/files/${fileId}/download-url?type=${type}`);
      window.open(r.url, '_blank');
    } catch (err: any) {
      showToast('Failed to generate download link', 'error');
    }
  }

  if (!project) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-2xl shimmer border border-zinc-800" />
        ))}
      </div>
    );
  }

  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.key === project.status);
  const isDispatched = project.status === 'sent_to_client';
  const isEstimation = (project.projectType || 'estimation') === 'estimation';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-2xl shadow-2xl animate-scale-in border flex items-center gap-3 backdrop-blur-xl ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
              : 'bg-red-500/20 border-red-500/40 text-red-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Back Navigation & Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="btn-ghost text-xs group cursor-pointer"
        >
          <svg className="w-4 h-4 text-zinc-400 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Pipeline
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={deleteProject}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Delete this project permanently"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Delete Project
          </button>
        </div>
      </div>

      {/* Dispatched History Banner */}
      {isDispatched && (
        <div className="glass-card p-4 border-indigo-500/40 bg-indigo-500/10 flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-200">Completed & Dispatched to Client</p>
              <p className="text-xs text-indigo-300/80 font-mono">Sent to: {project.clientEmail} · Invoice & Deliverables Delivered</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
            Completed Deal
          </span>
        </div>
      )}

      {/* ── Project Header ── */}
      <div className="glass-card p-6 border-zinc-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xl sm:text-2xl font-bold text-yellow-400">
                {project.referenceNumber}
              </span>
              <StatusBadge status={project.status} />
              {project.priority && <PriorityBadge priority={project.priority} />}
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border uppercase ${
                isEstimation ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}>
                {isEstimation ? '📐 Cost Estimation' : '🏛️ Design & Drafting'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 font-display">
              {project.clientCompanyName || project.clientName}
            </h2>
            {project.clientContactPerson && (
              <p className="text-xs text-zinc-300 font-semibold mt-0.5">
                Attention: <span className="text-yellow-300">{project.clientContactPerson}</span>
              </p>
            )}
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{project.clientEmail} · {project.clientPhone}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                recalculateInvoice(decidedPrice, merchantFeePercent);
                setShowInvoice(true);
              }}
              className="btn-secondary text-xs py-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Invoice & Merchant Fee
            </button>

            <button
              onClick={() => setShowAssign(true)}
              className="btn-secondary text-xs py-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              {project.assignedEngineer ? 'Reassign Engineer' : 'Manage & Assign'}
            </button>

            {project.status === 'delivered' && (
              <button
                onClick={openDeliver}
                className="btn-primary text-xs py-2.5 animate-pulse-glow cursor-pointer"
              >
                <svg className="w-4 h-4 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                Send to Client & Invoice
              </button>
            )}
          </div>
        </div>

        {/* Commercial Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-800">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <p className="text-[11px] text-zinc-500 font-semibold uppercase">Salesperson</p>
            <p className="text-sm font-bold text-zinc-200 mt-0.5">{project.salespersonName || 'N/A'}</p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <p className="text-[11px] text-zinc-500 font-semibold uppercase">Agreed Base Price</p>
            <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
              ${Number(project.decidedPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <p className="text-[11px] text-zinc-500 font-semibold uppercase">Merchant Fee</p>
            <p className="text-sm font-bold text-amber-400 font-mono mt-0.5">
              {project.merchantFeePercent ? `${project.merchantFeePercent}%` : '0%'} (${Number(project.merchantFeeAmount || 0).toFixed(2)})
            </p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <p className="text-[11px] text-zinc-500 font-semibold uppercase">Total Invoice Due</p>
            <p className="text-sm font-bold text-yellow-400 font-mono mt-0.5">
              ${Number(project.totalPrice || project.decidedPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* ── RFI (Request for Information) Desk ── */}
      <div className="glass-card p-6 border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-sm">
              ❓
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Engineering Requests for Information (RFI)</h3>
              <p className="text-xs text-zinc-400">Questions raised by engineers regarding drawings or scope clarifications</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 font-mono">
            {project.rfis?.length || 0} Total
          </span>
        </div>

        {!project.rfis || project.rfis.length === 0 ? (
          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-center">
            <p className="text-xs text-zinc-500">No open RFIs. Engineer has all required drawing sheets.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {project.rfis.map((rfi: any) => {
              const isPending = rfi.status === 'pending';
              const isForwarded = rfi.status === 'forwarded_to_client';
              const isAnswered = rfi.status === 'answered';

              return (
                <div key={rfi.id} className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
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
                          📎 Attachment: {rfi.attachmentName}
                        </p>
                      )}
                      <p className="text-[10px] text-zinc-500 mt-2">
                        Raised by {rfi.engineer?.fullName || 'Assigned Engineer'} on {new Date(rfi.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* RFI Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isAnswered && (
                        <>
                          <button
                            onClick={() => {
                              setAnsweringRfiId(rfi.id);
                              setAdminAnswerText(rfi.adminAnswer || '');
                            }}
                            className="btn-secondary text-xs py-1.5 px-3 cursor-pointer"
                          >
                            Answer RFI
                          </button>
                          <button
                            onClick={() => handleForwardRfiToClient(rfi.id)}
                            disabled={rfiActionLoading}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 cursor-pointer"
                            title="Send email directly to client contact"
                          >
                            Forward to Client ✉️
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Display Admin Answer if present */}
                  {rfi.adminAnswer && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
                      <p className="font-bold text-emerald-300 mb-0.5">Admin Answer:</p>
                      <p className="whitespace-pre-wrap">{rfi.adminAnswer}</p>
                    </div>
                  )}

                  {/* Inline Answer Form */}
                  {answeringRfiId === rfi.id && (
                    <div className="pt-2 border-t border-zinc-800 space-y-2 animate-fade-in">
                      <label className="block text-xs font-bold text-zinc-300">Your Response / Clarification:</label>
                      <textarea
                        value={adminAnswerText}
                        onChange={(e) => setAdminAnswerText(e.target.value)}
                        rows={3}
                        className="input text-xs resize-none"
                        placeholder="Provide details or instructions for the engineer..."
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setAnsweringRfiId(null)}
                          className="btn-secondary text-xs py-1 px-3 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={rfiActionLoading || !adminAnswerText.trim()}
                          onClick={() => handleAnswerRfi(rfi.id)}
                          className="btn-primary text-xs py-1 px-4 cursor-pointer font-bold"
                        >
                          {rfiActionLoading ? 'Saving...' : 'Send Answer to Engineer ✓'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Files & Deliverables Management ── */}
      <div className="glass-card p-6 border-zinc-800 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Project Files, Drawings & Deliverables</h3>
            <p className="text-xs text-zinc-400">Admin can upload supplementary drawings or remove obsolete files</p>
          </div>

          <button
            onClick={() => setShowAdminUpload(!showAdminUpload)}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {showAdminUpload ? 'Hide Upload' : '+ Upload Additional File'}
          </button>
        </div>

        {showAdminUpload && (
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 animate-fade-in space-y-3">
            <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
              Upload Drawings / Specs / Addenda
            </p>
            <FileUploader
              projectId={project.id}
              fileType="intake"
              onUpload={() => {
                showToast('File uploaded successfully');
                loadProject();
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client / Project Files */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Input Drawings & Specs</span>
              <span className="text-xs font-mono text-zinc-500">{project.files?.length || 0} Files</span>
            </div>

            {project.files && project.files.length > 0 ? (
              <div className="space-y-2">
                {project.files.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/60 text-xs">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-medium text-zinc-200 truncate">{f.originalName}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{(f.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => downloadFile(f.id, 'intake')}
                        className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-300 transition-colors"
                        title="Download"
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={() => deleteFile(f.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic py-2">No input drawings uploaded yet.</p>
            )}
          </div>

          {/* Deliverables */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Completed Deliverables</span>
              <span className="text-xs font-mono text-emerald-400">{project.deliverables?.length || 0} Deliverables</span>
            </div>

            {project.deliverables && project.deliverables.length > 0 ? (
              <div className="space-y-2">
                {project.deliverables.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-medium text-emerald-300 truncate">{d.originalName}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{(d.sizeBytes / 1024 / 1024).toFixed(2)} MB · {new Date(d.uploadedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => downloadFile(d.id, 'deliverable')}
                        className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-300 transition-colors"
                        title="Download"
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={() => deleteFile(d.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                        title="Remove deliverable"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic py-2">No deliverables uploaded by engineer yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Assign Engineer Modal ── */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card max-w-lg w-full p-6 space-y-5 border-zinc-700 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <p className="text-xs font-mono text-yellow-400 font-semibold">{project.referenceNumber}</p>
                <h3 className="text-base font-bold text-white mt-0.5">Assign Project to Engineer</h3>
              </div>
              <button
                onClick={() => setShowAssign(false)}
                className="text-zinc-500 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={assignForm.handleSubmit(onAssign)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Select Engineer *
                </label>
                <select
                  {...assignForm.register('engineerId', { required: true })}
                  defaultValue={project.assignedTo || ''}
                  className="input text-sm"
                >
                  <option value="">-- Choose Engineer --</option>
                  {engineers.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.role.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                    Internal Deadline *
                  </label>
                  <input
                    type="date"
                    {...assignForm.register('internalDeadline', { required: true })}
                    defaultValue={project.internalDeadline ? project.internalDeadline.split('T')[0] : ''}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                    Priority Level *
                  </label>
                  <select
                    {...assignForm.register('priority')}
                    defaultValue={project.priority || 'normal'}
                    className="input text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Admin Instructions for Engineer
                </label>
                <textarea
                  {...assignForm.register('adminInstructions')}
                  defaultValue={project.adminInstructions || ''}
                  rows={3}
                  className="input text-xs resize-none"
                  placeholder="Special trade instructions, specific sheet numbers to takeoff..."
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssign(false)}
                  className="btn-secondary flex-1 py-2.5 text-xs text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-2.5 text-xs font-bold text-center cursor-pointer"
                >
                  Save Assignment ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Invoice & Dynamic Merchant Fee Modal ── */}
      {showInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card max-w-xl w-full p-6 space-y-5 border-zinc-700 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <p className="text-xs font-mono text-yellow-400 font-semibold">{project.referenceNumber}</p>
                <h3 className="text-base font-bold text-white mt-0.5">Commercial Invoice & Merchant Fee</h3>
              </div>
              <button
                onClick={() => setShowInvoice(false)}
                className="text-zinc-500 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveInvoiceAndMerchantFee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                    Decided Price ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={decidedPrice}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDecidedPrice(val);
                      recalculateInvoice(val, merchantFeePercent);
                    }}
                    className="input text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                    Merchant Fee (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={merchantFeePercent}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setMerchantFeePercent(val);
                        recalculateInvoice(decidedPrice, val);
                      }}
                      className="input text-sm font-mono font-bold pr-8"
                      placeholder="e.g. 3.0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* Live Computed Calculation Banner */}
              <div className="p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Calculated Total Due:</span>
                <span className="font-mono text-base font-bold text-yellow-400">
                  ${(decidedPrice + (decidedPrice * (merchantFeePercent / 100))).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Itemized Invoice Preview (Editable)
                </label>
                <textarea
                  value={invoice}
                  onChange={(e) => setInvoice(e.target.value)}
                  rows={8}
                  className="input font-mono text-xs resize-none bg-zinc-950"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvoice(false)}
                  className="btn-secondary flex-1 py-2.5 text-xs text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={invoiceLoading}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold text-center cursor-pointer"
                >
                  {invoiceLoading ? 'Saving...' : 'Save Invoice & Fee ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Client Delivery Modal ── */}
      {showDeliver && preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card max-w-xl w-full p-6 space-y-5 border-zinc-700 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <p className="text-xs font-mono text-yellow-400 font-semibold">{project.referenceNumber}</p>
                <h3 className="text-base font-bold text-white mt-0.5">Send Deliverables & Invoice to Client</h3>
              </div>
              <button
                onClick={() => setShowDeliver(false)}
                className="text-zinc-500 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={deliverForm.handleSubmit(onSend)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Recipient Client Email</label>
                <input {...deliverForm.register('to', { required: true })} className="input text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Subject Line</label>
                <input {...deliverForm.register('subject', { required: true })} className="input text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Email Body</label>
                <textarea {...deliverForm.register('body')} rows={4} className="input text-xs resize-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Attached Invoice Breakdown</label>
                <textarea {...deliverForm.register('invoice')} rows={4} className="input font-mono text-xs resize-none bg-zinc-950" />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeliver(false)}
                  className="btn-secondary flex-1 py-2.5 text-xs text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendLoading}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold text-center cursor-pointer"
                >
                  {sendLoading ? 'Dispatching Email...' : 'Send to Client 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
