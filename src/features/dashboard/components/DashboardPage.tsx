// import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

const stats = [
  {
    title: "Total Invoices",
    value: "0",
    description: "Invoices processed",
    icon: FileText,
    color: "text-blue-600 bg-blue-50",
  },
  {
    title: "Pending Review",
    value: "0",
    description: "Awaiting validation",
    icon: Clock,
    color: "text-amber-600 bg-amber-50",
  },
  {
    title: "Approved",
    value: "0",
    description: "Ready for payment",
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    title: "Exceptions",
    value: "0",
    description: "Need attention",
    icon: AlertCircle,
    color: "text-red-600 bg-red-50",
  },
];

export function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your accounts payable processing pipeline.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {stat.title}
              </CardDescription>
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Invoice
            </CardTitle>
            <CardDescription>
              Upload a new invoice for automated data extraction and validation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 text-muted-foreground text-sm">
              Drag & drop or click to upload (coming soon)
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest invoice processing activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 rounded-lg bg-muted/50 text-muted-foreground text-sm">
              No recent activity
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
