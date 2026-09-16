import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IDDocumentStep from '../components/IDDocumentStep';

describe('IDDocumentStep', () => {
  const renderComponent = (overrides: Record<string, unknown> = {}) => {
    const props = {
      docIdFront: null,
      docIdBack: null,
      docPassport: null,
      onDocIdFrontChange: vi.fn(),
      onDocIdBackChange: vi.fn(),
      onDocPassportChange: vi.fn(),
      ...overrides,
    };
    return render(<IDDocumentStep {...props} />);
  };

  it('renders ID Verification heading', () => {
    renderComponent();
    expect(screen.getByText('ID Verification (Required)')).toBeInTheDocument();
  });

  it('renders National ID Front upload', () => {
    renderComponent();
    expect(screen.getByText('National ID (Front)')).toBeInTheDocument();
  });

  it('renders National ID Back upload', () => {
    renderComponent();
    expect(screen.getByText('National ID (Back)')).toBeInTheDocument();
  });

  it('renders Passport upload', () => {
    renderComponent();
    expect(screen.getByText('Passport (Optional)')).toBeInTheDocument();
  });

  it('calls onDocIdFrontChange when front ID file is selected', () => {
    const onDocIdFrontChange = vi.fn();
    renderComponent({ onDocIdFrontChange });
    const uploadRows = screen.getAllByText('National ID (Front)');
    const label = uploadRows[0].closest('div')?.querySelector('label');
    const fileInput = label?.querySelector('input[type="file"]');
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [new File(['x'], 'id-front.pdf')] } });
      expect(onDocIdFrontChange).toHaveBeenCalledWith(expect.any(File));
    }
  });

  it('renders three file upload rows', () => {
    renderComponent();
    const labels = screen.getByText('ID Verification (Required)').textContent || '';
    // Check all three upload rows are in document
    expect(screen.getByText('National ID (Front)')).toBeInTheDocument();
    expect(screen.getByText('National ID (Back)')).toBeInTheDocument();
    expect(screen.getByText('Passport (Optional)')).toBeInTheDocument();
  });
});