# Changelog

## 2026-04-05

### Destaques
1. Experiencia web/desktop com layout responsivo (sidebar, drawers e grids).
2. Upload de imagens integrado ao Supabase Storage (capas, avatar, hospedagem, roteiro).
3. Novas telas: checklist por viagem e estatisticas gerais.
4. Itinerario com mapa, categorias, fotos e drag & drop no desktop.
5. Detalhe da viagem com compartilhamento em texto e PDF.

### UI e Navegacao
1. Layout responsivo com `DesktopLayout`, `WebSidebar` e `useResponsive`.
2. `SheetModal` (drawer desktop / bottom sheet mobile) aplicado em multiplas telas.
3. `HScrollable` com setas no desktop e paginacao no mobile.
4. Login com layout split no desktop e fluxo de recuperacao de senha.

### Funcionalidades
1. Orçamento por viagem e progresso de gastos.
2. Mapa com Leaflet no web e WebView no mobile.
3. Compartilhamento de viagem (texto + PDF).
4. Checklist por viagem com categorias e templates.

### Supabase
1. Migrations para orçamento, checklist, storage e coordenadas.
2. Bucket `trip-images` com politicas de acesso.

### Dependencias
1. DnD Kit para drag & drop no web.
2. Leaflet e React Leaflet para mapa no web.
3. Expo Print/Sharing e FileSystem para compartilhamento e upload.
