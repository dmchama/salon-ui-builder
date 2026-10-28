import { useEffect, useRef, useState } from "react";
import { FileText, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, isPreviewableImage, RECEIPT_ACCEPT, RECEIPT_UPLOAD_LIMIT_BYTES } from "@/lib/receipt-file";
import { prepareReceipt } from "@/lib/receipt-compress";

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  /** false where the API can't take HEIC (SMS campaigns): HEIC is converted to JPEG or refused. */
  allowHeic?: boolean;
  /** Lets the parent keep its submit button disabled while a photo is being resized. */
  onPreparingChange?: (preparing: boolean) => void;
};

/**
 * Click or drag-and-drop area for one payment receipt (spec 002 AC4, AC6). Large photos are
 * resized in the browser before they are handed to the parent (spec 003).
 */
const ReceiptDropzone = ({ file, onChange, disabled, allowHeic = true, onPreparingChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
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

  const setBusy = (busy: boolean) => {
    setPreparing(busy);
    onPreparingChange?.(busy);
  };

  const pick = async (picked: File | undefined) => {
    if (!picked || preparing) return;
    setError(null);
    setBusy(true);
    try {
      const result = await prepareReceipt(picked, { allowHeic });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOriginalSize(result.originalSize ?? null);
      onChange(result.file);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = () => {
    onChange(null);
    setError(null);
    setOriginalSize(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const locked = disabled || preparing;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={RECEIPT_ACCEPT}
        className="hidden"
        disabled={locked}
        onChange={(e) => pick(e.target.files?.[0])}
      />

      {preparing ? (
        <div className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gold/60 bg-gold/5 px-4 py-8 text-sm text-gray-700">
          <Loader2 className="h-5 w-5 animate-spin text-gold" /> Preparing image…
        </div>
      ) : file ? (
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
            <p className="text-xs text-gray-500">
              {formatBytes(file.size)}
              {originalSize ? ` · resized from ${formatBytes(originalSize)}` : ""}
            </p>
            <button
              type="button"
              className="mt-1 text-xs font-semibold text-gold hover:underline"
              onClick={() => inputRef.current?.click()}
              disabled={locked}
            >
              Replace
            </button>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={remove} disabled={locked} aria-label="Remove receipt">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={locked}
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
          <span className="text-xs text-gray-500">
            Photos are resized automatically. PDF up to {formatBytes(RECEIPT_UPLOAD_LIMIT_BYTES)}.
          </span>
        </button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default ReceiptDropzone;
