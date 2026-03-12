import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UploadDialog } from "@/components/UploadDialog";
import { ChemicalLevelCard } from "@/components/ChemicalLevelCard";
import { TrendChart } from "@/components/TrendChart";
import { TestHistory } from "@/components/TestHistory";
import { EmptyState } from "@/components/EmptyState";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { TestReading } from "@shared/schema";
import { format } from "date-fns";

export default function Dashboard() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: readings = [], isLoading } = useQuery<TestReading[]>({
    queryKey: ['/api/readings'],
  });

  const analyzeMutation = useMutation({
    mutationFn: async ({ file, brandId }: { file: File; brandId?: string }) => {
      const formData = new FormData();
      formData.append('image', file);
      if (brandId && brandId !== 'none') {
        formData.append('brandId', brandId);
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to analyze image');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/readings'] });
      setUploadDialogOpen(false);
      toast({
        title: "Analysis Complete",
        description: `Test strip analyzed with ${Math.round((data.confidence || 0) * 100)}% confidence`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = (file: File, brandId?: string) => {
    analyzeMutation.mutate({ file, brandId });
  };

  const latestReading = readings[0];
  const hasData = readings.length > 0;

  const getTrendData = (field: 'pH' | 'chlorine' | 'alkalinity') => {
    return readings
      .filter(r => r[field] !== null)
      .slice(0, 6)
      .reverse()
      .map(r => ({
        date: format(new Date(r.timestamp), 'M/d'),
        value: r[field] as number,
      }));
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Tests</h1>
          {latestReading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Last updated {format(new Date(latestReading.timestamp), "MMM d, h:mm a")}
            </p>
          )}
        </div>
        <Button
          onClick={() => setUploadDialogOpen(true)}
          size="sm"
          data-testid="button-new-test"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">New Test</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : !hasData ? (
        <EmptyState onUploadClick={() => setUploadDialogOpen(true)} />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          <section>
            <h2 className="text-base sm:text-lg font-semibold mb-3">Current Levels</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <ChemicalLevelCard
                name="pH"
                value={latestReading.pH}
                unit="pH"
                optimalMin={7.2}
                optimalMax={7.8}
                warningMin={7.0}
                warningMax={8.0}
              />
              <ChemicalLevelCard
                name="Chlorine"
                value={latestReading.chlorine}
                unit="ppm"
                optimalMin={1.0}
                optimalMax={3.0}
                warningMin={0.5}
                warningMax={5.0}
              />
              <ChemicalLevelCard
                name="Alkalinity"
                value={latestReading.alkalinity}
                unit="ppm"
                optimalMin={80}
                optimalMax={120}
                warningMin={60}
                warningMax={150}
              />
              <ChemicalLevelCard
                name="Bromine"
                value={latestReading.bromine}
                unit="ppm"
                optimalMin={2.0}
                optimalMax={4.0}
                warningMin={1.0}
                warningMax={6.0}
              />
              <ChemicalLevelCard
                name="Hardness"
                value={latestReading.hardness}
                unit="ppm"
                optimalMin={150}
                optimalMax={250}
                warningMin={100}
                warningMax={400}
              />
            </div>
          </section>

          {readings.length >= 2 && (
            <section>
              <h2 className="text-base sm:text-lg font-semibold mb-3">Trends Over Time</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {getTrendData('pH').length >= 2 && (
                  <TrendChart
                    title="pH Trend"
                    data={getTrendData('pH')}
                    optimalMin={7.2}
                    optimalMax={7.8}
                    unit="pH"
                    color="hsl(var(--chart-1))"
                  />
                )}
                {getTrendData('chlorine').length >= 2 && (
                  <TrendChart
                    title="Chlorine Trend"
                    data={getTrendData('chlorine')}
                    optimalMin={1.0}
                    optimalMax={3.0}
                    unit="ppm"
                    color="hsl(var(--chart-2))"
                  />
                )}
                {getTrendData('alkalinity').length >= 2 && (
                  <TrendChart
                    title="Alkalinity Trend"
                    data={getTrendData('alkalinity')}
                    optimalMin={80}
                    optimalMax={120}
                    unit="ppm"
                    color="hsl(var(--chart-3))"
                  />
                )}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-base sm:text-lg font-semibold mb-3">Test History</h2>
            <TestHistory
              readings={readings.map(r => ({
                id: r.id,
                timestamp: new Date(r.timestamp),
                pH: r.pH,
                chlorine: r.chlorine,
                alkalinity: r.alkalinity,
                confidence: r.confidence ?? undefined,
              }))}
              onViewDetails={(id) => console.log('View details for:', id)}
            />
          </section>
        </div>
      )}

      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
        isAnalyzing={analyzeMutation.isPending}
      />
    </div>
  );
}
