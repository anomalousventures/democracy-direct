import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/preact";
import { LoadingButton } from "./loading-button";

describe("LoadingButton", () => {
  it("renders children when not loading", () => {
    render(<LoadingButton>Click me</LoadingButton>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("shows loading text when loading", () => {
    render(
      <LoadingButton loading loadingText="Saving...">
        Click me
      </LoadingButton>
    );
    expect(screen.getByRole("button")).toHaveTextContent("Saving...");
  });

  it("shows spinner when loading", () => {
    render(
      <LoadingButton loading loadingText="Saving...">
        Click me
      </LoadingButton>
    );
    const button = screen.getByRole("button");
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("is disabled when loading", () => {
    render(<LoadingButton loading>Click me</LoadingButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("respects disabled prop", () => {
    render(<LoadingButton disabled>Click me</LoadingButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("falls back to children when loading but no loadingText provided", () => {
    render(<LoadingButton loading>Click me</LoadingButton>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });
});
