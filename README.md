# Commit Wizard

O **Commit Wizard** é uma ferramenta automatizada para a geração de mensagens de commit com base na convenção de **Conventional Commits**. Ele ajuda a garantir que suas mensagens de commit sigam um padrão consistente e facilite a comunicação de mudanças no código.

## Funcionalidades

- Geração automática de mensagens de commit usando o **Cody**.
- Garantia de que a mensagem de commit siga o padrão **Conventional Commits**.
- Oferece a opção de editar ou confirmar a mensagem gerada.
- Verificação se o repositório Git está inicializado e se o usuário está autenticado no **Cody**.
- Integração com a ferramenta **Cody** para sugestão de mensagens de commit baseadas no diff de código.

## Instalação

### Requisitos

- **Node.js**: A ferramenta requer o **Node.js** para ser executada.
- **Cody**: A ferramenta usa o **Cody** da Sourcegraph para gerar as mensagens de commit.

### Instalação Global

Para instalar o Commit Wizard globalmente, execute o seguinte comando:

```bash
npm install -g @gilbert_oliveira/commit-wizard
