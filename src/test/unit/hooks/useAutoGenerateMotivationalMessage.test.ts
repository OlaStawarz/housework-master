import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAutoGenerateMotivationalMessage, isAutoGenerateWindowOpen } from '@/components/hooks/useAutoGenerateMotivationalMessage';

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('useAutoGenerateMotivationalMessage', () => {
  const TODAY = new Date('2026-05-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(TODAY);
    vi.clearAllMocks();
    fetchMock.mockReset();
    
    fetchMock.mockResolvedValue({
      status: 201,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    taskId: 'task-1',
    taskName: 'Mycie okien',
    taskDueDate: TODAY.toISOString(),
    latestMessage: null,
    latestStatus: 'empty' as const,
    enabled: true,
    onGenerated: vi.fn(),
  };

  describe('isAutoGenerateWindowOpen logic', () => {
    it('returns true if due date is today', () => {
      expect(isAutoGenerateWindowOpen(TODAY.toISOString())).toBe(true);
    });

    it('returns true if due date was yesterday', () => {
      const yesterday = new Date(TODAY);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isAutoGenerateWindowOpen(yesterday.toISOString())).toBe(true);
    });

    it('returns false if due date is tomorrow', () => {
      const tomorrow = new Date(TODAY);
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isAutoGenerateWindowOpen(tomorrow.toISOString())).toBe(false);
    });
  });

  describe('canGenerate logic', () => {
    it('returns true when window is open and no message exists', () => {
      const { result } = renderHook(() => useAutoGenerateMotivationalMessage(defaultProps));
      expect(result.current.canGenerate).toBe(true);
    });

    it('returns false when window is closed (future task)', () => {
      const tomorrow = new Date(TODAY);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { result } = renderHook(() => useAutoGenerateMotivationalMessage({
        ...defaultProps,
        taskDueDate: tomorrow.toISOString(),
      }));
      expect(result.current.canGenerate).toBe(false);
    });

    it('returns false when message exists and is fresh (< 24h)', () => {
      const recentMessage = {
        id: 'msg-1',
        task_id: 'task-1',
        message_text: 'Go!',
        generated_at: new Date(TODAY.getTime() - 1000 * 60 * 60).toISOString(),
      };

      const { result } = renderHook(() => useAutoGenerateMotivationalMessage({
        ...defaultProps,
        latestMessage: recentMessage,
        latestStatus: 'success',
      }));
      expect(result.current.canGenerate).toBe(false);
    });

    it('returns true when message exists but is stale (> 24h)', () => {
      const staleMessage = {
        id: 'msg-1',
        task_id: 'task-1',
        message_text: 'Go!',
        generated_at: new Date(TODAY.getTime() - 1000 * 60 * 60 * 25).toISOString(),
      };

      const { result } = renderHook(() => useAutoGenerateMotivationalMessage({
        ...defaultProps,
        latestMessage: staleMessage,
        latestStatus: 'success',
      }));
      expect(result.current.canGenerate).toBe(true);
    });
  });

  describe('Auto-trigger effect', () => {
    beforeEach(() => {
      vi.useRealTimers();
    });

    it('triggers generation automatically when conditions are met', async () => {
        fetchMock.mockReset();
        fetchMock.mockResolvedValue({ status: 201, json: async () => ({}) });

        const props = {
            ...defaultProps,
            taskDueDate: new Date().toISOString(),
        };

        renderHook(() => useAutoGenerateMotivationalMessage(props));

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
        
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/generate'),
            expect.objectContaining({ method: 'POST' })
        );
    });

    it('does not trigger if already generating', async () => {
        fetchMock.mockReset();
        fetchMock.mockReturnValue(new Promise(() => {})); 

        const props = {
            ...defaultProps,
            taskDueDate: new Date().toISOString(),
        };

        const { result, rerender } = renderHook(() => useAutoGenerateMotivationalMessage(props));

        await waitFor(() => expect(result.current.isGenerating).toBe(true));
        
        expect(fetchMock).toHaveBeenCalledTimes(1);

        rerender();

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Manual trigger & Tone logic', () => {
      it('uses "playful" tone for tasks due today', async () => {
          const { result } = renderHook(() => useAutoGenerateMotivationalMessage({
              ...defaultProps,
              latestStatus: 'error'
          }));
          
          await act(async () => {
             await result.current.triggerGenerate(true);
          });

          expect(fetchMock).toHaveBeenCalledWith(
              expect.any(String),
              expect.objectContaining({
                  body: expect.stringContaining('"tone":"playful"')
              })
          );
      });

      it('uses "encouraging" tone for overdue tasks', async () => {
        const yesterday = new Date(TODAY);
        yesterday.setDate(yesterday.getDate() - 1);

        const { result } = renderHook(() => useAutoGenerateMotivationalMessage({
            ...defaultProps,
            taskDueDate: yesterday.toISOString(),
            latestStatus: 'error'
        }));
        
        await act(async () => {
            await result.current.triggerGenerate(true);
        });

        expect(fetchMock).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: expect.stringContaining('"tone":"encouraging"')
            })
        );
    });
  });
});
