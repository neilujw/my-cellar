import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';

import FilterPanel from './FilterPanel.svelte';
import { WineType } from '../lib/types';
import { createEmptyFilters, type SearchFilters } from '../lib/search-utils';

describe('FilterPanel', () => {
  afterEach(() => {
    cleanup();
  });

  it('should be collapsed by default', () => {
    const onchange = vi.fn();
    render(FilterPanel, {
      props: { filters: createEmptyFilters(), countries: [], regions: [], onchange },
    });

    expect(screen.getByTestId('filter-toggle')).toBeInTheDocument();
    expect(screen.queryByTestId('filter-content')).not.toBeInTheDocument();
  });

  it('should expand when toggle button is clicked', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(FilterPanel, {
      props: { filters: createEmptyFilters(), countries: [], regions: [], onchange },
    });

    await user.click(screen.getByTestId('filter-toggle'));

    expect(screen.getByTestId('filter-content')).toBeInTheDocument();
  });

  it('should collapse when toggle button is clicked again', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(FilterPanel, {
      props: { filters: createEmptyFilters(), countries: [], regions: [], onchange },
    });

    await user.click(screen.getByTestId('filter-toggle'));
    expect(screen.getByTestId('filter-content')).toBeInTheDocument();

    await user.click(screen.getByTestId('filter-toggle'));
    expect(screen.queryByTestId('filter-content')).not.toBeInTheDocument();
  });

  it('should show active filter count badge when filters are active', () => {
    const filters: SearchFilters = {
      ...createEmptyFilters(),
      types: [WineType.Red],
      country: 'France',
    };
    const onchange = vi.fn();
    render(FilterPanel, {
      props: { filters, countries: ['France'], regions: [], onchange },
    });

    expect(screen.getByTestId('filter-count')).toHaveTextContent('2');
  });

  it('should not show filter count badge when no filters are active', () => {
    const onchange = vi.fn();
    render(FilterPanel, {
      props: { filters: createEmptyFilters(), countries: [], regions: [], onchange },
    });

    expect(screen.queryByTestId('filter-count')).not.toBeInTheDocument();
  });

  it('should call onchange when a type toggle is clicked', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(FilterPanel, {
      props: { filters: createEmptyFilters(), countries: [], regions: [], onchange },
    });

    await user.click(screen.getByTestId('filter-toggle'));
    await user.click(screen.getByTestId('filter-type-red'));

    expect(onchange).toHaveBeenCalledWith(
      expect.objectContaining({ types: [WineType.Red] }),
    );
  });

  it('should call onchange to clear all filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    const filters: SearchFilters = {
      ...createEmptyFilters(),
      types: [WineType.Red],
      country: 'France',
      minRating: 7,
    };
    render(FilterPanel, {
      props: { filters, countries: ['France'], regions: [], onchange },
    });

    await user.click(screen.getByTestId('filter-toggle'));
    await user.click(screen.getByTestId('filter-clear'));

    expect(onchange).toHaveBeenCalledWith(
      expect.objectContaining({
        types: [],
        country: '',
        region: '',
        vintageMin: undefined,
        vintageMax: undefined,
        minRating: undefined,
      }),
    );
  });

  it('should display dynamic country options', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(FilterPanel, {
      props: {
        filters: createEmptyFilters(),
        countries: ['France', 'Italy', 'Spain'],
        regions: [],
        onchange,
      },
    });

    await user.click(screen.getByTestId('filter-toggle'));
    const countrySelect = screen.getByTestId('filter-country');
    const options = countrySelect.querySelectorAll('option');

    // "All countries" + 3 country options
    expect(options).toHaveLength(4);
    expect(options[1]).toHaveTextContent('France');
    expect(options[2]).toHaveTextContent('Italy');
    expect(options[3]).toHaveTextContent('Spain');
  });

  it('should display dynamic region options', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(FilterPanel, {
      props: {
        filters: createEmptyFilters(),
        countries: [],
        regions: ['Bordeaux', 'Burgundy'],
        onchange,
      },
    });

    await user.click(screen.getByTestId('filter-toggle'));
    const regionSelect = screen.getByTestId('filter-region');
    const options = regionSelect.querySelectorAll('option');

    // "All regions" + 2 region options
    expect(options).toHaveLength(3);
    expect(options[1]).toHaveTextContent('Bordeaux');
    expect(options[2]).toHaveTextContent('Burgundy');
  });
});
