/**
 * Concours photo CSE — réception des votes dans Google Sheets.
 * Coller ce fichier dans Extensions > Apps Script de votre Google Sheet.
 */
const CONFIG = {
  // Domaines e-mail autorisés, ex. ['monentreprise.fr']. Laisser [] pour tout accepter.
  ALLOWED_DOMAINS: [],
  MAX_VOTES: 1,                              // identique à maxVotes dans config.js
  VOTE_END: '2026-11-15T23:59:00+01:00',     // identique à voteEnd dans config.js
};
// Option : créez un onglet "Codes" avec un code de vote par ligne (colonne A).
// S'il existe, seuls ces codes peuvent voter (et chacun une seule fois).

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const data = JSON.parse(e.postData.contents);
    const voter = String(data.voter || '').trim().toLowerCase();
    const votes = [...new Set((data.votes || []).map(String))]
      .filter(id => /^[\w-]{1,40}$/.test(id));

    if (new Date() > new Date(CONFIG.VOTE_END)) return reply(false, 'Les votes sont clos.');
    if (!voter) return reply(false, 'Indiquez votre identifiant pour voter.');
    if (votes.length < 1 || votes.length > CONFIG.MAX_VOTES) {
      return reply(false, `Choisissez entre 1 et ${CONFIG.MAX_VOTES} photo(s).`);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const codes = ss.getSheetByName('Codes');
    if (codes && codes.getLastRow() > 0) {
      const list = codes.getRange(1, 1, codes.getLastRow(), 1).getValues()
        .flat().map(v => String(v).trim().toLowerCase());
      if (!list.includes(voter)) return reply(false, 'Code de vote inconnu. Vérifiez-le et réessayez.');
    } else if (CONFIG.ALLOWED_DOMAINS.length) {
      const ok = /^[^@\s]+@[^@\s]+$/.test(voter) && CONFIG.ALLOWED_DOMAINS.includes(voter.split('@')[1]);
      if (!ok) return reply(false, 'Utilisez votre adresse e-mail professionnelle.');
    }

    const sheet = votesSheet(ss);
    const last = sheet.getLastRow();
    if (last > 1) {
      const voters = sheet.getRange(2, 2, last - 1, 1).getValues().flat();
      if (voters.includes(voter)) return reply(false, 'Vous avez déjà voté. Merci !');
    }
    const now = new Date();
    sheet.getRange(last + 1, 1, votes.length, 3).setValues(votes.map(id => [now, voter, id]));
    return reply(true, 'Vote enregistré. Merci pour votre participation !');
  } catch (err) {
    return reply(false, 'Erreur serveur : ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('Le script de vote fonctionne.');
}

function votesSheet(ss) {
  let s = ss.getSheetByName('Votes');
  if (!s) {
    s = ss.insertSheet('Votes');
    s.appendRow(['Date', 'Votant', 'Photo']);
    s.setFrozenRows(1);
  }
  return s;
}

function reply(ok, message) {
  return ContentService.createTextOutput(JSON.stringify({ ok, message }))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Menu "Concours" dans la feuille pour calculer le classement. */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Concours')
    .addItem('Calculer les résultats', 'computeResults')
    .addToUi();
}

function computeResults() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const s = votesSheet(ss);
  const counts = {};
  if (s.getLastRow() > 1) {
    s.getRange(2, 3, s.getLastRow() - 1, 1).getValues().flat()
      .forEach(id => { counts[id] = (counts[id] || 0) + 1; });
  }
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  let r = ss.getSheetByName('Résultats') || ss.insertSheet('Résultats');
  r.clear();
  r.appendRow(['Rang', 'Photo', 'Voix']);
  rows.forEach(([id, n], i) => r.appendRow([i + 1, id, n]));
  r.setFrozenRows(1);
  ss.setActiveSheet(r);
}
