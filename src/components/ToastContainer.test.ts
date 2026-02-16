import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import ToastContainer from './ToastContainer.svelte';
import { addToast, clearAllToasts, ToastVariant } from '../lib/toast.svelte';

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearAllToasts();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    clearAllToasts();
  });

  it('should not render when no toasts exist', () => {
    render(ToastContainer);

    expect(screen.queryByTestId('toast-container')).not.toBeInTheDocument();
  });

  it('should render a success toast', () => {
    addToast('Bottle added', ToastVariant.Success);
    render(ToastContainer);

    expect(screen.getByTestId('toast-success')).toBeInTheDocument();
    expect(screen.getByText('Bottle added')).toBeInTheDocument();
  });

  it('should render an error toast', () => {
    addToast('Sync failed', ToastVariant.Error);
    render(ToastContainer);

    expect(screen.getByTestId('toast-error')).toBeInTheDocument();
    expect(screen.getByText('Sync failed')).toBeInTheDocument();
  });

  it('should render an info toast', () => {
    addToast('Info message', ToastVariant.Info);
    render(ToastContainer);

    expect(screen.getByTestId('toast-info')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('should render multiple toasts', () => {
    addToast('First', ToastVariant.Success);
    addToast('Second', ToastVariant.Error);
    render(ToastContainer);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('should dismiss toast when clicking dismiss button', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    addToast('Dismissable', ToastVariant.Info, 60000);
    render(ToastContainer);

    expect(screen.getByText('Dismissable')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Dismiss'));

    expect(screen.queryByText('Dismissable')).not.toBeInTheDocument();
  });

  it('should have status role for accessibility', () => {
    addToast('Accessible toast', ToastVariant.Success);
    render(ToastContainer);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
