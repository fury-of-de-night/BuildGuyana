import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TradeLicenseStep from '../components/TradeLicenseStep';

describe('TradeLicenseStep', () => {
  it('renders nothing when category is not a regulated trade', () => {
    const { container } = render(
      <TradeLicenseStep
        category="Plumbing Installation"
        tradeLicenseNumber=""
        tradeLicenseDoc={null}
        regulatedTrades={['Electrical Work', 'Plumbing']}
        onNumberChange={vi.fn()}
        onDocChange={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders trade license fields when category is regulated', () => {
    render(
      <TradeLicenseStep
        category="Electrical Work"
        tradeLicenseNumber=""
        tradeLicenseDoc={null}
        regulatedTrades={['Electrical Work', 'Plumbing']}
        onNumberChange={vi.fn()}
        onDocChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/Trade License Number/i)).toBeInTheDocument();
  });

  it('renders nothing when category is Plumbing but not in regulatedTrades', () => {
    const { container } = render(
      <TradeLicenseStep
        category="Plumbing"
        tradeLicenseNumber=""
        tradeLicenseDoc={null}
        regulatedTrades={['Electrical Work']}
        onNumberChange={vi.fn()}
        onDocChange={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls onNumberChange when typing a license number', () => {
    const onNumberChange = vi.fn();
    render(
      <TradeLicenseStep
        category="Electrical Work"
        tradeLicenseNumber=""
        tradeLicenseDoc={null}
        regulatedTrades={['Electrical Work', 'Plumbing']}
        onNumberChange={onNumberChange}
        onDocChange={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText(/Trade License Number/i), { target: { value: 'TL-2024-12345' } });
    expect(onNumberChange).toHaveBeenCalledWith('TL-2024-12345');
  });

  it('calls onDocChange when selecting a trade license file', () => {
    const onDocChange = vi.fn();
    render(
      <TradeLicenseStep
        category="Electrical Work"
        tradeLicenseNumber=""
        tradeLicenseDoc={null}
        regulatedTrades={['Electrical Work', 'Plumbing']}
        onNumberChange={vi.fn()}
        onDocChange={onDocChange}
      />
    );
    const fileInput = screen.getByLabelText(/Trade License Document/i);
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'license.pdf')] } });
    expect(onDocChange).toHaveBeenCalledWith(expect.any(File));
  });
});