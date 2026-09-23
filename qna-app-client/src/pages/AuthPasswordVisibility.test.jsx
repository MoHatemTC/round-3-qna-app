import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import { SessionContext } from "@/context/session";

vi.mock("@/lib/api", () => ({ api: { post: vi.fn() } }));

function renderLogin() {
  return render(
    <MemoryRouter>
      <SessionContext.Provider value={{ refresh: vi.fn() }}>
        <LoginPage />
      </SessionContext.Provider>
    </MemoryRouter>
  );
}

function renderRegister() {
  return render(
    <MemoryRouter>
      <SessionContext.Provider value={{ refresh: vi.fn() }}>
        <RegisterPage />
      </SessionContext.Provider>
    </MemoryRouter>
  );
}

describe("password visibility controls", () => {
  it.each([
    ["login", renderLogin],
    ["register", renderRegister],
  ])("toggles the %s password field", (_name, renderPage) => {
    renderPage();
    const password = screen.getByLabelText("Password");
    const toggle = screen.getByRole("button", { name: "Show password" });

    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(toggle);
    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });
});