import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhotoUpload } from "@/components/PhotoUpload";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File) => void;
  isAnalyzing?: boolean;
}

export function UploadDialog({ open, onOpenChange, onUpload, isAnalyzing }: UploadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Test Strip Photo</DialogTitle>
          <DialogDescription>
            Take or upload a photo of your test strip for AI-powered analysis
          </DialogDescription>
        </DialogHeader>
        <PhotoUpload onUpload={onUpload} isAnalyzing={isAnalyzing} />
      </DialogContent>
    </Dialog>
  );
}
