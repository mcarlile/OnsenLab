import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { format } from "date-fns";

interface TestReading {
  id: string;
  timestamp: Date;
  pH: number | null;
  chlorine: number | null;
  alkalinity: number | null;
  confidence?: number;
}

interface TestHistoryProps {
  readings: TestReading[];
  onViewDetails?: (id: string) => void;
}

export function TestHistory({ readings, onViewDetails }: TestHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Test History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                  Date & Time
                </th>
                <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                  pH
                </th>
                <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                  Chlorine
                </th>
                <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                  Alkalinity
                </th>
                <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                  Confidence
                </th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {readings.map((reading, index) => (
                <tr 
                  key={reading.id} 
                  className={index % 2 === 0 ? "bg-muted/30" : ""}
                  data-testid={`row-reading-${reading.id}`}
                >
                  <td className="py-3 px-2 text-sm font-mono">
                    {format(reading.timestamp, "MMM d, yyyy HH:mm")}
                  </td>
                  <td className="text-center py-3 px-2 text-sm font-medium">
                    {reading.pH !== null ? reading.pH.toFixed(1) : "--"}
                  </td>
                  <td className="text-center py-3 px-2 text-sm font-medium">
                    {reading.chlorine !== null ? `${reading.chlorine.toFixed(1)} ppm` : "--"}
                  </td>
                  <td className="text-center py-3 px-2 text-sm font-medium">
                    {reading.alkalinity !== null ? `${reading.alkalinity.toFixed(0)} ppm` : "--"}
                  </td>
                  <td className="text-center py-3 px-2">
                    {reading.confidence && (
                      <Badge variant={reading.confidence >= 0.8 ? "default" : "secondary"}>
                        {Math.round(reading.confidence * 100)}%
                      </Badge>
                    )}
                  </td>
                  <td className="text-right py-3 px-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails?.(reading.id)}
                      data-testid={`button-view-${reading.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
