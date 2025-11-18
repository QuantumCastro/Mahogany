import { render, screen } from "@testing-library/react";
import { HealthCard } from "../health-card";

describe("HealthCard", () => {
  it("renders status and timestamp", () => {
    render(<HealthCard service="backend" status="ok" timestamp="2025-10-27T00:00:00Z" />);

    expect(screen.getByText("backend")).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();
    expect(screen.getByText(/Última respuesta/i)).toBeInTheDocument();
  });
});
