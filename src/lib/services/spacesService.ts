// src/lib/services/spacesService.ts
import type { SupabaseClient } from '../../db/supabase.client';
import type { SpaceListDto, SpaceDto, PaginationDto, CreateSpaceCommand, CreateSpaceParams, UpdateSpaceCommand, UpdateSpaceParams } from '../../types';

/**
 * Parametry dla funkcji listSpaces
 */
export interface ListSpacesParams {
  userId: string;
  search?: string;
  page: number;
  limit: number;
  sort: 'created_at.asc' | 'created_at.desc' | 'name.asc' | 'name.desc';
}

/**
 * Pobiera listę przestrzeni użytkownika z paginacją, filtrowaniem i sortowaniem
 * 
 * @param supabase - Klient Supabase
 * @param params - Parametry zapytania
 * @returns Promise z danymi przestrzeni i informacjami o paginacji
 * @throws PageOutOfRangeError jeśli numer strony przekracza liczbę dostępnych stron
 * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
 */
export async function listSpaces(
  supabase: SupabaseClient,
  params: ListSpacesParams
): Promise<SpaceListDto> {
  const { userId, search, page, limit, sort } = params;

  // Parsowanie parametru sortowania
  const [sortField, sortDirection] = sort.split('.') as [string, 'asc' | 'desc'];

  // Przygotowanie zapytania bazowego
  let query = supabase
    .from('spaces')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  // Filtrowanie po nazwie (jeśli podano search)
  if (search && search.trim() !== '') {
    query = query.ilike('name', `%${search.trim()}%`);
  }

  // Sortowanie
  query = query.order(sortField, { ascending: sortDirection === 'asc' });

  // Paginacja - obliczanie zakresu
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  // Wykonanie zapytania
  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching spaces:', error);
    throw new Error('Failed to fetch spaces from database');
  }

  // Obliczenie całkowitej liczby stron
  const total = count || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  // Walidacja: sprawdzenie czy żądana strona istnieje
  if (total > 0 && page > totalPages) {
    throw new PageOutOfRangeError(page, totalPages);
  }

  // Mapowanie danych na SpaceDto
  const spaces: SpaceDto[] = (data || []).map((space) => ({
    id: space.id,
    user_id: space.user_id,
    name: space.name,
    space_type: space.space_type,
    icon: space.icon,
    created_at: space.created_at,
    updated_at: space.updated_at,
  }));

  // Przygotowanie informacji o paginacji
  const pagination: PaginationDto = {
    page,
    limit,
    total,
    total_pages: totalPages,
  };

  return {
    data: spaces,
    pagination,
  };
}

export class PageOutOfRangeError extends Error {
  constructor(requestedPage: number, maxPage: number) {
    super(`Page ${requestedPage} is out of range. Maximum page is ${maxPage}`);
    this.name = 'PageOutOfRangeError';
  }
}

export class SpaceTypeNotFoundError extends Error {
  constructor(type: string) {
    super(`Space type '${type}' does not exist`);
    this.name = 'SpaceTypeNotFoundError';
  }
}
export class DuplicateSpaceNameError extends Error {
  constructor(name: string) {
    super(`A space with name '${name}' already exists`);
    this.name = 'DuplicateSpaceNameError';
  }
}

export class SpaceNotFoundError extends Error {
  constructor() {
    super('Space not found');
    this.name = 'SpaceNotFoundError';
  }
}

/**
 * Tworzy nową przestrzeń dla użytkownika w bazie danych.
 * Waliduje opcjonalny space_type oraz obsługuje unikalność nazwy.
 *
 * @param supabase - Instancja klienta SupabaseClient.
 * @param params - Parametry CreateSpaceParams zawierające:
 *   - userId: ID użytkownika.
 *   - command: CreateSpaceCommand z właściwościami name, space_type, icon.
 * @returns Promise<SpaceDto> - Obiekt reprezentujący nowo utworzoną przestrzeń.
 * @throws SpaceTypeNotFoundError - gdy podany space_type nie istnieje.
 * @throws DuplicateSpaceNameError - gdy nazwa przestrzeni koliduje z istniejącą.
 * @throws Error - inne błędy przy wstawieniu do bazy.
 */
