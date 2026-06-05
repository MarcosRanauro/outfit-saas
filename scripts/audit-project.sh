#!/usr/bin/env bash

set -u

REPORT_DIR="reports"
STAMP="$(date '+%Y-%m-%d_%H-%M-%S')"
REPORT="$REPORT_DIR/project-audit-$STAMP.md"

mkdir -p "$REPORT_DIR"

EXCLUDES=(
  --exclude-dir=node_modules
  --exclude-dir=.next
  --exclude-dir=dist
  --exclude-dir=build
  --exclude-dir=.git
  --exclude-dir=coverage
  --exclude-dir=.turbo
)

log() {
  echo "$1" | tee -a "$REPORT"
}

section() {
  echo "" | tee -a "$REPORT"
  echo "## $1" | tee -a "$REPORT"
  echo "" | tee -a "$REPORT"
}

run_check() {
  local title="$1"
  local command="$2"

  section "$title"
  log '```bash'
  log "$command"
  log '```'
  log ""

  output=$(bash -c "$command" 2>&1)
  status=$?

  if [ $status -eq 0 ]; then
    log "✅ **Status:** OK"
  else
    log "❌ **Status:** Falhou"
  fi

  log ""
  log "<details>"
  log "<summary>Ver saída</summary>"
  log ""
  log '```txt'
  echo "$output" | tee -a "$REPORT"
  log '```'
  log ""
  log "</details>"
}

has_npm_script() {
  node -e "
    const pkg = require('./package.json');
    process.exit(pkg.scripts && pkg.scripts['$1'] ? 0 : 1);
  " 2>/dev/null
}

count_grep() {
  local pattern="$1"
  local path="$2"

  if [ -d "$path" ] || [ -f "$path" ]; then
    grep -RIn "${EXCLUDES[@]}" "$pattern" "$path" 2>/dev/null | wc -l | tr -d ' '
  else
    echo "0"
  fi
}

list_grep() {
  local pattern="$1"
  local path="$2"
  local limit="${3:-30}"

  if [ -d "$path" ] || [ -f "$path" ]; then
    grep -RIn "${EXCLUDES[@]}" "$pattern" "$path" 2>/dev/null | head -n "$limit"
  fi
}

log "# Auditoria de Projeto"
log ""
log "- Data: $(date)"
log "- Diretório: $(pwd)"
log ""

section "Ambiente"

log '```txt'
echo "Node: $(node -v 2>/dev/null || echo 'Node não encontrado')" | tee -a "$REPORT"
echo "npm:  $(npm -v 2>/dev/null || echo 'npm não encontrado')" | tee -a "$REPORT"
echo "Git:  $(git --version 2>/dev/null || echo 'git não encontrado')" | tee -a "$REPORT"
log '```'

section "Resumo do package.json"

if [ -f package.json ]; then
  log '```json'
  node -e "
    const pkg = require('./package.json');
    console.log(JSON.stringify({
      name: pkg.name,
      version: pkg.version,
      scripts: pkg.scripts,
      dependencies: Object.keys(pkg.dependencies || {}),
      devDependencies: Object.keys(pkg.devDependencies || {})
    }, null, 2));
  " | tee -a "$REPORT"
  log '```'
else
  log "❌ package.json não encontrado."
fi

if [ -f package-lock.json ]; then
  run_check "Instalação limpa das dependências" "npm ci"
else
  section "Instalação limpa das dependências"
  log "⚠️ package-lock.json não encontrado. Pulando npm ci."
fi

if has_npm_script lint; then
  run_check "Lint" "npm run lint"
else
  section "Lint"
  log "⚠️ Script de lint não encontrado no package.json."
fi

if has_npm_script typecheck; then
  run_check "TypeScript" "npm run typecheck"
elif [ -f tsconfig.json ]; then
  run_check "TypeScript" "npx tsc --noEmit"
else
  section "TypeScript"
  log "⚠️ tsconfig.json não encontrado. Pulando checagem TypeScript."
fi

if has_npm_script test; then
  run_check "Testes" "npm test -- --runInBand"
else
  section "Testes"
  log "⚠️ Script de teste não encontrado no package.json."
fi

if has_npm_script build; then
  run_check "Build" "npm run build"
else
  section "Build"
  log "⚠️ Script de build não encontrado no package.json."
fi

run_check "Auditoria de segurança das dependências" "npm audit --audit-level=moderate"
run_check "Pacotes desatualizados" "npm outdated || true"

