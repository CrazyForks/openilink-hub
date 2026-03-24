import { useEffect, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { api } from "../lib/api";
import { RefreshCw, ChevronRight, ChevronDown, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

interface TraceSpan {
  id: number;
  trace_id: string;
  span_id: string;
  parent_span_id: string;
  name: string;
  kind: string;
  status_code: string;
  status_message: string;
  start_time: number;
  end_time: number;
  attributes: Record<string, any> | null;
  events: { name: string; timestamp: number; attributes?: Record<string, any> }[] | null;
  created_at: number;
}

const kindColors: Record<string, string> = {
  internal: "bg-slate-500",
  client: "bg-blue-500",
  server: "bg-green-500",
};

function StatusIcon({ code }: { code: string }) {
  if (code === "ok") return <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />;
  if (code === "error") return <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />;
  return <MinusCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
}

function durationMs(span: TraceSpan): number {
  if (span.end_time > span.start_time) return span.end_time - span.start_time;
  return 0;
}

function buildTree(spans: TraceSpan[]): Map<string, TraceSpan[]> {
  const children = new Map<string, TraceSpan[]>();
  for (const s of spans) {
    const parentKey = s.parent_span_id || "";
    if (!children.has(parentKey)) children.set(parentKey, []);
    children.get(parentKey)!.push(s);
  }
  return children;
}

function SpanRow({ span, depth, tree, expandedAttrs, toggleAttrs }: {
  span: TraceSpan;
  depth: number;
  tree: Map<string, TraceSpan[]>;
  expandedAttrs: Set<string>;
  toggleAttrs: (id: string) => void;
}) {
  const children = tree.get(span.span_id) || [];
  const dur = durationMs(span);
  const isExpanded = expandedAttrs.has(span.span_id);
  const hasAttrs = (span.attributes && Object.keys(span.attributes).length > 0) ||
    (span.events && span.events.length > 0) ||
    span.status_message;

  return (
    <>
      <div
        className="flex items-center gap-2 text-xs py-1 hover:bg-secondary/50 rounded px-1 cursor-pointer"
        style={{ paddingLeft: `${depth * 20 + 4}px` }}
        onClick={() => hasAttrs && toggleAttrs(span.span_id)}
      >
        {hasAttrs ? (
          isExpanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <StatusIcon code={span.status_code} />
        <Badge variant="outline" className={`text-[9px] px-1 py-0 text-white shrink-0 ${kindColors[span.kind] || "bg-gray-400"}`}>
          {span.kind}
        </Badge>
        <span className="font-mono truncate">{span.name}</span>
        {dur > 0 && <span className="text-muted-foreground shrink-0 ml-auto">{dur}ms</span>}
      </div>

      {isExpanded && (
        <div className="text-[10px] font-mono space-y-0.5 mb-1" style={{ paddingLeft: `${depth * 20 + 28}px` }}>
          {span.status_message && (
            <div className="text-destructive">error: {span.status_message}</div>
          )}
          {span.attributes && Object.entries(span.attributes).map(([k, v]) => (
            <div key={k} className="text-muted-foreground">
              <span className="text-foreground/70">{k}:</span> {String(v)}
            </div>
          ))}
          {span.events && span.events.map((ev, i) => (
            <div key={i} className="text-muted-foreground">
              <span className="text-amber-600">[event]</span> {ev.name}
              {ev.attributes && Object.entries(ev.attributes).map(([k, v]) => (
                <span key={k} className="ml-2">{k}={String(v)}</span>
              ))}
            </div>
          ))}
        </div>
      )}

      {children.map((child) => (
        <SpanRow
          key={child.span_id}
          span={child}
          depth={depth + 1}
          tree={tree}
          expandedAttrs={expandedAttrs}
          toggleAttrs={toggleAttrs}
        />
      ))}
    </>
  );
}

export function BotTracesTab({ botId }: { botId: string }) {
  const [rootSpans, setRootSpans] = useState<TraceSpan[]>([]);
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);
  const [traceSpans, setTraceSpans] = useState<TraceSpan[]>([]);
  const [expandedAttrs, setExpandedAttrs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [traceLoading, setTraceLoading] = useState(false);

  async function load() {
    setLoading(true);
    try { setRootSpans((await api.listTraces(botId, 100)) || []); } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [botId]);

  async function toggleTrace(traceId: string) {
    if (expandedTrace === traceId) {
      setExpandedTrace(null);
      setTraceSpans([]);
      setExpandedAttrs(new Set());
      return;
    }
    setExpandedTrace(traceId);
    setTraceLoading(true);
    try {
      setTraceSpans((await api.getTrace(botId, traceId)) || []);
    } catch {
      setTraceSpans([]);
    }
    setExpandedAttrs(new Set());
    setTraceLoading(false);
  }

  function toggleAttrs(spanId: string) {
    setExpandedAttrs((prev) => {
      const next = new Set(prev);
      if (next.has(spanId)) next.delete(spanId);
      else next.add(spanId);
      return next;
    });
  }

  function formatTime(ms: number) {
    return new Date(ms).toLocaleString();
  }

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Traces</p>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {rootSpans.length === 0 && !loading && (
        <p className="text-center text-sm text-muted-foreground py-8">No traces yet</p>
      )}

      <div className="space-y-1">
        {rootSpans.map((root) => {
          const isOpen = expandedTrace === root.trace_id;
          const dur = durationMs(root);
          const sender = root.attributes?.["message.sender"] || "";
          const content = root.attributes?.["message.content"] || "";
          const msgType = root.attributes?.["message.type"] || "text";

          return (
            <div key={root.id} className="rounded-lg border bg-card overflow-hidden">
              <div
                className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-secondary/50"
                onClick={() => toggleTrace(root.trace_id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusIcon code={root.status_code} />
                    <Badge variant={root.status_code === "error" ? "destructive" : "default"} className="text-[10px] shrink-0">
                      {msgType}
                    </Badge>
                    <span className="text-xs font-mono truncate">{sender}</span>
                    <span className="text-xs text-muted-foreground truncate">{content}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[10px] text-muted-foreground">
                  {dur > 0 && <span>{dur}ms</span>}
                  <span>{formatTime(root.start_time)}</span>
                </div>
              </div>

              {isOpen && (
                <div className="border-t p-3 bg-background">
                  <div className="text-[10px] text-muted-foreground mb-2 font-mono">
                    trace: {root.trace_id}
                  </div>
                  {traceLoading ? (
                    <p className="text-xs text-muted-foreground py-2">Loading spans...</p>
                  ) : (
                    <div>
                      {(() => {
                        const tree = buildTree(traceSpans);
                        // Find root spans (parent_span_id is empty)
                        const roots = traceSpans.filter((s) => !s.parent_span_id);
                        return roots.map((s) => (
                          <SpanRow
                            key={s.span_id}
                            span={s}
                            depth={0}
                            tree={tree}
                            expandedAttrs={expandedAttrs}
                            toggleAttrs={toggleAttrs}
                          />
                        ));
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
