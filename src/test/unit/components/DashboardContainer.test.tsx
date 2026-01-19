import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardContainer } from '@/components/DashboardContainer';

// Mock hooków
vi.mock('@/components/hooks/useDashboardTasks', () => ({
  useDashboardTasks: vi.fn(),
}));

vi.mock('@/components/hooks/useTaskMutations', () => ({
  useTaskMutations: vi.fn(() => ({
    completeTask: vi.fn(),
    postponeTask: vi.fn(),
  })),
}));

// Mock komponentów podrzędnych
vi.mock('@/components/OnboardingState', () => ({
  OnboardingState: ({ onCreateSpace }: any) => (
    <div data-testid="onboarding-state">
      <button onClick={onCreateSpace}>Utwórz przestrzeń</button>
    </div>
  ),
}));

vi.mock('@/components/EmptyTasksState', () => ({
  EmptyTasksState: () => <div data-testid="empty-tasks-state">Brak zadań</div>,
}));

vi.mock('@/components/TaskCard', () => ({
  TaskCard: ({ task }: any) => <div data-testid="task-card">{task.name}</div>,
}));

vi.mock('@/components/TasksLoadingSkeleton', () => ({
  TasksLoadingSkeleton: () => <div data-testid="loading-skeleton">Loading...</div>,
}));

// Mock fetch globalnie
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Import hooków do mockowania implementacji
import { useDashboardTasks } from '@/components/hooks/useDashboardTasks';

describe('DashboardContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    
    // Domyślny mock dla useDashboardTasks (zwraca puste dane)
    (useDashboardTasks as any).mockReturnValue({
      tasks: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      loadMore: vi.fn(),
      hasMore: false,
      isLoadingMore: false,
    });
  });

  it('renders loading skeleton when checking spaces', () => {
    // Fetch jeszcze nie wrócił (Promise pending)
    fetchMock.mockReturnValue(new Promise(() => {}));
    
    render(<DashboardContainer />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders OnboardingState when user has no spaces', async () => {
    // Mock fetch zwracający brak przestrzeni
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    render(<DashboardContainer />);
    
    await waitFor(() => {
      expect(screen.getByTestId('onboarding-state')).toBeInTheDocument();
    });
  });

  it('renders EmptyTasksState when user has spaces but no tasks', async () => {
    // Mock fetch zwracający przestrzenie
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: 's1' }] }),
    });

    render(<DashboardContainer />);
    
    await waitFor(() => {
      expect(screen.getByTestId('empty-tasks-state')).toBeInTheDocument();
    });
  });

  it('renders tasks sections when tasks are available', async () => {
    // Mock fetch zwracający przestrzenie
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: 's1' }] }),
    });

    // Mock useDashboardTasks dla różnych wywołań (overdue, today, upcoming)
    (useDashboardTasks as any).mockImplementation(({ section }: any) => {
      if (section === 'overdue') {
        return {
          tasks: [{ id: 't1', name: 'Zaległe zadanie' }],
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        };
      }
      if (section === 'today') {
        return {
          tasks: [{ id: 't2', name: 'Dzisiejsze zadanie' }],
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        };
      }
      if (section === 'upcoming') {
        return {
          tasks: [{ id: 't3', name: 'Przyszłe zadanie' }],
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        };
      }
      return { tasks: [], isLoading: false };
    });

    render(<DashboardContainer />);
    
    await waitFor(() => {
      expect(screen.getByText('Zaległe (1)')).toBeInTheDocument();
      expect(screen.getByText('Zaległe zadanie')).toBeInTheDocument();
      expect(screen.getByText('Dzisiaj (1)')).toBeInTheDocument();
      expect(screen.getByText('Dzisiejsze zadanie')).toBeInTheDocument();
      expect(screen.getByText('Nadchodzące (1)')).toBeInTheDocument();
      expect(screen.getByText('Przyszłe zadanie')).toBeInTheDocument();
    });
  });

  it('handles error state in tasks', async () => {
    // Mock fetch zwracający przestrzenie
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: 's1' }] }),
    });

    (useDashboardTasks as any).mockImplementation(({ section }: any) => {
      if (section === 'overdue') {
        return {
          tasks: [],
          isLoading: false,
          error: "Błąd pobierania",
          refetch: vi.fn(),
        };
      }
      if (section === 'today') {
        return {
          tasks: [],
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        };
      }
      // Dodajemy zadanie tutaj, aby hasNoTasks było false
      if (section === 'upcoming') {
        return {
          tasks: [{ id: 't2', name: 'Zadanie' }],
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        };
      }
      return { tasks: [], isLoading: false };
    });

    render(<DashboardContainer />);
    
    await waitFor(() => {
      expect(screen.getByText('Błąd pobierania')).toBeInTheDocument();
    });
  });

  it('renders only Today section when only today tasks exist', async () => {
    // Mock fetch zwracający przestrzenie
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: 's1' }] }),
    });

    (useDashboardTasks as any).mockImplementation(({ section }: any) => {
      if (section === 'today') {
        return {
          tasks: [{ id: 't1', name: 'Zadanie na dzisiaj' }],
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        };
      }
      return { 
        tasks: [], 
        isLoading: false, 
        error: null, 
        refetch: vi.fn() 
      };
    });

    render(<DashboardContainer />);
    
    await waitFor(() => {
      expect(screen.getByText('Dzisiaj (1)')).toBeInTheDocument();
      expect(screen.getByText('Zadanie na dzisiaj')).toBeInTheDocument();
      expect(screen.queryByText(/Zaległe/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Nadchodzące/)).not.toBeInTheDocument();
    });
  });
});

