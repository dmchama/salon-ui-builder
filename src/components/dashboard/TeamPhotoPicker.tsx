import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TeamAvatar from "@/components/TeamAvatar";
import { PHOTO_ACCEPT, preparePhoto } from "@/lib/photo-file";

/** What the form should do with the photo when it is saved. */
export type PhotoChange = { kind: "keep" } | { kind: "set"; file: File } | { kind: "remove" };

type Props = {
  name: string;
  currentUrl: string | null;
  change: PhotoChange;
  onChange: (change: PhotoChange) => void;
  onPreparingChange?: (busy: boolean) => void;
  disabled?: boolean;
};

/** Round photo picker for the add/edit team member form (spec 005 AC1, AC4, AC5, AC7). */
const TeamPhotoPicker = ({ name, currentUrl, change, onChange, onPreparingChange, disabled }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (change.kind !== "set") {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(change.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [change]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPreparing(true);
    onPreparingChange?.(true);
    try {
      const result = await preparePhoto(file);
      if ("error" in result) setError(result.error);
      else onChange({ kind: "set", file: result.file });
    } finally {
      setPreparing(false);
      onPreparingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const shownUrl = change.kind === "set" ? previewUrl : change.kind === "remove" ? null : currentUrl;
  const hasPhoto = Boolean(shownUrl);
  const locked = disabled || preparing;

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {change.kind === "set" && previewUrl ? (
          <img src={previewUrl} alt="New photo preview" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <TeamAvatar name={name || "?"} photoUrl={shownUrl} size={80} />
        )}
        {preparing && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_ACCEPT}
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
          disabled={locked}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => inputRef.current?.click()} disabled={locked}>
            <Camera className="h-4 w-4" /> {hasPhoto ? "Change photo" : "Upload photo"}
          </Button>
          {hasPhoto && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => onChange(currentUrl && change.kind !== "remove" ? { kind: "remove" } : { kind: "keep" })}
              disabled={locked}
            >
              Remove photo
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {preparing ? "Preparing image…" : "Optional. Shown to guests when they choose a professional."}
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
};

export default TeamPhotoPicker;