section "Variáveis de ambiente"

ENV_FILES=".env .env.local .env.development .env.production"

for file in $ENV_FILES; do
  if [ -f "$file" ]; then
    log "✅ Encontrado: \`$file\`"

    if grep -q "NEXT_PUBLIC_SUPABASE_URL" "$file"; then
      log "- ✅ NEXT_PUBLIC_SUPABASE_URL presente"
    else
      log "- ⚠️ NEXT_PUBLIC_SUPABASE_URL ausente"
    fi

    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$file"; then
      log "- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY presente"
    else
      log "- ⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY ausente"
    fi

    if grep -q "SUPABASE_SERVICE_ROLE_KEY" "$file"; then
      log "- ⚠️ SUPABASE_SERVICE_ROLE_KEY presente. Use somente no servidor/API routes/server actions. Nunca exponha no client."
    fi

    if grep -q "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY" "$file"; then
      log "- ❌ ERRO GRAVE: service role key está como NEXT_PUBLIC. Isso expõe a chave no navegador."
    fi

    log ""
  fi
done

section "Supabase"

if [ -d "supabase" ]; then
  log "✅ Pasta \`supabase/\` encontrada."

  if [ -d "supabase/migrations" ]; then
    MIGRATION_COUNT=$(find supabase/migrations -type f | wc -l | tr -d ' ')
    log "- Migrations encontradas: $MIGRATION_COUNT"
  else
    log "- ⚠️ Pasta \`supabase/migrations\` não encontrada."
  fi

  if [ -f "supabase/config.toml" ]; then
    log "- ✅ config.toml encontrado."
  else
    log "- ⚠️ config.toml não encontrado."
  fi
else
  log "⚠️ Pasta \`supabase/\` não encontrada."
fi

section "Possíveis problemas de código"

INLINE_STYLE_COUNT=$(count_grep "style={{" "src")
CONSOLE_COUNT=$(count_grep "console\\.log" "src")
ANY_COUNT=$(count_grep ": any\\|as any" "src")
TODO_COUNT=$(count_grep "TODO\\|FIXME" "src")
SERVICE_ROLE_COUNT=$(count_grep "SUPABASE_SERVICE_ROLE_KEY" "src")

log "- CSS inline com \`style={{ }}\`: $INLINE_STYLE_COUNT"
log "- \`console.log\` encontrados: $CONSOLE_COUNT"
log "- Uso de \`any\`: $ANY_COUNT"
log "- TODO/FIXME encontrados: $TODO_COUNT"
log "- Referências a \`SUPABASE_SERVICE_ROLE_KEY\` em src: $SERVICE_ROLE_COUNT"

if [ "$INLINE_STYLE_COUNT" -gt 0 ]; then
  section "CSS inline encontrado"
  log '```txt'
  list_grep "style={{" "src" 40 | tee -a "$REPORT"
  log '```'
fi

if [ "$CONSOLE_COUNT" -gt 0 ]; then
  section "console.log encontrados"
  log '```txt'
  list_grep "console\\.log" "src" 40 | tee -a "$REPORT"
  log '```'
fi

if [ "$ANY_COUNT" -gt 0 ]; then
  section "Uso de any encontrado"
  log '```txt'
  list_grep ": any\\|as any" "src" 40 | tee -a "$REPORT"
  log '```'
fi

if [ "$SERVICE_ROLE_COUNT" -gt 0 ]; then
  section "Uso de SUPABASE_SERVICE_ROLE_KEY no código"
  log "⚠️ Verifique com atenção. Essa chave não pode aparecer em componente client-side."
  log ""
  log '```txt'
  list_grep "SUPABASE_SERVICE_ROLE_KEY" "src" 40 | tee -a "$REPORT"
  log '```'
fi

section "Arquivos importantes"

for file in README.md CONTEXT.md CLAUDE.md .gitignore tsconfig.json next.config.js next.config.mjs eslint.config.js eslint.config.mjs; do
  if [ -f "$file" ]; then
    log "✅ $file"
  else
    log "⚠️ $file ausente"
  fi
done

section "Conclusão"

log "Auditoria finalizada."
log ""
log "Relatório gerado em:"
log ""
log '```txt'
log "$REPORT"
log '```'

echo ""
echo "✅ Auditoria concluída."
echo "📄 Relatório gerado em: $REPORT"