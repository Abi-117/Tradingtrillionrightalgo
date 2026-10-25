import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Search,
  FileBarChart2,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PageIntro, External } from "@/components/site/shared";
import { reportService } from "@/services/reportService";
import { site, pageHead } from "@/config/site";
export const Route = createFileRoute("/daily-report")({
  head: () =>
    pageHead(
      "Daily Trading Reports",
      "Browse daily trading reports, market analysis, and report images from Trillion Trading and Right Algo Trading.",
    ),
  component: Reports,
});
function Reports() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Reports");
  const [limit, setLimit] = useState(9);
  const [preview, setPreview] = useState<number | null>(null);
  const query = useQuery({
    queryKey: ["reports"],
    queryFn: reportService.list,
    enabled: Boolean(site.apiBaseUrl),
    retry: false,
  });
  const reports = (query.data ?? [])
    .filter(
      (r) =>
        (category === "All Reports" || r.category === category) &&
        `${r.title} ${r.date}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const selected = preview === null ? undefined : reports[preview];
  return (
    <>
      <PageIntro
        eyebrow="A CLOSER LOOK AT THE MARKETS"
        title="Daily market reports."
        text="Explore our published trading reports and market updates."
      />
      <section className="section">
        <div className="container">
          <div className="report-toolbar">
            <div className="filter-tabs">
              {["All Reports", "Trillion Trading", "Right Algo Trading"].map((c) => (
                <Button
                  key={c}
                  variant={c === category ? "default" : "ghost"}
                  onClick={() => {
                    setCategory(c);
                    setLimit(9);
                    setPreview(null);
                  }}
                >
                  {c}
                </Button>
              ))}
            </div>
            <label className="search-input">
              <Search size={17} />
              <input
                aria-label="Search report title or date"
                placeholder="Search title or date…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPreview(null);
                }}
              />
            </label>
          </div>
          {query.isLoading ? (
            <div className="empty-state">
              <Loader2 className="animate-spin" />
              <h3>Loading reports…</h3>
            </div>
          ) : query.isError ? (
            <div className="empty-state">
              <FileBarChart2 />
              <h3>Reports could not be loaded.</h3>
              <p>Please try again in a moment.</p>
              <Button variant="outline" onClick={() => query.refetch()}>
                <RefreshCw />
                Try Again
              </Button>
            </div>
          ) : reports.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">
                <FileBarChart2 size={34} />
              </span>
              <h3>
                {search || category !== "All Reports"
                  ? "No matching reports."
                  : "No reports available yet."}
              </h3>
              <p>
                {search
                  ? "Try a different title or date."
                  : "Published reports will appear here when available."}
              </p>
              {!site.apiBaseUrl && <span className="tag">Report service not connected</span>}
              {(search || category !== "All Reports") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setCategory("All Reports");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="report-grid">
                {reports.slice(0, limit).map((r, i) => (
                  <article className="report-card" key={r.id}>
                    <Button
                      variant="ghost"
                      className="report-image-button"
                      onClick={() => setPreview(i)}
                      aria-label={`Preview ${r.title}`}
                    >
                      <img src={r.imageUrl} alt={r.title} loading="lazy" />
                    </Button>
                    <div>
                      <span className="eyebrow">{r.category}</span>
                      <h3>{r.title}</h3>
                      <time dateTime={r.date}>{r.date}</time>
                      <p>{r.description}</p>
                    </div>
                  </article>
                ))}
              </div>
              {reports.length > limit && (
                <Button className="load-more" variant="outline" onClick={() => setLimit(limit + 9)}>
                  Load More Reports
                </Button>
              )}
            </>
          )}
          <p className="small-note">
            For information and educational reference only. Reports are not a promise of future
            returns.
          </p>
        </div>
      </section>
      <Dialog
        open={selected !== undefined}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="report-lightbox">
          <DialogTitle>{selected?.title}</DialogTitle>
          <DialogDescription>
            {selected?.date} · {selected?.description}
          </DialogDescription>
          {selected && <img src={selected.imageUrl} alt={selected.title} />}
          <div className="lightbox-controls">
            <Button
              variant="outline"
              aria-label="Previous report"
              disabled={preview === null || preview <= 0}
              onClick={() => setPreview((p) => (p === null ? null : p - 1))}
            >
              <ChevronLeft />
              Previous
            </Button>
            {selected?.downloadUrl && (
              <Button asChild>
                <External href={selected.downloadUrl}>
                  <Download />
                  Download
                </External>
              </Button>
            )}
            <Button
              variant="outline"
              aria-label="Next report"
              disabled={preview === null || preview >= reports.length - 1}
              onClick={() => setPreview((p) => (p === null ? null : p + 1))}
            >
              Next
              <ChevronRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
