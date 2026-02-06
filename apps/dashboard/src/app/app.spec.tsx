import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock urql
vi.mock("urql", () => ({
  Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useQuery: () => [{ data: null, fetching: true, error: null }],
  useSubscription: () => [{ data: null }],
}));

// Mock the graphql client
vi.mock("../graphql/client", () => ({
  client: {},
}));

import App from "./app";

describe("App", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it("should have loading state initially", () => {
    const { getByText } = render(<App />);
    expect(getByText(/Loading/i)).toBeTruthy();
  });
});
