const express = require('express');
const db      = require('../db');
const { auth, soOperadorOuAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/pendencias — lista conforme perfil
router.get('/', auth, (req, res) => {
  const { tipo, id } = req.usuario;
  const { urgente, status } = req.query;

  let sql = `
    SELECT p.*,
           uc.nome AS captador_nome,
           uo.nome AS operador_nome
    FROM pendencias p
    JOIN usuarios uc ON uc.id = p.captador_id
    JOIN usuarios uo ON uo.id = p.operador_id
    WHERE 1=1
  `;
  const params = [];

  if (tipo === 'operador') {
    sql += ' AND p.operador_id = ?';
    params.push(id);
  } else if (tipo === 'captador') {
    sql += ' AND p.captador_id = ?';
    params.push(id);
  }

  if (urgente === '1') { sql += ' AND p.urgente = 1'; }
  if (urgente === '0') { sql += ' AND p.urgente = 0'; }
  if (status)          { sql += ' AND p.status = ?'; params.push(status); }

  sql += ' ORDER BY p.id DESC';

  const pendencias = db.prepare(sql).all(...params);
  res.json(pendencias);
});

// POST /api/pendencias — cria pendência (operador ou admin)
router.post('/', auth, soOperadorOuAdmin, (req, res) => {
  const { cliente, problema, urgente, captador_id } = req.body;

  if (!cliente || !problema || !captador_id) {
    return res.status(400).json({ erro: 'Preencha todos os campos.' });
  }

  const captador = db.prepare("SELECT id FROM usuarios WHERE id = ? AND tipo = 'captador'").get(captador_id);
  if (!captador) return res.status(400).json({ erro: 'Captador inválido.' });

  const result = db.prepare(`
    INSERT INTO pendencias (cliente, problema, urgente, captador_id, operador_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(cliente, problema, urgente ? 1 : 0, captador_id, req.usuario.id);

  const nova = db.prepare(`
    SELECT p.*, uc.nome AS captador_nome, uo.nome AS operador_nome
    FROM pendencias p
    JOIN usuarios uc ON uc.id = p.captador_id
    JOIN usuarios uo ON uo.id = p.operador_id
    WHERE p.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(nova);
});

// PATCH /api/pendencias/:id/resolver — captador resolve
router.patch('/:id/resolver', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const { tipo, id: uid } = req.usuario;

  const p = db.prepare('SELECT * FROM pendencias WHERE id = ?').get(id);
  if (!p) return res.status(404).json({ erro: 'Pendência não encontrada.' });
  if (p.status === 'resolvida') return res.status(400).json({ erro: 'Já está resolvida.' });

  // Captador só pode resolver as suas; admin pode resolver qualquer
  if (tipo === 'captador' && p.captador_id !== uid) {
    return res.status(403).json({ erro: 'Acesso negado.' });
  }

  db.prepare(`
    UPDATE pendencias
    SET status = 'resolvida', resolvido_em = datetime('now','localtime')
    WHERE id = ?
  `).run(id);

  res.json({ ok: true });
});

// DELETE /api/pendencias/:id — admin ou operador dono
router.delete('/:id', auth, soOperadorOuAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { tipo, id: uid } = req.usuario;

  const p = db.prepare('SELECT * FROM pendencias WHERE id = ?').get(id);
  if (!p) return res.status(404).json({ erro: 'Pendência não encontrada.' });

  if (tipo === 'operador' && p.operador_id !== uid) {
    return res.status(403).json({ erro: 'Você só pode excluir suas próprias pendências.' });
  }

  db.prepare('DELETE FROM pendencias WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
