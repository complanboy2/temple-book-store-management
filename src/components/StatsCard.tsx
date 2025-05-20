
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
}) => {
  return (
    <Card className="temple-card overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-2 px-2 sm:px-3 sm:pb-2 sm:pt-3">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-1">
          {title}
        </CardTitle>
        {icon && <div className="text-temple-gold flex-shrink-0">{icon}</div>}
      </CardHeader>
      <CardContent className="space-y-1 px-2 sm:px-3 pb-2 sm:pb-3 pt-0">
        <p className="text-lg sm:text-2xl font-bold text-temple-maroon truncate">{value}</p>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{description}</p>
        )}
        {trend && trendValue && (
          <div className="flex items-center mt-1">
            <div
              className={`h-2 w-2 rounded-full ${
                trend === "up"
                  ? "bg-green-500"
                  : trend === "down"
                  ? "bg-red-500"
                  : "bg-yellow-500"
              } mr-1`}
            />
            <span
              className={`text-xs ${
                trend === "up"
                  ? "text-green-500"
                  : trend === "down"
                  ? "text-red-500"
                  : "text-yellow-500"
              } truncate`}
            >
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
