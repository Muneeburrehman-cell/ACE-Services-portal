'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { FileUploader } from '@/components/ui/FileUploader';

const schema = z.object({
  clientCompanyName:   z.string().min(2, 'Client company name is required'),
  clientContactPerson: z.string().min(2, 'Contact person name is required'),
  salespersonName:     z.string().optional(),
  decidedPrice:        z.coerce.number().min(1, 'Please enter the agreed price ($)'),
  projectType:         z.enum(['estimation', 'design_drafting']),
  clientEmail:         z.string().email('Valid email address required'),
  clientPhone:         z.string().min(7, 'Phone number is required'),
  scopeDescription:    z.string().min(10, 'Please provide at least 10 characters describing project scope'),
  requestedDeadline:   z.string().min(1, 'Requested deadline is required'),
});

type FormData = z.infer<typeof schema>;

export default function SubmitProjectPage() {
  const router = useRouter();
  const [stage, setStage] = useState<1 | 2>(1);
  const [projectId, setProjectId] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [files, setFiles] = useState<{ id: string; originalName: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectType: 'estimation',
      decidedPrice: undefined,
      clientCompanyName: '',
      clientContactPerson: '',
      salespersonName: '',
      clientEmail: '',
      clientPhone: '',
      scopeDescription: '',
      requestedDeadline: '',
    },
  });

  const selectedType = form.watch('projectType');

  async function handleCreateProject(data: FormData) {
    setError('');
    setSubmitting(true);
    try {
      const p = await api.post<any>('/projects', data);
      setProjectId(p.id);
      setReferenceNumber(p.referenceNumber);
      setStage(2);
    } catch (e: any) {
      setError(e.message || 'Failed to create project record');
    } finally {
      setSubmitting(false);
    }
  }

  function handleFinalSubmit() {
    if (files.length === 0) {
      setError('Please upload at least one blueprint, PDF, or specification drawing.');
      return;
    }
    setDone(true);
    setTimeout(() => {
      window.location.href = '/bd/dashboard';
    }, 1800);
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center animate-scale-in">
        <div className="glass-card p-10 border-emerald-500/30 shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="font-display text-3xl font-bold text-white mb-2">Project Registered!</h2>
          <p className="text-yellow-400 font-mono text-sm font-bold tracking-wider mb-4 bg-yellow-400/10 border border-yellow-400/20 px-4 py-1.5 rounded-full inline-block">
            {referenceNumber}
          </p>
          <p className="text-zinc-400 text-sm">
            {files.length} drawing/spec file{files.length !== 1 ? 's' : ''} uploaded. Email alert sent to Administrator.
          </p>
          <div className="w-full bg-zinc-800 h-1 rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-yellow-400 animate-[shimmer_1.8s_infinite] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Stepper Progress Bar */}
      <div className="glass-card p-4 border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
            stage === 1 ? 'bg-yellow-400 text-zinc-950 ring-4 ring-yellow-400/20 font-bold' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {stage === 1 ? '1' : '✓'}
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-200">Step 1: Scope & Pricing</p>
            <p className="text-[10px] text-zinc-500">Step 1 of 2 — Client details and project scope</p>
          </div>
        </div>

        <div className="w-12 h-0.5 bg-zinc-800 hidden sm:block" />

        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
            stage === 2 ? 'bg-yellow-400 text-zinc-950 ring-4 ring-yellow-400/20 font-bold' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
          }`}>
            2
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-200">Step 2: Drawing Files</p>
            <p className="text-[10px] text-zinc-500">Step 2 of 2 — Attach project files</p>
          </div>
        </div>
      </div>

      {/* ── Stage 1: Form ── */}
      {stage === 1 && (
        <form onSubmit={form.handleSubmit(handleCreateProject)} className="space-y-5 animate-fade-in-up">
          {/* Department / Category Selector */}
          <div className="glass-card p-5 border-zinc-800 space-y-3">
            <label className="block text-xs font-bold text-yellow-400 uppercase tracking-widest">
              Select Department / Service Category *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => form.setValue('projectType', 'estimation')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  selectedType === 'estimation'
                    ? 'bg-orange-500/15 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm">
                  📐
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-100">Cost Estimation & Takeoff</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Quantity takeoffs, material & labor cost estimation</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => form.setValue('projectType', 'design_drafting')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  selectedType === 'design_drafting'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  🏛️
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-100">Design & CAD Drafting</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Architectural 2D/3D CAD plans, permit drawings</p>
                </div>
              </button>
            </div>
          </div>

          {/* Client & Sales Details */}
          <div className="glass-card p-6 border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              </svg>
              Client & Commercial Terms
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Client Company Name *
                </label>
                <input
                  {...form.register('clientCompanyName')}
                  className="input text-sm"
                  placeholder="e.g. Apex Builders Corp."
                />
                {form.formState.errors.clientCompanyName && (
                  <p className="text-red-400 text-xs mt-1">{String(form.formState.errors.clientCompanyName.message)}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Contact Person Name *
                </label>
                <input
                  {...form.register('clientContactPerson')}
                  className="input text-sm"
                  placeholder="e.g. John Smith"
                />
                {form.formState.errors.clientContactPerson && (
                  <p className="text-red-400 text-xs mt-1">{String(form.formState.errors.clientContactPerson.message)}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Salesperson Name
                </label>
                <input
                  {...form.register('salespersonName')}
                  className="input text-sm"
                  placeholder="e.g. Sarah Jenkins"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Decided Price ($ USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                  <input
                    {...form.register('decidedPrice')}
                    type="number"
                    step="0.01"
                    className="input text-sm pl-8 font-mono font-semibold"
                    placeholder="e.g. 750.00"
                  />
                </div>
                {form.formState.errors.decidedPrice && (
                  <p className="text-red-400 text-xs mt-1">{String(form.formState.errors.decidedPrice.message)}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Client Email *</label>
                <input {...form.register('clientEmail')} type="email" className="input text-sm" placeholder="contact@apexbuilders.com" />
                {form.formState.errors.clientEmail && <p className="text-red-400 text-xs mt-1">{String(form.formState.errors.clientEmail.message)}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Phone Number *</label>
                <input {...form.register('clientPhone')} type="tel" className="input text-sm" placeholder="+1 (555) 345-6789" />
                {form.formState.errors.clientPhone && <p className="text-red-400 text-xs mt-1">{String(form.formState.errors.clientPhone.message)}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Requested Client Deadline *</label>
                <input {...form.register('requestedDeadline')} type="date" className="input text-sm" />
                {form.formState.errors.requestedDeadline && <p className="text-red-400 text-xs mt-1">{String(form.formState.errors.requestedDeadline.message)}</p>}
              </div>
            </div>
          </div>

          {/* Scope of Work */}
          <div className="glass-card p-6 border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Scope Description & Technical Notes *
            </h3>
            <textarea
              {...form.register('scopeDescription')}
              rows={4}
              className="input text-sm resize-none"
              placeholder="Describe the trade scopes (e.g. Concrete framing, Drywall takeoff, Electrical single-line drafting), structural sheets included, CSI divisions, and special instructions..."
            />
            {form.formState.errors.scopeDescription && (
              <p className="text-red-400 text-xs mt-1">{String(form.formState.errors.scopeDescription.message)}</p>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => router.push('/bd/dashboard')}
              className="btn-secondary text-xs py-2.5 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs py-2.5 px-6 font-bold cursor-pointer"
            >
              {submitting ? 'Creating Project...' : 'Continue →'}
            </button>
          </div>
        </form>
      )}

      {/* ── Stage 2: File Upload ── */}
      {stage === 2 && (
        <div className="space-y-5 animate-fade-in">
          <div className="glass-card p-6 border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-yellow-400 uppercase tracking-widest font-semibold">{referenceNumber}</p>
                <h3 className="font-display text-xl font-bold text-white mt-0.5">Upload Blueprints & Drawings</h3>
                <p className="text-xs text-zinc-400 mt-1">Upload PDF drawing sheets, CAD specs, and architectural packages.</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-mono">
                {files.length} file{files.length !== 1 ? 's' : ''} added
              </span>
            </div>

            <FileUploader
              projectId={projectId}
              fileType="intake"
              onUpload={(file) => {
                setFiles(prev => [...prev, file]);
                setError('');
              }}
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStage(1)}
              className="btn-secondary text-xs py-2.5 px-4"
            >
              ← Back to Details
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="btn-primary text-xs py-3 px-8 font-bold cursor-pointer shadow-lg shadow-yellow-400/20"
            >
              Submit</button>
          </div>
        </div>
      )}
    </div>
  );
}
