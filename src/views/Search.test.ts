import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';

import Search from './Search.svelte';
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
    rating: 8,
    history: [
      { date: '2026-01-15', action: HistoryAction.Added, quantity: 3 },
    ],
    ...overrides,
  };
}

describe('Search', () => {
  beforeEach(() => {
    storage.resetDbConnection();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('empty cellar', () => {
    it('should display empty cellar state with CTA when no bottles exist', async () => {
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue([]);
      render(Search);

      expect(await screen.findByTestId('search-empty-cellar')).toBeInTheDocument();
      expect(screen.getByText(/Your cellar is empty/)).toBeInTheDocument();
      expect(screen.getByTestId('cta-add-bottle')).toBeInTheDocument();
    });

    it('should navigate to /add when CTA is clicked', async () => {
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue([]);
      render(Search);
      const user = userEvent.setup();

      const cta = await screen.findByTestId('cta-add-bottle');
      await user.click(cta);

      expect(window.location.hash).toBe('#/add');
    });
  });

  describe('search and filter', () => {
    const bottles = [
      makeBottle({ id: '1', name: 'Chateau Margaux', type: WineType.Red, country: 'France', region: 'Bordeaux', vintage: 2015, rating: 9 }),
      makeBottle({ id: '2', name: 'Petrus', type: WineType.Red, country: 'France', region: 'Pomerol', vintage: 2010, rating: 10 }),
      makeBottle({ id: '3', name: 'Cloudy Bay', type: WineType.White, country: 'New Zealand', region: 'Marlborough', vintage: 2020, rating: 7 }),
    ];

    it('should display all bottles initially', async () => {
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue(bottles);
      render(Search);

      await screen.findByTestId('search-results');
      const cards = screen.getAllByTestId('bottle-card');
      expect(cards).toHaveLength(3);
    });

    it('should display results count', async () => {
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue(bottles);
      render(Search);

      const count = await screen.findByTestId('results-count');
      expect(count).toHaveTextContent('3 bottles found');
    });

    it('should filter bottles by search text', async () => {
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue(bottles);
      render(Search);
      const user = userEvent.setup();

      const input = await screen.findByTestId('search-input');
      await user.type(input, 'chateau');

      const cards = screen.getAllByTestId('bottle-card');
      expect(cards).toHaveLength(1);
      expect(screen.getByTestId('results-count')).toHaveTextContent('1 bottle found');
    });

    it('should filter bottles by wine type', async () => {
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue(bottles);
      render(Search);
      const user = userEvent.setup();

      // Open filter panel and click White type
      await screen.findByTestId('search-results');
      await user.click(screen.getByTestId('filter-toggle'));
      await user.click(screen.getByTestId('filter-type-white'));

      const cards = screen.getAllByTestId('bottle-card');
      expect(cards).toHaveLength(1);
      expect(screen.getByTestId('results-count')).toHaveTextContent('1 bottle found');
    });

    it('should show no results state when filters match nothing', async () => {
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue(bottles);
      render(Search);
      const user = userEvent.setup();

      const input = await screen.findByTestId('search-input');
      await user.type(input, 'nonexistent wine xyz');

      expect(screen.getByTestId('search-no-results')).toBeInTheDocument();
      expect(screen.getByText('No bottles match your filters.')).toBeInTheDocument();
    });

    it('should sort bottles by name by default', async () => {
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue(bottles);
      render(Search);

      await screen.findByTestId('search-results');
      const names = screen.getAllByTestId('bottle-card-name');

      // Alphabetical: Chateau Margaux, Cloudy Bay, Petrus
      expect(names[0]).toHaveTextContent('Chateau Margaux');
      expect(names[1]).toHaveTextContent('Cloudy Bay');
      expect(names[2]).toHaveTextContent('Petrus');
    });

    it('should sort bottles by vintage when selected', async () => {
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue(bottles);
      render(Search);
      const user = userEvent.setup();

      await screen.findByTestId('search-results');
      await user.selectOptions(screen.getByTestId('sort-select'), 'vintage');

      const vintages = screen.getAllByTestId('bottle-card-vintage');
      expect(vintages[0]).toHaveTextContent('2010');
      expect(vintages[1]).toHaveTextContent('2015');
      expect(vintages[2]).toHaveTextContent('2020');
    });

    it('should sort bottles by rating descending when selected', async () => {
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue(bottles);
      render(Search);
      const user = userEvent.setup();

      await screen.findByTestId('search-results');
      await user.selectOptions(screen.getByTestId('sort-select'), 'rating');

      const names = screen.getAllByTestId('bottle-card-name');
      expect(names[0]).toHaveTextContent('Petrus');
      expect(names[1]).toHaveTextContent('Chateau Margaux');
      expect(names[2]).toHaveTextContent('Cloudy Bay');
    });
  });

  describe('bottles with zero quantity', () => {
    it('should display bottles with zero quantity', async () => {
      const bottles = [
        makeBottle({
          id: '1',
          name: 'Empty Bottle',
          history: [
            { date: '2026-01-01', action: HistoryAction.Added, quantity: 1 },
            { date: '2026-01-05', action: HistoryAction.Consumed, quantity: 1 },
          ],
        }),
        makeBottle({ id: '2', name: 'Full Bottle' }),
      ];
      vi.spyOn(storage, 'getAllBottles').mockResolvedValue(bottles);
      render(Search);

      await screen.findByTestId('search-results');
      const cards = screen.getAllByTestId('bottle-card');
      expect(cards).toHaveLength(2);
    });
  });
});
