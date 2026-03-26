import { useState, useRef, useEffect, useCallback } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utility for tailwind class merging if needed */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DocumentViewerProps {
  fileUrl: string | null;
  title?: string;
}

export function DocumentViewer({
  fileUrl,
  title = "Document Preview",
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const resetState = () => {
    setZoom(1);
    setError(false);
    setLoading(true);
    setBlobUrl(null);
  };

  useEffect(() => {
    resetState();
    if (!fileUrl) {
      setLoading(false);
      return;
    }

    let objectUrl: string | null = null;
    let isMounted = true;

    if (fileUrl.toLowerCase().includes(".pdf")) {
      setLoading(true);
      fetch(fileUrl)
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          const blob = await res.blob();
          if (!isMounted) return;
          objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
          setLoading(false);
        })
        .catch(() => {
          if (!isMounted) return;
          setError(true);
          setLoading(false);
        });
    } else {
      setBlobUrl(fileUrl);
      setLoading(false);
    }

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileUrl]);

  const handleZoomIn = useCallback(() => setZoom((prev) => Math.min(prev + 0.25, 3)), []);
  const handleZoomOut = useCallback(() => setZoom((prev) => Math.max(prev - 0.25, 0.5)), []);
  const handleZoomReset = useCallback(() => setZoom(1), []);

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  if (!fileUrl) {
    return (
      <div className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-muted-foreground py-20 min-h-[500px] flex-1">
          <FileText className="h-12 w-12 opacity-40 mb-3" />
          <p className="text-sm">No document available</p>
        </CardContent>
      </div>
    );
  }

  const isPdf = fileUrl.toLowerCase().includes(".pdf");

  return (
    <div className="h-full flex flex-col relative">
      {/* Header & Controls */}
      <CardHeader className="pb-2 border-b bg-muted/20 shrink-0 z-10 sticky top-0 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 m-0">
            <FileText className="h-4 w-4" />
            {title}
          </CardTitle>

          <div className="flex items-center gap-1.5 bg-background rounded-md border p-1 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5 || error || loading}
              aria-label="Zoom Out"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-mono font-medium w-12 text-center select-none text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleZoomIn}
              disabled={zoom >= 3 || error || loading}
              aria-label="Zoom In"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleZoomReset}
              disabled={zoom === 1 || error || loading}
              aria-label="Reset Zoom"
              title="Reset Zoom"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />

            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-primary hover:text-primary hover:bg-primary/10 transition-colors"
              title="Open full size"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </CardHeader>

      {/* Viewer Area */}
      <CardContent
        className="flex-1 p-0 relative overflow-auto bg-muted/10 min-h-[400px]"
        ref={containerRef}
      >
        {error ? (
          <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Document Unavailable</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              The requested document could not be found or failed to load. It may have been deleted or is temporarily unavailable.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={resetState}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Open Document
              </a>
            </div>
          </div>
        ) : isPdf && blobUrl ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              minHeight: "600px",
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
          >
            <iframe
              src={`${blobUrl}#view=FitH`}
              className="w-full h-full border-0 outline-none shadow-sm"
              onLoad={handleLoad}
              onError={handleError}
              title="PDF Document Viewer"
            />
          </div>
        ) : !isPdf && blobUrl ? (
          <div
            className="p-4"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              width: "100%",
            }}
          >
            <img
              src={blobUrl}
              alt={title}
              className="w-full h-auto object-contain rounded-lg shadow-sm bg-background border"
              onLoad={handleLoad}
              onError={handleError}
            />
          </div>
        ) : null}
      </CardContent>
    </div>
  );
}
