# Checklist de Merge e Testes Minimos

## Merge
1. Conferir encoding UTF-8 em textos (ex: "Alimentacao", "Estatisticas").
2. Verificar import do CSS do Leaflet no web.
3. Garantir URLs publicas HTTPS no upload de imagens.
4. Validar bucket `trip-images` e politicas RLS no Supabase.
5. Rodar e aplicar migrations pendentes (budget, checklist, storage, coordenadas).
6. Adicionar novos arquivos ao git e revisar diffs.
7. Confirmar `package.json` e `package-lock.json` consistentes.
8. Revisar layout web em largura >= 1024.

## Testes Minimos - Web
1. Login e cadastro.
2. Criar viagem, adicionar capa e salvar.
3. Abrir detalhes da viagem e testar carrosseis.
4. Compartilhar viagem (texto e PDF).
5. Abrir checklist: criar, marcar e remover itens.
6. Abrir estatisticas e validar totais.
7. Itinerario: criar item com foto e mapa.

## Testes Minimos - Mobile
1. Login e cadastro.
2. Criar viagem e editar dados.
3. Upload de imagens (capa, hospedagem, avatar).
4. Itinerario com mapa e abrir no Google Maps.
5. Compartilhar texto e PDF.
6. Gastos com orçamento e validacao de campos.
