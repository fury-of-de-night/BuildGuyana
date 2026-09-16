import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BusinessTypeStep from '../components/BusinessTypeStep';

describe('BusinessTypeStep', () => {
  const renderComponent = (overrides: Record<string, unknown> = {}) => {
    const props = {
      businessType: '',
      onBusinessTypeChange: vi.fn(),
      companyName: '',
      onCompanyNameChange: vi.fn(),
      ...overrides,
    };
    return render(<BusinessTypeStep {...props} />);
  };

  it('renders both business type options', () => {
    renderComponent();
    expect(screen.getByText('Sole Proprietor')).toBeInTheDocument();
    expect(screen.getByText('Registered Company')).toBeInTheDocument();
  });

  it('highlights Sole Proprietor when selected', () => {
    renderComponent({ businessType: 'sole_proprietor' });
    const btn = screen.getByText('Sole Proprietor').closest('button');
    expect(btn).toHaveClass('border-primary-500');
    expect(btn).toHaveClass('bg-primary-50');
  });

  it('highlights Registered Company when selected', () => {
    renderComponent({ businessType: 'registered_company' });
    const btn = screen.getByText('Registered Company').closest('button');
    expect(btn).toHaveClass('border-primary-500');
    expect(btn).toHaveClass('bg-primary-50');
  });

  it('calls onBusinessTypeChange when Sole Proprietor is clicked', () => {
    const onBusinessTypeChange = vi.fn();
    renderComponent({ onBusinessTypeChange });
    fireEvent.click(screen.getByText('Sole Proprietor'));
    expect(onBusinessTypeChange).toHaveBeenCalledWith('sole_proprietor');
  });

  it('calls onBusinessTypeChange when Registered Company is clicked', () => {
    const onBusinessTypeChange = vi.fn();
    renderComponent({ onBusinessTypeChange });
    fireEvent.click(screen.getByText('Registered Company'));
    expect(onBusinessTypeChange).toHaveBeenCalledWith('registered_company');
  });

  it('shows Company Name input when businessType is registered_company', () => {
    renderComponent({ businessType: 'registered_company' });
    expect(screen.getByLabelText(/Company \/ Organization Name/i)).toBeInTheDocument();
  });

  it('hides Company Name input when businessType is sole_proprietor', () => {
    renderComponent({ businessType: 'sole_proprietor' });
    expect(screen.queryByLabelText(/Company \/ Organization Name/i)).not.toBeInTheDocument();
  });

  it('shows placeholder when no business type selected', () => {
    renderComponent({ businessType: '' });
    expect(screen.getByText(/Please select your business type to continue/i)).toBeInTheDocument();
  });
});