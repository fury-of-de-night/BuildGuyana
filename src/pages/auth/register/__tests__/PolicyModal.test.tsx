import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PolicyModal from '../components/PolicyModal';

describe('PolicyModal', () => {
  const renderComponent = (isOpen = false, policyTexts = { privacy: '', cookie: '' }, policyActive = { privacy: false, cookie: false }, onAccept = vi.fn()) => {
    return render(<PolicyModal
      isOpen={isOpen}
      policyTexts={policyTexts}
      policyActive={policyActive}
      onAccept={onAccept}
    />);
  };

  it('renders nothing when isOpen is false', () => {
    renderComponent(false);
    expect(screen.queryByText('Updated Policies')).not.toBeInTheDocument();
  });

  it('renders policy content when policyActive is true', () => {
    renderComponent(true, { privacy: 'Privacy text', cookie: 'Cookie text' }, { privacy: true, cookie: true });
    expect(screen.getByText('Updated Policies')).toBeInTheDocument();
    expect(screen.getByText('Privacy Notice')).toBeInTheDocument();
    expect(screen.getByText('Cookie Policy')).toBeInTheDocument();
  });

  it('shows message when no policy content is available', () => {
    renderComponent(true, { privacy: '', cookie: '' }, { privacy: false, cookie: false });
    expect(screen.getByText(/No policy content is currently available/i)).toBeInTheDocument();
  });

  it('calls onAccept when Agree button is clicked', () => {
    const onAccept = vi.fn();
    renderComponent(true, { privacy: '', cookie: '' }, { privacy: false, cookie: false }, onAccept);
    fireEvent.click(screen.getByText('Agree'));
    expect(onAccept).toHaveBeenCalled();
  });

  it('shows Accepting... state when policyAccepting is true', () => {
    renderComponent(true, { privacy: '', cookie: '' }, { privacy: false, cookie: false }, () => {});
    const button = screen.getByText('Agree');
    // Simulate the button state change
    fireEvent.click(button);
    expect(button).toHaveTextContent('Accepting...');
  });
});