#!/usr/bin/env node
/* eslint-disable */
// cSpell:disable
/**
 * Script de Teste: Validar Integração Mercado Pago
 * Uso: node scripts/test-mercadopago.js
 */

const https = require("https");
const dotenv = require("dotenv");
const path = require("path");

// Carregar .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY;

console.log("🔍 VALIDANDO INTEGRAÇÃO MERCADO PAGO...\n");

// 1. Validar variáveis de ambiente
console.log("1️⃣ Verificando Variáveis de Ambiente:");
if (!accessToken) {
  console.error("❌ MERCADO_PAGO_ACCESS_TOKEN não está configurado");
  process.exit(1);
} else {
  console.log("✅ MERCADO_PAGO_ACCESS_TOKEN configurado");
  console.log(`   Token: ${accessToken.substring(0, 20)}...`);
}

if (!publicKey) {
  console.error("❌ MERCADO_PAGO_PUBLIC_KEY não está configurado");
  process.exit(1);
} else {
  console.log("✅ MERCADO_PAGO_PUBLIC_KEY configurado");
}

// 2. Testar autenticação com API
console.log("\n2️⃣ Testando Autenticação com Mercado Pago API:");

const testAuth = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.mercadopago.com",
      port: 443,
      path: "/v1/payments?limit=1",
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          console.log("✅ Autenticação com API Mercado Pago bem-sucedida!");
          try {
            const response = JSON.parse(data);
            console.log(
              `   Pagamentos encontrados: ${response.paging?.total || 0}`
            );
            resolve(true);
          } catch {
            console.error("⚠️ Resposta não é JSON válido");
            resolve(true);
          }
        } else {
          console.error(`❌ Erro na autenticação (Status ${res.statusCode})`);
          console.error(`   Resposta: ${data.substring(0, 100)}`);
          resolve(false);
        }
      });
    });

    req.on("error", (error) => {
      console.error(`❌ Erro de conexão: ${error.message}`);
      reject(error);
    });

    req.end();
  });
};

// 3. Testar criação de preferência
console.log("\n3️⃣ Testando Criação de Preferência (Pagamento):");

const testPreference = () => {
  return new Promise((resolve, reject) => {
    const preferenceData = JSON.stringify({
      items: [
        {
          id: "test-product",
          title: "Produto de Teste",
          quantity: 1,
          unit_price: 99.9,
          picture_url: "https://via.placeholder.com/150",
        },
      ],
      payer: {
        name: "Test",
        email: "test@test.com",
        phone: { number: "11999999999" },
        address: {
          zip_code: "01310100",
          street_name: "Av. Paulista, 1000",
          city_name: "São Paulo",
          state_name: "SP",
        },
      },
      back_urls: {
        success: "http://localhost:3000/compra-sucesso",
        failure: "http://localhost:3000/compra-falha",
        pending: "http://localhost:3000/conta/compras",
      },
      notification_url: "http://localhost:3000/api/webhooks/mercadopago",
      statement_descriptor: "TECH4LOOP TEST",
    });

    const options = {
      hostname: "api.mercadopago.com",
      port: 443,
      path: "/checkout/preferences",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": preferenceData.length,
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 201) {
          try {
            const response = JSON.parse(data);
            console.log("✅ Preferência criada com sucesso!");
            console.log(`   ID: ${response.id}`);
            console.log(`   URL: ${response.init_point}`);
            resolve(true);
          } catch {
            console.error("⚠️ Resposta não é JSON válido");
            resolve(false);
          }
        } else {
          console.error(
            `❌ Erro ao criar preferência (Status ${res.statusCode})`
          );
          console.error(`   Resposta: ${data.substring(0, 200)}`);
          resolve(false);
        }
      });
    });

    req.on("error", (error) => {
      console.error(`❌ Erro de conexão: ${error.message}`);
      reject(error);
    });

    req.write(preferenceData);
    req.end();
  });
};

// Executar testes
(async () => {
  try {
    const authOk = await testAuth();
    const prefOk = await testPreference();

    console.log("\n📊 RESUMO DOS TESTES:");
    console.log(`   Autenticação:        ${authOk ? "✅" : "❌"}`);
    console.log(`   Criação Preferência: ${prefOk ? "✅" : "❌"}`);

    if (authOk && prefOk) {
      console.log("\n🎉 Integração Mercado Pago está FUNCIONANDO!");
      console.log("\n📝 Próximos passos:");
      console.log("   1. Abra http://localhost:3000/produtos");
      console.log("   2. Adicione um produto ao carrinho");
      console.log("   3. Faça o checkout com um cartão de teste");
      console.log("   4. Use: 4111 1111 1111 1111 / 11/2025 / 123");
      process.exit(0);
    } else {
      console.log("\n⚠️ Alguns testes falharam. Verifique a configuração.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Erro ao executar testes:", error);
    process.exit(1);
  }
})();
