# Ninho — quiz LATAM e organizador do bebê

Quiz em espanhol com moeda por país, oferta de **US$9.99 em pagamento único**, tela de login e organizador.

## URLs da publicação no GitHub Pages

- Quiz: `/ninho/`
- Login: `/ninho/login.html`
- Organizador: `/ninho/app.html`

Os arquivos desta pasta podem ficar no repositório público. Nenhuma senha de comprador, token de sessão, chave de webhook ou chave de e-mail deve ser adicionada ao GitHub.

## Estado desta entrega

- Frontend pronto para publicação em GitHub Pages.
- Login: e-mail da compra + código individual enviado após pagamento confirmado.
- Servidor de acesso implementado e testado com SQLite e e-mail simulado.
- **Pendente antes de vender:** implantar o Worker e D1 na conta Cloudflare, configurar remetente de e-mail, checkout real e adaptador autenticado do provedor de pagamento. Esta entrega não configura uma conta de pagamento e não prova uma compra real.
- Sem API configurada, o login não libera o app. Sem checkout em `config.js`, o botão de compra fica desativado.
- Código JavaScript é público; o bloqueio de compras não é DRM. O servidor protege a sessão, a autorização e os dados de cada comprador.

## Configuração do servidor

1. Criar um banco Cloudflare D1 e aplicar `backend/schema.sql`.
2. Copiar `backend/wrangler.example.toml` para `backend/wrangler.toml`; preencher o banco e o identificador real do produto.
3. Configurar a rota **somente** `newstodayhealth.online/ninho/api/*`. As outras páginas do domínio continuam no GitHub Pages. A rota precisa do proxy Cloudflare ativo e deve encaminhar ao Worker.
4. Definir segredos em runtime: `WEBHOOK_SECRET`, `ACCESS_CODE_SECRET` (pelo menos 32 caracteres aleatórios cada) e `RESEND_API_KEY`. Definir `MAIL_FROM` com remetente verificado. Não salvar valores reais no repositório.
5. Publicar o Worker com a conta Cloudflare do proprietário. Os endpoints devem estar no mesmo domínio do frontend, via HTTPS.
6. Preencher `checkoutUrl` em `config.js` com o checkout **real** de US$9.99. A página de retorno deve apontar para `/ninho/login.html`. O retorno do navegador NÃO confirma pagamento nem libera acesso.
7. Ligar o adaptador do checkout ao endpoint abaixo. Só ativar vendas depois de testar compra aprovada, reembolso e entrega do e-mail com o provedor real.

## Integração de pagamentos: contrato interno

`POST /ninho/api/webhook` aceita eventos **normalizados e assinados por um integrador confiável**. Não é um webhook pronto de Monetizze, Greenn, Stripe ou outro provedor. O adaptador específico ainda precisa ser conectado depois de escolher o checkout.

O adaptador deve primeiro validar a assinatura oficial ou consultar o pedido autenticado no provedor. Não pode aceitar um status enviado pelo navegador. Depois deve assinar o corpo original enviado ao Ninho.

Headers:

- `x-ninho-timestamp`: epoch em segundos, tolerância de 5 minutos.
- `x-ninho-signature`: `sha256=` + HMAC-SHA256 hexadecimal de `timestamp + '.' + corpo_JSON_exato`, com `WEBHOOK_SECRET`.

Exemplo de corpo (valores ilustrativos, nunca autoriza sozinho):

```json
{"event_id":"provider-event-id","order_id":"provider-order-id","email":"buyer@example.com","product_id":"configured-product-id","status":"approved","amount":999,"currency":"USD"}
```

`amount` usa centavos. Compras devem corresponder ao produto configurado e a USD 999 centavos. Para checkout que efetivamente cobra outra moeda, implementar reconciliação segura do preço do produto no adaptador; não converter um valor informado pelo navegador.

`status`: `approved`, `refunded` ou `chargeback`. Reembolso e chargeback são terminais para o pedido, inclusive quando um evento de aprovação chega depois. Outra compra válida pode restabelecer acesso. Eventos repetidos são idempotentes; falha de e-mail retorna erro para o integrador tentar novamente. O integrador deve gerar um novo timestamp e assinatura para cada tentativa.

O e-mail é enviado somente depois de evento aprovado autenticado. O código individual não aparece na resposta do webhook nem é salvo em texto puro no banco. O código é uma credencial reutilizável: orientamos não compartilhar. Rotação de `ACCESS_CODE_SECRET` exige um plano de reemissão de códigos; não fazer por rotina.

## Sessão e dados

- Cookie opaco de sessão de 30 dias: HttpOnly, Secure e SameSite=Lax; só o hash fica no banco.
- Toda consulta e gravação de plano revalida sessão e compra aprovada no servidor.
- O plano é vinculado ao e-mail autenticado; o cliente não escolhe o proprietário dos dados.
- Gravações exigem origem exata e há limitação de tentativas de login por e-mail e IP.
- Reembolso retira acesso nos próximos pedidos ao servidor; não apaga backups já baixados.
- O plano do app sincroniza com o servidor. Durante falha de conexão, mudanças ficam no cache local e um aviso pede backup. Fechar antes da sincronização pode perder as últimas alterações em outro aparelho.
- Fotos comprimidas são incluídas no plano; o servidor limita a requisição a 2 MB. Para muitas fotos, será necessário armazenamento de imagens separado.

## Verificação local

Requer Node moderno e Python 3 com SQLite, sem dependências externas:

```sh
node tests/access.mjs
node --check app.js
node --check funnel.js
node --check account.js
```

Os testes validam assinatura, produto e preço, evento repetido, login, sessão, isolamento de conta, CSRF, reembolso, evento fora de ordem, logout e limite de tentativas. E-mails são simulados; nenhum comprador real recebe mensagens nos testes.

## Referências de implementação

- https://developers.cloudflare.com/d1/worker-api/prepared-statements/
- https://resend.com/docs/api-reference/emails/send-email

## Moeda

O país determina o código ISO da moeda do orçamento. Não há conversão cambial automática. Artigos começam com preço a definir; o comprador preenche seus valores locais. O preço do acesso é separado: US$9.99.
