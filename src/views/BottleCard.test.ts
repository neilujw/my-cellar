import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';

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
});
