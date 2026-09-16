import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComplianceDocsStep from '../components/ComplianceDocsStep';
import { DocumentUploadItem } from '../register.types';

describe('ComplianceDocsStep', () => {
  const renderComponent = (overrides: Record<string, unknown> = {}) => {
    const documents: DocumentUploadItem[] = [
      { key: 'gra', label: 'GRA Compliance', state: null, setState: vi.fn() },
      { key: 'nis', label: 'NIS Compliance', state: null, setState: vi.fn() },
    ];
    const props = {
      title: 'Compliance Documents',
      description: 'Upload your compliance documents.',
      documents,
      ...overrides,
    };
    return render(<ComplianceDocsStep {...props} />);
  };

  it('renders the title', () => {
    renderComponent();
    expect(screen.getByText('Compliance Documents')).toBeInTheDocument();
  });

  it('renders the description', () => {
    renderComponent();
    expect(screen.getByText('Upload your compliance documents.')).toBeInTheDocument();
  });

  it('renders all document upload rows', () => {
    renderComponent();
    expect(screen.getByText('GRA Compliance')).toBeInTheDocument();
    expect(screen.getByText('NIS Compliance')).toBeInTheDocument();
  });

  it('renders Upload button for each document', () => {
    renderComponent();
    const uploads = screen.getAllByText('Upload');
    expect(uploads.length).toBeGreaterThanOrEqual(2);
  });

  it('shows filename when document is attached', () => {
    const documents: DocumentUploadItem[] = [
      { key: 'gra', label: 'GRA Compliance', state: new File(['x'], 'gra.pdf'), setState: vi.fn() },
      { key: 'nis', label: 'NIS Compliance', state: null, setState: vi.fn() },
    ];
    render({
      title: 'Compliance Documents',
      description: 'Test',
      documents,
    });
    expect(screen.getByText('gra.pdf')).toBeInTheDocument();
    expect(screen.queryByText('NIS Compliance')).toBeInTheDocument();
  });
});