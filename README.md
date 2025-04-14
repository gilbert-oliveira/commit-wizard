# Commit Wizard

Gere mensagens de commit convencionais automaticamente com base nas alterações no código usando a API da OpenAI.

## ✨ Visão Geral

Este projeto é uma ferramenta de linha de comando (CLI) chamada `commit-wizard`, que utiliza a API da OpenAI para gerar mensagens de commit com base no `diff` dos arquivos que estão em *staged* no Git.

## 🚀 Instalação

```bash
npm install -g commit-wizard
```

Ou, se estiver usando localmente:

```bash
npm install
```

## ⚙️ Configuração

Antes de usar, você precisa definir a variável de ambiente com sua chave da OpenAI:

```bash
export OPENAI_API_KEY=sk-...
```

Você pode adicionar isso no seu `.bashrc`, `.zshrc` ou arquivo de ambiente equivalente.

## 🧠 Como Funciona

1. O script lê os arquivos que estão em *staged* (`git diff --cached`).
2. Envia esse diff para a API da OpenAI.
3. Recebe uma sugestão de mensagem de commit no formato convencional (`feat:`, `fix:`, etc).
4. Exibe a mensagem para revisão.

## 📝 Exemplo de Uso

```bash
npx commit-wizard
```

Resultado esperado:

```
Sugestão de commit:
feat: adiciona verificação automática para arquivos staged usando GPT-4
```

## 🛠 Tecnologias Utilizadas

- Node.js
- TypeScript
- OpenAI API
- Commander (CLI)
- Dotenv

## 🧪 Scripts Disponíveis

- `npm run build`: compila o TypeScript para JavaScript.
- `npm start`: executa o CLI direto pelo TypeScript (com ts-node).
- `npm run dev`: roda em modo de desenvolvimento com `ts-node-dev`.

## ✅ Commit Convencional

Este projeto segue o padrão de commit convencional, como:

- `feat:` para novas funcionalidades
- `fix:` para correções de bugs
- `docs:` para documentação
- `refactor:` para mudanças internas no código

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Feito com 💜 por Gilbert de Oliveira Santos