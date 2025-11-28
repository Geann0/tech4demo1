/**
 * Script para executar a migration em partes menores
 * Executa: node scripts/execute-migration.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Ler .env.local manualmente
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");

const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeMigration() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 EXECUTANDO MIGRATION: partner_legal_data_and_fees.sql");
  console.log("=".repeat(70) + "\n");

  console.log(
    "⚠️  ATENÇÃO: Este script NÃO pode executar DDL via API do Supabase."
  );
  console.log("             A migration deve ser executada manualmente.\n");

  console.log("📋 INSTRUÇÕES:\n");
  console.log("1. Abra o Supabase SQL Editor:");
  console.log(
    "   👉 https://supabase.com/dashboard/project/plphgrlkszglrawjgtvn/sql/new\n"
  );

  console.log("2. Copie o conteúdo do arquivo:");
  console.log("   📁 database_migrations/partner_legal_data_and_fees.sql\n");

  console.log("3. Cole no SQL Editor do Supabase\n");

  console.log("4. Clique em RUN (ou Ctrl+Enter)\n");

  console.log("5. Aguarde a execução (30-60 segundos)\n");

  console.log("6. Execute o verificador:");
  console.log("   node scripts/verify-migration.js\n");

  console.log("=".repeat(70));
  console.log("📖 Mais informações: Consulte MIGRATION_GUIDE.md");
  console.log("=".repeat(70) + "\n");

  // Tentar abrir o arquivo automaticamente
  const migrationPath = path.join(
    __dirname,
    "..",
    "database_migrations",
    "partner_legal_data_and_fees.sql"
  );

  if (fs.existsSync(migrationPath)) {
    console.log("✅ Arquivo de migration encontrado:\n");
    console.log(`   ${migrationPath}\n`);

    const stats = fs.statSync(migrationPath);
    const content = fs.readFileSync(migrationPath, "utf8");
    const lines = content.split("\n").length;

    console.log(`📊 Estatísticas do arquivo:`);
    console.log(`   - Linhas: ${lines}`);
    console.log(`   - Tamanho: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   - Tabelas: partner_legal_data, partner_payouts, audit_log`);
    console.log(`   - Funções: calculate_platform_fee(), log_audit()`);
    console.log(`   - Views: partner_sales_summary\n`);

    // Mostrar preview das primeiras linhas
    const previewLines = content.split("\n").slice(0, 20).join("\n");
    console.log("👀 Preview (primeiras 20 linhas):\n");
    console.log("─".repeat(70));
    console.log(previewLines);
    console.log("─".repeat(70));
    console.log("... (restante do arquivo)\n");
  } else {
    console.error("❌ Arquivo de migration não encontrado!\n");
    process.exit(1);
  }
}

executeMigration();
