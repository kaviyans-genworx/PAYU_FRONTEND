import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { validationService } from "../services/validationService";
import type { ValidationGroupSummary } from "@/types/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ShieldCheck, RefreshCw, AlertCircle, Eye } from "lucide-react";

function statusVariant(
  status: string,
): "success" | "warning" | "destructive" | "secondary" {
  switch (status.toLowerCase()) {
    case "validated":
    case "matched":
      return "success";
    case "pending":
      return "warning";
    case "failed":
    case "mismatched":
      return "destructive";
    default:
      return "secondary";
  }
}

export function ValidationGroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<ValidationGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await validationService.listGroups();
      setGroups(data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail ??
        (err instanceof Error ? err.message : "Failed to load validation groups");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchGroups();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Validation Groups</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Review grouped invoices and purchase orders for manual comparison.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchGroups}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size={32} />
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShieldCheck className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No validation groups found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {groups.length} group{groups.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-muted/50">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Group ID
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">
                      Invoice Count
                    </th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">
                      PO Count
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Created At
                    </th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">
                      View
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <tr
                      key={g.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{g.id}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(g.status)}>
                          {g.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">{g.invoice_count}</td>
                      <td className="px-4 py-3 text-center">{g.po_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {g.created_at
                          ? new Date(g.created_at).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/validation/${g.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
