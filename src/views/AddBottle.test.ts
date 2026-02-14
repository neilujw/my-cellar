import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';

import AddBottle from './AddBottle.svelte';
import { HistoryAction, WineType, type Bottle } from '../lib/types';
import * as storage from '../lib/storage';

function makeBottle(overrides: Partial<Bottle> = {}): Bottle {
  return {
    id: 'existing-1',
    name: 'Chateau Margaux',
    vintage: 2015,
    type: WineType.Red,
    country: 'France',
    region: 'Bordeaux',
    grapeVariety: ['Cabernet Sauvignon'],
    history: [
      { date: '2026-01-15', action: HistoryAction.Added, quantity: 3 },
    ],
    ...overrides,
  };
}

/** Fills in all required form fields with valid data. */
async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByTestId('input-name'), 'Chateau Margaux');
  await user.type(screen.getByTestId('input-vintage'), '2015');
  await user.selectOptions(screen.getByTestId('input-type'), WineType.Red);
  await user.type(screen.getByTestId('input-country'), 'France');
  await user.type(screen.getByTestId('input-region'), 'Bordeaux');
}

describe('AddBottle', () => {
  beforeEach(() => {
    storage.resetDbConnection();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('form rendering', () => {
    it('should render all required and optional fields', () => {
      render(AddBottle);

      expect(screen.getByTestId('input-name')).toBeInTheDocument();
      expect(screen.getByTestId('input-vintage')).toBeInTheDocument();
      expect(screen.getByTestId('input-type')).toBeInTheDocument();
      expect(screen.getByTestId('input-country')).toBeInTheDocument();
      expect(screen.getByTestId('input-region')).toBeInTheDocument();
      expect(screen.getByTestId('input-quantity')).toBeInTheDocument();
      expect(screen.getByTestId('input-grape')).toBeInTheDocument();
      expect(screen.getByTestId('input-rating')).toBeInTheDocument();
      expect(screen.getByTestId('input-location')).toBeInTheDocument();
      expect(screen.getByTestId('input-price')).toBeInTheDocument();
      expect(screen.getByTestId('input-currency')).toBeInTheDocument();
      expect(screen.getByTestId('input-notes')).toBeInTheDocument();
      expect(screen.getByTestId('input-history-notes')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('should default quantity to 1 and currency to EUR', () => {
      render(AddBottle);

      expect(screen.getByTestId('input-quantity')).toHaveValue(1);
      expect(screen.getByTestId('input-currency')).toHaveValue('EUR');
    });
  });

  describe('validation', () => {
    it('should display validation errors when submitting empty required fields', async () => {
      render(AddBottle);
      const user = userEvent.setup();

      // Clear the default quantity value so it also triggers an error
      await user.clear(screen.getByTestId('input-quantity'));
      await user.click(screen.getByTestId('submit-button'));

      expect(screen.getByTestId('error-name')).toBeInTheDocument();
      expect(screen.getByTestId('error-vintage')).toBeInTheDocument();
      expect(screen.getByTestId('error-type')).toBeInTheDocument();
      expect(screen.getByTestId('error-country')).toBeInTheDocument();
      expect(screen.getByTestId('error-region')).toBeInTheDocument();
      expect(screen.getByTestId('error-quantity')).toBeInTheDocument();
    });

    it('should not call storage when validation fails', async () => {
      const spy = vi.spyOn(storage, 'addBottle');
      render(AddBottle);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('submit-button'));

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('successful add', () => {
    it('should create a bottle and navigate to dashboard on valid submit', async () => {
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue([]);
      const addSpy = vi.spyOn(storage, 'addBottle').mockResolvedValue('new-id');
      render(AddBottle);
      const user = userEvent.setup();

      await fillRequiredFields(user);
      await user.click(screen.getByTestId('submit-button'));

      expect(addSpy).toHaveBeenCalledOnce();
      const bottle = addSpy.mock.calls[0][0];
      expect(bottle.name).toBe('Chateau Margaux');
      expect(bottle.vintage).toBe(2015);
      expect(bottle.type).toBe(WineType.Red);
      expect(window.location.hash).toBe('#/');
    });
  });

  describe('duplicate detection', () => {
    it('should show confirmation banner when duplicate is found', async () => {
      const existing = makeBottle();
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue([existing]);
      render(AddBottle);
      const user = userEvent.setup();

      await fillRequiredFields(user);
      await user.click(screen.getByTestId('submit-button'));

      const banner = screen.getByTestId('duplicate-banner');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent('Chateau Margaux');
      expect(banner).toHaveTextContent('2015');
    });

    it('should merge history entry on confirm and navigate to dashboard', async () => {
      const existing = makeBottle();
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue([existing]);
      const updateSpy = vi.spyOn(storage, 'updateBottle').mockResolvedValue();
      render(AddBottle);
      const user = userEvent.setup();

      await fillRequiredFields(user);
      await user.click(screen.getByTestId('submit-button'));
      await user.click(screen.getByTestId('confirm-duplicate'));

      expect(updateSpy).toHaveBeenCalledOnce();
      const updated = updateSpy.mock.calls[0][0];
      expect(updated.id).toBe('existing-1');
      expect(updated.history).toHaveLength(2);
      expect(updated.history[1].action).toBe(HistoryAction.Added);
      expect(window.location.hash).toBe('#/');
    });

    it('should dismiss banner on cancel and keep form', async () => {
      const existing = makeBottle();
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue([existing]);
      render(AddBottle);
      const user = userEvent.setup();

      await fillRequiredFields(user);
      await user.click(screen.getByTestId('submit-button'));

      expect(screen.getByTestId('duplicate-banner')).toBeInTheDocument();

      await user.click(screen.getByTestId('cancel-duplicate'));

      expect(screen.queryByTestId('duplicate-banner')).not.toBeInTheDocument();
      expect(screen.getByTestId('add-bottle-form')).toBeInTheDocument();
    });
  });

  describe('grape variety tag input', () => {
    it('should add tags on Enter key', async () => {
      render(AddBottle);
      const user = userEvent.setup();

      await user.type(screen.getByTestId('input-grape'), 'Merlot{Enter}');

      const tags = screen.getByTestId('grape-tags');
      expect(tags).toHaveTextContent('Merlot');
    });

    it('should add tags on comma key', async () => {
      render(AddBottle);
      const user = userEvent.setup();

      await user.type(screen.getByTestId('input-grape'), 'Syrah,');

      const tags = screen.getByTestId('grape-tags');
      expect(tags).toHaveTextContent('Syrah');
    });

    it('should remove tags individually', async () => {
      render(AddBottle);
      const user = userEvent.setup();

      await user.type(screen.getByTestId('input-grape'), 'Merlot{Enter}');
      await user.type(screen.getByTestId('input-grape'), 'Syrah{Enter}');

      expect(screen.getByTestId('grape-tags')).toHaveTextContent('Merlot');
      expect(screen.getByTestId('grape-tags')).toHaveTextContent('Syrah');

      await user.click(screen.getByTestId('remove-grape-Merlot'));

      expect(screen.getByTestId('grape-tags')).not.toHaveTextContent('Merlot');
      expect(screen.getByTestId('grape-tags')).toHaveTextContent('Syrah');
    });
  });

  describe('optional fields', () => {
    it('should allow empty rating, location, and price', async () => {
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue([]);
      const addSpy = vi.spyOn(storage, 'addBottle').mockResolvedValue('new-id');
      render(AddBottle);
      const user = userEvent.setup();

      await fillRequiredFields(user);
      await user.click(screen.getByTestId('submit-button'));

      expect(addSpy).toHaveBeenCalledOnce();
      const bottle = addSpy.mock.calls[0][0];
      expect(bottle.rating).toBeUndefined();
      expect(bottle.location).toBeUndefined();
      expect(bottle.history[0].price).toBeUndefined();
    });

    it('should default price currency to EUR', () => {
      render(AddBottle);

      expect(screen.getByTestId('input-currency')).toHaveValue('EUR');
    });
  });
});
