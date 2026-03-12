import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChemicalLevelCard } from "@/components/ChemicalLevelCard";
import { ArrowLeft, Camera, Clock } from "lucide-react";
import { format } from "date-fns";
import type { TestReading } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function TestDetail() {
  const params = useParams<{ id: string }>();
  const readingId = params.id;

  const { data: reading, isLoading, error } = useQuery<TestReading>({
    queryKey: ['/api/readings', readingId],
    queryFn: async () => {
      const res = await fetch(`/api/readings/${readingId}`);
      if (!res.ok) throw new Error("Reading not found");
      return res.json();
    },
    enabled: !!readingId,
  });

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !reading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" data-testid="link-back-dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="text-center py-16 text-muted-foreground" data-testid="text-not-found">
          Reading not found
        </div>
      </div>
    );
  }

  const ts = new Date(reading.timestamp);
  const formattedTimestamp = format(ts, "MMMM d, yyyy 'at' h:mm:ss a");

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="link-back-dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-detail-title">Test Results</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground" data-testid="text-detail-timestamp">{formattedTimestamp}</span>
          </div>
        </div>
        {reading.confidence !== null && (
          <Badge
            variant={reading.confidence >= 0.8 ? "default" : reading.confidence >= 0.7 ? "secondary" : "destructive"}
            className="ml-auto"
            data-testid="badge-overall-confidence"
          >
            {Math.round(reading.confidence * 100)}% Confidence
          </Badge>
        )}
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-base sm:text-lg font-semibold mb-3">Chemical Readings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <ChemicalLevelCard
              name="pH"
              value={reading.pH}
              unit="pH"
              optimalMin={7.2}
              optimalMax={7.8}
              warningMin={7.0}
              warningMax={8.0}
              interval={reading.pHInterval}
              paramConfidence={reading.pHConfidence}
            />
            <ChemicalLevelCard
              name="Chlorine"
              value={reading.chlorine}
              unit="ppm"
              optimalMin={1.0}
              optimalMax={3.0}
              warningMin={0.5}
              warningMax={5.0}
              interval={reading.chlorineInterval}
              paramConfidence={reading.chlorineConfidence}
            />
            <ChemicalLevelCard
              name="Alkalinity"
              value={reading.alkalinity}
              unit="ppm"
              optimalMin={80}
              optimalMax={120}
              warningMin={60}
              warningMax={150}
              interval={reading.alkalinityInterval}
              paramConfidence={reading.alkalinityConfidence}
            />
            <ChemicalLevelCard
              name="Bromine"
              value={reading.bromine}
              unit="ppm"
              optimalMin={2.0}
              optimalMax={4.0}
              warningMin={1.0}
              warningMax={6.0}
              interval={reading.bromineInterval}
              paramConfidence={reading.bromineConfidence}
            />
            <ChemicalLevelCard
              name="Hardness"
              value={reading.hardness}
              unit="ppm"
              optimalMin={150}
              optimalMax={250}
              warningMin={100}
              warningMax={400}
              interval={reading.hardnessInterval}
              paramConfidence={reading.hardnessConfidence}
            />
          </div>
        </section>

        {(reading.imageTopUrl || reading.imageBottomUrl) && (
          <section>
            <h2 className="text-base sm:text-lg font-semibold mb-3">Original Evidence</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Uploaded Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reading.imageTopUrl && (
                    <div className="relative" data-testid="evidence-image-top">
                      <img
                        src={reading.imageTopUrl}
                        alt="Test strip photo (top)"
                        className="w-full rounded-md border border-border object-contain max-h-80"
                        data-testid="img-evidence-top"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-3 py-1.5 rounded-b-md font-mono" data-testid="text-timestamp-overlay-top">
                        {formattedTimestamp}
                      </div>
                    </div>
                  )}
                  {reading.imageBottomUrl && (
                    <div className="relative" data-testid="evidence-image-bottom">
                      <img
                        src={reading.imageBottomUrl}
                        alt="Test strip photo (bottom)"
                        className="w-full rounded-md border border-border object-contain max-h-80"
                        data-testid="img-evidence-bottom"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-3 py-1.5 rounded-b-md font-mono" data-testid="text-timestamp-overlay-bottom">
                        {formattedTimestamp}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
