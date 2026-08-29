'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}

interface ClientOption {
  label: string;
  value: string;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
  onToast,
}: CreateProjectModalProps) {
  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      clientCompanyName: '',
      clientContactPerson: '',
      clientEmail: '',
      clientPhone: '',
      projectName: '',
      projectDescription: '',
      scopeDescription: '',
      requestedDeadline: '',
      decidedPrice: '',
      salespersonName: '',
      projectType: 'estimation',
      useExistingClient: false,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [showClientInput, setShowClientInput] = useState(false);
  const useExistingClient = watch('useExistingClient');
  const selectedCompany = watch('clientCompanyName');

  // Fetch existing clients
  useEffect(() => {
    if (!isOpen) return;

    const fetchClients = async () => {
      try {
        const res = await api.get<any>('/projects?limit=500');
        const projects: any[] = Array.isArray(res) ? res : ((res as any)?.data ?? []);
        const uniqueClients = Array.from(
          new Map(
            projects
              .filter((p: any) => p.clientCompanyName)
              .map((p: any) => [p.clientCompanyName, p])
          ).values()
        ).map((p: any) => ({
          label: p.clientCompanyName,
          value: p.clientCompanyName,
        }));
        setClientOptions(uniqueClients.sort((a, b) => a.label.localeCompare(b.label)));
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      }
    };

    fetchClients();
  }, [isOpen]);

  // Fetch client details when selected
  useEffect(() => {
    if (!useExistingClient || !selectedCompany) return;

    const fetchClientDetails = async () => {
      try {
        const res = await api.get<any>(`/projects/by-client/${encodeURIComponent(selectedCompany)}`);
        const projects = Array.isArray(res) ? res : (res?.data ?? []);
        if (projects.length > 0) {
          const lastProject = projects[0];
          setValue('clientContactPerson', lastProject.clientContactPerson || '');
          setValue('clientEmail', lastProject.clientEmail || '');
          setValue('clientPhone', lastProject.clientPhone || '');
        }
      } catch (err) {
        console.error('Failed to fetch client details:', err);
      }
    };

    fetchClientDetails();
  }, [useExistingClient, selectedCompany, setValue]);

  async function onSubmit(data: any) {
    setIsLoading(true);
    try {
      const payload = {
        clientCompanyName: data.clientCompanyName,
        clientContactPerson: data.clientContactPerson,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        salespersonName: data.salespersonName || null,
        decidedPrice: data.decidedPrice ? parseFloat(data.decidedPrice) : null,
        scopeDescription: data.scopeDescription,
        requestedDeadline: data.requestedDeadline,
        projectType: data.projectType,
      };

      await api.post('/projects/admin/create', payload);
      onToast('Project created successfully! 🎉', 'success');
      reset();
      setShowClientInput(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      onToast(err.message || 'Failed to create project', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border-zinc-700 shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <p className="text-xs font-mono text-emerald-400 font-semibold">NEW PROJECT</p>
            <h2 className="text-lg font-bold text-white mt-1">Create Project</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white text-2xl p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* CLIENT SECTION */}
          <div className="space-y-3 pb-4 border-b border-zinc-800/50">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Client Details</h3>

            {/* Existing or New Client Toggle */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('useExistingClient')}
                  className="w-4 h-4 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-zinc-300">Select existing client</span>
              </label>
            </div>

            {useExistingClient && clientOptions.length > 0 ? (
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Client Company *
                </label>
                <select
                  {...register('clientCompanyName', { required: 'Client company is required' })}
                  className="input text-sm w-full"
                >
                  <option value="">-- Select Client --</option>
                  {clientOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.clientCompanyName && (
                  <p className="text-xs text-red-400 mt-1">{String(errors.clientCompanyName.message)}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Company Name *
                </label>
                <input
                  type="text"
                  {...register('clientCompanyName', { required: 'Company name is required' })}
                  placeholder="e.g., ABC Construction Inc."
                  className="input text-sm w-full"
                />
                {errors.clientCompanyName && (
                  <p className="text-xs text-red-400 mt-1">{String(errors.clientCompanyName.message)}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Contact Person *
                </label>
                <input
                  type="text"
                  {...register('clientContactPerson', { required: 'Contact person is required' })}
                  placeholder="e.g., John Smith"
                  className="input text-sm"
                />
                {errors.clientContactPerson && (
                  <p className="text-xs text-red-400 mt-1">{String(errors.clientContactPerson.message)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  {...register('clientEmail', { required: 'Email is required' })}
                  placeholder="client@company.com"
                  className="input text-sm"
                />
                {errors.clientEmail && (
                  <p className="text-xs text-red-400 mt-1">{String(errors.clientEmail.message)}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                Phone *
              </label>
              <input
                type="tel"
                {...register('clientPhone', { required: 'Phone is required' })}
                placeholder="+1 (555) 123-4567"
                className="input text-sm w-full"
              />
              {errors.clientPhone && (
                <p className="text-xs text-red-400 mt-1">{String(errors.clientPhone.message)}</p>
              )}
            </div>
          </div>

          {/* PROJECT SECTION */}
          <div className="space-y-3 pb-4 border-b border-zinc-800/50">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Project Details</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Project Type *
                </label>
                <select
                  {...register('projectType', { required: 'Project type is required' })}
                  className="input text-sm"
                >
                  <option value="estimation">📐 Cost Estimation</option>
                  <option value="design_drafting">🏛️ Design & Drafting</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Deadline *
                </label>
                <input
                  type="date"
                  {...register('requestedDeadline', { required: 'Deadline is required' })}
                  className="input text-sm"
                />
                {errors.requestedDeadline && (
                  <p className="text-xs text-red-400 mt-1">{String(errors.requestedDeadline.message)}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                Scope Description *
              </label>
              <textarea
                {...register('scopeDescription', { required: 'Scope is required' })}
                placeholder="Describe the project scope, deliverables, specific requirements..."
                rows={3}
                className="input text-xs resize-none w-full"
              />
              {errors.scopeDescription && (
                <p className="text-xs text-red-400 mt-1">{String(errors.scopeDescription.message)}</p>
              )}
            </div>
          </div>

          {/* OPTIONAL SECTION */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Optional Information</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Salesperson Name
                </label>
                <input
                  type="text"
                  {...register('salespersonName')}
                  placeholder="e.g., Jane Doe"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Project Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('decidedPrice')}
                  placeholder="0.00"
                  className="input text-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-2.5 text-xs text-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1 py-2.5 text-xs font-bold text-center cursor-pointer disabled:opacity-60"
            >
              {isLoading ? 'Creating Project...' : 'Create Project ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
