import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateTaskModal } from '@/components/CreateTaskModal';

// Mock RecurrenceInputs - upraszczamy, by łatwo sterować wartościami i sprawdzać propsy
vi.mock('@/components/RecurrenceInputs', () => ({
  RecurrenceInputs: ({ value, onValueChange, unit, onUnitChange, valueError }: any) => (
    <div data-testid="recurrence-mock">
      <input 
        data-testid="rec-value-input"
        type="number"
        value={value} 
        onChange={(e) => onValueChange(e.target.value === '' ? '' : Number(e.target.value))} 
      />
      <select 
        data-testid="rec-unit-select"
        value={unit} 
        onChange={(e) => onUnitChange(e.target.value)}
      >
        <option value="days">days</option>
        <option value="months">months</option>
      </select>
      {valueError && <div role="alert" data-testid="rec-error">{valueError}</div>}
    </div>
  )
}));

// Mock fetch globalnie
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('CreateTaskModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    spaceId: '123e4567-e89b-12d3-a456-426614174000', // Prawidłowe UUID dla walidacji Zod
    onTaskCreated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
  });

  it('renders correctly when open', () => {
    render(<CreateTaskModal {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Dodaj nowe zadanie')).toBeInTheDocument();
    expect(screen.getByLabelText(/nazwa zadania/i)).toBeInTheDocument();
    expect(screen.getByTestId('recurrence-mock')).toBeInTheDocument();
  });

  it('validates form on submit (empty name)', async () => {
    render(<CreateTaskModal {...defaultProps} />);

    // Próbujemy wysłać pusty formularz
    const submitBtn = screen.getByRole('button', { name: /utwórz/i });
    fireEvent.click(submitBtn);

    // Oczekujemy komunikatu błędu (tekst zależy od Zod schema w tasks.ts)
    await waitFor(() => {
      expect(screen.getByText(/nazwa zadania jest wymagana/i)).toBeInTheDocument();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('validates form on submit (empty recurrence value)', async () => {
    render(<CreateTaskModal {...defaultProps} />);

    // Wpisz nazwę zadania
    const nameInput = screen.getByLabelText(/nazwa zadania/i);
    fireEvent.change(nameInput, { target: { value: 'Testowe zadanie' } });

    // Zostaw pustą wartość cykliczności (domyślnie powinna być 1, więc ją wyczyść)
    const recValueInput = screen.getByTestId('rec-value-input');
    fireEvent.change(recValueInput, { target: { value: '' } });

    // Próbujemy wysłać formularz
    const submitBtn = screen.getByRole('button', { name: /utwórz/i });
    fireEvent.click(submitBtn);

    // Oczekujemy komunikatu błędu dla pustej wartości cykliczności
    await waitFor(() => {
      expect(screen.getByText(/wartość musi być liczbą większą od 0/i)).toBeInTheDocument();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits form with correct data', async () => {
    // Mock sukcesu API
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'new-task-1', name: 'Nowe zadanie' }),
    });

    render(<CreateTaskModal {...defaultProps} />);
    
    // Wpisz nazwę
    const nameInput = screen.getByLabelText(/nazwa zadania/i);
    fireEvent.change(nameInput, { target: { value: 'Nowe zadanie' } });
    
    // Zmień cykliczność (przez mocka)
    const valInput = screen.getByTestId('rec-value-input');
    fireEvent.change(valInput, { target: { value: '3' } });
    
    const unitSelect = screen.getByTestId('rec-unit-select');
    fireEvent.change(unitSelect, { target: { value: 'months' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /utwórz/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        space_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Nowe zadanie',
        recurrence_value: 3,
        recurrence_unit: 'months'
      })
    }));

    expect(defaultProps.onTaskCreated).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles API error (409 Conflict)', async () => {
    // Mock błędu 409
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: 'Conflict' }),
    });

    render(<CreateTaskModal {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/nazwa zadania/i), { target: { value: 'Duplikat' } });
    
    const submitBtn = screen.getByRole('button', { name: /utwórz/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Zadanie o tej nazwie już istnieje w tej przestrzeni')).toBeInTheDocument();
    });
    
    expect(defaultProps.onTaskCreated).not.toHaveBeenCalled();
  });

  it('handles generic API error', async () => {
    // Mock błędu 500
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server exploded' }),
    });

    render(<CreateTaskModal {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/nazwa zadania/i), { target: { value: 'Błąd' } });
    
    const submitBtn = screen.getByRole('button', { name: /utwórz/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Server exploded')).toBeInTheDocument();
    });
  });
});

