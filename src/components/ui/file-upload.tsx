import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, File, Loader2 } from 'lucide-react';

interface FileUploadProps {
  label?: string;
  value?: string[];
  onChange: (files: string[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string;
  maxSizeMB?: number;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label = 'Attachments',
  value = [],
  onChange,
  maxFiles = 5,
  acceptedFileTypes = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  maxSizeMB = 5,
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (value.length >= maxFiles) {
        alert(`You can only upload up to ${maxFiles} files.`);
        return;
      }

      setIsUploading(true);
      const newFiles: string[] = [];

      try {
        for (let i = 0; i < e.target.files.length; i++) {
          const file = e.target.files[i];

          if (file.size > maxSizeMB * 1024 * 1024) {
            alert(`File ${file.name} is too large. Max size is ${maxSizeMB}MB.`);
            continue;
          }

          const base64 = await fileToBase64(file);
          newFiles.push(base64);
        }

        onChange([...value, ...newFiles]);
      } catch (error) {
        console.error('Error reading files:', error);
      } finally {
        setIsUploading(false);
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleRemove = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-2">
        {label && <Label>{label}</Label>}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || value.length >= maxFiles}
            className="w-full h-24 border-dashed"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-6 w-6" />
                <span className="text-sm">Click to upload files</span>
                <span className="text-xs opacity-70">
                  Max {maxSizeMB}MB each. {maxFiles - value.length} remaining.
                </span>
              </div>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedFileTypes}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Attached Files ({value.length})</Label>
          <div className="grid gap-2">
            {value.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-md border bg-muted/20">
                <div className="flex items-center gap-2 overflow-hidden">
                  <File className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="text-sm truncate">
                    {/* Basic attempt to extract name or show Generic name since we store base64 */}
                    Attachment {index + 1}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
