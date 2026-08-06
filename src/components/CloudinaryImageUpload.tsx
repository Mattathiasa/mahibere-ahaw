import { useRef, useState } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCloudinary } from '@/hooks/useCloudinary';
import { optimized } from '@/services/cloudinary';

interface Props {
  value?: string;
  onChange: (url: string) => void;
  /**
   * Also receives Cloudinary's publicId, which `onChange` cannot carry.
   * Without it an image can only ever be dereferenced, never located again in
   * Cloudinary to actually delete.
   */
  onUploaded?: (image: { url: string; publicId: string }) => void;
  folder?: string;
  label?: string;
  /** 'avatar' shows a round preview; 'wide' shows a 16:9 banner preview. */
  variant?: 'avatar' | 'wide';
  /** Accept several files at once, for galleries. */
  multiple?: boolean;
}

/** Reusable Cloudinary image picker — upload, preview, remove. */
export function CloudinaryImageUpload({
  value, onChange, onUploaded, folder = 'mahibere-ahaw', label = 'Upload image',
  variant = 'wide', multiple = false,
}: Props) {
  const { isConfigured, upload } = useCloudinary();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: File[]) {
    setError(null);
    setBusy(true);
    const failures: string[] = [];
    try {
      // Sequential rather than parallel: a dozen simultaneous uploads from a
      // phone on a slow connection tends to fail as a group.
      for (const file of files) {
        // Client-side guards (mirror the Cloudinary preset restrictions).
        if (!file.type.startsWith('image/')) {
          failures.push(`${file.name}: not an image`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          failures.push(`${file.name}: larger than 5 MB`);
          continue;
        }
        try {
          const res = await upload(file, folder);
          onChange(res.secureUrl);
          onUploaded?.({ url: res.secureUrl, publicId: res.publicId });
        } catch (e) {
          failures.push(`${file.name}: ${e instanceof Error ? e.message : 'upload failed'}`);
        }
      }
      if (failures.length > 0) setError(failures.join(' · '));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative inline-block">
          <img
            src={optimized(value, variant === 'avatar' ? 200 : 600)}
            alt="preview"
            className={variant === 'avatar'
              ? 'h-24 w-24 rounded-full object-cover border border-border'
              : 'w-full max-w-md aspect-video rounded-xl object-cover border border-border'}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1 shadow hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) handleFiles(files);
          e.target.value = '';
        }}
      />
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy || !isConfigured}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          {busy ? 'Uploading…' : label}
        </Button>
        {!isConfigured && (
          <span className="text-xs text-amber-600">
            Cloudinary not configured — set it in Software Control → Integrations.
          </span>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
