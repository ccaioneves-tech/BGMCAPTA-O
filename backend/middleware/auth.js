const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'bgm_captacao_secret_key_2024';

function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }
  const token = header.split(' ')[1];
  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

function soAdmin(req, res, next) {
  if (req.usuario?.tipo !== 'admin') {
    return res.status(403).json({ erro: 'Acesso restrito ao administrador.' });
  }
  next();
}

function soOperadorOuAdmin(req, res, next) {
  if (!['admin','operador'].includes(req.usuario?.tipo)) {
    return res.status(403).json({ erro: 'Acesso não autorizado.' });
  }
  next();
}

module.exports = { auth, soAdmin, soOperadorOuAdmin, SECRET };
