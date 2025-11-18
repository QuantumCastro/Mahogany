"use client";

import { useRouter } from "next/navigation";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";

import { useI18n } from "@/lib/i18n/i18n-provider";
import type { GraphEdge, GraphFile, GraphNode } from "@/lib/vault/types";

type GraphControls = {
  center: number;
  repel: number;
  distance: number;
};

type NodeDatum = GraphNode &
  SimulationNodeDatum & {
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number;
    fy?: number;
  };

type LinkDatum = GraphEdge & SimulationLinkDatum<NodeDatum>;

const defaultControls: GraphControls = {
  center: 0.3,
  repel: 200,
  distance: 80,
};

export function GraphPanel() {
  const [state, setState] = useState<"idle" | "loading" | "error" | "ready">("idle");
  const [graph, setGraph] = useState<GraphFile | null>(null);
  const [filterTag, setFilterTag] = useState<string>("all");
  const [controls, setControls] = useState<GraphControls>(defaultControls);
  const [recalc, setRecalc] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const { t } = useI18n();

  const loadGraph = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/data/graph.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Graph not reachable");
      }
      const payload = (await response.json()) as GraphFile;
      setGraph(payload);
      setState("ready");
    } catch (error) {
      console.error(error);
      setState("error");
    }
  }, []);

  const filtered = useMemo(() => {
    if (!graph) return null;
    if (filterTag === "all") return graph;
    const ids = new Set(graph.nodes.filter((node) => node.tags.includes(filterTag)).map((node) => node.id));
    return {
      nodes: graph.nodes.filter((node) => ids.has(node.id)),
      edges: graph.edges.filter(
        (edge) => ids.has(String(edge.source)) && ids.has(String(edge.target)),
      ),
    };
  }, [graph, filterTag]);

  const availableTags = useMemo(() => {
    if (!graph) return [];
    const tags = new Set<string>();
    graph.nodes.forEach((node) => node.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [graph]);

  if (state === "idle") {
    return (
      <div className="rounded-2xl border border-border bg-panel p-6 text-center">
        <p className="text-muted">{t("graph.prompt")}</p>
        <button
          type="button"
          onClick={loadGraph}
          className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-brand hover:text-brand focus-ring"
        >
          {t("graph.load")}
        </button>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="rounded-2xl border border-border bg-panel p-6 text-center text-muted">
        {t("graph.loading")}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-2xl border border-border bg-panel p-6 text-center">
        <p className="text-muted">{t("graph.error")}</p>
        <button
          type="button"
          onClick={loadGraph}
          className="mt-4 rounded-full border border-border px-4 py-2 text-sm focus-ring"
        >
          {t("graph.load")}
        </button>
      </div>
    );
  }

  if (!filtered) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
      <GraphCanvas
        graph={filtered}
        controls={controls}
        reducedMotion={reducedMotion}
        recalc={recalc}
      />
      <GraphControlsSidebar
        controls={controls}
        setControls={setControls}
        tags={availableTags}
        filterTag={filterTag}
        setFilterTag={setFilterTag}
        onRecalculate={() => setRecalc((value) => value + 1)}
        labels={{
          title: t("graph.controls.title"),
          center: t("graph.controls.center"),
          repel: t("graph.controls.repel"),
          distance: t("graph.controls.distance"),
          filter: t("graph.controls.filter"),
          button: t("graph.controls.recalculate"),
          all: t("graph.controls.all"),
        }}
      />
    </div>
  );
}

