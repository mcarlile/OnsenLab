import { useState, useCallback } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PhotoUploadProps {
  onUpload: (file: File) => void;
  isAnalyzing?: boolean;
}

export function PhotoUpload({ onUpload, isAnalyzing = false }: PhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onUpload(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-colors ${
        dragActive ? "bg-primary/5" : ""
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
        data-testid="input-file-upload"
      />
      
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Test strip preview" 
            className="w-full h-64 object-cover"
          />
          {!isAnalyzing && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-4 right-4"
              onClick={clearPreview}
              data-testid="button-clear-preview"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm font-medium">Analyzing test strip...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center min-h-64 p-8 cursor-pointer hover-elevate active-elevate-2"
        >
          <Camera className="h-16 w-16 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload Test Strip Photo</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Drop test strip photo or click to upload
          </p>
          <Badge variant="secondary" className="mb-2">
            JPG, PNG up to 10MB
          </Badge>
          <div className="flex items-center gap-2 mt-4">
            <Upload className="h-4 w-4" />
            <span className="text-sm font-medium">Choose File</span>
          </div>
        </label>
      )}
    </Card>
  );
}
