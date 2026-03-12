import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface TestReading {
  id: string;
  timestamp: Date;
  pH: number | null;
  chlorine: number | null;
  alkalinity: number | null;
  confidence?: number | null;
  pHInterval?: number | null;
  chlorineInterval?: number | null;
  alkalinityInterval?: number | null;
  pHConfidence?: number | null;
  chlorineConfidence?: number | null;
  alkalinityConfidence?: number | null;
  bromineConfidence?: number | null;
  hardnessConfidence?: number | null;
}

interface TestHistoryProps {
  readings: TestReading[];
  onViewDetails?: (id: string) => void;
}

function formatWithInterval(value: number | null, interval?: number | null, decimals = 1) {
  if (value === null) return "--";
  const v = value.toFixed(decimals);
  if (interval !== null && interval !== undefined && interval > 0) {
    const i = interval % 1 === 0 ? interval.toString() : interval.toFixed(decimals);
    return `${v} ±${i}`;
  }
  return v;
}

function hasLowConfidence(reading: TestReading): boolean {
  const confidences = [
    reading.pHConfidence,
    reading.chlorineConfidence,
    reading.alkalinityConfidence,
    reading.bromineConfidence,
    reading.hardnessConfidence,
  ];
  return confidences.some(c => c !== null && c !== undefined && c < 0.70);
}

export function TestHistory({ readings, onViewDetails }: TestHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Recent Tests</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                  Date & Time
                </th>
                <th className="text-center py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">
                  pH
                </th>
                <th className="text-center py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground hidden sm:table-cell">
                  Chlorine
                </th>
                <th className="text-center py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground hidden md:table-cell">
                  Alkalinity
                </th>
                <th className="text-center py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground hidden lg:table-cell">
                  Confidence
                </th>
                <th className="text-right py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                  
                </th>
              </tr>
            </thead>
            <tbody>
              {readings.map((reading, index) => {
                const lowConf = hasLowConfidence(reading);
                return (
                  <tr 
                    key={reading.id} 
                    className={index % 2 === 0 ? "bg-muted/30" : ""}
                    data-testid={`row-reading-${reading.id}`}
                  >
                    <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm font-mono">
                      <div className="flex flex-col">
                        <span>{format(reading.timestamp, "MMM d, yyyy")}</span>
                        <span className="text-muted-foreground text-xs">{format(reading.timestamp, "HH:mm")}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium tabular-nums">
                      {formatWithInterval(reading.pH, reading.pHInterval)}
                    </td>
                    <td className="text-center py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium hidden sm:table-cell tabular-nums">
                      {formatWithInterval(reading.chlorine, reading.chlorineInterval)}
                    </td>
                    <td className="text-center py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium hidden md:table-cell tabular-nums">
                      {formatWithInterval(reading.alkalinity, reading.alkalinityInterval, 0)}
                    </td>
                    <td className="text-center py-3 px-2 sm:px-3 hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {reading.confidence != null && (
                          <Badge variant={reading.confidence >= 0.8 ? "default" : reading.confidence >= 0.7 ? "secondary" : "destructive"} className="text-xs">
                            {Math.round(reading.confidence * 100)}%
                          </Badge>
                        )}
                        {lowConf && (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="text-right py-3 px-3 sm:px-4">
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
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
