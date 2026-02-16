import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';

import BottleCard from './BottleCard.svelte';
import { HistoryAction, WineType, type Bottle } from '../lib/types';

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
      { date: '2026-01-15', action: HistoryAction.Added, quantity: 3 },
    ],
    ...overrides,
  };
}

describe('BottleCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render all bottle fields', () => {
    render(BottleCard, { props: { bottle: makeBottle({ rating: 8.5 }) } });

    expect(screen.getByTestId('bottle-card-name')).toHaveTextContent('Chateau Margaux');
    expect(screen.getByTestId('bottle-card-origin')).toHaveTextContent('France — Bordeaux');
    expect(screen.getByTestId('bottle-card-type')).toHaveTextContent('Red');
    expect(screen.getByTestId('bottle-card-vintage')).toHaveTextContent('2015');
    expect(screen.getByTestId('bottle-card-quantity')).toHaveTextContent('3 bottles');
    expect(screen.getByTestId('bottle-card-rating')).toHaveTextContent('8.5/10');
  });

  it('should not display rating when not set', () => {
    render(BottleCard, { props: { bottle: makeBottle({ rating: undefined }) } });

    expect(screen.queryByTestId('bottle-card-rating')).not.toBeInTheDocument();
  });

  it('should display zero quantity correctly', () => {
    const bottle = makeBottle({
      history: [
        { date: '2026-01-01', action: HistoryAction.Added, quantity: 2 },
        { date: '2026-01-05', action: HistoryAction.Consumed, quantity: 2 },
      ],
    });
    render(BottleCard, { props: { bottle } });

    expect(screen.getByTestId('bottle-card-quantity')).toHaveTextContent('0 bottles');
  });

  it('should display singular "bottle" for quantity of 1', () => {
    const bottle = makeBottle({
      history: [{ date: '2026-01-01', action: HistoryAction.Added, quantity: 1 }],
    });
    render(BottleCard, { props: { bottle } });

    expect(screen.getByTestId('bottle-card-quantity')).toHaveTextContent('1 bottle');
  });

  it('should display correct type badge for each wine type', () => {
    render(BottleCard, { props: { bottle: makeBottle({ type: WineType.Sparkling }) } });

    expect(screen.getByTestId('bottle-card-type')).toHaveTextContent('Sparkling');
  });

  describe('click handler', () => {
    it('should call onclick with the bottle when clicked', async () => {
      const onclick = vi.fn();
      const bottle = makeBottle();
      render(BottleCard, { props: { bottle, onclick } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('bottle-card'));

      expect(onclick).toHaveBeenCalledOnce();
      expect(onclick).toHaveBeenCalledWith(bottle);
    });

    it('should have button role and cursor when onclick is provided', () => {
      render(BottleCard, { props: { bottle: makeBottle(), onclick: vi.fn() } });

      const card = screen.getByTestId('bottle-card');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabindex', '0');
    });

    it('should not have button role when onclick is not provided', () => {
      render(BottleCard, { props: { bottle: makeBottle() } });

      const card = screen.getByTestId('bottle-card');
      expect(card).not.toHaveAttribute('role');
    });
  });
});
