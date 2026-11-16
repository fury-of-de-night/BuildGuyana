import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RoleSelectionStep from '../components/RoleSelectionStep';

describe('RoleSelectionStep', () => {
  const renderComponent = (role: import('../register.types').Role = 'project_owner', onRoleChange = vi.fn()) =>
    render(<RoleSelectionStep role={role} onRoleChange={onRoleChange} />);

  it('renders both role options', () => {
    renderComponent();
    expect(screen.getByText('Project Owner')).toBeInTheDocument();
    expect(screen.getByText('Tradesperson')).toBeInTheDocument();
  });

  it('highlights Project Owner when role is project_owner', () => {
    renderComponent('project_owner');
    const ownerBtn = screen.getByText('Project Owner').closest('button');
    expect(ownerBtn).toHaveClass('border-primary-500');
    expect(ownerBtn).toHaveClass('bg-primary-50');
  });

  it('highlights Tradesperson when role is tradesperson', () => {
    renderComponent('tradesperson');
    const tradeBtn = screen.getByText('Tradesperson').closest('button');
    expect(tradeBtn).toHaveClass('border-primary-500');
    expect(tradeBtn).toHaveClass('bg-primary-50');
  });

  it('calls onRoleChange when Project Owner is clicked', () => {
    const onRoleChange = vi.fn();
    renderComponent('tradesperson', onRoleChange);
    fireEvent.click(screen.getByText('Project Owner'));
    expect(onRoleChange).toHaveBeenCalledWith('project_owner');
  });

  it('calls onRoleChange when Tradesperson is clicked', () => {
    const onRoleChange = vi.fn();
    renderComponent('project_owner', onRoleChange);
    fireEvent.click(screen.getByText('Tradesperson'));
    expect(onRoleChange).toHaveBeenCalledWith('tradesperson');
  });
});