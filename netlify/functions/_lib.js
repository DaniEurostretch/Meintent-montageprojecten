// Gedeelde helpers voor de inlogfuncties. Bestandsnaam begint met _ -> Netlify
// behandelt dit NIET als losse functie, maar het kan wel geïmporteerd worden.
const crypto = require('crypto');

// Geen toegangslijst: iedereen met het juiste portaalwachtwoord kan inloggen
// met zijn eigen e-mailadres. De code gaat naar het ingevoerde adres.
// Wachtwoord-hashes (SHA-256) per portaal. De serverfunctie controleert het
// wachtwoord vóór er gemaild wordt, zodat de mailfunctie niet misbruikt kan worden.
const PWHASH = {
  montage: "af6af118d75bf45065619eaf4b395e8a53f63bed81917144488d1c401ebb9138", // EurMei2026!
  beheer:  "9f994ac9a4a098b06d4baada87cd2f705af6f402225a38aae9fbcba2906d7fcb"  // MeiEur2026!
};

function sha256(s) { return crypto.createHash('sha256').update(String(s)).digest('hex'); }
function sign(msg) {
  return crypto.createHmac('sha256', process.env.AUTH_SECRET || '')
               .update(String(msg)).digest('hex');
}
function b64url(s) { return Buffer.from(s).toString('base64url'); }
function unb64(s)  { return Buffer.from(s, 'base64url').toString('utf8'); }
function eq(a, b) {
  try {
    const A = Buffer.from(String(a)), B = Buffer.from(String(b));
    return A.length === B.length && crypto.timingSafeEqual(A, B);
  } catch (e) { return false; }
}
function norm(e) { return String(e || '').trim().toLowerCase(); }
function checkPw(portal, password) {
  const want = PWHASH[portal];
  return !!want && eq(sha256(password), want);
}

module.exports = { sign, b64url, unb64, eq, norm, checkPw };
