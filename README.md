# Password Manager App

Monorepo iniziale per la webapp password manager richiesta.

## Struttura

- `frontend/`: React + Vite
- `backend/`: Express API
- `docker-compose.yml`: stack locale con porte alternative

## Porte locali

- Frontend: `http://localhost:5174`
- Backend: `http://localhost:3002`
- PostgreSQL: `localhost:5433`

## Stato attuale

Lo scaffold è pronto per sviluppo incrementale su branch `test`.

## Configurazione ambiente

- Copia [.env.example](.env.example) in [.env](.env) alla root del progetto per Docker Compose e per le URL condivise tra frontend e backend.
- Se lavori direttamente nella cartella backend, puoi usare anche [backend/.env.example](backend/.env.example) come riferimento per le variabili usate dall'API.
- Per l'invio email reale compila `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` e `EMAIL_FROM`.
- `BACKEND_PUBLIC_URL` deve puntare all'URL realmente raggiungibile dal browser per i link di verifica email.
