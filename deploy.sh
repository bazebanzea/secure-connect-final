#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# deploy.sh — SentinelMFA · Déploiement Supabase complet
# Lance depuis le dossier du projet : ./deploy.sh
# ═══════════════════════════════════════════════════════════
set -euo pipefail

TOKEN="sbp_6d326dfc1936fb0f3450f79fe5223d830b30e65f"
PROJECT_REF="dvyhvkzipxaotuazcjbl"
PROJECT_URL="https://dvyhvkzipxaotuazcjbl.supabase.co"

G='\033[0;32m'; B='\033[0;34m'; Y='\033[1;33m'; R='\033[0;31m'; N='\033[0m'
ok()   { echo -e "${G}✓  $1${N}"; }
step() { echo -e "\n${B}▶  $1${N}"; }
die()  { echo -e "${R}✗  $1${N}"; exit 1; }

echo -e "${B}"
echo "╔══════════════════════════════════════════╗"
echo "║    SentinelMFA — Déploiement Supabase    ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${N}"

# ── 1. CLI Supabase ────────────────────────────────────────
step "Vérification de la CLI Supabase"
if ! command -v supabase &>/dev/null; then
  echo "  Installation en cours..."
  if command -v brew &>/dev/null; then
    brew install supabase/tap/supabase
  elif command -v npm &>/dev/null; then
    npm install -g supabase
  elif command -v winget &>/dev/null; then
    winget install Supabase.CLI
  else
    die "Installe la CLI manuellement: https://supabase.com/docs/guides/cli"
  fi
fi
ok "CLI $(supabase --version)"

# ── 2. Connexion ────────────────────────────────────────────
step "Connexion Supabase"
supabase login --token "$TOKEN"
ok "Connecté"

# ── 3. Lien projet ──────────────────────────────────────────
step "Lien avec le projet $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF"
ok "Projet lié"

# ── 4. Migrations SQL ───────────────────────────────────────
step "Déploiement du schéma SQL (tables + RLS)"
supabase db push
ok "Schéma déployé : profiles, mfa_factors, passkeys, webauthn_challenges"

# ── 5. Secrets WebAuthn ────────────────────────────────────
step "Configuration des secrets Edge Functions"
supabase secrets set \
  WEBAUTHN_RP_NAME="SentinelMFA" \
  WEBAUTHN_RP_ID="localhost" \
  WEBAUTHN_ORIGIN="http://localhost:5173"
ok "Secrets configurés"

# ── 6. Edge Functions ──────────────────────────────────────
step "Déploiement des 4 Edge Functions WebAuthn"
for fn in webauthn-register-start webauthn-register-finish webauthn-auth-start webauthn-auth-finish; do
  echo -n "   $fn ... "
  supabase functions deploy "$fn"
  echo -e "${G}✓${N}"
done

# ── 7. Résumé ──────────────────────────────────────────────
echo ""
echo -e "${G}╔══════════════════════════════════════════╗${N}"
echo -e "${G}║       ✅  Déploiement terminé !           ║${N}"
echo -e "${G}╚══════════════════════════════════════════╝${N}"
echo ""
echo "  🌐  Dashboard : https://supabase.com/dashboard/project/${PROJECT_REF}"
echo "  🔗  API URL   : ${PROJECT_URL}"
echo ""
echo -e "${B}  Lance l'app :${N}"
echo "      npm install"
echo "      npm run dev"
echo ""
echo -e "${Y}  ⚠  Pour mettre en production, mets à jour les secrets :${N}"
echo "      supabase secrets set WEBAUTHN_RP_ID=ton-domaine.com"
echo "      supabase secrets set WEBAUTHN_ORIGIN=https://ton-domaine.com"
