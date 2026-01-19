import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '@/components/TaskCard';
import type { TaskDto } from '@/types';
import { toast } from 'sonner';

// 1. Mockowanie modułów zewnętrznych (Factory Pattern)
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mockujemy komponent podrzędny, aby nie testować jego wewnętrznej logiki tutaj
vi.mock('@/components/motivational/MotivationalMessageText', () => ({
  MotivationalMessageText: () => <div data-testid="motivational-message">Message</div>,
}));

// 2. Helper do tworzenia obiektów testowych
const createMockTask = (overrides?: Partial<TaskDto>): TaskDto => ({
  id: 'task-123',
  name: 'Test Task',
  space_id: 'space-1',
  due_date: new Date().toISOString(),
  status: 'pending',
  recurrence_unit: 'days',
  recurrence_value: 1,
  postponement_count: 0,
  last_completed_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_id: 'user-1',
  space: {
    id: 'space-1',
    name: 'Test Space',
    space_type: 'living_room',
    icon: '🏠'
  },
  ...overrides,
});

describe('TaskCard', () => {
  // Ustawiamy "Dzisiaj" na stałą datę: 15 Stycznia 2024, 12:00
  const FIXED_DATE = new Date('2026-01-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering & Date Logic', () => {
    it('renders task name correctly', () => {
      const task = createMockTask({ name: 'Mycie okien' });
      render(
        <TaskCard 
          task={task} 
          onComplete={vi.fn()} 
          onPostpone={vi.fn()} 
          onEdit={vi.fn()} 
          onDelete={vi.fn()} 
        />
      );
      
      expect(screen.getByText('Mycie okien')).toBeInTheDocument();
    });

    it('renders "Dzisiaj" for current date with sky-colored badge', () => {
      const task = createMockTask({ due_date: FIXED_DATE.toISOString() });
      render(
        <TaskCard 
          task={task} 
          onComplete={vi.fn()} 
          onPostpone={vi.fn()} 
          onEdit={vi.fn()} 
          onDelete={vi.fn()} 
        />
      );

      const badge = screen.getByText('Dzisiaj');
      expect(badge).toBeInTheDocument();
      // Zadania na dzisiaj powinny mieć niebieski (sky) styl
      expect(badge).toHaveClass('bg-sky-100');
      expect(badge).toHaveClass('text-sky-700');
    });

    it('renders today task card with sky-colored background', () => {
      const task = createMockTask({ due_date: FIXED_DATE.toISOString() });
      render(
        <TaskCard 
          task={task} 
          onComplete={vi.fn()} 
          onPostpone={vi.fn()} 
          onEdit={vi.fn()} 
          onDelete={vi.fn()} 
        />
      );

      // Karta powinna mieć niebieskie tło dla zadań na dzisiaj
      const card = screen.getByTestId('task-card-Test Task');
      expect(card).toHaveClass('bg-sky-50');
    });

    it('renders "Jutro" for next day', () => {
      const tomorrow = new Date(FIXED_DATE);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const task = createMockTask({ due_date: tomorrow.toISOString() });
      render(
        <TaskCard 
          task={task} 
          onComplete={vi.fn()} 
          onPostpone={vi.fn()} 
          onEdit={vi.fn()} 
          onDelete={vi.fn()} 
        />
      );

      expect(screen.getByText('Jutro')).toBeInTheDocument();
    });

    it('renders "Za X dni" for future dates', () => {
      const future = new Date(FIXED_DATE);
      future.setDate(future.getDate() + 5);
      
      const task = createMockTask({ due_date: future.toISOString() });
      render(
        <TaskCard 
          task={task} 
          onComplete={vi.fn()} 
          onPostpone={vi.fn()} 
          onEdit={vi.fn()} 
          onDelete={vi.fn()} 
        />
      );

      expect(screen.getByText(/Za 5 dni/i)).toBeInTheDocument();
    });

    it('renders "X dni temu" for overdue tasks (days unit)', () => {
      const past = new Date(FIXED_DATE);
      past.setDate(past.getDate() - 3);
      
      const task = createMockTask({ 
        due_date: past.toISOString(),
        recurrence_unit: 'days' 
      });
      
      render(
        <TaskCard 
          task={task} 
          onComplete={vi.fn()} 
          onPostpone={vi.fn()} 
          onEdit={vi.fn()} 
          onDelete={vi.fn()} 
        />
      );

      expect(screen.getByText(/3 dni temu/i)).toBeInTheDocument();
      // Zadania przeterminowane powinny mieć klasę destructive
      expect(screen.getByText(/3 dni temu/i)).toHaveClass('text-destructive');
    });

    it('renders "Miesiąc temu" for overdue tasks > 28 days (months unit)', () => {
      const past = new Date(FIXED_DATE);
      past.setDate(past.getDate() - 30); // 30 dni temu
      
      const task = createMockTask({ 
        due_date: past.toISOString(),
        recurrence_unit: 'months' 
      });
      
      render(
        <TaskCard 
          task={task} 
          onComplete={vi.fn()} 
          onPostpone={vi.fn()} 
          onEdit={vi.fn()} 
          onDelete={vi.fn()} 
        />
      );

      // Logika biznesowa: jeśli recurrenceUnit to 'months', pokazujemy "Miesiąc temu" zamiast "30 dni temu"
      expect(screen.getByText('Miesiąc temu')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onComplete when checkbox is clicked', () => {
      const onComplete = vi.fn();
      const task = createMockTask();
      
      render(
        <TaskCard 
          task={task} 
          onComplete={onComplete} 
          onPostpone={vi.fn()} 
          onEdit={vi.fn()} 
          onDelete={vi.fn()} 
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith(task.id);
    });

    it('calls onDelete when delete button is clicked', () => {
      const onDelete = vi.fn();
      const task = createMockTask();
      
      render(
        <TaskCard 
          task={task} 
          onComplete={vi.fn()} 
          onPostpone={vi.fn()} 
          onEdit={vi.fn()} 
          onDelete={onDelete} 
        />
      );

      const deleteBtn = screen.getByText('Usuń');
      fireEvent.click(deleteBtn);

      expect(onDelete).toHaveBeenCalledWith(task.id);
    });
  });

  describe('Business Rule: Postpone Limit', () => {
    // Przycisk "Zrobię to jutro" pojawia się TYLKO gdy zadanie jest przeterminowane
    const setupOverdueTask = (postponement_count: number) => {
      const past = new Date(FIXED_DATE);
      past.setDate(past.getDate() - 1); // Wczoraj
      
      return createMockTask({ 
        due_date: past.toISOString(),
        postponement_count
      });
    };

    it('allows postpone if limit not reached (count < 3)', () => {
      const onPostpone = vi.fn();
      const task = setupOverdueTask(2); // Limit jeszcze nie osiągnięty
      
      render(
        <TaskCard 
          task={task} 
          onComplete={vi.fn()} 
          onPostpone={onPostpone} 
          onEdit={vi.fn()} 
          onDelete={vi.fn()} 
        />
      );

      const postponeBtn = screen.getByText('Zrobię to jutro');
      expect(postponeBtn).not.toBeDisabled();
      
      fireEvent.click(postponeBtn);
      
      expect(onPostpone).toHaveBeenCalledWith(task.id);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('blocks postpone if limit reached (count >= 3)', () => {
      const onPostpone = vi.fn();
      const task = setupOverdueTask(3); // Limit osiągnięty
      
      render(
        <TaskCard 
          task={task} 
          onComplete={vi.fn()} 
          onPostpone={onPostpone} 
          onEdit={vi.fn()} 
          onDelete={vi.fn()} 
        />
      );

      const postponeBtn = screen.getByText('Zrobię to jutro');
      
      // Sprawdzenie wizualne - przycisk powinien być jakoś oznaczony (klasa opacity-50 w kodzie)
      expect(postponeBtn).toHaveClass('opacity-50');
      
      fireEvent.click(postponeBtn);
      
      // Kluczowe asercje biznesowe:
      expect(onPostpone).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('3 razy'));
      
      // Sprawdzenie czy komunikat o limicie jest widoczny w UI
      expect(screen.getByText('Zadanie przełożone 3 razy!')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('renders space name when showSpaceName is true', () => {
      const task = createMockTask({ 
        space: { id: 's1', name: 'Kuchnia', icon: '🏠', space_type: 'kitchen' } 
      });
      
      render(
        <TaskCard 
          task={task} 
          onComplete={vi.fn()} 
          onPostpone={vi.fn()} 
          onEdit={vi.fn()} 
          onDelete={vi.fn()} 
          showSpaceName={true}
        />
      );

      expect(screen.getByText('(Kuchnia)')).toBeInTheDocument();
    });

    it('hides actions when hideActions is true', () => {
      const task = createMockTask();
      
      render(
        <TaskCard 
          task={task} 
          onComplete={vi.fn()} 
          onPostpone={vi.fn()} 
          onEdit={vi.fn()} 
          onDelete={vi.fn()} 
          hideActions={true}
        />
      );

      expect(screen.queryByText('Edytuj')).not.toBeInTheDocument();
      expect(screen.queryByText('Usuń')).not.toBeInTheDocument();
    });
  });
});

