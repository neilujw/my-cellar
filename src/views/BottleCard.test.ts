import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';

import BottleCard from './BottleCard.svelte';
import { HistoryAction, WineType, type Bottle } from '../lib/types';
import * as bottleActions from '../lib/bottle-actions';

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
    vi.restoreAllMocks();
  });

  it('should render all bottle fields', () => {
    render(BottleCard, { props: { bottle: makeBottle({ rating: 4 }) } });

    expect(screen.getByTestId('bottle-card-name')).toHaveTextContent('Chateau Margaux');
    expect(screen.getByTestId('bottle-card-origin')).toHaveTextContent('France — Bordeaux');
    expect(screen.getByTestId('bottle-card-type')).toHaveTextContent('Red');
    expect(screen.getByTestId('bottle-card-vintage')).toHaveTextContent('2015');
    expect(screen.getByTestId('bottle-card-quantity')).toHaveTextContent('3 bottles');
    expect(screen.getByTestId('bottle-card-rating')).toHaveTextContent('★★★★☆');
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

  describe('ready to drink badge', () => {
    it('should show badge when consumeStartingFrom is set and <= current year and quantity > 0', () => {
      const currentYear = new Date().getFullYear();
      const bottle = makeBottle({ consumeStartingFrom: currentYear });
      render(BottleCard, { props: { bottle } });

      expect(screen.getByTestId('bottle-card-ready')).toHaveTextContent('Ready to drink');
    });

    it('should show badge when consumeStartingFrom is in the past', () => {
      const bottle = makeBottle({ consumeStartingFrom: 2020 });
      render(BottleCard, { props: { bottle } });

      expect(screen.getByTestId('bottle-card-ready')).toBeInTheDocument();
    });

    it('should not show badge when consumeStartingFrom is in the future', () => {
      const bottle = makeBottle({ consumeStartingFrom: 2099 });
      render(BottleCard, { props: { bottle } });

      expect(screen.queryByTestId('bottle-card-ready')).not.toBeInTheDocument();
    });

    it('should not show badge when consumeStartingFrom is not set', () => {
      render(BottleCard, { props: { bottle: makeBottle() } });

      expect(screen.queryByTestId('bottle-card-ready')).not.toBeInTheDocument();
    });

    it('should not show badge when quantity is 0', () => {
      const bottle = makeBottle({
        consumeStartingFrom: 2020,
        history: [
          { date: '2026-01-01', action: HistoryAction.Added, quantity: 1 },
          { date: '2026-01-02', action: HistoryAction.Consumed, quantity: 1 },
        ],
      });
      render(BottleCard, { props: { bottle } });

      expect(screen.queryByTestId('bottle-card-ready')).not.toBeInTheDocument();
    });
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

  describe('consume button', () => {
    it('should show consume button when quantity > 0', () => {
      render(BottleCard, { props: { bottle: makeBottle() } });

      expect(screen.getByTestId('bottle-card-consume')).toBeInTheDocument();
      expect(screen.queryByTestId('bottle-card-remove')).not.toBeInTheDocument();
    });

    it('should hide consume button when quantity is 0', () => {
      const bottle = makeBottle({
        history: [
          { date: '2026-01-01', action: HistoryAction.Added, quantity: 1 },
          { date: '2026-01-02', action: HistoryAction.Consumed, quantity: 1 },
        ],
      });
      render(BottleCard, { props: { bottle } });

      expect(screen.queryByTestId('bottle-card-consume')).not.toBeInTheDocument();
    });

    it('should call consumeBottle and onupdate when consume is clicked', async () => {
      const updatedBottle = makeBottle({ id: 'updated' });
      vi.spyOn(bottleActions, 'consumeBottle').mockResolvedValue(updatedBottle);
      const onupdate = vi.fn();
      render(BottleCard, { props: { bottle: makeBottle(), onupdate } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('bottle-card-consume'));

      expect(bottleActions.consumeBottle).toHaveBeenCalledOnce();
      expect(onupdate).toHaveBeenCalledWith(updatedBottle);
    });

    it('should not trigger card onclick when consume button is clicked', async () => {
      vi.spyOn(bottleActions, 'consumeBottle').mockResolvedValue(makeBottle());
      const onclick = vi.fn();
      render(BottleCard, { props: { bottle: makeBottle(), onclick } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('bottle-card-consume'));

      expect(onclick).not.toHaveBeenCalled();
    });
  });
});
