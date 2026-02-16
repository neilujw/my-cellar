import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';

import BottleDetail from './BottleDetail.svelte';
import { HistoryAction, WineType, type Bottle } from '../lib/types';
import * as storage from '../lib/storage';

function makeBottle(overrides: Partial<Bottle> = {}): Bottle {
  return {
    id: 'bottle-1',
    name: 'Chateau Margaux',
    vintage: 2015,
    type: WineType.Red,
    country: 'France',
    region: 'Bordeaux',
    grapeVariety: ['Cabernet Sauvignon', 'Merlot'],
    location: 'Rack A3',
    rating: 9,
    notes: 'Excellent tannins',
    history: [
      {
        date: '2026-01-15',
        action: HistoryAction.Added,
        quantity: 6,
        price: { amount: 120, currency: 'EUR' },
        notes: 'Initial purchase',
      },
      {
        date: '2026-02-01',
        action: HistoryAction.Consumed,
        quantity: 1,
      },
    ],
    ...overrides,
  };
}

describe('BottleDetail', () => {
  beforeEach(() => {
    storage.resetDbConnection();
    vi.spyOn(storage, 'getAllBottles').mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render all bottle fields', () => {
      const bottle = makeBottle();
      render(BottleDetail, { props: { bottle, onclose: vi.fn(), onupdate: vi.fn() } });

      expect(screen.getByTestId('detail-name')).toHaveTextContent('Chateau Margaux');
      expect(screen.getByTestId('detail-vintage')).toHaveTextContent('Vintage 2015');
      expect(screen.getByTestId('detail-type')).toHaveTextContent('Red');
      expect(screen.getByTestId('detail-quantity')).toHaveTextContent('5 bottles');
      expect(screen.getByTestId('detail-rating')).toHaveTextContent('9/10');
      expect(screen.getByTestId('detail-origin')).toHaveTextContent('France — Bordeaux');
      expect(screen.getByTestId('detail-grapes')).toHaveTextContent('Cabernet Sauvignon');
      expect(screen.getByTestId('detail-grapes')).toHaveTextContent('Merlot');
      expect(screen.getByTestId('detail-location')).toHaveTextContent('Rack A3');
      expect(screen.getByTestId('detail-notes')).toHaveTextContent('Excellent tannins');
    });

    it('should render full history timeline', () => {
      const bottle = makeBottle();
      render(BottleDetail, { props: { bottle, onclose: vi.fn(), onupdate: vi.fn() } });

      const entries = screen.getAllByTestId('history-entry');
      expect(entries).toHaveLength(2);
    });

    it('should not show rating when not set', () => {
      const bottle = makeBottle({ rating: undefined });
      render(BottleDetail, { props: { bottle, onclose: vi.fn(), onupdate: vi.fn() } });

      expect(screen.queryByTestId('detail-rating')).not.toBeInTheDocument();
    });

    it('should not show location when not set', () => {
      const bottle = makeBottle({ location: undefined });
      render(BottleDetail, { props: { bottle, onclose: vi.fn(), onupdate: vi.fn() } });

      expect(screen.queryByTestId('detail-location')).not.toBeInTheDocument();
    });

    it('should not show notes when not set', () => {
      const bottle = makeBottle({ notes: undefined });
      render(BottleDetail, { props: { bottle, onclose: vi.fn(), onupdate: vi.fn() } });

      expect(screen.queryByTestId('detail-notes')).not.toBeInTheDocument();
    });

    it('should show country only when region is not set', () => {
      const bottle = makeBottle({ region: undefined });
      render(BottleDetail, { props: { bottle, onclose: vi.fn(), onupdate: vi.fn() } });

      expect(screen.getByTestId('detail-origin')).toHaveTextContent('France');
      expect(screen.getByTestId('detail-origin').textContent).not.toContain('—');
    });
  });

  describe('close button', () => {
    it('should call onclose when close button is clicked', async () => {
      const onclose = vi.fn();
      render(BottleDetail, { props: { bottle: makeBottle(), onclose, onupdate: vi.fn() } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('detail-close-button'));

      expect(onclose).toHaveBeenCalledOnce();
    });
  });

  describe('edit button', () => {
    it('should open edit modal when edit button is clicked', async () => {
      render(BottleDetail, { props: { bottle: makeBottle(), onclose: vi.fn(), onupdate: vi.fn() } });
      const user = userEvent.setup();

      expect(screen.queryByTestId('edit-bottle-modal')).not.toBeInTheDocument();

      await user.click(screen.getByTestId('detail-edit-button'));

      expect(screen.getByTestId('edit-bottle-modal')).toBeInTheDocument();
    });
  });
});
