import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";

vi.mock("../lib/sync-manager", () => ({
  enqueueMutation: vi.fn().mockResolvedValue(undefined),
}));

import AddBottle from "./AddBottle.svelte";
import { HistoryAction, WineType, type Bottle } from "../lib/types";
import * as storage from "../lib/storage";
import { enqueueMutation } from "../lib/sync-manager";

const mockedEnqueueMutation = vi.mocked(enqueueMutation);

function makeBottle(overrides: Partial<Bottle> = {}): Bottle {
  return {
    id: "existing-1",
    name: "Chateau Margaux",
    vintage: 2015,
    type: WineType.Red,
    country: "France",
    region: "Bordeaux",
    grapeVariety: ["Cabernet Sauvignon"],
    history: [{ date: "2026-01-15", action: HistoryAction.Added, quantity: 3 }],
    ...overrides,
  };
}

/** Fills in all required form fields with valid data. */
async function fillRequiredFields(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.type(screen.getByTestId("input-name"), "Chateau Margaux");
  await user.type(screen.getByTestId("input-vintage"), "2015");
  await user.selectOptions(screen.getByTestId("input-type"), WineType.Red);
  await user.type(screen.getByTestId("input-country"), "France");
  await user.type(screen.getByTestId("input-region"), "Bordeaux");
}

/** Fills required fields for a new bottle (no autocomplete match). */
async function fillNewBottleFields(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.type(screen.getByTestId("input-name"), "Petrus");
  await user.type(screen.getByTestId("input-vintage"), "2020");
  await user.selectOptions(screen.getByTestId("input-type"), WineType.Red);
  await user.type(screen.getByTestId("input-country"), "France");
  await user.type(screen.getByTestId("input-region"), "Pomerol");
}