export async function createSpace(
  supabase: SupabaseClient,
  params: CreateSpaceParams
): Promise<SpaceDto> {
  const { userId, command } = params;
  const { name, space_type, icon } = command;
  // Walidacja space_type
  if (space_type) {
    const { data: spaceType, error: typeError } = await supabase
      .from('space_types')
      .select('code')
      .eq('code', space_type)
      .single();
    if (typeError || !spaceType) {
      throw new SpaceTypeNotFoundError(space_type);
    }
  }
  // Tworzenie przestrzeni
  const { data: newSpace, error: insertError } = await supabase
    .from('spaces')
    .insert({ user_id: userId, name, space_type, icon })
    .select()
    .single();
  if (insertError) {
    if ((insertError as any).code === '23505') {
      throw new DuplicateSpaceNameError(name);
    }
    throw insertError;
  }
  // Bezpośrednie zwrócenie nowo utworzonej przestrzeni
  return newSpace as SpaceDto;
}

/**
 * Pobiera szczegółowe informacje o pojedynczej przestrzeni
 *
 * @param supabase - Instancja klienta SupabaseClient
 * @param spaceId - UUID identyfikator przestrzeni
 * @param userId - ID zalogowanego użytkownika (dla weryfikacji dostępu)
 * @returns Promise<SpaceDto> - Obiekt reprezentujący przestrzeń
 * @throws SpaceNotFoundError - gdy przestrzeń nie istnieje lub nie należy do użytkownika
 * @throws Error - inne błędy przy pobraniu z bazy
 */
export async function getSpaceById(
  supabase: SupabaseClient,
  spaceId: string,
  userId: string
): Promise<SpaceDto> {
  const { data: space, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('id', spaceId)
    .eq('user_id', userId)
    .single();

  if (error || !space) {
    throw new SpaceNotFoundError();
  }

  return space as SpaceDto;
}

/**
 * Aktualizuje istniejącą przestrzeń użytkownika
 *
 * @param supabase - Instancja klienta SupabaseClient
 * @param spaceId - UUID identyfikator przestrzeni
 * @param userId - ID zalogowanego użytkownika (dla weryfikacji dostępu)
 * @param command - UpdateSpaceCommand zawierający pola do aktualizacji (name, icon)
 * @returns Promise<SpaceDto> - Zaktualizowany obiekt przestrzeni
 * @throws SpaceNotFoundError - gdy przestrzeń nie istnieje lub nie należy do użytkownika
 * @throws DuplicateSpaceNameError - gdy nowa nazwa koliduje z istniejącą
 * @throws Error - inne błędy przy aktualizacji
 */
export async function updateSpace(
  supabase: SupabaseClient,
  params: UpdateSpaceParams
): Promise<SpaceDto> {
  const { spaceId, userId, command } = params;
  // Najpierw sprawdzamy, czy przestrzeń istnieje i należy do użytkownika
  const { data: existingSpace, error: selectError } = await supabase
    .from('spaces')
    .select('id')
    .eq('id', spaceId)
    .eq('user_id', userId)
    .single();

  if (selectError || !existingSpace) {
    throw new SpaceNotFoundError();
  }

  // Wykonywanie UPDATE
  const { data: updatedSpace, error: updateError } = await supabase
    .from('spaces')
    .update(command)
    .eq('id', spaceId)
    .select()
    .single();

  if (updateError) {
    // UNIQUE constraint violation na (user_id, name)
    if ((updateError as any).code === '23505') {
      throw new DuplicateSpaceNameError(command.name || 'unknown');
    }
    throw updateError;
  }

  return updatedSpace as SpaceDto;
}

/**
 * Usuwa przestrzeń należącą do użytkownika wraz z jej zadaniami
 *
 * @param supabase - Instancja klienta SupabaseClient
 * @param spaceId - UUID identyfikator przestrzeni do usunięcia
 * @param userId - ID zalogowanego użytkownika (dla weryfikacji dostępu)
 * @returns Promise<void>
 * @throws SpaceNotFoundError - gdy przestrzeń nie istnieje lub nie należy do użytkownika
 * @throws Error - inne błędy przy usuwaniu
 */
export async function deleteSpace(
  supabase: SupabaseClient,
  spaceId: string,
  userId: string
): Promise<void> {
  // Najpierw sprawdzamy, czy przestrzeń istnieje i należy do użytkownika
  const { data: existingSpace, error: selectError } = await supabase
    .from('spaces')
    .select('id')
    .eq('id', spaceId)
    .eq('user_id', userId)
    .single();

  if (selectError || !existingSpace) {
    throw new SpaceNotFoundError();
  }

  // Wykonywanie DELETE (CASCADE automatycznie usuwa powiązane tasks i motivational_messages)
  const { error: deleteError } = await supabase
    .from('spaces')
    .delete()
    .eq('id', spaceId);

  if (deleteError) {
    throw deleteError;
  }
}

