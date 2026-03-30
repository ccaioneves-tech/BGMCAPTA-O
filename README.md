# BGM Captação — Sistema de Pendências

Sistema interno de gerenciamento de pendências com backend Node.js,
banco SQLite e frontend HTML puro.

---

## ESTRUTURA DO PROJETO

```
bgm-captacao/
├── backend/
│   ├── data/            ← banco SQLite (criado automaticamente)
│   ├── middleware/
│   │   └── auth.js      ← validação JWT
│   ├── routes/
│   │   ├── auth.js      ← login e alterar senha
│   │   ├── usuarios.js  ← CRUD de usuários
│   │   └── pendencias.js← CRUD de pendências
│   ├── db.js            ← banco SQLite + seed inicial
│   ├── server.js        ← servidor Express
│   ├── package.json
│   └── .env.example
└── frontend/
    └── index.html       ← interface completa
```

---

## COMO RODAR LOCALMENTE

### Pré-requisitos
- Node.js instalado (versão 18 ou superior)
- npm (vem junto com o Node.js)

### Passo a passo

1. Entre na pasta do backend:
   ```
   cd bgm-captacao/backend
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Copie o arquivo de configuração:
   ```
   cp .env.example .env
   ```

4. Inicie o servidor:
   ```
   npm start
   ```

5. Abra no navegador:
   ```
   http://localhost:3000
   ```

O sistema já estará funcionando com usuários e pendências de demonstração.

---

## CREDENCIAIS PADRÃO

| Perfil    | Login       | Senha     |
|-----------|-------------|-----------|
| Admin     | caioadmin1  | admin0707 |
| Operador  | operador1   | op123     |
| Captador  | captador1   | cap123    |
| Captador  | captador2   | cap456    |

**Importante:** Troque as senhas após o primeiro acesso.

---

## API — ENDPOINTS

### Autenticação
```
POST /api/auth/login          { login, senha }
POST /api/auth/alterar-senha  { senhaAtual, novaSenha }  [JWT]
```

### Usuários (somente admin)
```
GET    /api/usuarios           [JWT]
POST   /api/usuarios           { nome, login, senha, tipo }  [JWT + admin]
DELETE /api/usuarios/:id       [JWT + admin]
```

### Pendências
```
GET    /api/pendencias         [JWT]  ?urgente=0|1 &status=pendente|resolvida
POST   /api/pendencias         { cliente, problema, urgente, captador_id }  [JWT]
PATCH  /api/pendencias/:id/resolver   [JWT]
DELETE /api/pendencias/:id     [JWT]
```

---

## DEPLOY NO RENDER (GRATUITO)

### 1. Prepare o repositório

Crie uma conta no GitHub e suba o projeto:
```
git init
git add .
git commit -m "BGM Captação v1"
git remote add origin https://github.com/seu-usuario/bgm-captacao.git
git push -u origin main
```

### 2. Configure no Render

1. Acesse https://render.com e crie uma conta gratuita
2. Clique em **New → Web Service**
3. Conecte seu repositório GitHub
4. Configure assim:

| Campo            | Valor                          |
|------------------|--------------------------------|
| Root Directory   | `backend`                      |
| Runtime          | `Node`                         |
| Build Command    | `npm install`                  |
| Start Command    | `npm start`                    |

### 3. Variáveis de ambiente no Render

Na aba **Environment** do seu serviço, adicione:

```
JWT_SECRET=coloque_uma_chave_longa_e_aleatoria_aqui
NODE_ENV=production
PORT=10000
```

### 4. Persistência do banco no Render

O Render gratuito usa disco efêmero (dados somem ao reiniciar).
Para persistência real no Render gratuito:

**Opção A — Render Disk (pago)**
- Adicione um Disk em `/opt/render/project/src/backend/data`

**Opção B — Migrar para PostgreSQL (recomendado para produção)**
- O Render oferece PostgreSQL gratuito
- Substitua `better-sqlite3` por `pg` e adapte as queries

**Opção C — Railway.app**
- Similar ao Render, mas com melhor suporte a SQLite persistente

### 5. URL final

Após o deploy, o Render fornece uma URL no formato:
```
https://bgm-captacao.onrender.com
```

Compartilhe essa URL com sua equipe.

---

## VARIÁVEIS DE AMBIENTE

| Variável      | Descrição                          | Padrão         |
|---------------|------------------------------------|----------------|
| PORT          | Porta do servidor                  | 3000           |
| JWT_SECRET    | Chave secreta para JWT             | (ver .env)     |
| NODE_ENV      | development ou production          | development    |
| FRONTEND_URL  | Origem permitida (CORS)            | *              |

---

## SEGURANÇA

- Senhas criptografadas com bcrypt (salt rounds: 12)
- Autenticação via JWT com expiração de 12 horas
- CORS configurável por variável de ambiente
- Rotas protegidas por perfil (admin / operador / captador)
- Nenhuma credencial exposta no frontend

---

## MODO DESENVOLVIMENTO

Para recarregar automaticamente ao editar:
```
npm run dev
```
(requer nodemon, instalado como devDependency)
