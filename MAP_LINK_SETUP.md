## 🗺️ Ativar Feature de Links de Mapa

### ❌ Problema Atual
Ao tentar editar um evento existente e adicionar um link de mapa, você recebe:
```
Erro: Could not find the 'map_link' column of 'itinerary_items' in the schema cache
```

### ✅ Solução
A coluna `map_link` ainda **não existe no banco de dados**. Você precisa executá-la manualmente no dashboard Supabase.

---

## 📋 Passos para Resolver

### 1️⃣ Abra o Dashboard Supabase
Clique neste link:
```
https://supabase.com/dashboard/project/pxbpkkizfvpnocopnsjt/sql
```

### 2️⃣ Copie e Execute o SQL
No editor SQL, execute **exatamente este código**:

```sql
-- Adicionar coluna map_link
ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS map_link TEXT DEFAULT NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_itinerary_items_map_link 
  ON itinerary_items(map_link) WHERE map_link IS NOT NULL;

-- Registrar a migration (opcional, para organização)
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES (
  '20260420',
  '20260420_add_map_link_to_itinerary_items.sql',
  'ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS map_link TEXT;'
)
ON CONFLICT (version) DO NOTHING;
```

### 3️⃣ Clique em "RUN"
Espere a execução. Você deve ver:
```
✅ Query executed successfully
```

### 4️⃣ Recarregue seu App
```bash
npm start
```

---

## ✅ O Que Funciona Agora

### 📝 Criar Novo Evento com Link de Mapa
1. Clique em "+" para criar novo evento
2. Preencha título, categoria, etc.
3. **Cole um link do Google Maps ou Apple Maps** no campo "Link do Local"
4. Um botão aparecerá: "Abrir local no mapa"
5. Clique nele para abrir um modal escolhendo qual app usar
6. Salve o evento ✅

### ✏️ Editar Evento Existente e Adicionar Link
1. Clique em um evento já criado para editar
2. Role até "Link do Local"
3. **Cole um link do Google Maps ou Apple Maps**
4. Um botão aparecerá: "Abrir local no mapa"
5. Clique para testar (abre no app escolhido)
6. Clique "Salvar edição" ✅

### 🌐 Formatos de Link Aceitos
- ✅ Google Maps completo: `https://maps.google.com/maps/place/...`
- ✅ Google Maps curto: `https://g.page/...`
- ✅ Google Maps com coordenadas: `https://maps.google.com/?q=lat,lng`
- ✅ Apple Maps: `https://maps.apple.com/?ll=lat,lng`

---

## 🎯 Fluxo Completo de Uso

```
1. Cole Link do Mapa
   ↓
2. Botão "Abrir local no mapa" aparece automaticamente
   ↓
3. Clique no botão
   ↓
4. Aparece modal nativo:
   - iOS: ActionSheet com opções "Google Maps", "Apple Maps", "Safari"
   - Android: Alert dialog com mesmas opções
   ↓
5. Escolha qual app abrir
   ↓
6. Abre no app escolhido 🗺️
```

---

## ❓ Perguntas Frequentes

**P: Preciso fazer o login no Supabase?**
R: Sim, você já deve estar logado no dashboard. Se não estiver, faça login com sua conta Supabase.

**P: O que fazer se der erro ao executar SQL?**
R: Copie o error e tente novamente. Se persistir, verifique se:
- Você está no projeto correto (`pxbpkkizfvpnocopnsjt`)
- Você colou todo o SQL (3 statements)

**P: Preciso executar `npm install` novamente?**
R: Não, as dependências já foram removidas na implementação anterior.

**P: Funciona offline?**
R: Sim! Se estiver offline e adicionar um link de mapa, a mutação fica na fila e sincroniza quando reconectar.

---

## 🚀 Próximas Etapas
1. Execute o SQL acima
2. Recarregue o app (`npm start`)
3. Teste criando/editando eventos com links de mapa
4. Aproveite! 🎉

