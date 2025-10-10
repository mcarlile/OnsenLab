import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, Upload } from "lucide-react";

interface EmptyStateProps {
  onUploadClick: () => void;
}

export function EmptyState({ onUploadClick }: EmptyStateProps) {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <Droplets className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No Test Data Yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Start monitoring your hot tub by uploading your first test strip photo. 
          Our AI will analyze the chemical levels instantly.
        </p>
        <Button 
          size="lg" 
          onClick={onUploadClick}
          data-testid="button-upload-first"
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload First Test Strip
        </Button>
      </div>
    </Card>
  );
}
