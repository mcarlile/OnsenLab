import { useState } from "react";
import { PhotoUpload } from "@/components/PhotoUpload";
import { ChemicalLevelCard } from "@/components/ChemicalLevelCard";
import { TrendChart } from "@/components/TrendChart";
import { TestHistory } from "@/components/TestHistory";
import { EmptyState } from "@/components/EmptyState";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Droplets, Activity, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
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
  ];

  const handleUpload = (file: File) => {
    console.log('File uploaded:', file.name);
    setIsAnalyzing(true);
    // TODO: Remove mock - Replace with actual API call
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasData(true);
    }, 2000);
  };

  const scrollToUpload = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Droplets className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Hot Tub Monitor</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Water Chemistry</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <Activity className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <Calendar className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Upload Test Strip</h2>
              <PhotoUpload onUpload={handleUpload} isAnalyzing={isAnalyzing} />
            </section>

            {!hasData ? (
              <EmptyState onUploadClick={scrollToUpload} />
            ) : (
              <>
                <section>
                  <h2 className="text-2xl font-semibold mb-4">Current Levels</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <h2 className="text-2xl font-semibold mb-4">Trends</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              </>
            )}
          </TabsContent>

          <TabsContent value="history">
            {hasData ? (
              <TestHistory 
                readings={mockHistory}
                onViewDetails={(id) => console.log('View details for:', id)}
              />
            ) : (
              <EmptyState onUploadClick={() => setActiveTab("dashboard")} />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Hot Tub Monitor - Keep your water chemistry balanced</p>
        </div>
      </footer>
    </div>
  );
}
