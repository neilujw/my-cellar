import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";

import TextAutocomplete from "./TextAutocomplete.svelte";

const suggestions = ["France", "Italy", "Spain", "Germany", "Argentina"];

const defaultProps = {
  value: "",
  suggestions,
  oninput: () => {},
  label: "Country *",
  id: "country",
  errorTestId: "error-country",
};

describe("TextAutocomplete", () => {
  afterEach(() => {
    cleanup();
  });

  describe("rendering", () => {
    it("should render the input with correct test id", () => {
      render(TextAutocomplete, { props: defaultProps });

      expect(screen.getByTestId("input-country")).toBeInTheDocument();
    });

    it("should not show dropdown initially", () => {
      render(TextAutocomplete, { props: defaultProps });

      expect(
        screen.queryByTestId("country-autocomplete-dropdown"),
      ).not.toBeInTheDocument();
    });

    it("should display error when provided", () => {
      render(TextAutocomplete, {
        props: { ...defaultProps, error: "Country is required" },
      });

      expect(screen.getByTestId("error-country")).toHaveTextContent(
        "Country is required",
      );
    });

    it("should render label", () => {
      render(TextAutocomplete, { props: defaultProps });

      expect(screen.getByText("Country *")).toBeInTheDocument();
    });
  });

  describe("dropdown behavior", () => {
    it("should show all suggestions on focus", async () => {
      render(TextAutocomplete, { props: defaultProps });

      const input = screen.getByTestId("input-country");
      await userEvent.setup().click(input);

      expect(
        screen.getByTestId("country-autocomplete-dropdown"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("country-autocomplete-item-0"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("country-autocomplete-item-4"),
      ).toBeInTheDocument();
    });

    it("should filter suggestions with case-insensitive contains match", async () => {
      const { rerender } = render(TextAutocomplete, {
        props: { ...defaultProps, value: "" },
      });

      const input = screen.getByTestId("input-country");
      await userEvent.setup().type(input, "an");

      await rerender({ ...defaultProps, value: "an" });

      expect(
        screen.getByTestId("country-autocomplete-dropdown"),
      ).toBeInTheDocument();
      // 'France' and 'Germany' contain 'an'
      expect(
        screen.getByTestId("country-autocomplete-item-0"),
      ).toHaveTextContent("France");
      expect(
        screen.getByTestId("country-autocomplete-item-1"),
      ).toHaveTextContent("Germany");
      expect(
        screen.queryByTestId("country-autocomplete-item-2"),
      ).not.toBeInTheDocument();
    });

    it('should show "No matches" when input text does not match any suggestion', async () => {
      const { rerender } = render(TextAutocomplete, {
        props: { ...defaultProps, value: "" },
      });

      const input = screen.getByTestId("input-country");
      await userEvent.setup().type(input, "xyz");

      await rerender({ ...defaultProps, value: "xyz" });

      expect(
        screen.getByTestId("country-autocomplete-no-matches"),
      ).toHaveTextContent("No matches");
    });

    it("should show nothing when suggestions list is empty", async () => {
      render(TextAutocomplete, {
        props: { ...defaultProps, suggestions: [] },
      });

      const input = screen.getByTestId("input-country");
      await userEvent.setup().click(input);

      expect(
        screen.queryByTestId("country-autocomplete-dropdown"),
      ).not.toBeInTheDocument();
    });

    it("should highlight matching portion in suggestions", async () => {
      const { rerender } = render(TextAutocomplete, {
        props: { ...defaultProps, value: "" },
      });

      const input = screen.getByTestId("input-country");
      await userEvent.setup().type(input, "ran");

      await rerender({ ...defaultProps, value: "ran" });

      const item = screen.getByTestId("country-autocomplete-item-0");
      const mark = item.querySelector("mark");
      expect(mark).not.toBeNull();
      expect(mark!.textContent).toBe("ran");
    });
  });

  describe("selection", () => {
    it("should call oninput with selected suggestion when clicked", async () => {
      let inputValue = "";
      const { rerender } = render(TextAutocomplete, {
        props: {
          ...defaultProps,
          oninput: (v: string) => {
            inputValue = v;
          },
        },
      });

      const input = screen.getByTestId("input-country");
      await userEvent.setup().click(input);

      await rerender({
        ...defaultProps,
        value: "",
        oninput: (v: string) => {
          inputValue = v;
        },
      });

      await userEvent
        .setup()
        .click(screen.getByTestId("country-autocomplete-item-1"));

      expect(inputValue).toBe("Italy");
    });
  });

  describe("keyboard navigation", () => {
    it("should navigate with arrow keys and select with Enter", async () => {
      let inputValue = "";
      const user = userEvent.setup();
      const { rerender } = render(TextAutocomplete, {
        props: {
          ...defaultProps,
          oninput: (v: string) => {
            inputValue = v;
          },
        },
      });

      const input = screen.getByTestId("input-country");
      await user.click(input);

      await rerender({
        ...defaultProps,
        oninput: (v: string) => {
          inputValue = v;
        },
      });

      await user.keyboard("{ArrowDown}");
      expect(
        screen.getByTestId("country-autocomplete-item-0").className,
      ).toContain("bg-indigo-100");

      await user.keyboard("{ArrowDown}");
      expect(
        screen.getByTestId("country-autocomplete-item-1").className,
      ).toContain("bg-indigo-100");

      await user.keyboard("{Enter}");
      expect(inputValue).toBe("Italy");
    });

    it("should wrap around when navigating past last item", async () => {
      const user = userEvent.setup();
      render(TextAutocomplete, {
        props: { ...defaultProps, suggestions: ["France", "Italy"] },
      });

      const input = screen.getByTestId("input-country");
      await user.click(input);

      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      expect(
        screen.getByTestId("country-autocomplete-item-1").className,
      ).toContain("bg-indigo-100");

      await user.keyboard("{ArrowDown}");
      expect(
        screen.getByTestId("country-autocomplete-item-0").className,
      ).toContain("bg-indigo-100");
    });

    it("should close dropdown on Escape", async () => {
      const user = userEvent.setup();
      render(TextAutocomplete, { props: defaultProps });

      const input = screen.getByTestId("input-country");
      await user.click(input);

      expect(
        screen.getByTestId("country-autocomplete-dropdown"),
      ).toBeInTheDocument();

      await user.keyboard("{Escape}");

      expect(
        screen.queryByTestId("country-autocomplete-dropdown"),
      ).not.toBeInTheDocument();
    });

    it("should navigate up with ArrowUp and wrap to last item", async () => {
      const user = userEvent.setup();
      render(TextAutocomplete, {
        props: { ...defaultProps, suggestions: ["France", "Italy"] },
      });

      const input = screen.getByTestId("input-country");
      await user.click(input);

      await user.keyboard("{ArrowUp}");
      expect(
        screen.getByTestId("country-autocomplete-item-1").className,
      ).toContain("bg-indigo-100");
    });
  });

  describe("ARIA attributes", () => {
    it("should have combobox role on input", () => {
      render(TextAutocomplete, { props: defaultProps });

      expect(screen.getByTestId("input-country")).toHaveAttribute(
        "role",
        "combobox",
      );
    });

    it("should have aria-expanded false when dropdown is closed", () => {
      render(TextAutocomplete, { props: defaultProps });

      expect(screen.getByTestId("input-country")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });

    it("should have aria-expanded true when dropdown is open", async () => {
      render(TextAutocomplete, { props: defaultProps });

      const input = screen.getByTestId("input-country");
      await userEvent.setup().click(input);

      expect(input).toHaveAttribute("aria-expanded", "true");
    });

    it("should have listbox role on dropdown", async () => {
      render(TextAutocomplete, { props: defaultProps });

      const input = screen.getByTestId("input-country");
      await userEvent.setup().click(input);

      expect(
        screen.getByTestId("country-autocomplete-dropdown"),
      ).toHaveAttribute("role", "listbox");
    });

    it("should set aria-activedescendant when navigating", async () => {
      const user = userEvent.setup();
      render(TextAutocomplete, { props: defaultProps });

      const input = screen.getByTestId("input-country");
      await user.click(input);

      expect(input).not.toHaveAttribute("aria-activedescendant");

      await user.keyboard("{ArrowDown}");
      expect(input).toHaveAttribute(
        "aria-activedescendant",
        "country-autocomplete-item-0",
      );
    });

    it("should have option role on dropdown items", async () => {
      render(TextAutocomplete, { props: defaultProps });

      const input = screen.getByTestId("input-country");
      await userEvent.setup().click(input);

      expect(screen.getByTestId("country-autocomplete-item-0")).toHaveAttribute(
        "role",
        "option",
      );
    });
  });

  describe("disabled state", () => {
    it("should disable input when disabled prop is true", () => {
      render(TextAutocomplete, {
        props: { ...defaultProps, disabled: true },
      });

      expect(screen.getByTestId("input-country")).toBeDisabled();
    });
  });
});
