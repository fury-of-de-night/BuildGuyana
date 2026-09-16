import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TradeCategoryStep from '../components/TradeCategoryStep';
import { CATEGORY_NAMES } from '@/mocks/categories';

describe('TradeCategoryStep', () => {
  const renderComponent = (overrides: Record<string, unknown> = {}) => {
    const props = {
      category: '',
      otherTradeDescription: '',
      onCategoryChange: vi.fn(),
      onOtherTradeDescriptionChange: vi.fn(),
      ...overrides,
    };
    return render(<TradeCategoryStep {...props} />);
  };

  it('renders all category options', () => {
    renderComponent();
    CATEGORY_NAMES.filter((n) => n !== 'Other Trade').forEach((cat) => {
      expect(screen.getByText(cat)).toBeInTheDocument();
    });
    expect(screen.getByText('Other Trade')).toBeInTheDocument();
  });

  it('calls onCategoryChange with empty string when placeholder selected', () => {
    const onCategoryChange = vi.fn();
    renderComponent({ onCategoryChange });
    fireEvent.change(screen.getByLabelText(/Primary Trade Category/i), { target: { value: '' } });
    expect(onCategoryChange).toHaveBeenCalledWith('');
  });

  it('calls onCategoryChange when a category is selected', () => {
    const onCategoryChange = vi.fn();
    renderComponent({ onCategoryChange });
    fireEvent.change(screen.getByLabelText(/Primary Trade Category/i), { target: { value: 'Plumbing' } });
    expect(onCategoryChange).toHaveBeenCalledWith('Plumbing');
  });

  it('clears otherTradeDescription when category changes', () => {
    const onOtherTradeDescriptionChange = vi.fn();
    renderComponent({ onOtherTradeDescriptionChange });
    fireEvent.change(screen.getByLabelText(/Primary Trade Category/i), { target: { value: 'Plumbing' } });
    expect(onOtherTradeDescriptionChange).toHaveBeenCalledWith('');
  });

  it('shows Other Trade description field when Other Trade is selected', () => {
    renderComponent({ category: 'Other Trade' });
    expect(screen.getByLabelText(/Describe Your Trade/i)).toBeInTheDocument();
  });

  it('hides Other Trade field when category is not Other Trade', () => {
    renderComponent({ category: 'Plumbing' });
    expect(screen.queryByLabelText(/Describe Your Trade/i)).not.toBeInTheDocument();
  });
});