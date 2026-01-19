import { z } from 'zod';
import type { SupabaseClient } from '../../db/supabase.client';
import type {
  GenerateMotivationalMessageCommand,
  MotivationalMessageDto,
} from '../../types';
import { TaskNotFoundError } from './tasksService';
import { OpenRouterService, OpenRouterError, type Message } from './openrouter.service';

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
  apiKey?: string;
  siteUrl?: string;
}

/**
 * Parametry dla funkcji getLatestMessage
 */
export interface GetLatestMessageParams {
  userId: string;
  taskId: string;
}

const MotivationalResponseSchema = z.object({
  message_text: z.string(),
});

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
  const { userId, taskId, command, apiKey, siteUrl } = params;
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

  // Wygenerowanie wiadomości przy użyciu OpenRouterService
  let messageText: string;
  try {
    const openRouter = new OpenRouterService(apiKey, siteUrl);
    
    const systemPrompt = `Role: You are an expert productivity coach and behavioral psychologist specializing in household chore motivation.
    
    Task: Generate a single, effective motivational message to encourage a user to complete their specific task.
    
    Context:
    - User's Task: "${task_name}"
    - Desired Tone: "${tone}"
    
    Constraints & Rules:
    1. LANGUAGE: The output message MUST be in Polish.
    2. LENGTH: CRITICAL. The message MUST be strictly under ${max_length} characters. Focus on brevity and impact.
    3. ACCURACY: Do not invent details about the task that are not provided (no hallucinations).
    4. FORMAT: Return VALID JSON only. No markdown formatting, no backticks, no introductory text.
    
    Examples (Few-Shot Learning):
    - Input: Task="Zmywanie naczyń", Tone="encouraging"
      Output: { "message_text": "Dajesz! Talerze same się nie umyją, a czysta kuchnia to czysty umysł! 🚀" }
    - Input: Task="Wstawienie prania", Tone="encouraging"
      Output: { "message_text": "Wrzuć ubrania do pralki i miej to z głowy. Świeże pranie to +10 do komfortu!" }
    - Input: Task="Podlanie kwiatów", Tone="encouraging"
      Output: { "message_text": "Twoje rośliny liczą na Ciebie! Mała kropa wody dla nich, duża satysfakcja dla Ciebie." }

    - Input: Task="Wyrzucenie śmieci", Tone="playful"
      Output: { "message_text": "Śmieci same nie wyjdą, chyba że dostaną nogi. Uprzedź ewolucję! 😉" }
    - Input: Task="Odkurzanie", Tone="playful"
      Output: { "message_text": "Odkurzacz czeka na spacer. Wyprowadź bestię i pokonaj te koty z kurzu! 🦁" }
    - Input: Task="Mycie okien", Tone="playful"
      Output: { "message_text": "Umyj okna, niech sąsiedzi widzą w HD, jak świetnie radzisz sobie z życiem! 😎" }

    - Input: Task="Odkurzanie salonu", Tone="neutral"
      Output: { "message_text": "Chwila dla domu. Spokojne otoczenie to relaks dla Ciebie." }
    
    Output Format:
    { "message_text": "Your message here" }`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
    ];

    const result = await openRouter.getStructuredCompletion(
      messages,
      MotivationalResponseSchema,
      {
        temperature: 0.8, // Trochę kreatywności dla motywacji
      }
    );

    messageText = result.message_text;
  } catch (error) {
    if (error instanceof OpenRouterError) {
      if (error.status === 429) {
        throw new AIRateLimitError('AI rate limit exceeded');
      }
      throw new AIAPIError(error.message, error.status);
    }
    // Re-throw other errors (e.g. unexpected)
    throw new AIAPIError(error instanceof Error ? error.message : 'Unknown AI error');
  }

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
