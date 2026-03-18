import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, Settings, X, FlaskConical, Check, AlertCircle } from "lucide-react";
import { type TestStripBrand } from "@shared/schema";
import { Link } from "wouter";

export type UploadPhase = "compressing" | "analyzing" | "done" | "error" | null;

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[], brandId?: string) => void;
  uploadPhase: UploadPhase;
  uploadError: string | null;
  failedPhase: string | null;
}

const MAX_PHOTOS = 2;

const STEPS: { phase: UploadPhase; label: string }[] = [
  { phase: "compressing", label: "Compressing photos" },
  { phase: "analyzing", label: "Securing photos & analyzing with AI" },
  { phase: "done", label: "Complete" },
];

function stepIndex(phase: UploadPhase): number {
  if (phase === "compressing") return 0;
  if (phase === "analyzing") return 1;
  if (phase === "done") return 2;
  return -1;
}

function ProgressSteps({ phase, error, failedPhase }: { phase: UploadPhase; error: string | null; failedPhase: string | null }) {
  const current = phase === "error" ? stepIndex(failedPhase as UploadPhase) : stepIndex(phase);

  return (
    <div className="space-y-2 py-2" data-testid="upload-progress-steps">
      {STEPS.map((step, i) => {
        const isDone = (phase === "done") || (phase !== "error" && current > i) || (phase === "error" && i < current);
        const isActive = current === i && phase !== "error" && phase !== "done";
        const isError = phase === "error" && current === i;

        return (
          <div key={step.label} className="flex items-center gap-3">
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              {isDone ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : isError ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : isActive ? (
                <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : (
                <div className="h-3 w-3 rounded-full border border-muted-foreground/40" />
              )}
            </div>
            <span
              className={
                isDone
                  ? "text-sm text-muted-foreground line-through"
                  : isActive
                  ? "text-sm font-medium"
                  : isError
                  ? "text-sm text-destructive"
                  : "text-sm text-muted-foreground/60"
              }
            >
              {step.label}
            </span>
          </div>
        );
      })}
      {phase === "error" && error && (
        <p className="text-sm text-destructive mt-2 pl-8" data-testid="text-upload-error">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectedPhoto {
  file: File;
  preview: string;
}

function PhotoPicker({
  photos,
  onAdd,
  onRemove,
  disabled,
}: {
  photos: SelectedPhoto[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  disabled: boolean;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const isFull = photos.length >= MAX_PHOTOS;

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected && selected.length > 0) {
      onAdd(Array.from(selected));
    }
    e.target.value = "";
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      onAdd([selected]);
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className="flex gap-3" data-testid="photo-previews">
          {photos.map((photo, i) => (
            <div key={i} className="relative rounded-md overflow-visible border border-border flex-1">
              <img
                src={photo.preview}
                alt={`Selected photo ${i + 1}`}
                className="w-full h-28 object-cover rounded-md"
                data-testid={`img-preview-${i}`}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={() => onRemove(i)}
                disabled={disabled}
                data-testid={`button-remove-image-${i}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {!isFull && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-16 flex flex-col gap-1"
            onClick={() => galleryRef.current?.click()}
            disabled={disabled}
            data-testid="button-gallery"
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs">
              {photos.length === 0 ? "Choose Photos" : "Add Another"}
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-16 flex flex-col gap-1"
            onClick={() => cameraRef.current?.click()}
            disabled={disabled}
            data-testid="button-camera"
          >
            <Camera className="h-5 w-5" />
            <span className="text-xs">Take Photo</span>
          </Button>
        </div>
      )}

      {isFull && (
        <p className="text-xs text-muted-foreground text-center" data-testid="text-photo-limit">
          Maximum {MAX_PHOTOS} photos reached
        </p>
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleGalleryChange}
        data-testid="input-gallery"
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraChange}
        data-testid="input-camera"
      />
    </div>
  );
}

export function UploadDialog({ open, onOpenChange, onUpload, uploadPhase, uploadError, failedPhase }: UploadDialogProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);

  const { data: brands = [] } = useQuery<TestStripBrand[]>({
    queryKey: ["/api/brands"],
  });

  const isAnalyzing = uploadPhase !== null && uploadPhase !== "error";

  useEffect(() => {
    if (!open && !isAnalyzing) {
      photos.forEach(p => URL.revokeObjectURL(p.preview));
      setPhotos([]);
    }
  }, [open]);

  const handleAddPhotos = (files: File[]) => {
    setPhotos(prev => {
      const remaining = MAX_PHOTOS - prev.length;
      const toAdd = files.slice(0, remaining);
      const newPhotos = toAdd.map(file => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      return [...prev, ...newPhotos];
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => {
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleAnalyze = () => {
    if (photos.length === 0) return;
    onUpload(photos.map(p => p.file), selectedBrand || undefined);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isAnalyzing) {
      onOpenChange(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Test Strip Photo</DialogTitle>
          <DialogDescription>
            Select up to {MAX_PHOTOS} photos of your test strip. If the strip is too long for one shot, add a second photo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {uploadPhase !== null ? (
            <ProgressSteps phase={uploadPhase} error={uploadError} failedPhase={failedPhase} />
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <Label htmlFor="brand-select">Test Strip Brand (Optional)</Label>
                  <Link href="/brands">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" data-testid="link-manage-brands">
                      <Settings className="h-3 w-3 mr-1" />
                      Manage
                    </Button>
                  </Link>
                </div>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger id="brand-select" data-testid="select-brand">
                    <SelectValue placeholder="Select a brand for better accuracy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None - Generic Analysis</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.manufacturer} - {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Selecting the correct brand improves AI accuracy</p>
              </div>

              <div className="space-y-2">
                <Label>Photos</Label>
                <PhotoPicker
                  photos={photos}
                  onAdd={handleAddPhotos}
                  onRemove={handleRemovePhoto}
                  disabled={false}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleAnalyze}
                disabled={photos.length === 0}
                data-testid="button-analyze"
              >
                <FlaskConical className="h-4 w-4 mr-2" />
                Analyze Strip
              </Button>
            </>
          )}

          {uploadPhase === "error" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
              data-testid="button-dismiss-error"
            >
              Dismiss
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
