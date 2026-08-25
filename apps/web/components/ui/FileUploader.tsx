'use client';
import { useState, useRef } from 'react';
import { api, getAccessToken } from '@/lib/api';

const ALLOWED = '.pdf,.dwg,.dxf,.png,.jpg,.jpeg,.xlsx,.docx,.zip';
const MAX_SIZE = 100 * 1024 * 1024;
interface UploadedFile { id: string; originalName: string; }

export function FileUploader({ projectId, fileType, onUpload, disabled }: {
  projectId: string; fileType: 'intake' | 'deliverable';
  onUpload: (f: UploadedFile) => void; disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    for (const file of Array.from(files)) {
      if (file.size > MAX_SIZE) { setError(`${file.name} exceeds 100 MB`); continue; }
      setUploading(true); setProgress(10);
      try {
        const { uploadUrl, s3Key } = await api.post<any>('/files/upload-url', {
          projectId, fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size, fileType,
        });
        setProgress(30);
        await new Promise<void>((res, rej) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.upload.onprogress = e => { if (e.lengthComputable) setProgress(30 + Math.round(e.loaded / e.total * 60)); };
          xhr.onload = () => (xhr.status < 300 ? res() : rej(new Error('Upload failed')));
          xhr.onerror = () => rej(new Error('Network error'));
          xhr.send(file);
        });
        setProgress(95);
        const confirmed = await api.post<UploadedFile>('/files/confirm', {
          projectId, s3Key, originalName: file.name,
          mimeType: file.type, sizeBytes: file.size, fileType,
        });
        setProgress(100); onUpload(confirmed);
      } catch (e: any) { setError(e.message); }
      finally { setUploading(false); setProgress(0); }
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept={ALLOWED} multiple className="hidden"
        onChange={e => handleFiles(e.target.files)} disabled={disabled || uploading} />
      <div
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
          ${uploading ? 'border-yellow-400/50 bg-yellow-400/5' : 'border-zinc-700 hover:border-yellow-400/50 hover:bg-yellow-400/5'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        {uploading ? (
          <div className="space-y-2">
            <p className="text-yellow-400 text-sm font-medium">Uploading... {progress}%</p>
            <div className="w-full bg-zinc-700 rounded-full h-1.5">
              <div className="bg-yellow-400 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <p className="text-zinc-300 text-sm font-medium">Drop files here or click to browse</p>
            <p className="text-zinc-600 text-xs mt-1">PDF, DWG, DXF, PNG, JPG, XLSX, DOCX, ZIP · Max 100 MB</p>
          </>
        )}
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
