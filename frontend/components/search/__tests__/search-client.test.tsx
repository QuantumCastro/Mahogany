import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { NoteIndexItem } from "@/lib/vault/types";

import { SearchClient } from "../search-client";
import { I18nProvider } from "@/lib/i18n/i18n-provider";

const DATASET: NoteIndexItem[] = [
  {
    id: "n_01",
    slug: "bienvenida",
    title: "Bienvenida",
    tags: ["meta"],
    excerpt: "Bienvenida al vault.",
    plainText: "Bienvenida al vault demo con grafo y backlinks",
    updatedAt: "2025-10-10",
  },
  {
    id: "n_02",
    slug: "markdown",
    title: "Markdown",
    tags: ["syntax"],
    excerpt: "Tabla y callout.",
    plainText: "Sintaxis markdown con tablas y notas",
    updatedAt: "2025-10-11",
  },
];

const renderWithI18n = (ui: React.ReactNode) => render(<I18nProvider>{ui}</I18nProvider>);

describe("SearchClient", () => {
  it("muestra sugerencias cuando no hay consulta", () => {
    renderWithI18n(<SearchClient dataset={DATASET} />);
    expect(screen.getByText(/Suggestions/i)).toBeInTheDocument();
    expect(screen.getAllByText(/tag:#meta/i)).not.toHaveLength(0);
  });

  it("devuelve resultados para consultas válidas", async () => {
    const user = userEvent.setup();
    renderWithI18n(<SearchClient dataset={DATASET} />);

    await user.type(screen.getByLabelText(/Search/i), "tag:#meta");

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Bienvenida/i })).toBeInTheDocument();
    });
  });

  it("muestra estado vacío cuando no encuentra coincidencias", async () => {
    const user = userEvent.setup();
    renderWithI18n(<SearchClient dataset={DATASET} />);

    await user.type(screen.getByLabelText(/Search/i), "tag:#graph -meta");

    await waitFor(() => {
      expect(screen.getByText(/No results/i)).toBeInTheDocument();
    });
  });
});
