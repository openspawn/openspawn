import { render } from "@testing-library/react";

import App from "./app";

describe("App", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it("should have the correct title", () => {
    const { getByText } = render(<App />);
    expect(getByText("OpenSpawn Dashboard")).toBeTruthy();
  });
});
