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
```

### Instalação Local

Para instalar o Commit Wizard localmente, execute o seguinte comando:

```bash
npm install @gilbert_oliveira/commit-wizard
```

## Uso

Para usar o Commit Wizard, execute o seguinte comando no terminal:

```bash
commit-wizard
```

O Commit Wizard irá gerar uma mensagem de commit com base nas mudanças no repositório Git e na convenção de **Conventional Commits**. Você pode editar a mensagem gerada ou confirmá-la.

## Contribuição

Se você quiser contribuir com o Commit Wizard, siga as instruções abaixo:

1. Faça um fork do repositório.
2. Crie uma nova branch com a sua feature: `git checkout -b my-feature`
3. Faça o commit das suas alterações: `git commit -m 'feat: My new feature'`
4. Faça o push para a sua branch: `git push origin my-feature`
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