function GraphCanvas({
  graph,
  controls,
  reducedMotion,
  recalc,
}: {
  graph: GraphFile;
  controls: GraphControls;
  reducedMotion: boolean;
  recalc: number;
}) {
  const router = useRouter();
  const [nodes, setNodes] = useState<NodeDatum[]>([]);
  const [links, setLinks] = useState<LinkDatum[]>([]);
  const simulationRef = useRef<Simulation<NodeDatum, LinkDatum> | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const isDragging = useRef<string | null>(null);
  const dragMeta = useRef<{
    nodeId: string | null;
    moved: boolean;
    startX: number;
    startY: number;
    startedAt: number;
  }>({
    nodeId: null,
    moved: false,
    startX: 0,
    startY: 0,
    startedAt: 0,
  });

  const DRAG_DISTANCE_THRESHOLD = 6;

  const handleNodeOpen = useCallback(
    (node: NodeDatum) => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("vault:pending-note", node.slug);
        const emit = () =>
          window.dispatchEvent(
            new CustomEvent("vault:open-note", {
              detail: { slug: node.slug },
            }) as Event,
          );
        if (window.location.pathname === "/") {
          emit();
        } else {
          let attempts = 0;
          const maxAttempts = 30;
          const tick = () => {
            if (window.location.pathname === "/") {
              emit();
              return;
            }
            if (attempts < maxAttempts) {
              attempts += 1;
              window.setTimeout(tick, 50);
            }
          };
          window.setTimeout(tick, 50);
        }
      }
      router.push("/");
    },
    [router],
  );

  const initializeSimulation = useCallback(() => {
    const nodeData: NodeDatum[] = graph.nodes.map((node) => ({ ...node }));
    const linkData: LinkDatum[] = graph.edges.map((edge) => ({ ...edge }));
    setLinks(linkData);
    const linkForce = forceLink<NodeDatum, LinkDatum>(linkData)
      .id((node: NodeDatum) => node.id)
      .distance(controls.distance);
    const simulation = forceSimulation(nodeData)
      .force("link", linkForce)
      .force("charge", forceManyBody().strength(-controls.repel))
      .force("center", forceCenter(0, 0).strength(controls.center))
      .alpha(1)
      .alphaDecay(reducedMotion ? 0.3 : 0.05)
      .on("tick", () => {
        setNodes([...nodeData]);
      });

    simulationRef.current = simulation;
    return () => {
      simulation.stop();
    };
  }, [graph, controls.center, controls.distance, controls.repel, reducedMotion]);

  useEffect(() => {
    const cleanup = initializeSimulation();
    return cleanup;
  }, [initializeSimulation, recalc]);

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(2.5, Math.max(0.4, prev.scale + delta)),
    }));
  };

  const handleBackgroundDrag = (event: React.MouseEvent<SVGSVGElement>) => {
    if (event.buttons !== 1 || isDragging.current) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = transform;

    const move = (moveEvent: MouseEvent) => {
      setTransform({
        ...initial,
        x: initial.x + (moveEvent.clientX - startX),
        y: initial.y + (moveEvent.clientY - startY),
      });
    };

    const stop = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  };

  const startNodeDrag = (event: React.PointerEvent, node: NodeDatum) => {
    event.stopPropagation();
    isDragging.current = node.id;
    dragMeta.current = {
      nodeId: node.id,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      startedAt: performance.now(),
    };
    node.fx = node.x;
    node.fy = node.y;
    simulationRef.current?.alphaTarget(0.3).restart();
    window.addEventListener("pointermove", moveNode);
    window.addEventListener("pointerup", endNodeDrag);

    function moveNode(moveEvent: PointerEvent) {
      if (isDragging.current !== node.id) return;
      const trigger = (event.currentTarget as Element | null)?.closest("svg");
      if (!trigger) return;
      const svg = trigger as SVGSVGElement;
      const rect = svg.getBoundingClientRect();
      const x = ((moveEvent.clientX - rect.left - transform.x) / transform.scale) - rect.width / 2;
      const y = ((moveEvent.clientY - rect.top - transform.y) / transform.scale) - rect.height / 2;

      if (!dragMeta.current.moved) {
        const dx = moveEvent.clientX - dragMeta.current.startX;
        const dy = moveEvent.clientY - dragMeta.current.startY;
        if (Math.hypot(dx, dy) < DRAG_DISTANCE_THRESHOLD) {
          return;
        }
        dragMeta.current.moved = true;
      }

      node.fx = x;
      node.fy = y;
      setNodes((prev) =>
        prev.map((item) => (item.id === node.id ? { ...item, fx: x, fy: y, x, y } : item)),
      );
    }

    function endNodeDrag(upEvent: PointerEvent) {
      let moved = dragMeta.current.moved;
      if (!moved) {
        const dx = upEvent.clientX - dragMeta.current.startX;
        const dy = upEvent.clientY - dragMeta.current.startY;
        if (Math.hypot(dx, dy) >= DRAG_DISTANCE_THRESHOLD) {
          moved = true;
        }
      }
      isDragging.current = null;
      node.fx = undefined;
      node.fy = undefined;
      simulationRef.current?.alphaTarget(0);
      dragMeta.current = { nodeId: null, moved: false, startX: 0, startY: 0, startedAt: 0 };
      window.removeEventListener("pointermove", moveNode);
      window.removeEventListener("pointerup", endNodeDrag);
      if (!moved) {
        handleNodeOpen(node);
      }
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-panel p-2">
      <svg
        role="presentation"
        width="100%"
        height="520"
        viewBox="-300 -300 600 600"
        onWheel={handleWheel}
        onMouseDown={handleBackgroundDrag}
        className="rounded-2xl bg-surface"
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {links.map((link, index) => {
            const source = link.source as NodeDatum;
            const target = link.target as NodeDatum;
            if (!source || !target) return null;
            return (
              <line
                key={index}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="rgba(148,163,184,0.8)"
                strokeWidth={Math.max(1, link.weight / 2)}
              />
            );
          })}
          {nodes.map((node) => (
            <g key={node.id} className="cursor-pointer" style={{ cursor: "pointer" }}>
              <circle
                cx={node.x}
                cy={node.y}
                r={12}
                fill="var(--brand)"
                stroke="white"
                strokeWidth={2}
                onPointerDown={(event) => startNodeDrag(event, node)}
              />
              <text
                x={Number(node.x) + 16}
                y={Number(node.y) + 4}
                fontSize="12"
                fill="var(--foreground)"
              >
                {node.title}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function GraphControlsSidebar({
  controls,
  setControls,
  tags,
  filterTag,
  setFilterTag,
  onRecalculate,
  labels,
}: {
  controls: GraphControls;
  setControls: Dispatch<SetStateAction<GraphControls>>;
  tags: string[];
  filterTag: string;
  setFilterTag: Dispatch<SetStateAction<string>>;
  onRecalculate: () => void;
  labels: {
    title: string;
    center: string;
    repel: string;
    distance: string;
    filter: string;
    button: string;
    all: string;
  };
}) {
  return (
    <aside className="rounded-2xl border border-border bg-panel p-4">
      <h2 className="text-lg font-semibold">{labels.title}</h2>
      <div className="mt-4 space-y-4 text-sm">
        <label className="flex flex-col gap-2">
          <span className="text-muted">
            {labels.center} ({controls.center.toFixed(2)})
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={controls.center}
            onChange={(event) =>
              setControls((prev) => ({ ...prev, center: Number(event.target.value) }))
            }
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-muted">
            {labels.repel} ({controls.repel.toFixed(0)})
          </span>
          <input
            type="range"
            min={0}
            max={800}
            step={20}
            value={controls.repel}
            onChange={(event) =>
              setControls((prev) => ({ ...prev, repel: Number(event.target.value) }))
            }
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-muted">
            {labels.distance} ({controls.distance.toFixed(0)}px)
          </span>
          <input
            type="range"
            min={20}
            max={180}
            step={10}
            value={controls.distance}
            onChange={(event) =>
              setControls((prev) => ({ ...prev, distance: Number(event.target.value) }))
            }
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-muted">{labels.filter}</span>
          <select
            value={filterTag}
            onChange={(event) => setFilterTag(event.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2"
          >
            <option value="all">{labels.all}</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        onClick={onRecalculate}
        className="mt-4 w-full rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-brand hover:text-brand focus-ring"
      >
        {labels.button}
      </button>
    </aside>
  );
}

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefers(media.matches);
    const handler = (event: MediaQueryListEvent) => setPrefers(event.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  return prefers;
}
