import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';

import EditBottle from './EditBottle.svelte';
import { HistoryAction, WineType, type Bottle } from '../lib/types';
import * as storage from '../lib/storage';
import * as syncManager from '../lib/sync-manager';
import * as toast from '../lib/toast.svelte';

function makeBottle(overrides: Partial<Bottle> = {}): Bottle {
  return {
    id: 'bottle-1',
    name: 'Chateau Margaux',
    vintage: 2015,
    type: WineType.Red,
    country: 'France',
    region: 'Bordeaux',
    grapeVariety: ['Cabernet Sauvignon'],
    location: 'Rack A3',
    rating: 9,
    notes: 'Excellent tannins',
    history: [
      { date: '2026-01-15', action: HistoryAction.Added, quantity: 6 },
    ],
    ...overrides,
  };
}

describe('EditBottle', () => {
  beforeEach(() => {
    storage.resetDbConnection();
    vi.spyOn(storage, 'getAllBottles').mockResolvedValue([]);
    vi.spyOn(storage, 'updateBottle').mockResolvedValue();
    vi.spyOn(syncManager, 'attemptSync').mockImplementation(() => Promise.resolve());
    vi.spyOn(toast, 'toastSuccess').mockReturnValue(1);
    vi.spyOn(toast, 'toastError').mockReturnValue(1);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('pre-filling', () => {
    it('should pre-fill all fields with current bottle values', () => {
      const bottle = makeBottle();
      render(EditBottle, { props: { bottle, onclose: vi.fn(), onsave: vi.fn() } });

      expect(screen.getByTestId('edit-input-name')).toHaveValue('Chateau Margaux');
      expect(screen.getByTestId('edit-input-vintage')).toHaveValue(2015);
      expect(screen.getByTestId('edit-input-type')).toHaveValue('Red');
      expect(screen.getByTestId('edit-input-rating')).toHaveValue(9);
      expect(screen.getByTestId('edit-input-location')).toHaveValue('Rack A3');
      expect(screen.getByTestId('edit-input-notes')).toHaveValue('Excellent tannins');
      expect(screen.getByTestId('input-edit-country')).toHaveValue('France');
      expect(screen.getByTestId('input-edit-region')).toHaveValue('Bordeaux');
    });

    it('should handle empty optional fields', () => {
      const bottle = makeBottle({ rating: undefined, notes: undefined, location: undefined, region: undefined });
      render(EditBottle, { props: { bottle, onclose: vi.fn(), onsave: vi.fn() } });

      expect(screen.getByTestId('edit-input-rating')).toHaveValue(null);
      expect(screen.getByTestId('edit-input-location')).toHaveValue('');
      expect(screen.getByTestId('edit-input-notes')).toHaveValue('');
      expect(screen.getByTestId('input-edit-region')).toHaveValue('');
    });
  });

  describe('key fields disabled', () => {
    it('should disable name, vintage, and type fields', () => {
      render(EditBottle, { props: { bottle: makeBottle(), onclose: vi.fn(), onsave: vi.fn() } });

      expect(screen.getByTestId('edit-input-name')).toBeDisabled();
      expect(screen.getByTestId('edit-input-vintage')).toBeDisabled();
      expect(screen.getByTestId('edit-input-type')).toBeDisabled();
    });

    it('should not disable editable fields', () => {
      render(EditBottle, { props: { bottle: makeBottle(), onclose: vi.fn(), onsave: vi.fn() } });

      expect(screen.getByTestId('edit-input-rating')).not.toBeDisabled();
      expect(screen.getByTestId('edit-input-location')).not.toBeDisabled();
      expect(screen.getByTestId('edit-input-notes')).not.toBeDisabled();
    });
  });

  describe('saving', () => {
    it('should call updateBottle and attemptSync on save', async () => {
      const onsave = vi.fn();
      render(EditBottle, { props: { bottle: makeBottle(), onclose: vi.fn(), onsave } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('edit-save-button'));

      expect(storage.updateBottle).toHaveBeenCalledOnce();
      expect(syncManager.attemptSync).toHaveBeenCalledOnce();
      expect(toast.toastSuccess).toHaveBeenCalledWith('Updated Chateau Margaux 2015');
      expect(onsave).toHaveBeenCalledOnce();
    });

    it('should save updated field values', async () => {
      const onsave = vi.fn();
      render(EditBottle, { props: { bottle: makeBottle(), onclose: vi.fn(), onsave } });
      const user = userEvent.setup();

      const ratingInput = screen.getByTestId('edit-input-rating');
      await user.clear(ratingInput);
      await user.type(ratingInput, '7');
      await user.click(screen.getByTestId('edit-save-button'));

      const savedBottle = vi.mocked(storage.updateBottle).mock.calls[0][0];
      expect(savedBottle.rating).toBe(7);
    });

    it('should show error toast on save failure', async () => {
      vi.mocked(storage.updateBottle).mockRejectedValue(new Error('DB error'));
      render(EditBottle, { props: { bottle: makeBottle(), onclose: vi.fn(), onsave: vi.fn() } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('edit-save-button'));

      expect(toast.toastError).toHaveBeenCalledWith('DB error');
    });
  });

  describe('rating validation', () => {
    it('should allow empty rating', async () => {
      render(EditBottle, { props: { bottle: makeBottle(), onclose: vi.fn(), onsave: vi.fn() } });
      const user = userEvent.setup();

      const ratingInput = screen.getByTestId('edit-input-rating');
      await user.clear(ratingInput);
      await user.click(screen.getByTestId('edit-save-button'));

      expect(storage.updateBottle).toHaveBeenCalledOnce();
    });

    it('should reject rating below 1', async () => {
      const bottle = makeBottle({ rating: undefined });
      render(EditBottle, { props: { bottle, onclose: vi.fn(), onsave: vi.fn() } });
      const user = userEvent.setup();

      await user.type(screen.getByTestId('edit-input-rating'), '0');
      await fireEvent.submit(screen.getByTestId('edit-bottle-form'));

      expect(screen.getByTestId('error-edit-rating')).toHaveTextContent('Rating must be between 1 and 10');
      expect(storage.updateBottle).not.toHaveBeenCalled();
    });

    it('should reject rating above 10', async () => {
      const bottle = makeBottle({ rating: undefined });
      render(EditBottle, { props: { bottle, onclose: vi.fn(), onsave: vi.fn() } });
      const user = userEvent.setup();

      await user.type(screen.getByTestId('edit-input-rating'), '11');
      await fireEvent.submit(screen.getByTestId('edit-bottle-form'));

      expect(screen.getByTestId('error-edit-rating')).toHaveTextContent('Rating must be between 1 and 10');
      expect(storage.updateBottle).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should call onclose when cancel button is clicked', async () => {
      const onclose = vi.fn();
      render(EditBottle, { props: { bottle: makeBottle(), onclose, onsave: vi.fn() } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('edit-cancel-button'));

      expect(onclose).toHaveBeenCalledOnce();
      expect(storage.updateBottle).not.toHaveBeenCalled();
    });

    it('should call onclose when X button is clicked', async () => {
      const onclose = vi.fn();
      render(EditBottle, { props: { bottle: makeBottle(), onclose, onsave: vi.fn() } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('edit-close-button'));

      expect(onclose).toHaveBeenCalledOnce();
    });
  });
});
