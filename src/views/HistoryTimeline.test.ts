import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';

import HistoryTimeline from './HistoryTimeline.svelte';
import { HistoryAction, type HistoryEntry } from '../lib/types';

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    date: '2026-01-15',
    action: HistoryAction.Added,
    quantity: 3,
    ...overrides,
  };
}

describe('HistoryTimeline', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render all history entries', () => {
    const history = [
      makeEntry({ date: '2026-01-15', action: HistoryAction.Added, quantity: 6 }),
      makeEntry({ date: '2026-01-20', action: HistoryAction.Consumed, quantity: 2 }),
    ];
    render(HistoryTimeline, { props: { history } });

    const entries = screen.getAllByTestId('history-entry');
    expect(entries).toHaveLength(2);
  });

  it('should sort entries by date descending (most recent first)', () => {
    const history = [
      makeEntry({ date: '2026-01-10', action: HistoryAction.Added, quantity: 3 }),
      makeEntry({ date: '2026-01-20', action: HistoryAction.Consumed, quantity: 1 }),
    ];
    render(HistoryTimeline, { props: { history } });

    const dates = screen.getAllByTestId('history-entry-date');
    expect(dates[0]).toHaveTextContent('2026-01-20');
    expect(dates[1]).toHaveTextContent('2026-01-10');
  });

  it('should display action, quantity, price, and notes for each entry', () => {
    const history = [
      makeEntry({
        date: '2026-02-01',
        action: HistoryAction.Added,
        quantity: 6,
        price: { amount: 25, currency: 'EUR' },
        notes: 'Great vintage',
      }),
    ];
    render(HistoryTimeline, { props: { history } });

    expect(screen.getByTestId('history-entry-action')).toHaveTextContent('Added');
    expect(screen.getByTestId('history-entry-quantity')).toHaveTextContent('6 bottles');
    expect(screen.getByTestId('history-entry-price')).toHaveTextContent('25 EUR');
    expect(screen.getByTestId('history-entry-notes')).toHaveTextContent('Great vintage');
  });

  it('should not show price when not provided', () => {
    render(HistoryTimeline, { props: { history: [makeEntry({ price: undefined })] } });

    expect(screen.queryByTestId('history-entry-price')).not.toBeInTheDocument();
  });

  it('should not show notes when not provided', () => {
    render(HistoryTimeline, { props: { history: [makeEntry({ notes: undefined })] } });

    expect(screen.queryByTestId('history-entry-notes')).not.toBeInTheDocument();
  });

  it('should display singular "bottle" for quantity of 1', () => {
    render(HistoryTimeline, { props: { history: [makeEntry({ quantity: 1 })] } });

    expect(screen.getByTestId('history-entry-quantity')).toHaveTextContent('1 bottle');
  });

  it('should display empty message when no history entries', () => {
    render(HistoryTimeline, { props: { history: [] } });

    expect(screen.getByText('No history entries.')).toBeInTheDocument();
    expect(screen.queryAllByTestId('history-entry')).toHaveLength(0);
  });
});
