# Raid Guides landing

Landing page estática de `www.raidguides.pt`, independente da aplicação Fumadocs.

## Desenvolvimento local

Com Node.js instalado:

```powershell
node preview.mjs
```

## Container

O container Nginx escuta internamente na porta `8080`. No stack principal, essa
porta é publicada como `3000`.

Todas as ligações para a documentação usam `https://docs.raidguides.pt`.
