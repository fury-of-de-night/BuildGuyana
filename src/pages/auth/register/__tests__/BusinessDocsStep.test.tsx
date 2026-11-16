import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BusinessDocsStep from '../components/BusinessDocsStep';

describe('BusinessDocsStep', () => {
  const renderComponent = (overrides: Record<string, unknown> = {}) => {
    const props = {
      docBusinessReg: null,
      directorIdFiles: [null, null, null] as File[],
      onDocBusinessRegChange: vi.fn(),
      onDirectorFileChange: vi.fn(),
      ...overrides,
    };
    return render(<BusinessDocsStep {...props} />);
  };

  it('renders Business Registration document upload', () => {
    renderComponent();
    expect(screen.getByText('Business Registration Document')).toBeInTheDocument();
  });

  it('renders Directors / Owners IDs section', () => {
    renderComponent();
    expect(screen.getByText(/Directors \/ Owners IDs/i)).toBeInTheDocument();
  });

  it('renders three director ID upload slots', () => {
    renderComponent();
    expect(screen.getAllByText(/Director \d+ ID/)).toHaveLength(3);
  });

  it('calls onDocBusinessRegChange when business reg file is selected', () => {
    const onDocBusinessRegChange = vi.fn();
    renderComponent({ onDocBusinessRegChange });
    const fileInput = screen.getByLabelText('Business Registration Document');
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'biz-reg.pdf')] } });
    expect(onDocBusinessRegChange).toHaveBeenCalledWith(expect.any(File));
  });

  it('calls onDirectorFileChange when a director ID is selected', () => {
    const onDirectorFileChange = vi.fn();
    renderComponent({ onDirectorFileChange });
    const fileInput = screen.getByLabelText('Director 1 ID');
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'id.pdf')] } });
    expect(onDirectorFileChange).toHaveBeenCalledWith(0, expect.any(File));
  });
});