import 'dotenv/config';
console.log("-----------------------------------------");
console.log("📂 Testando leitura do arquivo .env...");
console.log("ID do Projeto:", process.env.PUBLIC_SANITY_PROJECT_ID);
console.log("Token:", process.env.SANITY_API_TOKEN ? "ACHEI! Começa com " + process.env.SANITY_API_TOKEN.substring(0, 4) : "NÃO ACHEI ❌");
console.log("-----------------------------------------");