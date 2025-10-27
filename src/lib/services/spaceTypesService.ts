import type { SupabaseClient } from '../../db/supabase.client';
import type { SpaceTypeDto } from '../../types';

/**
 * Pobiera listę wszystkich dostępnych typów przestrzeni posortowanych po display_order
 * 
 * @param supabase - Klient Supabase
 * @returns Promise z tablicą typów przestrzeni
 * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
 */
export async function listSpaceTypes(
  supabase: SupabaseClient
): Promise<SpaceTypeDto[]> {
  // Wykonanie SELECT z sortowaniem po display_order
  const { data, error } = await supabase
    .from('space_types')
    .select('id, code, display_name, icon, display_order')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching space types:', error);
    throw new Error('Failed to fetch space types from database');
  }

  // Mapowanie danych na SpaceTypeDto
  const spaceTypes: SpaceTypeDto[] = (data || []).map((type) => ({
    id: type.id,
    code: type.code,
    display_name: type.display_name,
    icon: type.icon,
    display_order: type.display_order,
  }));

  return spaceTypes;
}
