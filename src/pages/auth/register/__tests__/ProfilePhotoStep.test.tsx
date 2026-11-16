import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfilePhotoStep from '../components/ProfilePhotoStep';

describe('ProfilePhotoStep', () => {
  it('renders the profile photo label', () => {
    render(
      <ProfilePhotoStep
        preview=""
        onFileChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/Profile Photo/i)).toBeInTheDocument();
  });

  it('shows fallback icon when no preview provided', () => {
    render(
      <ProfilePhotoStep
        preview=""
        onFileChange={vi.fn()}
      />
    );
    expect(screen.queryByRole('img', { name: /Preview/i })).not.toBeInTheDocument();
  });

  it('shows preview image when preview URL provided', () => {
    render(
      <ProfilePhotoStep
        preview="https://example.com/photo.jpg"
        onFileChange={vi.fn()}
      />
    );
    const img = screen.getByRole('img', { name: /Preview/i });
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('calls onFileChange with file when file input changes', () => {
    const onFileChange = vi.fn();
    render(
      <ProfilePhotoStep
        preview=""
        onFileChange={onFileChange}
      />
    );
    const fileInput = screen.getByLabelText(/Profile Photo/i);
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'photo.jpg')] } });
    expect(onFileChange).toHaveBeenCalledWith(expect.any(File));
  });

  it('calls onFileChange with null when file input is cleared', () => {
    const onFileChange = vi.fn();
    render(
      <ProfilePhotoStep
        preview=""
        onFileChange={onFileChange}
      />
    );
    const fileInput = screen.getByLabelText(/Profile Photo/i);
    fireEvent.change(fileInput, { target: { files: [] } });
    expect(onFileChange).toHaveBeenCalledWith(null);
  });
});