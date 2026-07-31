const express = require('express');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const PORT = process.env.PORT || 3000;
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || 'oriontxr';

let usernameQueue = [];
let isConnected = false;

async function connectTikTok() {
  console.log(`🔄 Tentative de connexion au live de @${TIKTOK_USERNAME}...`);
  
  const tiktok = new WebcastPushConnection(TIKTOK_USERNAME);

  tiktok.connect().then(() => {
    isConnected = true;
    console.log(`✅ Connecté au live de @${TIKTOK_USERNAME}`);
  }).catch(err => {
    isConnected = false;
    console.log(`⚠️ Erreur : ${err.message}, retry dans 15s...`);
    setTimeout(connectTikTok, 15000);
  });

  tiktok.on('chat', data => {
    const comment = data.comment.trim();
    const isValidRoblox = /^[A-Za-z0-9_]{3,20}$/.test(comment);
    if (isValidRoblox) {
      usernameQueue.push(comment);
      console.log(`👤 Pseudo détecté : ${comment}`);
    }
  });

  tiktok.on('disconnected', () => {
    isConnected = false;
    console.log('🔌 Déconnecté, retry dans 15s...');
    setTimeout(connectTikTok, 15000);
  });
}

app.get('/api/tiktok/get-spawn', (req, res) => {
  if (usernameQueue.length > 0) {
    const username = usernameQueue.shift();
    res.json({ username });
  } else {
    res.json({});
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    connected: isConnected,
    tiktokUsername: TIKTOK_USERNAME,
    queueLength: usernameQueue.length
  });
});

app.get('/api/test-add/:username', (req, res) => {
  const username = req.params.username;
  const isValid = /^[A-Za-z0-9_]{3,20}$/.test(username);
  if (isValid) {
    usernameQueue.push(username);
    res.json({ added: username, queueLength: usernameQueue.length });
  } else {
    res.json({ error: 'Pseudo invalide' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  connectTikTok();
});
