import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExperienceStep from '../components/ExperienceStep';

describe('ExperienceStep', () => {
  const renderComponent = (overrides: Record<string, unknown> = {}) => {
    const props = {
      yearsExperience: '',
      onYearsExperienceChange: vi.fn(),
      ...overrides,
    };
    return render(<ExperienceStep {...props} />);
  };

  it('renders Years of Experience label', () => {
    renderComponent();
    expect(screen.getByLabelText(/Years of Experience/i)).toBeInTheDocument();
  });

  it('renders number input with min/max attributes', () => {
    renderComponent();
    const input = screen.getByLabelText(/Years of Experience/i);
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '60');
  });

  it('calls onYearsExperienceChange on input change', () => {
    const onYearsExperienceChange = vi.fn();
    renderComponent({ onYearsExperienceChange });
    fireEvent.change(screen.getByLabelText(/Years of Experience/i), { target: { value: '5' } });
    expect(onYearsExperienceChange).toHaveBeenCalledWith('5');
  });

  it('shows placeholder text', () => {
    renderComponent();
    expect(screen.getByLabelText(/Years of Experience/i)).toHaveAttribute('placeholder', 'e.g. 5');
  });
});