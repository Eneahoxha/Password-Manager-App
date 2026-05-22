# 🔐 SecureVault — Password Manager Web App
## Documento di Progettazione Completo
> Versione 1.0 | Destinato a: GitHub Copilot / Cursor AI / VS Code  
> Stack: React + Node.js + PostgreSQL | Deploy: Vercel + Render

---

## 📋 INDICE

1. [Visione del Prodotto](#1-visione-del-prodotto)
2. [Requisiti Funzionali (RF)](#2-requisiti-funzionali-rf)
3. [Requisiti Non Funzionali (RNF)](#3-requisiti-non-funzionali-rnf)
4. [User Stories](#4-user-stories)
5. [Stack Tecnologico](#5-stack-tecnologico)
6. [Architettura del Sistema](#6-architettura-del-sistema)
7. [Struttura delle Directory](#7-struttura-delle-directory)
8. [Modello Dati (Database Schema)](#8-modello-dati-database-schema)
9. [API REST — Specifica degli Endpoint](#9-api-rest--specifica-degli-endpoint)
10. [Sicurezza — Implementazione Dettagliata](#10-sicurezza--implementazione-dettagliata)
11. [Frontend — Componenti React](#11-frontend--componenti-react)
12. [Configurazione CI/CD e Deploy](#12-configurazione-cicd-e-deploy)
13. [Variabili d'Ambiente](#13-variabili-dambiente)
14. [Prompt per Copilot — Task Sequenziali](#14-prompt-per-copilot--task-sequenziali)

---

## 1. Visione del Prodotto

**SecureVault** è una web application per la gestione sicura delle password personali. L'utente si registra, accede e gestisce un "vault" cifrato contenente le proprie credenziali (sito, username, password, note). Ogni dato sensibile viene cifrato lato client con AES-GCM prima di essere trasmesso al server, rendendo il backend un semplice custode di dati opachi.

**Obiettivo principale:** Costruire un'app full-stack con livello di sicurezza production-grade, zero costi di infrastruttura, e codice SOLID e testabile.

---

## 2. Requisiti Funzionali (RF)

### RF-01 — Registrazione Utente
- L'utente può creare un account fornendo email e master password.
- La master password viene hashata con **bcrypt** (salt rounds ≥ 12) prima di essere salvata.
- Il sistema verifica che l'email non sia già registrata e restituisce un errore chiaro in caso contrario.
- Al termine della registrazione viene restituito un messaggio di successo (no auto-login).

### RF-02 — Autenticazione (Login)
- L'utente accede con email e master password.
- Il backend verifica le credenziali e, se corrette, genera un **JWT Access Token** (scadenza: 15 minuti) e un **Refresh Token** (scadenza: 7 giorni).
- Entrambi i token vengono impostati come **cookie HttpOnly, Secure, SameSite=Strict**.
- Al login viene rigenerato l'identificativo di sessione (session regeneration).

### RF-03 — Logout
- L'utente può eseguire il logout.
- Il backend invalida il Refresh Token nel database (revoca attiva).
- I cookie vengono cancellati (Max-Age=0).

### RF-04 — Refresh della Sessione
- Prima della scadenza dell'Access Token, il frontend chiama `/api/auth/refresh`.
- Se il Refresh Token è valido e non revocato, il backend emette un nuovo Access Token.
- Implementare la rotazione del Refresh Token (ogni refresh emette un nuovo RT e invalida il vecchio).

### RF-05 — Creazione Voce nel Vault (Create)
- L'utente autenticato può aggiungere una nuova credenziale al vault.
- Campi obbligatori: `site_name`, `encrypted_payload` (stringa AES-GCM cifrata lato client).
- Campi opzionali: `username`, `url`, `notes` (tutti cifrati nel payload).
- Il backend associa la voce all'`user_id` estratto dal JWT (mai dal body della richiesta).

### RF-06 — Lettura Vault (Read)
- L'utente può recuperare la lista delle proprie voci (solo metadati non sensibili: id, site_name, created_at, updated_at).
- L'utente può recuperare una singola voce completa (incluso `encrypted_payload`) per ID.
- Il sistema verifica che la voce richiesta appartenga all'utente autenticato (Autorizzazione forte).

### RF-07 — Modifica Voce (Update)
- L'utente può aggiornare una voce esistente del proprio vault.
- Il payload aggiornato è cifrato lato client prima dell'invio.
- Il backend aggiorna solo le voci di proprietà dell'utente autenticato.

### RF-08 — Eliminazione Voce (Delete)
- L'utente può eliminare una voce del proprio vault.
- Il backend verifica la proprietà prima di eliminare.
- L'eliminazione è permanente (soft-delete opzionale nella v2).

### RF-09 — Generatore di Password
- Il frontend offre un generatore di password casuale configurabile (lunghezza, maiuscole, numeri, simboli).
- La generazione avviene interamente lato client (no chiamate API), usando `crypto.getRandomValues()`.

### RF-10 — Ricerca nel Vault
- L'utente può filtrare le voci del vault per nome del sito (ricerca client-side sulla lista già caricata).

---

## 3. Requisiti Non Funzionali (RNF)

### RNF-01 — Sicurezza: Zero Trust
- Il backend non si fida di alcun dato proveniente dal client senza validazione.
- Ogni richiesta autenticata verifica il JWT; ogni operazione CRUD verifica la proprietà della risorsa.

### RNF-02 — Sicurezza: Cifratura End-to-End del Vault
- Le password nel vault NON vengono mai inviate in chiaro al server.
- Il client cifra con **AES-256-GCM** usando la **Web Crypto API** del browser (nativa, no dipendenze).
- La chiave di cifratura viene derivata dalla master password con **PBKDF2** (100.000+ iterazioni, SHA-256).
- La chiave derivata NON viene mai inviata al server.

### RNF-03 — Sicurezza: Protezione Token
- JWT salvato SOLO in cookie HttpOnly (mai localStorage, mai sessionStorage).
- Flag cookie: `HttpOnly=true`, `Secure=true`, `SameSite=Strict`, `Path=/api`.
- Access Token scadenza: **15 minuti**. Refresh Token scadenza: **7 giorni**.

### RNF-04 — Sicurezza: Prevenzione XSS
- Input Sanitization su tutti i campi in ingresso (backend: libreria `validator.js` o `zod`).
- Output Encoding: React gestisce nativamente l'escaping del DOM (no `dangerouslySetInnerHTML`).
- Content Security Policy (CSP) impostata via header HTTP (`helmet.js`).

### RNF-05 — Sicurezza: Prevenzione SQL Injection
- Uso esclusivo di **query parametrizzate** tramite ORM (Prisma) o driver con prepared statements.
- Nessuna concatenazione di stringhe nelle query SQL.

### RNF-06 — Sicurezza: Rate Limiting
- Endpoint `/api/auth/login` e `/api/auth/register`: massimo **10 richieste per IP ogni 15 minuti**.
- Implementato con `express-rate-limit`.

### RNF-07 — Sicurezza: HTTPS Obbligatorio
- Tutto il traffico avviene su TLS. Render e Vercel forniscono certificati SSL automatici.
- Il backend rifiuta richieste HTTP non criptate in produzione.

### RNF-08 — Architettura: SOLID e Esagonale
- **SRP**: ogni modulo ha una singola responsabilità (auth, vault, crypto, db).
- **DIP**: il Core della business logic non dipende da implementazioni specifiche di DB o framework.
- **Porte e Adattatori**: le interfacce del repository astraggono l'accesso ai dati.

### RNF-09 — Performance
- Risposta API < 500ms per il 95° percentile in condizioni normali.
- Il frontend carica in < 3 secondi su connessione 4G (Vite ottimizza il bundle).

### RNF-10 — Testabilità
- Copertura unit test backend: ≥ 70% (Jest).
- Test di integrazione per tutti gli endpoint autenticati.
- Il frontend ha test sui componenti critici (React Testing Library).

### RNF-11 — Usabilità
- L'interfaccia è responsive (mobile-first).
- Feedback visivo immediato su ogni azione (loading state, messaggi di errore/successo).
- Mascheramento delle password con toggle visibilità.

### RNF-12 — Disponibilità
- Uptime target: 99% (compatibile con free tier di Render).
- Gestione graceful degli errori: no stack trace esposti al client in produzione.

---

## 4. User Stories

### Epic 1 — Gestione Account

**US-01** — Come **nuovo utente**, voglio **registrarmi con email e master password**, così da **creare il mio vault personale**.
- Criteri di accettazione:
  - [ ] Il form valida il formato email lato client e lato server.
  - [ ] La password richiede minimo 12 caratteri, 1 maiuscola, 1 numero, 1 simbolo.
  - [ ] In caso di email già esistente, il sistema mostra un errore generico (no info leakage).
  - [ ] La password non viene mai trasmessa in chiaro nel log del server.

**US-02** — Come **utente registrato**, voglio **accedere con le mie credenziali**, così da **poter gestire il mio vault**.
- Criteri di accettazione:
  - [ ] Il login richiede email e master password.
  - [ ] Dopo 5 tentativi falliti in 15 minuti lo stesso IP viene bloccato (rate limit).
  - [ ] Al login riuscito vengo reindirizzato alla dashboard del vault.
  - [ ] Il JWT è impostato come cookie HttpOnly (verificabile negli strumenti dev del browser).

**US-03** — Come **utente autenticato**, voglio **effettuare il logout**, così da **proteggere il mio account su dispositivi condivisi**.
- Criteri di accettazione:
  - [ ] Il logout cancella i cookie di sessione.
  - [ ] Il Refresh Token viene invalidato nel database.
  - [ ] Dopo il logout, accedere a rotte protette restituisce 401.

**US-04** — Come **utente autenticato**, voglio che **la mia sessione si rinnovi automaticamente**, così da **non essere disconnesso mentre sto lavorando**.
- Criteri di accettazione:
  - [ ] Il frontend intercetta il 401 sull'Access Token scaduto e chiama silenziosamente `/refresh`.
  - [ ] Se il refresh ha successo, la richiesta originale viene ritentata.
  - [ ] Se il refresh fallisce, l'utente viene reindirizzato al login.

---

### Epic 2 — Gestione Vault

**US-05** — Come **utente autenticato**, voglio **aggiungere una nuova credenziale al vault**, così da **conservarla in modo sicuro**.
- Criteri di accettazione:
  - [ ] Il form richiede almeno il nome del sito.
  - [ ] La password è cifrata nel browser prima dell'invio al server.
  - [ ] Dopo il salvataggio la voce appare nella lista del vault.
  - [ ] Il server non può leggere la password in chiaro.

**US-06** — Come **utente autenticato**, voglio **vedere la lista delle mie credenziali salvate**, così da **trovare rapidamente quella che mi serve**.
- Criteri di accettazione:
  - [ ] La lista mostra nome sito, username (se presente) e data di creazione.
  - [ ] La lista è ordinata per nome sito in modo alfabetico di default.
  - [ ] Un campo di ricerca filtra le voci in tempo reale.
  - [ ] La password non è visibile nella lista (solo dopo aver aperto la voce).

**US-07** — Come **utente autenticato**, voglio **visualizzare i dettagli di una credenziale**, così da **copiare la password quando ne ho bisogno**.
- Criteri di accettazione:
  - [ ] La password viene decifrata nel browser al momento della visualizzazione.
  - [ ] La password è nascosta di default con un'opzione per mostrarla.
  - [ ] Un pulsante "Copia" copia la password negli appunti senza mostrarla a schermo.
  - [ ] Gli appunti vengono svuotati automaticamente dopo 30 secondi.

**US-08** — Come **utente autenticato**, voglio **modificare una credenziale esistente**, così da **aggiornare la password quando la cambio su un sito**.
- Criteri di accettazione:
  - [ ] Il form di modifica precompila i campi con i valori attuali (decifrati).
  - [ ] Il salvataggio cifra il nuovo payload prima dell'invio.
  - [ ] La data `updated_at` viene aggiornata.

**US-09** — Come **utente autenticato**, voglio **eliminare una credenziale dal vault**, così da **rimuovere account che non uso più**.
- Criteri di accettazione:
  - [ ] Viene richiesta una conferma esplicita prima dell'eliminazione.
  - [ ] Dopo l'eliminazione la voce scompare dalla lista.
  - [ ] Non è possibile eliminare voci di altri utenti (403 Forbidden).

**US-10** — Come **utente autenticato**, voglio **generare una password sicura**, così da **creare credenziali forti senza doverle inventare**.
- Criteri di accettazione:
  - [ ] Il generatore è accessibile direttamente dal form di aggiunta/modifica.
  - [ ] Posso configurare: lunghezza (8-128), maiuscole, minuscole, numeri, simboli.
  - [ ] La password generata usa `crypto.getRandomValues()` (no `Math.random()`).
  - [ ] Un click copia la password generata negli appunti.

---

### Epic 3 — Sicurezza e Robustezza

**US-11** — Come **utente preoccupato per la sicurezza**, voglio che **le mie password siano illeggibili anche per gli sviluppatori dell'app**, così da **avere la massima privacy**.
- Criteri di accettazione:
  - [ ] Il database contiene solo blob cifrati.
  - [ ] La chiave di decifratura non viene mai inviata al server.
  - [ ] I log del server non contengono dati sensibili.

**US-12** — Come **utente**, voglio che **la sessione scada dopo un periodo di inattività**, così da **essere protetto se dimentico il browser aperto**.
- Criteri di accettazione:
  - [ ] Absolute timeout: la sessione scade dopo 24 ore dal login, indipendentemente dall'attività.
  - [ ] L'utente viene avvisato prima della scadenza con un banner.

---

## 5. Stack Tecnologico

### Frontend
| Tecnologia | Versione | Scopo |
|---|---|---|
| **React** | 18.x | UI framework, paradigma dichiarativo |
| **Vite** | 5.x | Build tool, dev server ultra-veloce |
| **React Router DOM** | 6.x | Routing SPA (client-side) |
| **Axios** | 1.x | HTTP client con interceptor per token refresh |
| **shadcn/ui** | latest | **Unica libreria UI del progetto.** Fornisce tutti i componenti (Button, Input, Card, Dialog, Sheet, Badge, Alert, Tooltip, DropdownMenu, Separator, Switch, Slider, Skeleton, Label, Toast). I componenti vengono copiati come source code in `src/components/ui/` tramite CLI (`npx shadcn@latest add <component>`). Usa internamente Radix UI (primitivi accessibili headless) e Tailwind CSS — entrambi installati come peer dependencies ma **non usati direttamente nel codice applicativo**: tutto passa dai componenti shadcn. |
| **lucide-react** | latest | Icone SVG, inclusa automaticamente dall'installazione di shadcn/ui |
| **Web Crypto API** | nativa | Cifratura AES-GCM, derivazione chiave PBKDF2 |
| **React Hook Form** | 7.x | Gestione form performante, integrato con shadcn `<Form>` component |
| **Zod** | 3.x | Validazione schema lato client, integrato con `@hookform/resolvers/zod` |

### Backend
| Tecnologia | Versione | Scopo |
|---|---|---|
| **Node.js** | 20.x LTS | Runtime JavaScript server-side |
| **Express.js** | 4.x | Web framework minimalista |
| **Prisma ORM** | 5.x | ORM type-safe, migrations, query builder |
| **jsonwebtoken** | 9.x | Generazione e verifica JWT |
| **bcryptjs** | 2.x | Hashing sicuro delle password |
| **cookie-parser** | 1.x | Parsing dei cookie nelle request |
| **helmet** | 7.x | Security headers automatici |
| **express-rate-limit** | 7.x | Rate limiting per endpoint sensibili |
| **cors** | 2.x | Configurazione CORS restrittiva |
| **zod** | 3.x | Validazione e sanitizzazione input |
| **dotenv** | 16.x | Gestione variabili d'ambiente |

### Database
| Tecnologia | Versione | Scopo |
|---|---|---|
| **PostgreSQL** | 15.x | RDBMS relazionale, hosted su Render |

### Testing
| Tecnologia | Scopo |
|---|---|
| **Jest** | Unit e integration test backend |
| **Supertest** | Test HTTP endpoint Express |
| **React Testing Library** | Test componenti React |
| **Vitest** | Test runner per il frontend (integrato in Vite) |

### DevOps / CI-CD
| Servizio | Scopo |
|---|---|
| **GitHub** | Source control, trigger CI/CD |
| **Vercel** | Deploy automatico frontend (collegato a GitHub) |
| **Render** | Deploy backend + PostgreSQL (collegato a GitHub) |

---

## 6. Architettura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  React App (Vite)                                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │  │
│  │  │  Auth    │  │  Vault   │  │  CryptoService  │  │  │
│  │  │ Context  │  │  Pages   │  │  (Web Crypto    │  │  │
│  │  └──────────┘  └──────────┘  │   API - PBKDF2  │  │  │
│  │                              │   + AES-GCM)    │  │  │
│  │                              └─────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│          │ HTTPS + Cookie HttpOnly (JWT)                  │
└──────────┼──────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Middleware Layer                                   │  │
│  │  helmet | cors | cookie-parser | rate-limit        │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌──────────────────┐  ┌────────────────────────────────┐ │
│  │  Auth Router     │  │  Vault Router                  │ │
│  │  POST /register  │  │  GET    /vault                 │ │
│  │  POST /login     │  │  GET    /vault/:id             │ │
│  │  POST /logout    │  │  POST   /vault                 │ │
│  │  POST /refresh   │  │  PUT    /vault/:id             │ │
│  └──────────────────┘  │  DELETE /vault/:id             │ │
│                        └────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Core (Business Logic — Hexagonal)                  │  │
│  │  AuthService | VaultService | TokenService          │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Infrastructure (Adapters)                          │  │
│  │  UserRepository | VaultRepository | TokenRepository │  │
│  └─────────────────────────────────────────────────────┘  │
│          │ Prisma ORM (query parametrizzate)               │
└──────────┼──────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────┐
│              PostgreSQL (Render Free Tier)                │
│  Tables: users | vault_entries | refresh_tokens          │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Struttura delle Directory

```
securevault/
├── frontend/                          # React App (deploy su Vercel)
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/                    # Componenti shadcn/ui (generati via CLI)
│   │   │   │   ├── button.tsx         # shadcn: Button
│   │   │   │   ├── input.tsx          # shadcn: Input
│   │   │   │   ├── dialog.tsx         # shadcn: Dialog (usato per Modal vault)
│   │   │   │   ├── card.tsx           # shadcn: Card (usato per VaultItem)
│   │   │   │   ├── badge.tsx          # shadcn: Badge
│   │   │   │   ├── alert.tsx          # shadcn: Alert (errori/successi)
│   │   │   │   ├── toast.tsx          # shadcn: Toast + useToast
│   │   │   │   ├── toaster.tsx        # shadcn: Toaster (provider globale)
│   │   │   │   ├── tooltip.tsx        # shadcn: Tooltip (copia password)
│   │   │   │   ├── switch.tsx         # shadcn: Switch (toggle visibilità pw)
│   │   │   │   ├── slider.tsx         # shadcn: Slider (lunghezza pw generata)
│   │   │   │   ├── separator.tsx      # shadcn: Separator
│   │   │   │   ├── dropdown-menu.tsx  # shadcn: DropdownMenu (menu voce vault)
│   │   │   │   └── label.tsx          # shadcn: Label (form labels accessibili)
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   └── vault/
│   │   │       ├── VaultList.jsx      # Usa Card di shadcn per ogni voce
│   │   │       ├── VaultItem.jsx      # Card + DropdownMenu + Badge
│   │   │       ├── VaultForm.jsx      # Dialog + Input + Label + Button shadcn
│   │   │       └── PasswordGenerator.jsx  # Slider + Switch + Button shadcn
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Stato globale autenticazione
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useVault.js
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── DashboardPage.jsx
│   │   ├── services/
│   │   │   ├── api.js                 # Axios instance + interceptors
│   │   │   ├── authService.js
│   │   │   ├── vaultService.js
│   │   │   └── cryptoService.js       # Web Crypto API (AES-GCM + PBKDF2)
│   │   ├── utils/
│   │   │   └── passwordGenerator.js   # crypto.getRandomValues()
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js             # Richiesto da shadcn/ui come peer dep — NON usare Tailwind direttamente nel codice
│   ├── components.json                # File di configurazione shadcn/ui (generato da CLI)
│   └── package.json
│
├── backend/                           # Express API (deploy su Render)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js            # Prisma client instance
│   │   │   └── environment.js         # Validazione env vars al boot
│   │   ├── core/                      # Business Logic (Hexagonal Core)
│   │   │   ├── auth/
│   │   │   │   ├── AuthService.js
│   │   │   │   └── TokenService.js
│   │   │   └── vault/
│   │   │       └── VaultService.js
│   │   ├── infrastructure/            # Adapters (implementazioni concrete)
│   │   │   ├── repositories/
│   │   │   │   ├── UserRepository.js
│   │   │   │   ├── VaultRepository.js
│   │   │   │   └── TokenRepository.js
│   │   ├── interfaces/                # Porte (contratti delle interfacce)
│   │   │   ├── IUserRepository.js
│   │   │   ├── IVaultRepository.js
│   │   │   └── ITokenRepository.js
│   │   ├── middleware/
│   │   │   ├── authenticate.js        # Verifica JWT dal cookie
│   │   │   ├── validate.js            # Validazione Zod dei body
│   │   │   └── errorHandler.js        # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   └── vault.routes.js
│   │   ├── schemas/                   # Schemi Zod per validazione
│   │   │   ├── auth.schema.js
│   │   │   └── vault.schema.js
│   │   └── app.js                     # Express app setup
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── authService.test.js
│   │   │   └── vaultService.test.js
│   │   └── integration/
│   │       ├── auth.routes.test.js
│   │       └── vault.routes.test.js
│   ├── server.js                      # Entry point
│   ├── jest.config.js
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI
├── .gitignore
└── README.md
```

---

## 8. Modello Dati (Database Schema)

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String          @id @default(uuid())
  email          String          @unique
  password_hash  String          // bcrypt hash (cost factor 12)
  created_at     DateTime        @default(now())
  updated_at     DateTime        @updatedAt
  
  vault_entries  VaultEntry[]
  refresh_tokens RefreshToken[]
  
  @@map("users")
}

model VaultEntry {
  id                String   @id @default(uuid())
  user_id           String
  site_name         String   // NON cifrato (usato per display nella lista)
  encrypted_payload String   // AES-GCM encrypted JSON: { username, password, url, notes, iv, salt }
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  user              User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id])
  @@map("vault_entries")
}

model RefreshToken {
  id         String   @id @default(uuid())
  user_id    String
  token_hash String   @unique // bcrypt hash del token (mai il token grezzo)
  expires_at DateTime
  revoked    Boolean  @default(false)
  created_at DateTime @default(now())
  
  user       User     @relation(fields: [user_id], references: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id])
  @@map("refresh_tokens")
}
```

---

## 9. API REST — Specifica degli Endpoint

### Base URL: `https://securevault-api.onrender.com/api`

### Autenticazione

| Metodo | Endpoint | Auth | Descrizione |
|---|---|---|---|
| `POST` | `/auth/register` | No | Registrazione nuovo utente |
| `POST` | `/auth/login` | No | Login, emissione cookie JWT |
| `POST` | `/auth/logout` | Cookie | Logout, revoca RT, clear cookie |
| `POST` | `/auth/refresh` | Cookie (RT) | Rinnovo Access Token |

**POST /auth/register**
```json
// Request Body
{
  "email": "user@example.com",
  "password": "MyStr0ng!Pass#2024"
}

// Response 201
{ "message": "Account creato con successo." }

// Response 409
{ "error": "Email già registrata." }
```

**POST /auth/login**
```json
// Request Body
{
  "email": "user@example.com",
  "password": "MyStr0ng!Pass#2024"
}

// Response 200
{
  "user": { "id": "uuid", "email": "user@example.com" }
}
// Set-Cookie: accessToken=<JWT>; HttpOnly; Secure; SameSite=Strict; Max-Age=900
// Set-Cookie: refreshToken=<RT>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/api/auth/refresh
```

### Vault

| Metodo | Endpoint | Auth | Descrizione |
|---|---|---|---|
| `GET` | `/vault` | Cookie (AT) | Lista voci vault dell'utente |
| `GET` | `/vault/:id` | Cookie (AT) | Singola voce completa |
| `POST` | `/vault` | Cookie (AT) | Crea nuova voce |
| `PUT` | `/vault/:id` | Cookie (AT) | Aggiorna voce esistente |
| `DELETE` | `/vault/:id` | Cookie (AT) | Elimina voce |

**GET /vault**
```json
// Response 200
{
  "entries": [
    {
      "id": "uuid",
      "site_name": "GitHub",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**POST /vault**
```json
// Request Body
{
  "site_name": "GitHub",
  "encrypted_payload": "base64_encoded_encrypted_json_with_iv_and_salt"
}

// Response 201
{
  "entry": {
    "id": "uuid",
    "site_name": "GitHub",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Codici di Errore Standard**

| Codice | Significato |
|---|---|
| `400` | Validazione fallita (body malformato o campi mancanti) |
| `401` | Token assente, scaduto o non valido |
| `403` | Accesso negato (risorsa di un altro utente) |
| `404` | Risorsa non trovata |
| `409` | Conflitto (es. email già esistente) |
| `429` | Rate limit superato |
| `500` | Errore interno del server (no dettagli in produzione) |

---

## 10. Sicurezza — Implementazione Dettagliata

### 10.1 Cifratura Lato Client (cryptoService.js)

```javascript
// Flusso completo di cifratura/decifratura nel browser

// 1. DERIVAZIONE CHIAVE da master password
async function deriveKey(masterPassword, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// 2. CIFRATURA del payload
async function encryptPayload(plaintext, masterPassword) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(masterPassword, salt);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(plaintext))
  );
  
  // Combina salt + iv + ciphertext in un'unica stringa base64
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, 16);
  combined.set(new Uint8Array(ciphertext), 28);
  
  return btoa(String.fromCharCode(...combined));
}

// 3. DECIFRATURA del payload
async function decryptPayload(encryptedBase64, masterPassword) {
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const salt       = combined.slice(0, 16);
  const iv         = combined.slice(16, 28);
  const ciphertext = combined.slice(28);
  const key        = await deriveKey(masterPassword, salt);
  
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  
  return JSON.parse(new TextDecoder().decode(plaintext));
}
```

### 10.2 Configurazione Cookie (backend)

```javascript
// Impostazione cookie sicuri al login
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/"
};

res.cookie("accessToken", accessToken, {
  ...cookieOptions,
  maxAge: 15 * 60 * 1000 // 15 minuti
});

res.cookie("refreshToken", refreshToken, {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 giorni
  path: "/api/auth/refresh" // Scope ristretto
});
```

### 10.3 Middleware di Autenticazione

```javascript
// middleware/authenticate.js
export const authenticate = (req, res, next) => {
  const token = req.cookies.accessToken;
  
  if (!token) {
    return res.status(401).json({ error: "Token assente." });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.sub; // Solo l'ID nel JWT, mai dati sensibili
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token non valido o scaduto." });
  }
};
```

### 10.4 JWT Payload (cosa mettere e non mettere)

```javascript
// ✅ CORRETTO: solo identificativi non sensibili
const payload = {
  sub: user.id,        // Subject (user ID)
  iat: Date.now(),     // Issued At
  // NO email, NO ruoli sensibili, NO dati personali
};

// ❌ SBAGLIATO: mai includere
const wrongPayload = {
  email: user.email,
  password: "...",
  vault: [...]
};
```

---

## 11. Frontend — Componenti React

### 11.1 AuthContext (stato globale)

```jsx
// context/AuthContext.jsx
// Gestisce: utente loggato, funzioni login/logout, isLoading
// Evita prop drilling verso tutti i componenti figli
// La master password è tenuta in memoria SOLO per la durata della sessione
// NON viene mai persistita (no localStorage, no sessionStorage)
```

### 11.2 Axios Interceptor (token refresh automatico)

```javascript
// services/api.js
// Interceptor di risposta: se riceve 401, chiama /auth/refresh,
// poi ritenta la richiesta originale (max 1 retry).
// Se il refresh fallisce, fa redirect a /login.
```

### 11.3 ProtectedRoute

```jsx
// components/layout/ProtectedRoute.jsx
// Wrapper per le rotte private.
// Se l'utente non è autenticato, reindirizza a /login.
// Integra con AuthContext.
```

### 11.4 Flusso Completo di Aggiunta Voce

```
User compila form
       │
       ▼
React Hook Form valida (Zod schema lato client)
       │
       ▼
cryptoService.encryptPayload(formData, masterPassword)
       │
       ▼
vaultService.createEntry({ site_name, encrypted_payload })
       │  axios.post('/api/vault', ..., { withCredentials: true })
       ▼
Backend verifica JWT dal cookie → estrae userId
       │
       ▼
VaultService.create(userId, data)
       │
       ▼
VaultRepository.create(prisma.vaultEntry.create(...))
       │
       ▼
DB: INSERT INTO vault_entries (user_id, site_name, encrypted_payload)
       │
       ▼
Response 201 → Frontend aggiorna lista vault (React state)
```

---

## 12. Configurazione CI/CD e Deploy

### vercel.json (frontend)
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### render.yaml (backend + database)
```yaml
services:
  - type: web
    name: securevault-api
    env: node
    plan: free
    buildCommand: "cd backend && npm install && npx prisma generate && npx prisma migrate deploy"
    startCommand: "cd backend && node server.js"
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: securevault-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true

databases:
  - name: securevault-db
    plan: free
    databaseName: securevault
    user: securevault_user
```

### .github/workflows/ci.yml
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd backend && npm ci
      - run: cd backend && npm test
  
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run test
      - run: cd frontend && npm run build
```

---

## 13. Variabili d'Ambiente

### Backend (.env)
```bash
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/securevault"

# JWT
JWT_SECRET="genera-una-stringa-random-di-almeno-64-caratteri"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="altra-stringa-random-diversa-dalla-precedente"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS
FRONTEND_URL="http://localhost:5173"

# Sicurezza
BCRYPT_SALT_ROUNDS=12
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:3001/api
```

> ⚠️ **CRITICO**: Non committare MAI il file `.env` nel repository.  
> Aggiungi `.env` al `.gitignore` prima del primo commit.  
> In produzione, configura le variabili dalla dashboard di Render e Vercel.

---

## 14. Prompt per Copilot — Task Sequenziali

Usa questi prompt in sequenza nel tuo IDE (VS Code + GitHub Copilot Chat) per costruire il progetto passo dopo passo. Ogni prompt presuppone che il precedente sia stato completato.

---

### FASE 1 — Setup Progetto

**Prompt 1.1 — Scaffolding**
```
Crea lo scaffolding completo del monorepo "securevault" con due cartelle 
principali: "frontend" (React + Vite + React Router DOM + shadcn/ui) e 
"backend" (Node.js + Express).

--- FRONTEND ---
Step 1: crea l'app React con Vite:
  npm create vite@latest frontend -- --template react

Step 2: installa le dipendenze applicative:
  cd frontend
  npm install react-router-dom axios react-hook-form zod @hookform/resolvers lucide-react

Step 3: installa e configura shadcn/ui (che porta con sé Tailwind e Radix 
come dipendenze interne — NON usare Tailwind direttamente nel codice):
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  npx shadcn@latest init
  (Scegli: TypeScript=No, style=Default, base color=Slate, CSS variables=Yes)

Step 4: aggiungi subito i componenti shadcn/ui necessari al progetto:
  npx shadcn@latest add button input card dialog sheet badge 
    alert tooltip dropdown-menu separator switch slider skeleton label

La cartella src/components/ui/ conterrà il source code dei componenti.
REGOLA: in tutto il progetto frontend si usano SOLO i componenti di 
src/components/ui/ per la UI — mai classi Tailwind scritte a mano nei 
file delle pagine o dei componenti applicativi.

--- BACKEND ---
  cd ../backend && npm init -y
  npm install express prisma @prisma/client jsonwebtoken bcryptjs \
    cookie-parser helmet cors express-rate-limit zod dotenv
  npm install -D jest supertest nodemon

Crea il .gitignore appropriato che ignori: node_modules, .env, dist, build
Mostrami la struttura di directory risultante.
```

**Prompt 1.2 — Database**
```
Nella cartella backend, inizializza Prisma con PostgreSQL e crea lo schema 
in backend/prisma/schema.prisma con tre modelli:

1. User: id (uuid), email (unique), password_hash, created_at, updated_at
2. VaultEntry: id (uuid), user_id (FK → User), site_name, encrypted_payload (Text), 
   created_at, updated_at. Aggiungi indice su user_id.
3. RefreshToken: id (uuid), user_id (FK → User), token_hash (unique), 
   expires_at, revoked (default false), created_at. Aggiungi indice su user_id.

Assicurati che tutte le relazioni abbiano onDelete: Cascade.
Usa @@map per nominare le tabelle in snake_case: "users", "vault_entries", "refresh_tokens".
```

---

### FASE 2 — Backend Core

**Prompt 2.1 — Express App Setup**
```
Crea il file backend/src/app.js che configura Express con:
1. helmet() per security headers
2. cors() configurato per accettare richieste solo da FRONTEND_URL (env var), 
   con credentials: true
3. cookie-parser
4. express.json() per il body parsing
5. Rate limiter su /api/auth: max 10 richieste ogni 15 minuti per IP
6. Mount dei router: /api/auth e /api/vault (da creare in routes/)
7. Global error handler finale che in produzione non espone stack trace

Crea il file backend/server.js che importa app.js e avvia il server sulla 
porta definita da env var PORT (default 3001).

Crea backend/src/config/environment.js che valida al boot che tutte le env 
vars necessarie siano presenti, altrimenti lancia un errore bloccante.
```

**Prompt 2.2 — Auth Service e Repository**
```
Seguendo l'architettura esagonale, crea i seguenti file nel backend:

1. backend/src/interfaces/IUserRepository.js: interfaccia (JSDoc) con i metodi 
   findByEmail(email), create(data), findById(id)

2. backend/src/infrastructure/repositories/UserRepository.js: implementazione 
   concreta usando Prisma per i metodi dell'interfaccia.

3. backend/src/interfaces/ITokenRepository.js: interfaccia con i metodi 
   createRefreshToken(userId, tokenHash, expiresAt), 
   findRefreshToken(tokenHash), revokeRefreshToken(id), 
   revokeAllUserTokens(userId)

4. backend/src/infrastructure/repositories/TokenRepository.js: implementazione 
   con Prisma.

5. backend/src/core/auth/TokenService.js: genera accessToken (JWT, 15min, 
   payload: { sub: userId }) e refreshToken (JWT opaco, 7 giorni). 
   Il refreshToken viene hashato con bcrypt prima di essere salvato nel DB.

6. backend/src/core/auth/AuthService.js: metodi register(email, password) 
   che hasha la password con bcrypt (12 rounds) e login(email, password) 
   che verifica le credenziali e ritorna i token.
```

**Prompt 2.3 — Auth Routes e Middleware**
```
Crea il middleware backend/src/middleware/authenticate.js che:
- Legge l'accessToken dal cookie (req.cookies.accessToken)
- Verifica il JWT con JWT_SECRET
- Se valido, aggiunge req.userId = decoded.sub
- Se non valido o assente, risponde 401

Crea backend/src/middleware/validate.js: factory function che accetta uno 
schema Zod e restituisce un middleware che valida req.body, rispondendo 400 
con i dettagli degli errori di validazione in caso di fallimento.

Crea backend/src/schemas/auth.schema.js con schemi Zod per:
- registerSchema: email valida, password min 12 chars con regex per 
  maiuscola + numero + simbolo
- loginSchema: email e password required

Crea backend/src/routes/auth.routes.js con:
- POST /register: validate(registerSchema) → AuthService.register → 
  risposta 201
- POST /login: validate(loginSchema) → AuthService.login → 
  imposta cookie HttpOnly accessToken (15min) e refreshToken (7gg, 
  path=/api/auth/refresh) → risposta 200 con { user: { id, email } }
- POST /logout: authenticate → TokenService.revokeRefreshToken → 
  res.clearCookie per entrambi i cookie → 200
- POST /refresh: legge refreshToken dal cookie → verifica → 
  emette nuovo accessToken → rotazione refreshToken → 200
```

**Prompt 2.4 — Vault Service e Routes**
```
Crea:

1. backend/src/interfaces/IVaultRepository.js: interfaccia con i metodi
   findAllByUserId(userId), findByIdAndUserId(id, userId), 
   create(userId, data), update(id, userId, data), delete(id, userId)

2. backend/src/infrastructure/repositories/VaultRepository.js: 
   implementazione con Prisma. CRITICO: ogni query include user_id nel WHERE 
   per garantire l'isolamento dei dati tra utenti.

3. backend/src/core/vault/VaultService.js: business logic che usa 
   VaultRepository. Verifica che la voce esista e appartenga all'utente 
   (lancia 403 se non è così).

4. backend/src/schemas/vault.schema.js: schema Zod con 
   site_name (stringa, max 100 chars) ed encrypted_payload (stringa base64).

5. backend/src/routes/vault.routes.js: applica authenticate a tutte le rotte.
   - GET /: VaultService.findAll → risposta con lista (solo id, site_name, 
     created_at, updated_at — NO encrypted_payload)
   - GET /:id: VaultService.findOne → risposta con tutti i campi incluso 
     encrypted_payload
   - POST /: validate(vaultSchema) → VaultService.create → 201
   - PUT /:id: validate(vaultSchema) → VaultService.update → 200
   - DELETE /:id: VaultService.delete → 204
```

---

### FASE 3 — Frontend

**Prompt 3.1 — CryptoService**
```
Crea frontend/src/services/cryptoService.js con le seguenti funzioni 
async che usano ESCLUSIVAMENTE la Web Crypto API nativa del browser 
(window.crypto.subtle). ZERO dipendenze esterne per la crittografia:

1. deriveKey(masterPassword, salt): deriva una chiave AES-256-GCM da una 
   stringa usando PBKDF2 con 100.000 iterazioni e SHA-256.

2. encryptPayload(plainObject, masterPassword): 
   - Genera salt random (16 bytes) e iv random (12 bytes)
   - Deriva la chiave con deriveKey
   - Cifra il JSON.stringify dell'oggetto con AES-GCM
   - Concatena salt + iv + ciphertext in un Uint8Array
   - Ritorna la stringa base64 risultante

3. decryptPayload(encryptedBase64, masterPassword):
   - Decodifica il base64
   - Estrae salt (0-16), iv (16-28), ciphertext (28+)
   - Deriva la chiave e decifra
   - Ritorna l'oggetto JSON parsato

Aggiungi JSDoc a tutte le funzioni. Gestisci gli errori di decifratura 
(chiave sbagliata) in modo che lancino un errore chiaro e leggibile.
```

**Prompt 3.2 — AuthContext e API Service**
```
Crea frontend/src/services/api.js:
- Istanza Axios con baseURL da VITE_API_BASE_URL e withCredentials: true
- Request interceptor: aggiunge header Accept: application/json
- Response interceptor: se riceve 401 e NON è la chiamata a /refresh,
  esegue una singola chiamata a /auth/refresh. Se il refresh ha successo 
  riprova la richiesta originale. Se fallisce fa redirect a /login 
  e resetla il flag isRefreshing. Usa un sistema di coda per le chiamate 
  concorrenti durante il refresh.

Crea frontend/src/context/AuthContext.jsx:
- Stato: user (oggetto o null), isLoading, masterPassword (in memoria, 
  MAI persistita)
- Funzioni: login(email, password, masterPassword), logout(), 
  checkAuth() (chiamata al mount per verificare se la sessione è attiva)
- Al login, masterPassword viene salvata nello stato React (memoria) 
  e NON in localStorage
- Esporta useAuth hook per il consumo nei componenti
```

**Prompt 3.3 — Pagine e Componenti**
```
Crea le seguenti pagine React usando ESCLUSIVAMENTE i componenti shadcn/ui 
da src/components/ui/ per tutta la UI. Non scrivere classi Tailwind nei 
file delle pagine — usa Card, Button, Input, Label, Alert, Dialog, 
Sheet, Badge, Skeleton e gli altri componenti shadcn già installati.

1. frontend/src/pages/LoginPage.jsx:
   - Layout centrato con shadcn <Card>, <CardHeader>, <CardContent>
   - Form controllato (React Hook Form + Zod) con shadcn <Form>, 
     <FormField>, <FormItem>, <FormLabel>, <FormControl>, <FormMessage>
   - Campi email e password con shadcn <Input>
   - Bottone submit con shadcn <Button> (con stato loading/spinner)
   - Errori API mostrati con shadcn <Alert variant="destructive">
   - Link a /register

2. frontend/src/pages/RegisterPage.jsx:
   - Struttura analoga a LoginPage con shadcn <Card>
   - Campi: email, password, conferma password (tutti shadcn <Input>)
   - Validazione: password min 12 chars, con maiuscola, numero, simbolo
   - Requisiti password mostrati in tempo reale con icone lucide-react 
     (CheckCircle / XCircle) senza aggiungere classi Tailwind custom

3. frontend/src/pages/DashboardPage.jsx:
   - Header con email utente (shadcn <Badge>) e bottone logout (<Button variant="outline">)
   - SearchBar: shadcn <Input> con icona lucide Search
   - Lista voci: ogni voce è una shadcn <Card> cliccabile con site_name e data
   - Bottone "Aggiungi" con shadcn <Button> (icona Plus da lucide-react)
   - Aggiunta/Modifica voce in un shadcn <Dialog> o <Sheet> laterale
     contenente il VaultForm
   - Visualizzazione dettaglio con shadcn <Dialog>: password nascosta 
     di default, bottone toggle visibilità (icona Eye/EyeOff lucide), 
     bottone "Copia" (icona Copy lucide) con shadcn <Tooltip> "Copiato!"
   - Conferma eliminazione con shadcn <AlertDialog>
   - Stato di caricamento con shadcn <Skeleton>

4. frontend/src/utils/passwordGenerator.js:
   - Funzione generatePassword(options) che usa crypto.getRandomValues()
   - Opzioni: length (8-128), uppercase, lowercase, numbers, symbols
   - Garantisce almeno un carattere per ogni categoria selezionata

5. frontend/src/components/vault/PasswordGenerator.jsx:
   - Componente UI con shadcn <Slider> per la lunghezza
   - <Switch> per ogni categoria (maiuscole, numeri, simboli)
   - <Button> "Genera" e <Button> "Copia"
   - Campo di output con shadcn <Input> readonly

6. frontend/src/components/layout/ProtectedRoute.jsx:
   - Se isLoading mostra shadcn <Skeleton> (tre righe placeholder)
   - Se user è null redirect a /login
   - Altrimenti renderizza i figli (Outlet)

7. Configura frontend/src/App.jsx con React Router:
   - / → redirect a /dashboard
   - /login → LoginPage (solo se non autenticato)
   - /register → RegisterPage (solo se non autenticato)
   - /dashboard → DashboardPage (ProtectedRoute)
```

---

### FASE 4 — Testing e Ottimizzazione

**Prompt 4.1 — Test Backend**
```
Crea i test Jest per il backend:

1. backend/tests/unit/authService.test.js:
   - Mock di UserRepository e TokenService
   - Test: register con email valida → chiama repository.create
   - Test: register con email duplicata → lancia errore 409
   - Test: login con password corretta → ritorna tokens
   - Test: login con password errata → lancia errore 401

2. backend/tests/integration/auth.routes.test.js:
   - Usa supertest con un'istanza di app
   - Usa un database di test (o mock Prisma)
   - Test: POST /register con dati validi → 201
   - Test: POST /register con email duplicata → 409
   - Test: POST /login con credenziali corrette → 200 + cookie
   - Test: POST /login con password errata → 401
   - Test: GET /vault senza cookie → 401
   - Test: GET /vault con cookie valido → 200

Configura backend/jest.config.js con testEnvironment: node e 
collectCoverage: true con soglia minima del 70%.
```

**Prompt 4.2 — Hardening Finale**
```
Applica questi miglioramenti di sicurezza e qualità al progetto:

Backend:
1. In app.js, configura helmet() con una CSP restrittiva che blocchi 
   script inline e risorse da domini non trusted.
2. Aggiungi un middleware che logga solo metodo, path e status code 
   (NO body, NO cookie, NO dati utente) usando il formato: 
   [ISO-timestamp] METHOD /path STATUS ms
3. Nel global error handler, assicurati che in produzione 
   (NODE_ENV=production) non venga mai esposto lo stack trace.
4. Aggiungi validazione che l'encrypted_payload sia una stringa base64 
   valida prima di salvarla nel DB.

Frontend:
5. In DashboardPage, implementa la pulizia automatica degli appunti 
   dopo 30 secondi dalla copia della password (usa setTimeout).
6. Aggiungi un banner di avviso visibile quando mancano 2 minuti alla 
   scadenza della sessione (calcola dalla JWT iat + 15min).
7. Assicurati che nessun componente usi dangerouslySetInnerHTML.
```

---

## Note Finali per Copilot

> Quando usi questi prompt, ricorda a Copilot le seguenti regole:
>
> 1. **Mai `localStorage`** per token o dati sensibili.
> 2. **Sempre `withCredentials: true`** nelle chiamate Axios.
> 3. **Sempre query parametrizzate** in Prisma (sono il default — non bypassare con `$queryRawUnsafe`).
> 4. **La master password** rimane in memoria React — mai persistita.
> 5. **Il JWT payload** contiene solo `sub` (user ID) — nient'altro.
> 6. **Ogni repository method** include `user_id` nel WHERE — sempre.
> 7. **Errori generici al client** in produzione — dettagli solo nei log del server.

---

*Documento generato per il progetto SecureVault — Pronto per GitHub Copilot e Cursor AI*
