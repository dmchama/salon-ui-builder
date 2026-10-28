import { useEffect, useRef, useState } from "react";
import { FileText, ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isPreviewableImage, RECEIPT_ACCEPT, validateReceiptFile } from "@/lib/receipt-file";

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
};

/** Click or drag-and-drop area for one payment receipt (spec 002 AC4, AC6). */
const ReceiptDropzone = ({ file, onChange, disabled }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !isPreviewableImage(file)) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (picked: File | undefined) => {
    if (!picked) return;
    const problem = validateReceiptFile(picked);
    setError(problem);
    if (!problem) onChange(picked);
  };

  const remove = () => {
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={RECEIPT_ACCEPT}
        className="hidden"
        disabled={disabled}
        onChange={(e) => pick(e.target.files?.[0])}
      />

      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
          {previewUrl ? (
            <img src={previewUrl} alt="Receipt preview" className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              {file.type === "application/pdf" ? <FileText className="h-7 w-7" /> : <ImageIcon className="h-7 w-7" />}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <button
              type="button"
              className="mt-1 text-xs font-semibold text-gold hover:underline"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              Replace
            </button>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={remove} disabled={disabled} aria-label="Remove receipt">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragging ? "border-gold bg-gold/5" : "border-gray-300 bg-gray-50 hover:border-gold/60"
          }`}
        >
          <Upload className="h-6 w-6 text-gold" />
          <span className="text-sm font-semibold text-gray-800">Click or drag your receipt here</span>
          <span className="text-xs text-gray-500">JPG, PNG, WEBP, HEIC or PDF — up to 5 MB</span>
        </button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default ReceiptDropzone;