describe("AddBottle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.resetDbConnection();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("form rendering", () => {
    it("should render all required and optional fields", () => {
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      render(AddBottle);

      expect(screen.getByTestId("input-name")).toBeInTheDocument();
      expect(screen.getByTestId("input-vintage")).toBeInTheDocument();
      expect(screen.getByTestId("input-type")).toBeInTheDocument();
      expect(screen.getByTestId("input-country")).toBeInTheDocument();
      expect(screen.getByTestId("input-region")).toBeInTheDocument();
      expect(screen.getByTestId("input-quantity")).toBeInTheDocument();
      expect(screen.getByTestId("input-grape")).toBeInTheDocument();
      expect(screen.getByTestId("input-rating")).toBeInTheDocument();
      expect(screen.getByTestId("input-location")).toBeInTheDocument();
      expect(screen.getByTestId("input-price")).toBeInTheDocument();
      expect(screen.getByTestId("input-currency")).toBeInTheDocument();
      expect(screen.getByTestId("input-notes")).toBeInTheDocument();
      expect(screen.getByTestId("input-history-notes")).toBeInTheDocument();
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
    });

    it("should default quantity to 1 and currency to EUR", () => {
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      render(AddBottle);

      expect(screen.getByTestId("input-quantity")).toHaveValue(1);
      expect(screen.getByTestId("input-currency")).toHaveValue("EUR");
    });
  });

  describe("validation", () => {
    it("should be disabled when required fields are empty", () => {
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      render(AddBottle);

      expect(screen.getByTestId("submit-button")).toBeDisabled();
    });

    it("should be enabled when all required fields are filled", async () => {
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      render(AddBottle);
      const user = userEvent.setup();

      await fillNewBottleFields(user);

      expect(screen.getByTestId("submit-button")).not.toBeDisabled();
    });

    it("should display validation errors when form is submitted with invalid fields", async () => {
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      render(AddBottle);
      const user = userEvent.setup();

      await user.clear(screen.getByTestId("input-quantity"));
      await fireEvent.submit(screen.getByTestId("add-bottle-form"));

      expect(screen.getByTestId("error-name")).toBeInTheDocument();
      expect(screen.getByTestId("error-vintage")).toBeInTheDocument();
      expect(screen.getByTestId("error-type")).toBeInTheDocument();
      expect(screen.getByTestId("error-country")).toBeInTheDocument();
      expect(screen.getByTestId("error-quantity")).toBeInTheDocument();
    });

    it("should not call storage when validation fails", async () => {
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      const spy = vi.spyOn(storage, "addBottle");
      render(AddBottle);

      await fireEvent.submit(screen.getByTestId("add-bottle-form"));

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("successful add", () => {
    it("should create a bottle and navigate to dashboard on valid submit", async () => {
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      const addSpy = vi.spyOn(storage, "addBottle").mockResolvedValue("new-id");
      render(AddBottle);
      const user = userEvent.setup();

      await fillNewBottleFields(user);
      await user.click(screen.getByTestId("submit-button"));

      expect(addSpy).toHaveBeenCalledOnce();
      const bottle = addSpy.mock.calls[0][0];
      expect(bottle.name).toBe("Petrus");
      expect(bottle.vintage).toBe(2020);
      expect(bottle.type).toBe(WineType.Red);
      expect(window.location.hash).toBe("#/");
    });

    it("should always navigate to dashboard after save (no conflict abort)", async () => {
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      vi.spyOn(storage, "addBottle").mockResolvedValue("new-id");
      render(AddBottle);
      const user = userEvent.setup();

      await fillNewBottleFields(user);
      await user.click(screen.getByTestId("submit-button"));

      expect(window.location.hash).toBe("#/");
    });
  });

  describe("sync trigger", () => {
    it("should call enqueueMutation after adding a new bottle", async () => {
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      vi.spyOn(storage, "addBottle").mockResolvedValue("new-id");
      render(AddBottle);
      const user = userEvent.setup();

      await fillNewBottleFields(user);
      await user.click(screen.getByTestId("submit-button"));

      expect(mockedEnqueueMutation).toHaveBeenCalledWith(
        expect.stringContaining("Petrus"),
      );
    });

    it("should call enqueueMutation after submitting with existing bottle selected", async () => {
      const existing = makeBottle();
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([existing]);
      vi.spyOn(storage, "updateBottle").mockResolvedValue();
      render(AddBottle);
      const user = userEvent.setup();

      // Type name to trigger autocomplete
      await user.type(screen.getByTestId("input-name"), "Chateau");

      // Select from autocomplete
      const item = await screen.findByTestId("autocomplete-item-0");
      await user.click(item);

      // Submit
      await user.click(screen.getByTestId("submit-button"));

      expect(mockedEnqueueMutation).toHaveBeenCalledWith(
        expect.stringContaining("Chateau Margaux"),
      );
    });

    it("should not call any GitHub API directly", async () => {
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      vi.spyOn(storage, "addBottle").mockResolvedValue("new-id");
      render(AddBottle);
      const user = userEvent.setup();

      await fillNewBottleFields(user);
      await user.click(screen.getByTestId("submit-button"));

      // Only enqueueMutation is called, no direct push
      expect(mockedEnqueueMutation).toHaveBeenCalledOnce();
    });
  });

  describe("autocomplete selection", () => {
    it("should show info banner when existing bottle is selected from autocomplete", async () => {
      const existing = makeBottle();
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([existing]);
      render(AddBottle);
      const user = userEvent.setup();

      await user.type(screen.getByTestId("input-name"), "Chateau");
      const item = await screen.findByTestId("autocomplete-item-0");
      await user.click(item);

      const banner = screen.getByTestId("existing-bottle-banner");
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent("Chateau Margaux");
      expect(banner).toHaveTextContent("2015");
      expect(banner).toHaveTextContent("3 in stock");
    });

    it("should auto-fill form fields when bottle is selected", async () => {
      const existing = makeBottle({
        country: "France",
        region: "Bordeaux",
        rating: 9,
      });
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([existing]);
      render(AddBottle);
      const user = userEvent.setup();

      await user.type(screen.getByTestId("input-name"), "Chateau");
      const item = await screen.findByTestId("autocomplete-item-0");
      await user.click(item);

      expect(screen.getByTestId("input-country")).toHaveValue("France");
      expect(screen.getByTestId("input-region")).toHaveValue("Bordeaux");
      expect(screen.getByTestId("input-vintage")).toHaveValue(2015);
      expect(screen.getByTestId("input-rating")).toHaveValue(9);
    });

    it("should make non-key fields read-only when existing bottle is selected", async () => {
      const existing = makeBottle();
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([existing]);
      render(AddBottle);
      const user = userEvent.setup();

      await user.type(screen.getByTestId("input-name"), "Chateau");
      const item = await screen.findByTestId("autocomplete-item-0");
      await user.click(item);

      expect(screen.getByTestId("input-country")).toBeDisabled();
      expect(screen.getByTestId("input-region")).toBeDisabled();
      expect(screen.getByTestId("input-rating")).toHaveAttribute("readonly");
      expect(screen.getByTestId("input-location")).toHaveAttribute("readonly");
      expect(screen.getByTestId("input-notes")).toHaveAttribute("readonly");
      expect(screen.getByTestId("input-grape")).toBeDisabled();
    });

    it("should keep key and history fields editable when existing bottle is selected", async () => {
      const existing = makeBottle();
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([existing]);
      render(AddBottle);
      const user = userEvent.setup();

      await user.type(screen.getByTestId("input-name"), "Chateau");
      const item = await screen.findByTestId("autocomplete-item-0");
      await user.click(item);

      expect(screen.getByTestId("input-name")).not.toHaveAttribute("readonly");
      expect(screen.getByTestId("input-vintage")).not.toHaveAttribute(
        "readonly",
      );
      expect(screen.getByTestId("input-type")).not.toBeDisabled();
      expect(screen.getByTestId("input-quantity")).not.toHaveAttribute(
        "readonly",
      );
      expect(screen.getByTestId("input-price")).not.toHaveAttribute("readonly");
      expect(screen.getByTestId("input-currency")).not.toHaveAttribute(
        "readonly",
      );
      expect(screen.getByTestId("input-history-notes")).not.toHaveAttribute(
        "readonly",
      );
    });

    it("should clear selection and remove banner when clear button is clicked", async () => {
      const existing = makeBottle();
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([existing]);
      render(AddBottle);
      const user = userEvent.setup();

      await user.type(screen.getByTestId("input-name"), "Chateau");
      const item = await screen.findByTestId("autocomplete-item-0");
      await user.click(item);

      expect(screen.getByTestId("existing-bottle-banner")).toBeInTheDocument();

      await user.click(screen.getByTestId("clear-selection"));

      expect(
        screen.queryByTestId("existing-bottle-banner"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("input-country")).not.toBeDisabled();
    });

    it("should submit with existing bottle and add history entry", async () => {
      const existing = makeBottle();
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([existing]);
      const updateSpy = vi.spyOn(storage, "updateBottle").mockResolvedValue();
      render(AddBottle);
      const user = userEvent.setup();

      await user.type(screen.getByTestId("input-name"), "Chateau");
      const item = await screen.findByTestId("autocomplete-item-0");
      await user.click(item);

      await user.click(screen.getByTestId("submit-button"));

      expect(updateSpy).toHaveBeenCalledOnce();
      const updated = updateSpy.mock.calls[0][0];
      expect(updated.id).toBe("existing-1");
      expect(updated.history).toHaveLength(2);
      expect(updated.history[1].action).toBe(HistoryAction.Added);
      expect(window.location.hash).toBe("#/");
    });

    it("should submit without existing bottle and create new bottle", async () => {
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      const addSpy = vi.spyOn(storage, "addBottle").mockResolvedValue("new-id");
      render(AddBottle);
      const user = userEvent.setup();

      await fillNewBottleFields(user);
      await user.click(screen.getByTestId("submit-button"));

      expect(addSpy).toHaveBeenCalledOnce();
    });
  });

  describe("reactive duplicate re-detection", () => {
    it("should clear selection when name no longer matches any bottle", async () => {
      const existing = makeBottle();
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([existing]);
      render(AddBottle);
      const user = userEvent.setup();

      // Select existing bottle
      await user.type(screen.getByTestId("input-name"), "Chateau");
      const item = await screen.findByTestId("autocomplete-item-0");
      await user.click(item);

      expect(screen.getByTestId("existing-bottle-banner")).toBeInTheDocument();

      // Change name so it no longer matches
      await user.clear(screen.getByTestId("input-name"));
      await user.type(screen.getByTestId("input-name"), "Something Else");

      expect(
        screen.queryByTestId("existing-bottle-banner"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("input-country")).not.toBeDisabled();
    });

    it("should match a different bottle when type changes", async () => {
      const red = makeBottle({ id: "red-1", type: WineType.Red });
      const white = makeBottle({ id: "white-1", type: WineType.White });
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([red, white]);
      render(AddBottle);
      const user = userEvent.setup();

      // Select the red bottle
      await user.type(screen.getByTestId("input-name"), "Chateau");
      const item = await screen.findByTestId("autocomplete-item-0");
      await user.click(item);

      expect(screen.getByTestId("existing-bottle-banner")).toHaveTextContent(
        "Red",
      );

      // Change type to white
      await user.selectOptions(
        screen.getByTestId("input-type"),
        WineType.White,
      );

      const banner = screen.getByTestId("existing-bottle-banner");
      expect(banner).toHaveTextContent("White");
    });

    it("should clear selection when vintage changes to non-matching", async () => {
      const existing = makeBottle();
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([existing]);
      render(AddBottle);
      const user = userEvent.setup();

      await user.type(screen.getByTestId("input-name"), "Chateau");
      const item = await screen.findByTestId("autocomplete-item-0");
      await user.click(item);

      expect(screen.getByTestId("existing-bottle-banner")).toBeInTheDocument();

      await user.clear(screen.getByTestId("input-vintage"));
      await user.type(screen.getByTestId("input-vintage"), "2020");

      expect(
        screen.queryByTestId("existing-bottle-banner"),
      ).not.toBeInTheDocument();
    });

    it("should detect duplicate when typing name, vintage, and type matching an existing bottle without autocomplete", async () => {
      const existing = makeBottle();
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([existing]);
      render(AddBottle);
      const user = userEvent.setup();

      // Wait for bottles to load
      await vi.waitFor(() => {
        expect(storage.getAllBottles).toHaveBeenCalled();
      });

      // Manually type all key fields matching an existing bottle (no autocomplete selection)
      await user.type(screen.getByTestId("input-vintage"), "2015");
      await user.selectOptions(screen.getByTestId("input-type"), WineType.Red);
      await user.type(screen.getByTestId("input-name"), "Chateau Margaux");

      expect(screen.getByTestId("existing-bottle-banner")).toBeInTheDocument();
      expect(screen.getByTestId("existing-bottle-banner")).toHaveTextContent(
        "Chateau Margaux",
      );
    });
  });

  describe("grape variety tag input", () => {
    it("should add tags on Enter key", async () => {
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      render(AddBottle);
      const user = userEvent.setup();

      await user.type(screen.getByTestId("input-grape"), "Merlot{Enter}");

      const tags = screen.getByTestId("grape-tags");
      expect(tags).toHaveTextContent("Merlot");
    });

    it("should add tags on comma key", async () => {
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      render(AddBottle);
      const user = userEvent.setup();

      await user.type(screen.getByTestId("input-grape"), "Syrah,");

      const tags = screen.getByTestId("grape-tags");
      expect(tags).toHaveTextContent("Syrah");
    });

    it("should remove tags individually", async () => {
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      render(AddBottle);
      const user = userEvent.setup();

      await user.type(screen.getByTestId("input-grape"), "Merlot{Enter}");
      await user.type(screen.getByTestId("input-grape"), "Syrah{Enter}");

      expect(screen.getByTestId("grape-tags")).toHaveTextContent("Merlot");
      expect(screen.getByTestId("grape-tags")).toHaveTextContent("Syrah");

      await user.click(screen.getByTestId("remove-grape-Merlot"));

      expect(screen.getByTestId("grape-tags")).not.toHaveTextContent("Merlot");
      expect(screen.getByTestId("grape-tags")).toHaveTextContent("Syrah");
    });
  });

  describe("country and region autocomplete", () => {
    it("should show country suggestions from existing bottles on focus", async () => {
      const bottles = [
        makeBottle({ id: "1", country: "France" }),
        makeBottle({ id: "2", country: "Italy" }),
        makeBottle({ id: "3", country: "France" }),
      ];
      vi.spyOn(storage, "getAllBottles").mockResolvedValue(bottles);
      render(AddBottle);
      const user = userEvent.setup();

      // Wait for bottles to load
      await vi.waitFor(() => {
        expect(storage.getAllBottles).toHaveBeenCalled();
      });

      await user.click(screen.getByTestId("input-country"));

      expect(
        screen.getByTestId("country-autocomplete-dropdown"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("country-autocomplete-item-0"),
      ).toHaveTextContent("France");
      expect(
        screen.getByTestId("country-autocomplete-item-1"),
      ).toHaveTextContent("Italy");
    });

    it("should show region suggestions from existing bottles on focus", async () => {
      const bottles = [
        makeBottle({ id: "1", region: "Bordeaux" }),
        makeBottle({ id: "2", region: "Tuscany" }),
        makeBottle({ id: "3", region: "Bordeaux" }),
      ];
      vi.spyOn(storage, "getAllBottles").mockResolvedValue(bottles);
      render(AddBottle);
      const user = userEvent.setup();

      await vi.waitFor(() => {
        expect(storage.getAllBottles).toHaveBeenCalled();
      });

      await user.click(screen.getByTestId("input-region"));

      expect(
        screen.getByTestId("region-autocomplete-dropdown"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("region-autocomplete-item-0"),
      ).toHaveTextContent("Bordeaux");
      expect(
        screen.getByTestId("region-autocomplete-item-1"),
      ).toHaveTextContent("Tuscany");
    });

    it("should fill country field when suggestion is selected", async () => {
      const bottles = [makeBottle({ id: "1", country: "France" })];
      vi.spyOn(storage, "getAllBottles").mockResolvedValue(bottles);
      render(AddBottle);
      const user = userEvent.setup();

      await vi.waitFor(() => {
        expect(storage.getAllBottles).toHaveBeenCalled();
      });

      await user.click(screen.getByTestId("input-country"));
      await user.click(screen.getByTestId("country-autocomplete-item-0"));

      expect(screen.getByTestId("input-country")).toHaveValue("France");
    });

    it("should disable country and region fields when existing bottle is selected", async () => {
      const existing = makeBottle();
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([existing]);
      render(AddBottle);
      const user = userEvent.setup();

      await user.type(screen.getByTestId("input-name"), "Chateau");
      const item = await screen.findByTestId("autocomplete-item-0");
      await user.click(item);

      expect(screen.getByTestId("input-country")).toBeDisabled();
      expect(screen.getByTestId("input-region")).toBeDisabled();
    });
  });

  describe("conflict handling", () => {
    it("should refresh allBottles and re-detect duplicate on conflict-resolved event", async () => {
      const existing = makeBottle();
      const getAllSpy = vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      render(AddBottle);
      const user = userEvent.setup();

      // Fill in fields matching the existing bottle
      await user.type(screen.getByTestId("input-name"), "Chateau Margaux");
      await user.type(screen.getByTestId("input-vintage"), "2015");
      await user.selectOptions(screen.getByTestId("input-type"), WineType.Red);

      // No duplicate detected yet (allBottles is empty)
      expect(screen.queryByTestId("existing-bottle-banner")).not.toBeInTheDocument();

      // Simulate conflict resolution bringing in remote data
      getAllSpy.mockResolvedValue([existing]);
      window.dispatchEvent(new CustomEvent("conflict-resolved"));

      // Wait for the async re-fetch
      await vi.waitFor(() => {
        expect(screen.getByTestId("existing-bottle-banner")).toBeInTheDocument();
      });
    });
  });

  describe("optional fields", () => {
    it("should allow empty rating, location, and price", async () => {
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      const addSpy = vi.spyOn(storage, "addBottle").mockResolvedValue("new-id");
      render(AddBottle);
      const user = userEvent.setup();

      await fillNewBottleFields(user);
      await user.click(screen.getByTestId("submit-button"));

      expect(addSpy).toHaveBeenCalledOnce();
      const bottle = addSpy.mock.calls[0][0];
      expect(bottle.rating).toBeUndefined();
      expect(bottle.location).toBeUndefined();
      expect(bottle.history[0].price).toBeUndefined();
    });

    it("should default price currency to EUR", () => {
      vi.spyOn(storage, "getAllBottles").mockResolvedValue([]);
      render(AddBottle);

      expect(screen.getByTestId("input-currency")).toHaveValue("EUR");
    });
  });

  describe("IDB integration — no storage mocks", () => {
    beforeEach(async () => {
      await storage.clearAll();
    });

    it("should write to real IDB when updating an existing bottle with price history", async () => {
      // Arrange: insert a bottle with a price in history directly into IDB
      const existing = makeBottle({
        history: [
          {
            date: "2026-01-15",
            action: HistoryAction.Added,
            quantity: 3,
            price: { amount: 42.5, currency: "EUR" },
          },
        ],
      });
      await storage.addBottle(existing);

      // getAllBottles reads from real IDB; don't mock it
      render(AddBottle);
      const user = userEvent.setup();

      // Act: trigger autocomplete to select the existing bottle
      await user.type(screen.getByTestId("input-name"), "Chateau");
      const item = await screen.findByTestId("autocomplete-item-0");
      await user.click(item);

      // Submit — this must call updateBottle with a cloneable object
      await user.click(screen.getByTestId("submit-button"));

      // Assert: the bottle was persisted (not a DataCloneError)
      const stored = await storage.getBottle("existing-1");
      expect(stored).toBeDefined();
      expect(stored!.history).toHaveLength(2);
      expect(stored!.history[0].price).toEqual({ amount: 42.5, currency: "EUR" });
      expect(stored!.history[1].action).toBe(HistoryAction.Added);
    });

    it("should write to real IDB when adding a brand-new bottle", async () => {
      // Arrange: empty DB
      render(AddBottle);
      const user = userEvent.setup();

      // Act: fill in a new bottle with a price
      await fillNewBottleFields(user);
      await user.type(screen.getByTestId("input-price"), "25");
      await user.click(screen.getByTestId("submit-button"));

      // Assert: exactly one bottle stored in IDB
      const all = await storage.getAllBottles();
      expect(all).toHaveLength(1);
      expect(all[0].name).toBe("Petrus");
      expect(all[0].history[0].price).toEqual({ amount: 25, currency: "EUR" });
    });

    it("should write to real IDB when fresh duplicate detected at submit time", async () => {
      // Arrange: start with an empty allBottles (bottle not yet in DB)
      render(AddBottle);
      const user = userEvent.setup();

      // Fill fields matching a bottle that will be inserted into IDB mid-flow
      await user.type(screen.getByTestId("input-name"), "Chateau Margaux");
      await user.type(screen.getByTestId("input-vintage"), "2015");
      await user.selectOptions(screen.getByTestId("input-type"), WineType.Red);
      await user.type(screen.getByTestId("input-country"), "France");

      // Now insert the bottle into IDB (simulating a pull that happened in the background)
      const existing = makeBottle({
        history: [
          {
            date: "2026-01-15",
            action: HistoryAction.Added,
            quantity: 6,
            price: { amount: 100, currency: "USD" },
          },
        ],
      });
      await storage.addBottle(existing);

      // Act: submit — handleSubmit re-fetches from IDB and detects the duplicate
      await user.click(screen.getByTestId("submit-button"));

      // Assert: the existing bottle was updated, not a new one created
      const all = await storage.getAllBottles();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe("existing-1");
      expect(all[0].history).toHaveLength(2);
      expect(all[0].history[0].price).toEqual({ amount: 100, currency: "USD" });
    });
  });
});
