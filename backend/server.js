require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── MIDDLEWARES ──
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// ── ROTAS DA API ──
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/usuarios',  require('./routes/usuarios'));
app.use('/api/pendencias', require('./routes/pendencias'));

// ── SERVE O FRONTEND (produção) ──
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Qualquer rota não-API redireciona para o index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

// ── INICIA O SERVIDOR ──
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🟠 BGM Captação rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'desenvolvimento'}\n`);
});
