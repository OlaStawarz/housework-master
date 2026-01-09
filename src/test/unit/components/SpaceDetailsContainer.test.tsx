import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpaceDetailsContainer } from '@/components/SpaceDetailsContainer';

// Mock hooków
vi.mock('@/components/hooks/useSpace', () => ({
  useSpace: vi.fn(),
}));

vi.mock('@/components/hooks/useTasks', () => ({
  useTasks: vi.fn(),
}));

vi.mock('@/components/hooks/useDeleteSpace', () => ({
  useDeleteSpace: vi.fn(() => ({
    deleteSpace: vi.fn(),
    isDeleting: false,
  })),
}));

vi.mock('@/components/hooks/useTaskMutations', () => ({
  useTaskMutations: vi.fn(() => ({
    completeTask: vi.fn(),
    postponeTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    isDeletingTask: false,
  })),
}));

// Mock komponentów
vi.mock('@/components/SpaceHeader', () => ({
  SpaceHeader: ({ space, onAddTask }: any) => (
    <div data-testid="space-header">
      <h1>{space.name}</h1>
      <button onClick={onAddTask}>Dodaj zadanie</button>
    </div>
  ),
}));

vi.mock('@/components/RecurrenceGroup', () => ({
  RecurrenceGroup: ({ title, tasks }: any) => (
    <div data-testid="recurrence-group">
      <h2>{title}</h2>
      {tasks.map((t: any) => <div key={t.id}>{t.name}</div>)}
    </div>
  ),
}));

vi.mock('@/components/EmptySpaceState', () => ({
  EmptySpaceState: () => <div data-testid="empty-space-state">Pusto tu</div>,
}));

vi.mock('@/components/TasksLoadingSkeleton', () => ({
  TasksLoadingSkeleton: () => <div data-testid="loading-skeleton">Loading...</div>,
}));

vi.mock('@/components/CreateTaskModal', () => ({
  CreateTaskModal: ({ isOpen }: any) => isOpen ? <div data-testid="create-task-modal">Modal</div> : null,
}));

// Importy hooków do mockowania
import { useSpace } from '@/components/hooks/useSpace';
import { useTasks } from '@/components/hooks/useTasks';

describe('SpaceDetailsContainer', () => {
  const mockSpace = {
    id: 's1',
    name: 'Salon',
    space_type: 'living_room',
    icon: 'couch',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Domyślne mocki
    (useSpace as any).mockReturnValue({
      space: mockSpace,
      isLoading: false,
      error: null,
    });

    (useTasks as any).mockReturnValue({
      tasks: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('renders loading state when space is loading', () => {
    (useSpace as any).mockReturnValue({
      space: null,
      isLoading: true,
      error: null,
    });

    render(<SpaceDetailsContainer spaceId="s1" />);
    // W SpaceDetailsContainer loading space jest ręcznie robiony (divy z animate-pulse)
    // Sprawdzamy brak nagłówka
    expect(screen.queryByTestId('space-header')).not.toBeInTheDocument();
  });

  it('renders error when space not found', () => {
    (useSpace as any).mockReturnValue({
      space: null,
      isLoading: false,
      error: "Nie znaleziono",
    });

    render(<SpaceDetailsContainer spaceId="s1" />);
    
    expect(screen.getByText('Nie znaleziono')).toBeInTheDocument();
    expect(screen.getByText('Wróć do listy przestrzeni')).toBeInTheDocument();
  });

  it('renders EmptySpaceState when no tasks (EMPTY STATE TEST)', () => {
    // Domyślny mock zwraca tasks: []
    render(<SpaceDetailsContainer spaceId="s1" />);
    
    expect(screen.getByTestId('space-header')).toBeInTheDocument();
    expect(screen.getByTestId('empty-space-state')).toBeInTheDocument();
  });

  it('renders RecurrenceGroup when tasks exist', () => {
    (useTasks as any).mockReturnValue({
      tasks: [
        { 
          id: 't1', 
          name: 'Zadanie 1', 
          recurrence_value: 1, 
          recurrence_unit: 'days',
          status: 'pending' 
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<SpaceDetailsContainer spaceId="s1" />);
    
    expect(screen.getByTestId('recurrence-group')).toBeInTheDocument();
    expect(screen.getByText('Zadanie 1')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-space-state')).not.toBeInTheDocument();
  });

  it('opens CreateTaskModal when add button is clicked', () => {
    render(<SpaceDetailsContainer spaceId="s1" />);
    
    const addBtn = screen.getByText('Dodaj zadanie');
    fireEvent.click(addBtn);
    
    expect(screen.getByTestId('create-task-modal')).toBeInTheDocument();
  });
});

