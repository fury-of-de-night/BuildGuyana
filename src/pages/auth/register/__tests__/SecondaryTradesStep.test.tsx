import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SecondaryTradesStep from '../components/SecondaryTradesStep';
import { CATEGORY_NAMES } from '@/mocks/categories';

describe('SecondaryTradesStep', () => {
  const renderComponent = (overrides: Record<string, unknown> = {}) => {
    const props = {
      secondaryTrades: [] as string[],
      secondaryDropdownOpen: false,
      selectedCategory: '',
      maxSecondaryTrades: 3,
      onToggleTrade: vi.fn(),
      onDropdownToggle: vi.fn(),
      ...overrides,
    };
    return render(<SecondaryTradesStep {...props} />);
  };

  it('renders the dropdown toggle button', () => {
    renderComponent();
    expect(screen.getByText('Select additional trades...')).toBeInTheDocument();
  });

  it('shows selected count when trades are selected', () => {
    renderComponent({ secondaryTrades: ['Plumbing', 'Electrical Work'] });
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('shows max-sub reached badge for unselected trades at limit', () => {
    const secondTrades = CATEGORY_NAMES.slice(0, 3);
    renderComponent({ secondaryTrades: secondTrades, selectedCategory: '' });
    // Each unselected trade at limit should show max-reached chip
    const maxReached = screen.getAllByText('max reached');
    expect(maxReached.length).toBeGreaterThan(0);
  });

  it('calls onDropdownToggle when dropdown toggle is clicked', () => {
    const onDropdownToggle = vi.fn();
    renderComponent({ onDropdownToggle });
    fireEvent.click(screen.getByText('Select additional trades...'));
    expect(onDropdownToggle).toHaveBeenCalled();
  });

  it('calls onToggleTrade when an option is clicked', () => {
    const onToggleTrade = vi.fn();
    renderComponent({ selectedCategory: '', onToggleTrade });
    const firstTrade = CATEGORY_NAMES[0];
    // Open dropdown by clicking toggle
    fireEvent.click(screen.getByText('Select additional trades...'));
    fireEvent.click(screen.getByText(firstTrade));
    expect(onToggleTrade).toHaveBeenCalledWith(firstTrade);
  });
});