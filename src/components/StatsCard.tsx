
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
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-temple-gold">{icon}</div>}
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-bold text-temple-maroon">{value}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {trend && trendValue && (
          <div className="flex items-center mt-2">
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
              }`}
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
