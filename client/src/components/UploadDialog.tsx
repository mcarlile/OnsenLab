import { useState, useRef } from "react";
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
}

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

function ProgressSteps({ phase, error }: { phase: UploadPhase; error: string | null }) {
  const current = stepIndex(phase);

  return (
    <div className="space-y-2 py-2" data-testid="upload-progress-steps">
      {STEPS.map((step, i) => {
        const isDone = current > i || phase === "done";
        const isActive = current === i && phase !== "error";
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

function ImageSlot({
  label,
  file,
  onFileSelect,
  onRemove,
  disabled,
  slotIndex,
}: {
  label: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  disabled: boolean;
  slotIndex: number;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      onFileSelect(selected);
      const url = URL.createObjectURL(selected);
      setPreview(url);
    }
    e.target.value = "";
  };

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    onRemove();
  };

  if (file && preview) {
    return (
      <div className="relative rounded-md overflow-visible border border-border">
        <img
          src={preview}
          alt={`Selected image ${slotIndex + 1}`}
          className="w-full h-32 object-cover rounded-md"
          data-testid={`img-preview-${slotIndex}`}
        />
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
          onClick={handleRemove}
          disabled={disabled}
          data-testid={`button-remove-image-${slotIndex}`}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="h-20 flex flex-col gap-1"
          onClick={() => cameraRef.current?.click()}
          disabled={disabled}
          data-testid={`button-camera-${slotIndex}`}
        >
          <Camera className="h-6 w-6" />
          <span className="text-xs">Take Photo</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex flex-col gap-1"
          onClick={() => galleryRef.current?.click()}
          disabled={disabled}
          data-testid={`button-gallery-${slotIndex}`}
        >
          <Upload className="h-6 w-6" />
          <span className="text-xs">Gallery</span>
        </Button>
      </div>
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        data-testid={`input-gallery-${slotIndex}`}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        data-testid={`input-camera-${slotIndex}`}
      />
    </div>
  );
}

export function UploadDialog({ open, onOpenChange, onUpload, uploadPhase, uploadError }: UploadDialogProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);

  const { data: brands = [] } = useQuery<TestStripBrand[]>({
    queryKey: ["/api/brands"],
  });

  const isAnalyzing = uploadPhase !== null && uploadPhase !== "error";

  const handleAnalyze = () => {
    if (!image1) return;
    const files = image2 ? [image1, image2] : [image1];
    onUpload(files, selectedBrand || undefined);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isAnalyzing) {
      setImage1(null);
      setImage2(null);
    }
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
            Capture one or two photos of your test strip. If the strip is too long for one shot, add a second photo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {uploadPhase !== null ? (
            <ProgressSteps phase={uploadPhase} error={uploadError} />
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

              <div className="space-y-3">
                <Label>Photos</Label>
                <div className="grid grid-cols-2 gap-3">
                  <ImageSlot
                    label="Photo 1 (required)"
                    file={image1}
                    onFileSelect={setImage1}
                    onRemove={() => setImage1(null)}
                    disabled={false}
                    slotIndex={0}
                  />
                  <ImageSlot
                    label="Photo 2 (optional)"
                    file={image2}
                    onFileSelect={setImage2}
                    onRemove={() => setImage2(null)}
                    disabled={false}
                    slotIndex={1}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleAnalyze}
                disabled={!image1}
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
