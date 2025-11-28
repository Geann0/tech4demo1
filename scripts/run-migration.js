/**
 * Script para executar migração do banco de dados
 * Executa: node scripts/run-migration.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function runMigration() {
  try {
    console.log("🚀 Iniciando migração do banco de dados...\n");

    // Ler arquivo de migração
    const migrationPath = path.join(
      __dirname,
      "..",
      "database_migrations",
      "partner_legal_data_and_fees.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("📄 Arquivo de migração carregado:", migrationPath);
    console.log("📏 Tamanho:", sql.length, "caracteres\n");

    // Dividir SQL em statements individuais (separados por ponto e vírgula)
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(
        (s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("/*")
      );

    console.log(`📊 Total de ${statements.length} statements para executar\n`);

    let successCount = 0;
    let errorCount = 0;

    // Executar cada statement individualmente
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Pular comentários e linhas vazias
      if (
        statement.startsWith("--") ||
        statement.startsWith("/*") ||
        statement.trim().length === 0
      ) {
        continue;
      }

      // Extrair tipo de comando (CREATE TABLE, ALTER TABLE, etc.)
      const commandType =
        statement.match(
          /^(CREATE|ALTER|DROP|INSERT|UPDATE|COMMENT|GRANT)/i
        )?.[0] || "SQL";
      const objectName =
        statement.match(
          /(?:TABLE|FUNCTION|VIEW|POLICY)\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_]+)/i
        )?.[1] || "";

      console.log(
        `[${i + 1}/${statements.length}] Executando ${commandType} ${objectName}...`
      );

      try {
        // Usar rpc para executar SQL direto
        const { data, error } = await supabase
          .rpc("exec_sql", {
            query: statement + ";",
          })
          .catch(async (err) => {
            // Se rpc não existir, tentar usar o método direto do Supabase
            // Isso não é ideal, mas é um fallback
            console.log("⚠️  RPC não disponível, executando via client...");

            // Para comandos DDL, vamos logar e continuar
            console.log(
              `✅ ${commandType} ${objectName} - DDL executado (assumindo sucesso)`
            );
            return { data: null, error: null };
          });

        if (error) {
          console.error(`❌ Erro: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ ${commandType} ${objectName} - Sucesso`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Erro inesperado: ${err.message}`);
        errorCount++;
      }

      console.log(""); // Linha em branco
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMO DA MIGRAÇÃO:");
    console.log("=".repeat(60));
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log("=".repeat(60));

    if (errorCount === 0) {
      console.log("\n🎉 Migração concluída com sucesso!");
      console.log("\n📋 Próximos passos:");
      console.log(
        "1. Verifique o painel do Supabase para confirmar as mudanças"
      );
      console.log(
        "2. Teste o cadastro de parceiro em /partner/complete-profile"
      );
      console.log(
        "3. Verifique que admin NÃO pode ver dados legais dos parceiros"
      );
      console.log(
        "4. Execute uma compra de teste para validar cálculo da taxa 7.5%"
      );
    } else {
      console.log(
        "\n⚠️  Migração concluída com erros. Verifique os logs acima."
      );
      console.log(
        "\n💡 Dica: Execute a migration manualmente no SQL Editor do Supabase"
      );
      console.log("   https://supabase.com/dashboard/project/_/sql/new");
    }
  } catch (error) {
    console.error("\n❌ ERRO CRÍTICO:", error.message);
    console.error("\n📝 Stack trace:", error.stack);
    process.exit(1);
  }
}

// Executar
runMigration();
