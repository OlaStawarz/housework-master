import type { SupabaseClient } from '../../db/supabase.client';
import type {
  GenerateMotivationalMessageCommand,
  MotivationalMessageDto,
  TaskDto
} from '../../types';
import { TaskNotFoundError } from './tasksService';

/**
 * Custom error class dla błędów AI API
 */
export class AIAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'AIAPIError';
  }
}

/**
 * Custom error class dla błędów rate limit AI
 */
export class AIRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIRateLimitError';
  }
}

/**
 * Błąd braku wiadomości motywacyjnej dla zadania
 */
export class MotivationalMessageNotFoundError extends Error {
  constructor(taskId: string) {
    super(`No motivational messages found for task ${taskId}`);
    this.name = 'MotivationalMessageNotFoundError';
  }
}

/**
 * Parametry dla funkcji generateMessage
 */
export interface GenerateMessageParams {
  userId: string;
  taskId: string;
  command: GenerateMotivationalMessageCommand;
}

/**
 * Parametry dla funkcji getLatestMessage
 */
export interface GetLatestMessageParams {
  userId: string;
  taskId: string;
}


/**
 * Generuje przykładową wiadomość motywacyjną na podstawie tonu
 * (Mock implementation - bez faktycznego wywołania AI API)
 */
function generateMockMotivationalMessage(
  taskName: string,
  tone: string,
  maxLength: number
): string {
  const mockMessages = {
    encouraging: [
      `Świetnie! ${taskName} to krok ku czystszemu domowi. Dasz radę! 💪`,
      `Brawo za podjęcie wyzwania! ${taskName} przyniesie spokój ducha.`,
      `Jesteś mistrzem swojego domu! ${taskName} czeka na Twoją magię.`,
      `Każde ${taskName} to inwestycja w komfort życia. Świetny wybór!`,
      `Pamiętaj - czystość domu to czystość umysłu. Do dzieła!`,
    ],
    playful: [
      `Czas na ${taskName}! Zróbmy z tego przygodę! 🎉`,
      `Hej, superbohaterze! ${taskName} potrzebuje Twojej mocy!`,
      `Chodź, pobawmy się w sprzątanie! ${taskName} będzie zabawą!`,
      `Włącz muzykę i zróbmy ${taskName} tanecznie! 💃`,
      `Bum! Bum! ${taskName} time! Jesteś gotowy na wyzwanie?`,
    ],
    neutral: [
      `Czas na ${taskName}. Zróbmy to systematycznie.`,
      `Kolejne ${taskName} na liście. Pozostańmy konsekwentni.`,
      `Regularne ${taskName} pomaga utrzymać porządek.`,
      `${taskName} to rutynowe zadanie domowe.`,
      `Przejdźmy do ${taskName} zgodnie z planem.`,
    ],
  };

  const messages = mockMessages[tone as keyof typeof mockMessages] || mockMessages.neutral;
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  return randomMessage;
}

/**
 * Generuje nową wiadomość motywacyjną dla zadania przy użyciu AI
 *
 * @param supabase - Klient Supabase
 * @param params - Parametry GenerateMessageParams
 * @returns Promise z MotivationalMessageDto
 * @throws TaskNotFoundError jeśli zadanie nie istnieje lub nie należy do użytkownika
 * @throws AIAPIError jeśli wystąpi błąd podczas komunikacji z AI API
 * @throws AIRateLimitError jeśli osiągnięto limit zapytań do AI
 * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
 */
export async function generateMessage(
  supabase: SupabaseClient,
  params: GenerateMessageParams
): Promise<MotivationalMessageDto> {
  const { userId, taskId, command } = params;
  const { task_name, tone, max_length } = command;

  // Weryfikacja czy zadanie istnieje i należy do użytkownika
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single();

  if (taskError || !task) {
    throw new TaskNotFoundError(taskId);
  }

  // Wygenerowanie wiadomości (mock implementation)
  const messageText = generateMockMotivationalMessage(task_name, tone, max_length);

  // Zapisanie wiadomości w bazie danych
  const { data: newMessage, error: insertError } = await supabase
    .from('motivational_messages')
    .insert({
      task_id: taskId,
      message_text: messageText,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error saving motivational message:', insertError);
    throw new Error('Failed to save motivational message to database');
  }

  // Mapowanie na DTO
  const motivationalMessage: MotivationalMessageDto = {
    id: newMessage.id,
    task_id: newMessage.task_id,
    message_text: newMessage.message_text,
    generated_at: newMessage.generated_at,
  };

  return motivationalMessage;
}

/**
 * Pobiera najnowszą wiadomość motywacyjną dla zadania użytkownika
 *
 * @param supabase - Klient Supabase
 * @param params - Parametry GetLatestMessageParams
 * @returns Promise z MotivationalMessageDto najnowszej wiadomości
 * @throws Error jeśli zadanie nie istnieje lub nie należy do użytkownika, lub jeśli brak wiadomości
 */
export async function getLatestMessage(
  supabase: SupabaseClient,
  params: GetLatestMessageParams
): Promise<MotivationalMessageDto> {
  const { userId, taskId } = params;

  // Weryfikacja czy zadanie istnieje i należy do użytkownika
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single();

  if (taskError || !task) {
    throw new TaskNotFoundError(taskId);
  }

  // Pobranie najnowszej wiadomości motywacyjnej dla zadania
  const { data: message, error: messageError } = await supabase
    .from('motivational_messages')
    .select('id, task_id, message_text, generated_at')
    .eq('task_id', taskId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  if (messageError || !message) {
    throw new MotivationalMessageNotFoundError(taskId);
  }

  // Mapowanie na DTO
  const motivationalMessage: MotivationalMessageDto = {
    id: message.id,
    task_id: message.task_id,
    message_text: message.message_text,
    generated_at: message.generated_at,
  };

  return motivationalMessage;
}
