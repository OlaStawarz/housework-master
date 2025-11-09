import type { SupabaseClient } from '../../db/supabase.client';
import type { TaskTemplateDto, ListTaskTemplatesParams } from '../../types';

/**
 * Pobiera listę szablonów zadań z opcjonalnym filtrowaniem po space_type i sortowaniem
 * 
 * @param supabase - Klient Supabase
 * @param params - Parametry zapytania (spaceType, sort)
 * @returns Promise z tablicą szablonów zadań
 * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
 */
export async function listTaskTemplates(
  supabase: SupabaseClient,
  params: ListTaskTemplatesParams = {}
): Promise<TaskTemplateDto[]> {
  const { spaceType, sort = 'space_type.asc,display_order.asc' } = params;

  // Przygotowanie zapytania bazowego
  let query = supabase
    .from('task_templates')
    .select('id, space_type, task_name, default_recurrence_value, default_recurrence_unit, display_order');

  // Filtrowanie po space_type (jeśli podano)
  if (spaceType) {
    query = query.eq('space_type', spaceType);
  }

  // Parsowanie i aplikacja sortowania
  // Format: "field1.asc,field2.desc" → []
  const sortParts = sort.split(',').map(s => s.trim());
  
  for (const sortPart of sortParts) {
    const [field, direction] = sortPart.split('.');
    if (field && direction) {
      query = query.order(field, { ascending: direction === 'asc' });
    }
  }

  // Wykonanie zapytania
  const { data, error } = await query;

  if (error) {
    console.error('Error fetching task templates:', error);
    throw new Error('Failed to fetch task templates from database');
  }

  // Mapowanie danych na TaskTemplateDto
  const templates: TaskTemplateDto[] = (data || []).map((template) => ({
    id: template.id,
    space_type: template.space_type,
    task_name: template.task_name,
    default_recurrence_value: template.default_recurrence_value,
    default_recurrence_unit: template.default_recurrence_unit,
    display_order: template.display_order,
  }));

  return templates;
}
