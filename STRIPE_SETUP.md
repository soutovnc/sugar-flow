# Assinaturas com Stripe

O aplicativo usa Stripe Checkout para assinaturas e o Customer Portal para que o cliente possa trocar ou cancelar o plano. As chaves secretas ficam apenas na API em `server/index.mjs`.

## 1. Crie os produtos no Stripe

No Dashboard do Stripe, crie um produto para o Bakery Suite Pro e dois preços recorrentes em BRL: um mensal e outro anual. Copie os IDs `price_...` para `STRIPE_PRICE_MONTHLY` e `STRIPE_PRICE_YEARLY`.

## 2. Configure as variáveis

Copie `.env.example` para `.env` localmente e preencha os valores. No ambiente publicado, cadastre as mesmas variáveis no provedor da API. `EXPO_PUBLIC_BILLING_API_URL` deve apontar para a URL HTTPS pública da API; as demais chaves de servidor não devem ser incluídas no build Expo.

## 3. Configure o webhook

No Stripe Dashboard, cadastre `https://SEU_DOMINIO/api/stripe/webhook` e selecione:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copie o segredo de assinatura gerado para `STRIPE_WEBHOOK_SECRET`. Em desenvolvimento local, execute `stripe listen --forward-to localhost:4242/api/stripe/webhook` e use o segredo exibido pelo CLI.

## 4. Ative o Customer Portal

No Stripe Dashboard, habilite o Customer Portal e permita cancelamento e troca de preço. A tela do app o utiliza para gerenciar uma assinatura existente.

## 5. Execute localmente

```sh
npm run billing:server
```

Em um dispositivo físico, `EXPO_PUBLIC_BILLING_API_URL` não pode usar `localhost`; use o IP da máquina na rede local ou um túnel HTTPS durante o desenvolvimento.

## Observação para iOS

Se a assinatura desbloquear recursos digitais consumidos dentro do app iOS distribuído na App Store, valide antes as regras da Apple sobre compras dentro do app. Stripe Checkout é adequado para web e cenários permitidos pela política, mas pode não substituir o In-App Purchase nesse caso.
