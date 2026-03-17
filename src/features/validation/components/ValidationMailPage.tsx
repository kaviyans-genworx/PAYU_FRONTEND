import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, FileSpreadsheet, FileText, Mail, Paperclip, Send } from "lucide-react";

import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DiscrepancyMailDraft, DiscrepancyMailSendPayload } from "@/types/documents";

import { validationService } from "../services/validationService";

function joinOrFallback(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "—";
}

export function ValidationMailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const numericGroupId = useMemo(() => Number(groupId), [groupId]);

  const [draft, setDraft] = useState<DiscrepancyMailDraft | null>(null);
  const [form, setForm] = useState<DiscrepancyMailSendPayload>({
    to_email: "",
    subject: "",
    body: "",
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId || Number.isNaN(numericGroupId)) {
      setError("Invalid validation group.");
      setLoading(false);
      return;
    }

    const fetchDraft = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await validationService.getDiscrepancyMailDraft(numericGroupId);
        setDraft(data);
        setForm({
          to_email: data.to_email,
          subject: data.subject,
          body: data.body,
        });
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
          (err instanceof Error ? err.message : "Failed to load mail draft");
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchDraft();
  }, [groupId, numericGroupId]);

  const handleChange = (field: keyof DiscrepancyMailSendPayload, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSend = async () => {
    if (!groupId || Number.isNaN(numericGroupId)) {
      setError("Invalid validation group.");
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await validationService.sendDiscrepancyMail(numericGroupId, form);
      setSuccess(response.message);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
        (err instanceof Error ? err.message : "Failed to send mail");
      setError(message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/validation/${numericGroupId}`)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Send discrepancy mail</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review and edit the vendor email before sending it for group #{Number.isNaN(numericGroupId) ? "—" : numericGroupId}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Button variant="outline" onClick={() => navigate(`/validation/${numericGroupId}`)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || !draft}>
            <Send className="h-4 w-4" />
            {sending ? "Sending..." : "Send Mail"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
          {success}
        </div>
      )}

      {draft && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-primary" />
                Mail editor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="to_email">Send to</Label>
                <Input
                  id="to_email"
                  type="email"
                  value={form.to_email}
                  onChange={(event) => handleChange("to_email", event.target.value)}
                  placeholder="vendor@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(event) => handleChange("subject", event.target.value)}
                  placeholder="Enter subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Content</Label>
                <textarea
                  id="body"
                  value={form.body}
                  onChange={(event) => handleChange("body", event.target.value)}
                  rows={18}
                  className="flex min-h-[360px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Write your email content"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Mail summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Vendor</span>
                  <span className="font-medium text-right">{draft.vendor_name || "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Discrepancies</span>
                  <Badge variant={draft.discrepancy_count > 0 ? "destructive" : "success"}>
                    {draft.discrepancy_count}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Attachments</span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    {draft.attachment_count}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Invoice numbers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground break-words">{joinOrFallback(draft.invoice_numbers)}</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSpreadsheet className="h-4 w-4 text-indigo-500" />
                  Purchase orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground break-words">{joinOrFallback(draft.po_numbers)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}