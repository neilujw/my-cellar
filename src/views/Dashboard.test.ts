import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';

import Dashboard from './Dashboard.svelte';
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
    grapeVariety: ['Cabernet Sauvignon'],
    history: [
      {
        date: '2026-01-15',
        action: HistoryAction.Added,
        quantity: 3,
        price: { amount: 45, currency: 'EUR' },
      },
    ],
    ...overrides,
  };
}

describe('Dashboard', () => {
  beforeEach(() => {
    storage.resetDbConnection();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('empty state', () => {
    it('should display empty state message when no bottles exist', async () => {
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue([]);
      render(Dashboard);

      expect(await screen.findByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('Your cellar is empty. Start building your collection!')).toBeInTheDocument();
    });

    it('should display CTA button that navigates to /add', async () => {
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue([]);
      render(Dashboard);
      const user = userEvent.setup();

      const ctaButton = await screen.findByTestId('cta-add-bottle');
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveTextContent('Add your first bottle');

      await user.click(ctaButton);

      expect(window.location.hash).toBe('#/add');
    });
  });

  describe('statistics display', () => {
    it('should display total bottle count', async () => {
      const bottles = [
        makeBottle({ id: 'a', history: [{ date: '2026-01-01', action: HistoryAction.Added, quantity: 3 }] }),
        makeBottle({ id: 'b', history: [{ date: '2026-01-01', action: HistoryAction.Added, quantity: 5 }] }),
      ];
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue(bottles);
      render(Dashboard);

      const totalCount = await screen.findByTestId('total-count');
      expect(totalCount).toHaveTextContent('8');
    });

    it('should display breakdown by wine type', async () => {
      const bottles = [
        makeBottle({
          id: 'a',
          type: WineType.Red,
          history: [{ date: '2026-01-01', action: HistoryAction.Added, quantity: 3 }],
        }),
        makeBottle({
          id: 'b',
          type: WineType.White,
          history: [{ date: '2026-01-01', action: HistoryAction.Added, quantity: 2 }],
        }),
      ];
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue(bottles);
      render(Dashboard);

      const breakdown = await screen.findByTestId('type-breakdown');
      expect(breakdown).toBeInTheDocument();
      expect(breakdown).toHaveTextContent('3');
      expect(breakdown).toHaveTextContent('Red');
      expect(breakdown).toHaveTextContent('2');
      expect(breakdown).toHaveTextContent('White');
      expect(breakdown).toHaveTextContent('0');
    });

    it('should display top regions with counts', async () => {
      const bottles = [
        makeBottle({
          id: 'a',
          region: 'Bordeaux',
          history: [{ date: '2026-01-01', action: HistoryAction.Added, quantity: 5 }],
        }),
        makeBottle({
          id: 'b',
          region: 'Burgundy',
          history: [{ date: '2026-01-01', action: HistoryAction.Added, quantity: 3 }],
        }),
      ];
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue(bottles);
      render(Dashboard);

      const regions = await screen.findByTestId('top-regions');
      expect(regions).toBeInTheDocument();
      expect(regions).toHaveTextContent('Bordeaux');
      expect(regions).toHaveTextContent('5');
      expect(regions).toHaveTextContent('Burgundy');
      expect(regions).toHaveTextContent('3');
    });
  });

  describe('recent activity', () => {
    it('should display recent activity entries in correct format', async () => {
      const bottles = [
        makeBottle({
          name: 'Chateau Margaux',
          vintage: 2015,
          history: [
            { date: '2026-02-10', action: HistoryAction.Added, quantity: 3 },
            { date: '2026-02-12', action: HistoryAction.Consumed, quantity: 1 },
          ],
        }),
      ];
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue(bottles);
      render(Dashboard);

      const activity = await screen.findByTestId('recent-activity');
      expect(activity).toBeInTheDocument();

      const items = activity.querySelectorAll('li');
      expect(items).toHaveLength(2);
      // Most recent first
      expect(items[0].textContent).toContain('2026-02-12');
      expect(items[0].textContent).toContain('Consumed');
      expect(items[0].textContent).toContain('Chateau Margaux');
      expect(items[0].textContent).toContain('2015');
      expect(items[1].textContent).toContain('2026-02-10');
      expect(items[1].textContent).toContain('Added');
    });
  });

  describe('edge cases', () => {
    it('should handle bottles with 0 current quantity correctly', async () => {
      const bottles = [
        makeBottle({
          id: 'a',
          type: WineType.Red,
          region: 'Bordeaux',
          history: [
            { date: '2026-01-01', action: HistoryAction.Added, quantity: 2 },
            { date: '2026-01-05', action: HistoryAction.Consumed, quantity: 2 },
          ],
        }),
        makeBottle({
          id: 'b',
          type: WineType.White,
          region: 'Burgundy',
          history: [{ date: '2026-01-01', action: HistoryAction.Added, quantity: 1 }],
        }),
      ];
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue(bottles);
      render(Dashboard);

      // Total should only count bottles with quantity > 0
      const totalCount = await screen.findByTestId('total-count');
      expect(totalCount).toHaveTextContent('1');

      // Type breakdown shows 0 for red (all consumed)
      const breakdown = screen.getByTestId('type-breakdown');
      expect(breakdown).toHaveTextContent('0');
      expect(breakdown).toHaveTextContent('1');

      // Top regions should exclude Bordeaux (0 quantity)
      const regions = screen.getByTestId('top-regions');
      expect(regions).toHaveTextContent('Burgundy');
      expect(regions).not.toHaveTextContent('Bordeaux');
    });
  });

  describe('bottle detail modal', () => {
    it('should open detail modal when a BottleCard is clicked', async () => {
      const bottles = [
        makeBottle({
          id: 'a',
          name: 'Chateau Margaux',
          history: [{ date: '2026-01-01', action: HistoryAction.Added, quantity: 3 }],
        }),
      ];
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue(bottles);
      render(Dashboard);
      const user = userEvent.setup();

      await screen.findByTestId('recent-bottles');
      await user.click(screen.getByTestId('bottle-card'));

      expect(screen.getByTestId('bottle-detail-modal')).toBeInTheDocument();
      expect(screen.getByTestId('detail-name')).toHaveTextContent('Chateau Margaux');
    });
  });
});
