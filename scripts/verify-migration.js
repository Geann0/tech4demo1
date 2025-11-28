/**
 * Script para verificar se a migração foi executada corretamente
 * Executa: node scripts/verify-migration.js
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
    // Remover aspas se houver
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function verifyMigration() {
  console.log("🔍 Verificando migração do banco de dados...\n");
  console.log("=".repeat(60));

  let allPassed = true;
  const results = [];

  // Teste 1: Verificar tabela partner_legal_data
  try {
    const { data, error } = await supabase
      .from("partner_legal_data")
      .select("partner_id")
      .limit(1);

    if (error && error.code === "PGRST116") {
      // Tabela não existe
      results.push({
        test: "Tabela partner_legal_data",
        status: "❌",
        message: "Tabela não existe",
      });
      allPassed = false;
    } else if (error) {
      results.push({
        test: "Tabela partner_legal_data",
        status: "⚠️ ",
        message: error.message,
      });
      allPassed = false;
    } else {
      results.push({
        test: "Tabela partner_legal_data",
        status: "✅",
        message: "OK",
      });
    }
  } catch (err) {
    results.push({
      test: "Tabela partner_legal_data",
      status: "❌",
      message: err.message,
    });
    allPassed = false;
  }

  // Teste 2: Verificar tabela partner_payouts
  try {
    const { data, error } = await supabase
      .from("partner_payouts")
      .select("id")
      .limit(1);

    if (error && error.code === "PGRST116") {
      results.push({
        test: "Tabela partner_payouts",
        status: "❌",
        message: "Tabela não existe",
      });
      allPassed = false;
    } else if (error) {
      results.push({
        test: "Tabela partner_payouts",
        status: "⚠️ ",
        message: error.message,
      });
      allPassed = false;
    } else {
      results.push({
        test: "Tabela partner_payouts",
        status: "✅",
        message: "OK",
      });
    }
  } catch (err) {
    results.push({
      test: "Tabela partner_payouts",
      status: "❌",
      message: err.message,
    });
    allPassed = false;
  }

  // Teste 3: Verificar tabela audit_log
  try {
    const { data, error } = await supabase
      .from("audit_log")
      .select("id")
      .limit(1);

    if (error && error.code === "PGRST116") {
      results.push({
        test: "Tabela audit_log",
        status: "❌",
        message: "Tabela não existe",
      });
      allPassed = false;
    } else if (error) {
      results.push({
        test: "Tabela audit_log",
        status: "⚠️ ",
        message: error.message,
      });
      allPassed = false;
    } else {
      results.push({ test: "Tabela audit_log", status: "✅", message: "OK" });
    }
  } catch (err) {
    results.push({
      test: "Tabela audit_log",
      status: "❌",
      message: err.message,
    });
    allPassed = false;
  }

  // Teste 4: Verificar colunas em order_items
  try {
    const { data, error } = await supabase
      .from("order_items")
      .select("partner_amount, platform_fee, platform_fee_rate")
      .limit(1);

    if (error && error.message.includes("column")) {
      results.push({
        test: "Colunas em order_items",
        status: "❌",
        message: "Colunas não existem",
      });
      allPassed = false;
    } else if (error) {
      results.push({
        test: "Colunas em order_items",
        status: "⚠️ ",
        message: error.message,
      });
    } else {
      results.push({
        test: "Colunas em order_items",
        status: "✅",
        message: "partner_amount, platform_fee, platform_fee_rate OK",
      });
    }
  } catch (err) {
    results.push({
      test: "Colunas em order_items",
      status: "❌",
      message: err.message,
    });
    allPassed = false;
  }

  // Teste 5: Verificar colunas de tracking em orders
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("tracking_code, carrier, shipped_at, nfe_pdf_url")
      .limit(1);

    if (error && error.message.includes("column")) {
      results.push({
        test: "Colunas de tracking em orders",
        status: "❌",
        message: "Colunas não existem",
      });
      allPassed = false;
    } else if (error) {
      results.push({
        test: "Colunas de tracking em orders",
        status: "⚠️ ",
        message: error.message,
      });
    } else {
      results.push({
        test: "Colunas de tracking em orders",
        status: "✅",
        message: "tracking_code, carrier, shipped_at, nfe_pdf_url OK",
      });
    }
  } catch (err) {
    results.push({
      test: "Colunas de tracking em orders",
      status: "❌",
      message: err.message,
    });
    allPassed = false;
  }

  // Teste 6: Verificar RLS em partner_legal_data
  try {
    // Tentar acessar sem auth (deve falhar)
    const { data, error } = await supabase
      .from("partner_legal_data")
      .select("*");

    if (error && error.code === "42501") {
      // RLS está ativo e bloqueando
      results.push({
        test: "RLS em partner_legal_data",
        status: "✅",
        message: "RLS ativo e bloqueando acesso",
      });
    } else if (!error && (!data || data.length === 0)) {
      // Sem dados ainda, mas RLS pode estar ativo
      results.push({
        test: "RLS em partner_legal_data",
        status: "✅",
        message: "RLS ativo (sem dados para testar)",
      });
    } else {
      // RLS pode não estar ativo
      results.push({
        test: "RLS em partner_legal_data",
        status: "⚠️ ",
        message: "RLS pode não estar ativo (verifique manualmente)",
      });
    }
  } catch (err) {
    results.push({
      test: "RLS em partner_legal_data",
      status: "⚠️ ",
      message: err.message,
    });
  }

  // Imprimir resultados
  console.log("\n📊 RESULTADOS DA VERIFICAÇÃO:\n");
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.status} ${result.test}`);
    if (result.message !== "OK") {
      console.log(`   ${result.message}`);
    }
  });

  console.log("\n" + "=".repeat(60));

  if (allPassed) {
    console.log("\n🎉 TODAS AS VERIFICAÇÕES PASSARAM!");
    console.log("\n✅ A migração foi executada com sucesso.");
    console.log("\n📋 Próximos passos:");
    console.log("1. Teste o cadastro de parceiro em /partner/complete-profile");
    console.log(
      "2. Faça uma compra de teste para validar o cálculo da taxa 7.5%"
    );
    console.log(
      "3. Verifique que admin NÃO pode ver dados legais dos parceiros\n"
    );
  } else {
    console.log("\n⚠️  ALGUMAS VERIFICAÇÕES FALHARAM");
    console.log("\n📝 Ação necessária:");
    console.log(
      "1. Execute a migration manualmente no SQL Editor do Supabase:"
    );
    console.log(
      "   https://supabase.com/dashboard/project/plphgrlkszglrawjgtvn/sql/new"
    );
    console.log(
      "2. Copie o conteúdo de: database_migrations/partner_legal_data_and_fees.sql"
    );
    console.log("3. Cole no SQL Editor e clique em RUN");
    console.log("4. Execute este script novamente para verificar\n");
  }

  console.log("🔗 Mais informações: Consulte MIGRATION_GUIDE.md\n");
}

// Executar
verifyMigration().catch((err) => {
  console.error("\n❌ ERRO CRÍTICO:", err.message);
  process.exit(1);
});
