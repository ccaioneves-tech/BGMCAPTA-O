const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { auth, SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { login, senha } = req.body;

  if (!login || !senha) {
    return res.status(400).json({ erro: 'Login e senha são obrigatórios.' });
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE login = ?').get(login);
  if (!usuario) {
    return res.status(401).json({ erro: 'Usuário ou senha incorretos.' });
  }

  const senhaOk = bcrypt.compareSync(senha, usuario.senha);
  if (!senhaOk) {
    return res.status(401).json({ erro: 'Usuário ou senha incorretos.' });
  }

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, login: usuario.login, tipo: usuario.tipo },
    SECRET,
    { expiresIn: '12h' }
  );

  res.json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, login: usuario.login, tipo: usuario.tipo }
  });
});

// POST /api/auth/alterar-senha
router.post('/alterar-senha', auth, (req, res) => {
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ erro: 'Preencha todos os campos.' });
  }
  if (novaSenha.length < 6) {
    return res.status(400).json({ erro: 'A nova senha deve ter no mínimo 6 caracteres.' });
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.usuario.id);
  if (!bcrypt.compareSync(senhaAtual, usuario.senha)) {
    return res.status(401).json({ erro: 'Senha atual incorreta.' });
  }

  const hash = bcrypt.hashSync(novaSenha, 12);
  db.prepare('UPDATE usuarios SET senha = ? WHERE id = ?').run(hash, req.usuario.id);

  res.json({ ok: true, msg: 'Senha alterada com sucesso.' });
});

module.exports = router;
