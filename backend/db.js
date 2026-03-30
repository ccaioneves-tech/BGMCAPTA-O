const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'bgm.db');

// Garante que a pasta data existe
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

// Habilita WAL mode para melhor performance com múltiplos acessos simultâneos
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Criação das tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nome       TEXT    NOT NULL,
    login      TEXT    NOT NULL UNIQUE,
    senha      TEXT    NOT NULL,
    tipo       TEXT    NOT NULL CHECK(tipo IN ('admin','operador','captador')),
    criado_em  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS pendencias (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente      TEXT    NOT NULL,
    problema     TEXT    NOT NULL,
    urgente      INTEGER NOT NULL DEFAULT 0,
    status       TEXT    NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','resolvida')),
    captador_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    operador_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criado_em    TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    resolvido_em TEXT
  );
`);

// Seed: cria admin padrão se não existir nenhum usuário
function seed() {
  const total = db.prepare('SELECT COUNT(*) as n FROM usuarios').get();
  if (total.n > 0) return;

  console.log('[DB] Criando usuários iniciais...');

  const adminHash = bcrypt.hashSync('admin0707', 12);
  const op1Hash   = bcrypt.hashSync('op123',     12);
  const cap1Hash  = bcrypt.hashSync('cap123',    12);
  const cap2Hash  = bcrypt.hashSync('cap456',    12);

  const insert = db.prepare(
    'INSERT INTO usuarios (nome, login, senha, tipo) VALUES (?, ?, ?, ?)'
  );

  db.transaction(() => {
    insert.run('Administrador',   'caioadmin1', adminHash, 'admin');
    insert.run('Carlos Operador', 'operador1',  op1Hash,   'operador');
    insert.run('Ana Captadora',   'captador1',  cap1Hash,  'captador');
    insert.run('João Captador',   'captador2',  cap2Hash,  'captador');

    // Pendências de demonstração
    const caps = db.prepare("SELECT id FROM usuarios WHERE tipo='captador'").all();
    const ops  = db.prepare("SELECT id FROM usuarios WHERE tipo='operador'").all();
    const capId = caps[0]?.id ?? 3;
    const opId  = ops[0]?.id  ?? 2;

    const ip = db.prepare(
      'INSERT INTO pendencias (cliente, problema, urgente, status, captador_id, operador_id) VALUES (?, ?, ?, ?, ?, ?)'
    );
    ip.run('Empresa Alfa Ltda',  'Contrato vencido sem renovação',       1, 'pendente',  capId, opId);
    ip.run('Beta Soluções',      'Documentação incompleta para análise', 0, 'pendente',  capId, opId);
    ip.run('Gama Comércio',      'Assinatura digital pendente',          1, 'resolvida', capId, opId);
    ip.run('Delta Indústria',    'Ficha cadastral desatualizada',        0, 'pendente',  capId, opId);
    ip.run('Épsilon Tecnologia', 'Proposta comercial sem retorno',       1, 'pendente',  capId, opId);
  })();

  console.log('[DB] Seed concluído.');
}

seed();

module.exports = db;
