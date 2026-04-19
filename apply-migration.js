#!/usr/bin/env node
/**
 * 🗺️ Script para aplicar migration de map_link
 * 
 * Execute manualmente no dashboard Supabase:
 * https://supabase.com/dashboard/project/pxbpkkizfvpnocopnsjt/sql
 */

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                    🗺️  MIGRATION: ADD MAP_LINK COLUMN                       ║
╚════════════════════════════════════════════════════════════════════════════╝

❌ Problema: A coluna 'map_link' ainda não existe no banco de dados.

📝 Solução: Execute o SQL abaixo no dashboard Supabase

🔗 URL: https://supabase.com/dashboard/project/pxbpkkizfvpnocopnsjt/sql

📋 Copie e execute este código:

═══════════════════════════════════════════════════════════════════════════════

-- 1️⃣ Adicionar coluna map_link à tabela itinerary_items
ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS map_link TEXT DEFAULT NULL;

-- 2️⃣ Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_itinerary_items_map_link 
  ON itinerary_items(map_link) WHERE map_link IS NOT NULL;

-- 3️⃣ Registrar migration no histórico (opcional, para limpeza)
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES (
  '20260420',
  '20260420_add_map_link_to_itinerary_items.sql',
  'ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS map_link TEXT;'
)
ON CONFLICT (version) DO NOTHING;

═══════════════════════════════════════════════════════════════════════════════

✅ Após executar, você pode:
  • Editar eventos existentes e adicionar links de mapa
  • Criar novos eventos com links de mapa
  • Recarregar o app (npm start)

💡 Dica: Copie o SQL acima em bloco (sem os números), abra o dashboard Supabase
   e cole no editor SQL. Clique "RUN" para executar.

`);


