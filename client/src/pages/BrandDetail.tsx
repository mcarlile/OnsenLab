import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Pencil } from "lucide-react";
import { format } from "date-fns";
import type { TestStripBrand, TestReading } from "@shared/schema";

function statusBadge(value: number | null, type: "ph" | "chlorine" | "alkalinity" | "bromine" | "hardness") {
  if (value === null) return <span className="text-muted-foreground text-sm">—</span>;

  const ranges: Record<string, { ok: [number, number]; warn: [number, number] }> = {
    ph:         { ok: [7.2, 7.6], warn: [7.0, 7.8] },
    chlorine:   { ok: [1, 3],     warn: [0.5, 5] },
    alkalinity: { ok: [80, 120],  warn: [60, 180] },
    bromine:    { ok: [2, 4],     warn: [1, 8] },
    hardness:   { ok: [200, 400], warn: [150, 500] },
  };

  const r = ranges[type];
  let variant: "default" | "secondary" | "destructive" = "destructive";
  if (value >= r.ok[0] && value <= r.ok[1]) variant = "default";
  else if (value >= r.warn[0] && value <= r.warn[1]) variant = "secondary";

  return (
    <Badge variant={variant} className="tabular-nums" data-testid={`badge-${type}-${value}`}>
      {value}
    </Badge>
  );
}

export default function BrandDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: brand, isLoading: brandLoading } = useQuery<TestStripBrand>({
    queryKey: ['/api/brands', id],
    queryFn: async () => {
      const res = await fetch(`/api/brands/${id}`);
      if (!res.ok) throw new Error("Brand not found");
      return res.json();
    },
  });

  const { data: readings = [], isLoading: readingsLoading } = useQuery<TestReading[]>({
    queryKey: ['/api/brands', id, 'readings'],
    queryFn: async () => {
      const res = await fetch(`/api/brands/${id}/readings`);
      if (!res.ok) throw new Error("Failed to fetch readings");
      return res.json();
    },
  });

  const isLoading = brandLoading || readingsLoading;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/brands')}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                {brand ? (
                  <>
                    <h1 className="text-lg sm:text-xl font-bold">{brand.name}</h1>
                    <p className="text-xs text-muted-foreground">{brand.manufacturer}{brand.sku ? ` · ${brand.sku}` : ""}</p>
                  </>
                ) : (
                  <h1 className="text-lg sm:text-xl font-bold">Brand Detail</h1>
                )}
              </div>
            </div>
            {brand && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/brands')}
                data-testid="button-edit-brand"
              >
                <Pencil className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit Brand</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : !brand ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Brand not found.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Brand info card */}
            <Card data-testid="card-brand-info">
              <CardContent className="pt-6">
                <div className="flex gap-6 flex-col sm:flex-row">
                  {brand.imageUrl && (
                    <img
                      src={brand.imageUrl}
                      alt={brand.name}
                      className="w-full sm:w-40 h-40 object-cover rounded-md border flex-shrink-0"
                      data-testid="img-brand"
                    />
                  )}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Manufacturer:</span> {brand.manufacturer}
                    </p>
                    {brand.sku && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">SKU:</span> {brand.sku}
                      </p>
                    )}
                    {brand.description && (
                      <p className="text-sm text-muted-foreground pt-1">{brand.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground pt-2">
                      <span className="font-medium text-foreground">Total tests logged:</span> {readings.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Readings table */}
            <Card data-testid="card-readings-table">
              <CardHeader>
                <CardTitle>Usage History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {readings.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    No readings logged with this brand yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date &amp; Time</TableHead>
                          <TableHead className="text-center">pH</TableHead>
                          <TableHead className="text-center">Chlorine<br /><span className="font-normal text-xs">(ppm)</span></TableHead>
                          <TableHead className="text-center">Alkalinity<br /><span className="font-normal text-xs">(ppm)</span></TableHead>
                          <TableHead className="text-center">Bromine<br /><span className="font-normal text-xs">(ppm)</span></TableHead>
                          <TableHead className="text-center">Hardness<br /><span className="font-normal text-xs">(ppm)</span></TableHead>
                          <TableHead className="text-center">Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {readings.map((reading) => (
                          <TableRow key={reading.id} data-testid={`row-reading-${reading.id}`}>
                            <TableCell className="whitespace-nowrap text-sm">
                              {format(new Date(reading.timestamp), "MMM d, yyyy")}
                              <br />
                              <span className="text-muted-foreground text-xs">
                                {format(new Date(reading.timestamp), "h:mm a")}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">{statusBadge(reading.pH, "ph")}</TableCell>
                            <TableCell className="text-center">{statusBadge(reading.chlorine, "chlorine")}</TableCell>
                            <TableCell className="text-center">{statusBadge(reading.alkalinity, "alkalinity")}</TableCell>
                            <TableCell className="text-center">{statusBadge(reading.bromine, "bromine")}</TableCell>
                            <TableCell className="text-center">{statusBadge(reading.hardness, "hardness")}</TableCell>
                            <TableCell className="text-center">
                              {reading.confidence !== null ? (
                                <span className="text-sm tabular-nums">
                                  {Math.round((reading.confidence ?? 0) * 100)}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
