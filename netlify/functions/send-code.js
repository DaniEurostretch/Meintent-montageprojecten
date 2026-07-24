// Stap 2: controleert het portaalwachtwoord, maakt een code, ondertekent een
// 'challenge' en mailt de code via Resend naar het ingevoerde adres.
const { sign, b64url, norm, checkPw } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'no' };
  if (!process.env.AUTH_SECRET || !process.env.RESEND_API_KEY)
    return { statusCode: 500, body: JSON.stringify({ error: 'config' }) };

  let b; try { b = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: 'bad' }; }
  const email  = norm(b.email);
  const portal = String(b.portal || '');

  // Wachtwoord moet kloppen, anders geen mail (voorkomt misbruik van de mailfunctie).
  if (!checkPw(portal, b.password || ''))
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'pw' }) };

  if (!email || email.indexOf('@') < 0)
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'email' }) };

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const exp  = Date.now() + 10 * 60 * 1000; // 10 minuten
  const sig  = sign(email + '|' + portal + '|' + code + '|' + exp);
  const challenge = b64url(email + '|' + portal + '|' + exp + '|' + sig);

  const naam = portal === 'beheer' ? 'Beheer' : 'Montage';
  const html =
    '<div style="font-family:Arial,sans-serif;color:#395159;font-size:15px">' +
    '<p>Je verificatiecode voor het Eurostretch ' + naam + '-portaal:</p>' +
    '<p style="font-size:30px;font-weight:bold;letter-spacing:6px;color:#cb9751;margin:14px 0">' + code + '</p>' +
    '<p style="color:#5a6770;font-size:13px">Deze code is 10 minuten geldig. Heb je dit niet aangevraagd? Dan kun je deze mail negeren.</p>' +
    '</div>';
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Eurostretch Meintent <noreply@eurostretchtents.com>',
        to: [email],
        subject: 'Je inlogcode: ' + code,
        html: html
      })
    });
    if (!r.ok) {
      console.log('resend-fail', r.status, await r.text());
      return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'mail' }) };
    }
  } catch (e) {
    console.log('resend-error', String(e));
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'mail' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true, challenge: challenge }) };
};
