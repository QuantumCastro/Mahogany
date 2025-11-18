import { render, screen } from "@testing-library/react";
import { FeaturePill } from "../feature-pill";

describe("FeaturePill", () => {
  it("renders label", () => {
    render(<FeaturePill label="beta" />);
    expect(screen.getByText("beta")).toBeInTheDocument();
  });
});
