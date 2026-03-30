const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../db');
const { auth, soAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/usuarios — lista todos (admin) ou só captadores (operador)
router.get('/', auth, (req, res) => {
  let usuarios;
  if (req.usuario.tipo === 'admin') {
    usuarios = db.prepare('SELECT id, nome, login, tipo, criado_em FROM usuarios ORDER BY id').all();
  } else {
    // Operador precisa listar captadores para criar pendência
    usuarios = db.prepare("SELECT id, nome FROM usuarios WHERE tipo = 'captador' ORDER BY nome").all();
  }
  res.json(usuarios);
});

// POST /api/usuarios — cria usuário (somente admin)
router.post('/', auth, soAdmin, (req, res) => {
  const { nome, login, senha, tipo } = req.body;

  if (!nome || !login || !senha || !tipo) {
    return res.status(400).json({ erro: 'Preencha todos os campos.' });
  }
  if (!['operador','captador'].includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo inválido. Use: operador ou captador.' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres.' });
  }

  const existe = db.prepare('SELECT id FROM usuarios WHERE login = ?').get(login);
  if (existe) {
    return res.status(409).json({ erro: 'Login já está em uso.' });
  }

  const hash = bcrypt.hashSync(senha, 12);
  const result = db.prepare(
    'INSERT INTO usuarios (nome, login, senha, tipo) VALUES (?, ?, ?, ?)'
  ).run(nome, login, hash, tipo);

  res.status(201).json({
    id: result.lastInsertRowid, nome, login, tipo
  });
});

// DELETE /api/usuarios/:id — exclui usuário (somente admin)
router.delete('/:id', auth, soAdmin, (req, res) => {
  const id = parseInt(req.params.id);

  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  if (usuario.tipo === 'admin') {
    return res.status(403).json({ erro: 'Não é possível excluir o administrador.' });
  }

  db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
