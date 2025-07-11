# Política de Segurança

## 🛡️ Reportando Vulnerabilidades

Agradecemos que você reporte vulnerabilidades de segurança para nos ajudar a manter o commit-wizard seguro.

### Como Reportar

**NÃO** abra uma issue pública para vulnerabilidades de segurança. Em vez disso:

1. **Email**: Envie um email para [security@gilbert.dev.br](mailto:security@gilbert.dev.br)
2. **GitHub Security**: Use o [GitHub Security Advisories](https://github.com/gilbert-oliveira/commit-wizard/security/advisories)
3. **Formulário**: Use o [formulário de segurança](https://github.com/gilbert-oliveira/commit-wizard/security/advisories/new)

### Informações Necessárias

Por favor, inclua as seguintes informações no seu reporte:

- **Descrição**: Descrição clara da vulnerabilidade
- **Reprodução**: Passos para reproduzir o problema
- **Impacto**: Possível impacto da vulnerabilidade
- **Versão**: Versão do commit-wizard afetada
- **Ambiente**: Sistema operacional, Node.js, Bun
- **Configuração**: Arquivo `.commit-wizardrc` (se relevante)

### Exemplo de Reporte

```
Assunto: [SECURITY] Vulnerabilidade de injeção em prompt

Descrição:
O parâmetro --message permite injeção de comandos através de caracteres especiais.

Reprodução:
1. Execute: commit-wizard --message "$(rm -rf /)"
2. O comando é executado como root

Impacto:
Execução arbitrária de comandos com privilégios elevados.

Versão: 1.0.0
Ambiente: Ubuntu 22.04, Node.js 18, Bun 1.0.0
```

## 🔍 Processo de Resposta

### Timeline

- **24 horas**: Confirmação inicial
- **72 horas**: Análise inicial e classificação
- **7 dias**: Patch disponível (críticas)
- **30 dias**: Patch disponível (altas/médias)
- **90 dias**: Patch disponível (baixas)

### Classificação

- **Crítica**: Execução remota de código, elevação de privilégios
- **Alta**: Vazamento de dados sensíveis, negação de serviço
- **Média**: Vazamento de informações, bypass de validações
- **Baixa**: Problemas de UX, logs expostos

### Comunicação

- **Privada**: Discussão inicial via email/GitHub Security
- **Pública**: GitHub Security Advisory após patch
- **CVE**: Solicitação de CVE para vulnerabilidades críticas/altas

## 🛠️ Medidas de Segurança

### Análise Automática

- **CodeQL**: Análise estática de segurança
- **Dependabot**: Atualizações automáticas de dependências
- **Audit**: Verificação de vulnerabilidades conhecidas
- **Branch Protection**: Proteções contra commits maliciosos

### Boas Práticas

- **Princípio do Menor Privilégio**: Execução com privilégios mínimos
- **Validação de Entrada**: Sanitização de todos os inputs
- **Logs Seguros**: Não logar dados sensíveis
- **Dependências**: Manter dependências atualizadas

### Configuração Segura

```json
{
  "openai": {
    "apiKey": "sk-...",
    "timeout": 30000,
    "maxRetries": 3
  },
  "security": {
    "validateInputs": true,
    "sanitizeOutputs": true,
    "logLevel": "warn"
  }
}
```

## 📋 Histórico de Vulnerabilidades

### 2025

- **Nenhuma vulnerabilidade reportada**

## 🤝 Reconhecimento

Agradecemos aos pesquisadores de segurança que reportam vulnerabilidades de forma responsável:

- [Lista de pesquisadores](https://github.com/gilbert-oliveira/commit-wizard/security/advisories)

## 📞 Contato

- **Email**: [security@gilbert.dev.br](mailto:security@gilbert.dev.br)
- **GitHub**: [Security Advisories](https://github.com/gilbert-oliveira/commit-wizard/security/advisories)

## 📝 Licença

Esta política de segurança está licenciada sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

---

**Última atualização**: Julho 2025
**Próxima revisão**: Julho 2025
