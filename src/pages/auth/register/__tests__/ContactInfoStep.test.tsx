import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContactInfoStep from '../components/ContactInfoStep';

describe('ContactInfoStep', () => {
  const renderComponent = (overrides: Record<string, unknown> = {}) => {
    const props = {
      phone: '',
      region: '',
      location: '',
      onPhoneChange: vi.fn(),
      onRegionChange: vi.fn(),
      onLocationChange: vi.fn(),
      regions: [
        { value: 'demerara-mahaica', label: 'Demerara-Mahaica' },
        { value: 'esisabato', label: 'Upper Demerara-Berbice' },
      ],
      ...overrides,
    };
    return render(<ContactInfoStep {...props} />);
  };

  it('renders WhatsApp phone input', () => {
    renderComponent();
    expect(screen.getByLabelText(/WhatsApp Number/i)).toBeInTheDocument();
  });

  it('renders Region select', () => {
    renderComponent();
    expect(screen.getByLabelText(/Region in Guyana/i)).toBeInTheDocument();
  });

  it('renders City/Town input', () => {
    renderComponent();
    expect(screen.getByLabelText(/City \/ Town/i)).toBeInTheDocument();
  });

  it('shows +592 prefix in phone input', () => {
    renderComponent();
    expect(screen.getByText('+592')).toBeInTheDocument();
  });

  it('calls onRegionChange when an option is selected', () => {
    const onRegionChange = vi.fn();
    renderComponent({ onRegionChange });
    fireEvent.change(screen.getByLabelText(/Region in Guyana/i), { target: { value: 'esisabato' } });
    expect(onRegionChange).toHaveBeenCalledWith('esisabato');
  });

  it('calls onLocationChange when typing a city', () => {
    const onLocationChange = vi.fn();
    renderComponent({ onLocationChange });
    fireEvent.change(screen.getByLabelText(/City \/ Town/i), { target: { value: 'Georgetown' } });
    expect(onLocationChange).toHaveBeenCalledWith('Georgetown');
  });
});