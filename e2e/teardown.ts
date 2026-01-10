import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Ładujemy zmienne środowiskowe z pliku .env.test
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY;
const testUserId = process.env.E2E_USERNAME_ID;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration in .env.test');
}

// Używamy klucza service role (jeśli dostępny) lub publicznego
// Do czyszczenia danych najlepiej użyć service role key, aby ominąć RLS,
// ale w kontekście testów E2E często używamy anon key i RLS pozwala usuwać własne dane.
// Zakładamy, że testuser może usuwać swoje przestrzenie.
const supabase = createClient(supabaseUrl, supabaseKey);

setup('cleanup database', async () => {
  console.log('Running teardown: Cleaning up database...');

  // Logowanie jako użytkownik testowy, aby RLS pozwoliło na usunięcie danych
  const email = process.env.E2E_USERNAME || 'testuser@example.com';
  const password = process.env.E2E_PASSWORD || 'testuser';

  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !user) {
    console.error('Teardown login failed:', authError);
    return;
  }

  // Używamy ID zalogowanego użytkownika
  const userId = user.id;

  console.log(`Logged in as ${email} for teardown.`);
  console.log(`User ID from session: ${userId}`);

  // 1. Usuń wszystkie zadania użytkownika (kaskadowo lub bezpośrednio)
  // Jeśli mamy FK z cascade delete w bazie, usunięcie przestrzeni usunie zadania.
  // Dla pewności czyścimy też zadania.
  const { error: tasksError } = await supabase
    .from('tasks')
    .delete()
    .eq('user_id', userId);

  if (tasksError) {
    console.error('Error cleaning up tasks:', tasksError);
  } else {
    console.log('Cleaned up tasks.');
  }

  // 2. Usuń wszystkie przestrzenie użytkownika
  const { error: spacesError } = await supabase
    .from('spaces')
    .delete()
    .eq('user_id', userId);

  if (spacesError) {
    console.error('Error cleaning up spaces:', spacesError);
  } else {
    console.log('Cleaned up spaces.');
  }

  console.log('Teardown complete.');
});

