import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';

import NameAutocomplete from './NameAutocomplete.svelte';
import { HistoryAction, WineType, type Bottle } from '../lib/types';

function makeBottle(overrides: Partial<Bottle> = {}): Bottle {
  return {
    id: 'test-id',
    name: 'Chateau Margaux',
    vintage: 2015,
    type: WineType.Red,
    country: 'France',
    region: 'Bordeaux',
    grapeVariety: ['Cabernet Sauvignon'],
    history: [{ date: '2026-01-15', action: HistoryAction.Added, quantity: 3 }],
    ...overrides,
  };
}

const defaultProps = {
  value: '',
  bottles: [
    makeBottle({ id: '1', name: 'Chateau Margaux' }),
    makeBottle({ id: '2', name: 'Chateau Latour', type: WineType.Red }),
    makeBottle({ id: '3', name: 'Domaine Leroy', type: WineType.White }),
  ],
  oninput: () => {},
  onselect: () => {},
};

describe('NameAutocomplete', () => {
  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('should render the name input', () => {
      render(NameAutocomplete, { props: defaultProps });

      expect(screen.getByTestId('input-name')).toBeInTheDocument();
    });

    it('should not show dropdown initially', () => {
      render(NameAutocomplete, { props: defaultProps });

      expect(screen.queryByTestId('autocomplete-dropdown')).not.toBeInTheDocument();
    });

    it('should display error when provided', () => {
      render(NameAutocomplete, { props: { ...defaultProps, error: 'Name is required' } });

      expect(screen.getByTestId('error-name')).toHaveTextContent('Name is required');
    });
  });

  describe('dropdown behavior', () => {
    it('should show dropdown with matches when 2+ characters are typed', async () => {
      let currentValue = '';
      const { rerender } = render(NameAutocomplete, {
        props: {
          ...defaultProps,
          value: currentValue,
          oninput: (v: string) => {
            currentValue = v;
          },
        },
      });

      const input = screen.getByTestId('input-name');
      await userEvent.setup().type(input, 'Ch');

      await rerender({ ...defaultProps, value: 'Ch', oninput: () => {} });

      expect(screen.getByTestId('autocomplete-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('autocomplete-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('autocomplete-item-1')).toBeInTheDocument();
    });

    it('should show "No matches" when query has 2+ chars but no results', async () => {
      const { rerender } = render(NameAutocomplete, {
        props: { ...defaultProps, value: '' },
      });

      const input = screen.getByTestId('input-name');
      await userEvent.setup().type(input, 'Zy');

      await rerender({ ...defaultProps, value: 'Zy' });

      expect(screen.getByTestId('autocomplete-no-matches')).toHaveTextContent('No matches');
    });

    it('should not show dropdown when fewer than 2 characters are typed', async () => {
      render(NameAutocomplete, { props: { ...defaultProps, value: 'C' } });

      expect(screen.queryByTestId('autocomplete-dropdown')).not.toBeInTheDocument();
    });

    it('should display bottle name, vintage, type badge, and quantity in items', async () => {
      const { rerender } = render(NameAutocomplete, {
        props: { ...defaultProps, value: '' },
      });

      const input = screen.getByTestId('input-name');
      await userEvent.setup().type(input, 'Chateau');
      await rerender({ ...defaultProps, value: 'Chateau' });

      const item = screen.getByTestId('autocomplete-item-0');
      expect(item).toHaveTextContent('Chateau Latour');
      expect(item).toHaveTextContent('2015');
      expect(item).toHaveTextContent('Red');
      expect(item).toHaveTextContent('×3');
    });
  });

  describe('selection', () => {
    it('should call onselect when a dropdown item is clicked', async () => {
      let selected: Bottle | null = null;
      const { rerender } = render(NameAutocomplete, {
        props: {
          ...defaultProps,
          value: '',
          onselect: (b: Bottle) => {
            selected = b;
          },
        },
      });

      const input = screen.getByTestId('input-name');
      await userEvent.setup().type(input, 'Chateau');
      await rerender({
        ...defaultProps,
        value: 'Chateau',
        onselect: (b: Bottle) => {
          selected = b;
        },
      });

      await userEvent.setup().click(screen.getByTestId('autocomplete-item-0'));

      expect(selected).not.toBeNull();
      expect(selected!.name).toBe('Chateau Latour');
    });
  });

  describe('keyboard navigation', () => {
    it('should navigate with arrow keys and select with Enter', async () => {
      let selected: Bottle | null = null;
      const user = userEvent.setup();
      const { rerender } = render(NameAutocomplete, {
        props: {
          ...defaultProps,
          value: '',
          onselect: (b: Bottle) => {
            selected = b;
          },
        },
      });

      const input = screen.getByTestId('input-name');
      await user.type(input, 'Chateau');
      await rerender({
        ...defaultProps,
        value: 'Chateau',
        onselect: (b: Bottle) => {
          selected = b;
        },
      });

      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('autocomplete-item-0').className).toContain('bg-indigo-100');

      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('autocomplete-item-1').className).toContain('bg-indigo-100');

      await user.keyboard('{Enter}');
      expect(selected).not.toBeNull();
      expect(selected!.name).toBe('Chateau Margaux');
    });

    it('should close dropdown on Escape', async () => {
      const user = userEvent.setup();
      const { rerender } = render(NameAutocomplete, {
        props: { ...defaultProps, value: '' },
      });

      const input = screen.getByTestId('input-name');
      await user.type(input, 'Chateau');
      await rerender({ ...defaultProps, value: 'Chateau' });

      expect(screen.getByTestId('autocomplete-dropdown')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(screen.queryByTestId('autocomplete-dropdown')).not.toBeInTheDocument();
    });
  });
});
