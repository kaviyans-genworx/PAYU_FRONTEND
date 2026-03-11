import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetState = () => {
    setZoom(1);
    setError(false);
    setLoading(true);
  };

  useEffect(() => {
    resetState();
  }, [fileUrl]);

  // Handle Escape key for exiting fullscreen natively
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoom(1);
  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  if (!fileUrl) {
    return (
      <Card className="h-full border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-muted-foreground py-20 min-h-[500px]">
          <FileText className="h-12 w-12 opacity-40 mb-3" />
          <p className="text-sm">No document available</p>
        </CardContent>
      </Card>
    );
  }

  const isPdf = fileUrl.toLowerCase().includes(".pdf");

  // Determine wrapper classes based on fullscreen state
  const wrapperClasses = isFullscreen
    ? "fixed inset-0 z-[100] w-screen h-screen m-0 rounded-none bg-background flex flex-col"
    : "h-full flex flex-col relative";

  // When zooming using width/height instead of CSS transforms, 
  // the layout naturally expands and triggers the parent's overflow-auto.
  // Using 100% as the baseline (zoom = 1).
  const zoomPercentage = `${Math.round(zoom * 100)}%`;

  return (
    <div className={wrapperClasses}>
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
            
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="h-3.5 w-3.5" />
              ) : (
                <Maximize className="h-3.5 w-3.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10 ml-1"
              title="Open full size"
            >
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Viewer Area */}
      <CardContent 
        className={cn(
          "flex-1 p-0 relative overflow-auto bg-muted/10 flex items-start justify-center",
          !isFullscreen && "min-h-[600px]"
        )}
        style={{ height: isFullscreen ? "auto" : "calc(100vh - 160px)" }} 
        ref={containerRef}
      >
        {error ? (
          <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Unable to load document preview</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              The browser might be blocking the file or the format is unsupported.
              You can try refreshing or view it externally.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={resetState}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  Open Document
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="flex justify-center transition-all duration-200 ease-out"
            style={{
              width: isPdf ? '100%' : zoomPercentage,
              height: isPdf ? zoomPercentage : 'auto',
              minWidth: isPdf ? zoomPercentage : 'auto',
              padding: isPdf ? 0 : "1.5rem",
              margin: 'auto', // Centers the content if it's smaller than the container
            }}
          >
            {isPdf ? (
              <object
                data={`${fileUrl}#view=FitH`}
                type="application/pdf"
                className="w-full h-full min-h-[600px] border-0 outline-none shadow-sm"
                onLoad={handleLoad}
                onError={handleError}
                aria-label="PDF Document Viewer"
              >
                <div className="flex flex-col items-center justify-center p-8 h-full min-h-[400px] bg-muted/30 text-center rounded-lg m-4 border border-dashed">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-foreground font-medium mb-1">
                    Your browser does not support embedded PDFs.
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Please download the PDF to view it.
                  </p>
                  <Button variant="outline" size="sm">
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      Download PDF
                    </a>
                  </Button>
                </div>
              </object>
            ) : (
              <img
                src={fileUrl}
                alt={title}
                className="w-full h-auto object-contain rounded-lg shadow-sm bg-background border"
                onLoad={handleLoad}
                onError={handleError}
                style={{
                  maxHeight: "none", // Prevent native max-height so zoom works
                }}
              />
            )}
          </div>
        )}
      </CardContent>
    </div>
  );
}
