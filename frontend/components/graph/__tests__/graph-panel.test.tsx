import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, type SpyInstance } from "vitest";
import type { GraphFile } from "@/lib/vault/types";
import { GraphPanel } from "../graph-panel";
import { I18nProvider } from "@/lib/i18n/i18n-provider";

const SAMPLE_GRAPH: GraphFile = {
  nodes: [
    { id: "n_01", slug: "bienvenida", title: "Bienvenida", tags: ["meta"] },
    { id: "n_02", slug: "grafo", title: "Grafo", tags: ["graph"] },
  ],
  edges: [{ source: "n_01", target: "n_02", weight: 1 }],
};

const createFetchResponse = <T,>(data: T, ok = true) =>
  ({
    ok,
    json: async () => data,
  }) as Response;

function mockMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockSimulation = {
  force: vi.fn().mockReturnThis(),
  alpha: vi.fn().mockReturnThis(),
  alphaDecay: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  stop: vi.fn(),
  alphaTarget: vi.fn().mockReturnThis(),
  restart: vi.fn().mockReturnThis(),
};

vi.mock("d3-force", () => {
  const chain = () => ({
    id: vi.fn().mockReturnThis(),
    distance: vi.fn().mockReturnThis(),
    strength: vi.fn().mockReturnThis(),
  });

  return {
    forceCenter: () => chain(),
    forceLink: () => chain(),
    forceManyBody: () => chain(),
    forceSimulation: (nodes: unknown[] = []) => ({
      ...mockSimulation,
      nodes: () => nodes,
      on: vi.fn().mockImplementation((event, cb) => {
        if (event === "tick") {
          cb();
        }
        return mockSimulation;
      }),
    }),
  };
});

const renderWithI18n = (ui: React.ReactNode) => render(<I18nProvider>{ui}</I18nProvider>);

describe("GraphPanel", () => {
  let fetchSpy: SpyInstance<Parameters<typeof fetch>, ReturnType<typeof fetch>>;

  beforeEach(() => {
    mockMatchMedia();
    fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockResolvedValue(createFetchResponse(SAMPLE_GRAPH));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza estado inicial y carga el grafo al solicitarlo", async () => {
    const user = userEvent.setup();
    renderWithI18n(<GraphPanel />);

    expect(
      screen.getByText(/Load the global graph to explore relationships/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /load graph/i }));

    await waitFor(() => {
      expect(screen.getByText(/Controls/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Filter by tag/i)).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith("/data/graph.json", { cache: "no-store" });
  });

  it("muestra estado de error si el fetch falla", async () => {
    const user = userEvent.setup();
    fetchSpy.mockResolvedValueOnce(createFetchResponse({}, false));

    renderWithI18n(<GraphPanel />);
    await user.click(screen.getByRole("button", { name: /load graph/i }));

    await waitFor(() => {
      expect(screen.getByText(/We could not load graph\.json/i)).toBeInTheDocument();
    });
  });
});
