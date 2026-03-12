import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UploadDialog } from "@/components/UploadDialog";
import { ChemicalLevelCard } from "@/components/ChemicalLevelCard";
import { TrendChart } from "@/components/TrendChart";
import { TestHistory } from "@/components/TestHistory";
import { EmptyState } from "@/components/EmptyState";
import { Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { TestReading } from "@shared/schema";
import { format } from "date-fns";

function getLowConfidenceParams(reading: TestReading): string[] {
  const LOW_THRESHOLD = 0.70;
  const params: string[] = [];
  if (reading.pHConfidence !== null && reading.pHConfidence < LOW_THRESHOLD && reading.pH !== null) params.push("pH");
  if (reading.chlorineConfidence !== null && reading.chlorineConfidence < LOW_THRESHOLD && reading.chlorine !== null) params.push("Chlorine");
  if (reading.alkalinityConfidence !== null && reading.alkalinityConfidence < LOW_THRESHOLD && reading.alkalinity !== null) params.push("Alkalinity");
  if (reading.bromineConfidence !== null && reading.bromineConfidence < LOW_THRESHOLD && reading.bromine !== null) params.push("Bromine");
  if (reading.hardnessConfidence !== null && reading.hardnessConfidence < LOW_THRESHOLD && reading.hardness !== null) params.push("Hardness");
  return params;
}

export default function Dashboard() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: readings = [], isLoading } = useQuery<TestReading[]>({
    queryKey: ['/api/readings'],
  });

  const analyzeMutation = useMutation({
    mutationFn: async ({ files, brandId }: { files: File[]; brandId?: string }) => {
      const formData = new FormData();
      for (const file of files) {
        formData.append('images', file);
      }
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

  const handleUpload = (files: File[], brandId?: string) => {
    analyzeMutation.mutate({ files, brandId });
  };

  const latestReading = readings[0];
  const hasData = readings.length > 0;
  const lowConfidenceParams = latestReading ? getLowConfidenceParams(latestReading) : [];

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
          {lowConfidenceParams.length > 0 && (
            <div
              className="flex items-start gap-3 rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4"
              role="alert"
              data-testid="banner-low-confidence"
            >
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300">Low confidence readings</p>
                <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                  The AI is less certain about {lowConfidenceParams.join(", ")}. Consider retaking the photo with better lighting or a clearer view of the color pads.
                </p>
              </div>
            </div>
          )}

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
                interval={latestReading.pHInterval}
                paramConfidence={latestReading.pHConfidence}
              />
              <ChemicalLevelCard
                name="Chlorine"
                value={latestReading.chlorine}
                unit="ppm"
                optimalMin={1.0}
                optimalMax={3.0}
                warningMin={0.5}
                warningMax={5.0}
                interval={latestReading.chlorineInterval}
                paramConfidence={latestReading.chlorineConfidence}
              />
              <ChemicalLevelCard
                name="Alkalinity"
                value={latestReading.alkalinity}
                unit="ppm"
                optimalMin={80}
                optimalMax={120}
                warningMin={60}
                warningMax={150}
                interval={latestReading.alkalinityInterval}
                paramConfidence={latestReading.alkalinityConfidence}
              />
              <ChemicalLevelCard
                name="Bromine"
                value={latestReading.bromine}
                unit="ppm"
                optimalMin={2.0}
                optimalMax={4.0}
                warningMin={1.0}
                warningMax={6.0}
                interval={latestReading.bromineInterval}
                paramConfidence={latestReading.bromineConfidence}
              />
              <ChemicalLevelCard
                name="Hardness"
                value={latestReading.hardness}
                unit="ppm"
                optimalMin={150}
                optimalMax={250}
                warningMin={100}
                warningMax={400}
                interval={latestReading.hardnessInterval}
                paramConfidence={latestReading.hardnessConfidence}
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
                pHInterval: r.pHInterval,
                chlorineInterval: r.chlorineInterval,
                alkalinityInterval: r.alkalinityInterval,
                pHConfidence: r.pHConfidence,
                chlorineConfidence: r.chlorineConfidence,
                alkalinityConfidence: r.alkalinityConfidence,
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
