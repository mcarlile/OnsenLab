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
import { Camera, Upload, Settings } from "lucide-react";
import { type TestStripBrand } from "@shared/schema";
import { Link } from "wouter";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, brandId?: string) => void;
  isAnalyzing: boolean;
}

export function UploadDialog({ open, onOpenChange, onUpload, isAnalyzing }: UploadDialogProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { data: brands = [] } = useQuery<TestStripBrand[]>({
    queryKey: ['/api/brands'],
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file, selectedBrand || undefined);
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Test Strip Photo</DialogTitle>
          <DialogDescription>
            Select your test strip brand and choose how to capture the image.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
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
            <p className="text-xs text-muted-foreground">
              Selecting the correct brand improves AI accuracy
            </p>
          </div>

          <div className="space-y-3">
            <Label>Capture Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={handleCameraClick}
                disabled={isAnalyzing}
                data-testid="button-camera"
              >
                <Camera className="h-8 w-8" />
                <span>Take Photo</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={handleGalleryClick}
                disabled={isAnalyzing}
                data-testid="button-gallery"
              >
                <Upload className="h-8 w-8" />
                <span>Choose from Gallery</span>
              </Button>
            </div>
          </div>

          {isAnalyzing && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-3 text-sm text-muted-foreground">Analyzing test strip...</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          data-testid="input-gallery"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
          data-testid="input-camera"
        />
      </DialogContent>
    </Dialog>
  );
}
