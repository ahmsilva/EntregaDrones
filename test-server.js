console.log("Testando se todas as dependências estão corretas...");

try {
    const server = require('./server.js');
    console.log("✅ Servidor carregado com sucesso!");
    console.log("🎉 Todas as dependências e rotas estão funcionando!");
} catch (error) {
    console.error("❌ Erro ao carregar o servidor:", error.message);
    process.exit(1);
}