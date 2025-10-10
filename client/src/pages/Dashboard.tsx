import { useState } from "react";
import { UploadDialog } from "@/components/UploadDialog";
import { ChemicalLevelCard } from "@/components/ChemicalLevelCard";
import { TrendChart } from "@/components/TrendChart";
import { TestHistory } from "@/components/TestHistory";
import { EmptyState } from "@/components/EmptyState";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Droplets, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // TODO: Remove mock data - this will be replaced with real API data
  const [hasData, setHasData] = useState(true);
  
  const mockCurrentReadings = {
    pH: 7.4,
    chlorine: 2.5,
    alkalinity: 95,
    bromine: null,
    hardness: 180,
  };

  const mockTrendData = {
    pH: [
      { date: '1/5', value: 7.2 },
      { date: '1/6', value: 7.4 },
      { date: '1/7', value: 7.3 },
      { date: '1/8', value: 7.5 },
      { date: '1/9', value: 7.4 },
      { date: '1/10', value: 7.4 },
    ],
    chlorine: [
      { date: '1/5', value: 2.8 },
      { date: '1/6', value: 2.6 },
      { date: '1/7', value: 2.4 },
      { date: '1/8', value: 2.2 },
      { date: '1/9', value: 2.8 },
      { date: '1/10', value: 2.5 },
    ],
    alkalinity: [
      { date: '1/5', value: 92 },
      { date: '1/6', value: 95 },
      { date: '1/7', value: 98 },
      { date: '1/8', value: 92 },
      { date: '1/9', value: 96 },
      { date: '1/10', value: 95 },
    ],
  };

  const mockHistory = [
    {
      id: '1',
      timestamp: new Date('2025-01-10T14:30:00'),
      pH: 7.4,
      chlorine: 2.5,
      alkalinity: 95,
      confidence: 0.92,
    },
    {
      id: '2',
      timestamp: new Date('2025-01-09T10:15:00'),
      pH: 7.3,
      chlorine: 2.8,
      alkalinity: 98,
      confidence: 0.88,
    },
    {
      id: '3',
      timestamp: new Date('2025-01-08T16:45:00'),
      pH: 7.5,
      chlorine: 2.2,
      alkalinity: 92,
      confidence: 0.95,
    },
    {
      id: '4',
      timestamp: new Date('2025-01-07T09:20:00'),
      pH: 7.3,
      chlorine: 2.4,
      alkalinity: 98,
      confidence: 0.90,
    },
    {
      id: '5',
      timestamp: new Date('2025-01-06T15:30:00'),
      pH: 7.4,
      chlorine: 2.6,
      alkalinity: 95,
      confidence: 0.87,
    },
  ];

  const handleUpload = (file: File) => {
    console.log('File uploaded:', file.name);
    setIsAnalyzing(true);
    // TODO: Remove mock - Replace with actual API call
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasData(true);
      setUploadDialogOpen(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="rounded-lg bg-primary/10 p-1.5 sm:p-2 flex-shrink-0">
                <Droplets className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold truncate">Hot Tub Monitor</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">AI-Powered Water Chemistry</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={() => setUploadDialogOpen(true)}
                size="sm"
                className="sm:h-9"
                data-testid="button-new-test"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New Test</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!hasData ? (
          <EmptyState onUploadClick={() => setUploadDialogOpen(true)} />
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-semibold">Current Levels</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Last updated: Today, 2:30 PM</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <ChemicalLevelCard
                  name="pH"
                  value={mockCurrentReadings.pH}
                  unit="pH"
                  optimalMin={7.2}
                  optimalMax={7.8}
                  warningMin={7.0}
                  warningMax={8.0}
                />
                <ChemicalLevelCard
                  name="Chlorine"
                  value={mockCurrentReadings.chlorine}
                  unit="ppm"
                  optimalMin={1.0}
                  optimalMax={3.0}
                  warningMin={0.5}
                  warningMax={5.0}
                />
                <ChemicalLevelCard
                  name="Alkalinity"
                  value={mockCurrentReadings.alkalinity}
                  unit="ppm"
                  optimalMin={80}
                  optimalMax={120}
                  warningMin={60}
                  warningMax={150}
                />
                <ChemicalLevelCard
                  name="Bromine"
                  value={mockCurrentReadings.bromine}
                  unit="ppm"
                  optimalMin={2.0}
                  optimalMax={4.0}
                  warningMin={1.0}
                  warningMax={6.0}
                />
                <ChemicalLevelCard
                  name="Hardness"
                  value={mockCurrentReadings.hardness}
                  unit="ppm"
                  optimalMin={150}
                  optimalMax={250}
                  warningMin={100}
                  warningMax={400}
                />
              </div>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">Trends Over Time</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <TrendChart
                  title="pH Trend"
                  data={mockTrendData.pH}
                  optimalMin={7.2}
                  optimalMax={7.8}
                  unit="pH"
                  color="hsl(var(--chart-1))"
                />
                <TrendChart
                  title="Chlorine Trend"
                  data={mockTrendData.chlorine}
                  optimalMin={1.0}
                  optimalMax={3.0}
                  unit="ppm"
                  color="hsl(var(--chart-2))"
                />
                <TrendChart
                  title="Alkalinity Trend"
                  data={mockTrendData.alkalinity}
                  optimalMin={80}
                  optimalMax={120}
                  unit="ppm"
                  color="hsl(var(--chart-3))"
                />
              </div>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">Test History</h2>
              <TestHistory 
                readings={mockHistory}
                onViewDetails={(id) => console.log('View details for:', id)}
              />
            </section>
          </div>
        )}
      </main>

      <footer className="border-t mt-12 sm:mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center text-xs sm:text-sm text-muted-foreground">
          <p>Hot Tub Monitor - Keep your water chemistry balanced</p>
        </div>
      </footer>

      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
}
