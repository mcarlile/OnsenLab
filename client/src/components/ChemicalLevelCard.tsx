import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface ChemicalLevelCardProps {
  name: string;
  value: number | null;
  unit: string;
  optimalMin: number;
  optimalMax: number;
  warningMin?: number;
  warningMax?: number;
  icon?: React.ReactNode;
}

export function ChemicalLevelCard({
  name,
  value,
  unit,
  optimalMin,
  optimalMax,
  warningMin,
  warningMax,
  icon,
}: ChemicalLevelCardProps) {
  const getStatus = () => {
    if (value === null) return "unknown";
    if (value >= optimalMin && value <= optimalMax) return "optimal";
    if (
      (warningMin !== undefined && value >= warningMin && value < optimalMin) ||
      (warningMax !== undefined && value > optimalMax && value <= warningMax)
    ) {
      return "warning";
    }
    return "critical";
  };

  const status = getStatus();

  const statusConfig = {
    optimal: {
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      icon: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
      badge: "Optimal",
      badgeVariant: "default" as const,
    },
    warning: {
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      badge: "Needs Attention",
      badgeVariant: "secondary" as const,
    },
    critical: {
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      icon: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
      badge: "Critical",
      badgeVariant: "destructive" as const,
    },
    unknown: {
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      icon: null,
      badge: "No Data",
      badgeVariant: "secondary" as const,
    },
  };

  const config = statusConfig[status];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{name}</CardTitle>
        {config.icon}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className={`text-3xl font-bold ${config.color}`} data-testid={`text-${name.toLowerCase()}-value`}>
              {value !== null ? value.toFixed(1) : "--"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{unit}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Optimal: {optimalMin}-{optimalMax} {unit}
            </p>
          </div>
          <Badge variant={config.badgeVariant} className="text-xs">
            {config.badge}
          </Badge>
        </div>
        <div className="mt-4 h-2 w-full rounded-full bg-muted overflow-hidden">
          {value !== null && (
            <div
              className={`h-full rounded-full transition-all ${
                status === "optimal"
                  ? "bg-green-600 dark:bg-green-400"
                  : status === "warning"
                  ? "bg-amber-600 dark:bg-amber-400"
                  : "bg-red-600 dark:bg-red-400"
              }`}
              style={{ width: `${Math.min(100, (value / (optimalMax * 1.5)) * 100)}%` }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
