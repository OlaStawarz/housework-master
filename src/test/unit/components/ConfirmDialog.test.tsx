import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '@/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn().mockResolvedValue(undefined),
    title: "Czy na pewno?",
    description: "Tej operacji nie można cofnąć.",
  };

  it('renders correctly when open', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    // Radix AlertDialog ma rolę alertdialog
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText("Czy na pewno?")).toBeInTheDocument();
    expect(screen.getByText("Tej operacji nie można cofnąć.")).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('calls onConfirm when Confirm button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} confirmText="Usuń" />);
    
    const confirmBtn = screen.getByRole('button', { name: /usuń/i });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('shows loading state and disables buttons when isConfirming is true', () => {
    render(<ConfirmDialog {...defaultProps} isConfirming={true} confirmText="Usuń" />);
    
    // Tekst zmienia się na "Usuń..."
    const confirmBtn = screen.getByRole('button', { name: /usuń.../i }); 
    expect(confirmBtn).toBeDisabled();
    
    const cancelBtn = screen.getByRole('button', { name: /anuluj/i });
    expect(cancelBtn).toBeDisabled();
  });

  it('renders custom labels', () => {
    render(
      <ConfirmDialog 
        {...defaultProps} 
        cancelText="Wróć" 
        confirmText="Zniszcz" 
      />
    );
    
    expect(screen.getByText("Wróć")).toBeInTheDocument();
    expect(screen.getByText("Zniszcz")).toBeInTheDocument();
  });
});
