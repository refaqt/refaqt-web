// SPDX-FileCopyrightText: 2025-2026 Refaqt (BE 0804.145.539) and contributors
// SPDX-License-Identifier: CC-BY-SA-4.0
// The two emails the form Worker sends: a message to contact@refaqt.com, and a thank-you
// email to the visitor. Each email has an HTML version and a plain-text version.
//
// The HTML works in Gmail and Outlook: tables for layout, inline styles, colours also as
// bgcolor attributes, no SVG, no web font download.
// The email follows the reader's theme. The inline colours are the light version. A
// "prefers-color-scheme: dark" block switches to the dark version and to the logo for dark
// backgrounds. Mail programs that do not know that block (Gmail web) show the light version.
// The Gmail apps do not know that block either. In dark mode they darken the colours
// themselves, but they do not change background images. So the logo area has a white
// background image: it stays white there, and the logo with dark letters stays readable.
// All visitor text is escaped. Visitor text never becomes a link: a zero-width space goes
// after every ".", "@", ":" and "/" that is followed by more text, so mail programs do not
// see a web address or an email address in it.

// Light colours: the default, written inline.
const C = {
  bg: '#f3f4f5',
  surface: '#ffffff',
  box: '#f3f4f5',
  text: '#1b1c1d',
  muted: '#5b6166',
  faint: '#868b90',
  band: ['#00c175', '#00ac99', '#009cb6', '#0094c6'],
};
// Dark colours: house style, from assets/css/style.css. Used when the reader has a dark theme.
const DARK = {
  bg: '#1b1c1d',
  surface: '#232323',
  box: '#1b1c1d',
  text: '#f0f0f0',
  muted: '#a4a9ad',
  faint: '#6f7478',
};
// CSS class for each text colour, so the dark block can change it.
const TONE = { text: 'c-tx', muted: 'c-mu', faint: 'c-fa' };
const LOGO_ON_DARK = 'https://refaqt.com/assets/img/refaqt-logo.png';
const LOGO_ON_LIGHT = 'https://refaqt.com/assets/img/refaqt-logo-on-light.png';
const WHITE_BG = 'https://refaqt.com/assets/img/email-white.png';
const logos = env => ({
  logoUrl: env.LOGO_ON_LIGHT_URL || LOGO_ON_LIGHT,
  logoDarkUrl: env.LOGO_URL || LOGO_ON_DARK,
  whiteBgUrl: env.WHITE_BG_URL || WHITE_BG,
});
const FONT = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const FORM_LABELS = {
  home: 'REFAQT contact form',
  aqtuator: 'AQTUATOR CS early access',
};

export const INTEREST_LABELS = {
  home: {
    contribute: 'Contribute to the designs',
    partner: 'Become a partner (build, sell or support)',
    engineering: 'Get help with custom engineering',
    licence: 'Get a commercial licence',
    other: 'Something else',
  },
  aqtuator: {
    buy: 'Buy stages or parts',
    diy: 'Build it myself',
    licence: 'Get a commercial licence',
  },
};

// Escape text for HTML.
export function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Stop mail programs from turning visitor text into a link.
export function unlink(value) {
  return String(value).replace(/([.@:/])(?=\S)/g, '$1​');
}

// Visitor text for HTML: no links, escaped, line breaks kept.
const vis = value => esc(unlink(value)).replace(/\n/g, '<br>');

// Text for a subject line: one line, no control characters, not too long.
const oneLine = (value, max = 120) => String(value).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

const interestLabel = lead => INTEREST_LABELS[lead.form]?.[lead.interest] || lead.interest || '';

// The rows that describe what the visitor sent, in the order we show them.
function choiceRows(lead) {
  const rows = [];
  if (lead.interest) rows.push(['I want to', interestLabel(lead)]);
  if (lead.form === 'aqtuator') rows.push(['Travel', lead.variant || 'Not sure yet']);
  return rows;
}

// One page with the logo, the colour band, the content and a footer.
function layout({ title, preheader, logoUrl, logoDarkUrl, whiteBgUrl, body, footer }) {
  const band = C.band.map(c => `<td width="25%" height="4" bgcolor="${c}" style="background-color:${c};height:4px;font-size:0;line-height:0;">&nbsp;</td>`).join('');
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(title)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<!--[if mso]><style>table, td, p, a, span, h1 { font-family: 'Segoe UI', Arial, sans-serif !important; }</style><![endif]-->
<style>
  body { margin: 0; padding: 0; }
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  @media (max-width: 620px) {
    .pad { padding-left: 20px !important; padding-right: 20px !important; }
    .h1 { font-size: 24px !important; line-height: 30px !important; }
  }
  @media (prefers-color-scheme: dark) {
    body, .c-bg { background-color: ${DARK.bg} !important; }
    .c-sf { background-color: ${DARK.surface} !important; }
    .c-hd { background-image: none !important; }
    .c-box { background-color: ${DARK.box} !important; }
    .c-tx { color: ${DARK.text} !important; }
    .c-mu { color: ${DARK.muted} !important; }
    .c-fa { color: ${DARK.faint} !important; }
    .logo-light { display: none !important; }
    .logo-dark { display: block !important; max-height: none !important; overflow: visible !important; }
  }
</style>
</head>
<body class="c-bg" style="margin:0;padding:0;background-color:${C.bg};" bgcolor="${C.bg}">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${C.bg};">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" class="c-bg" style="background-color:${C.bg};">
<tr><td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
  <tr><td bgcolor="${C.surface}" background="${esc(whiteBgUrl)}" style="background-color:${C.surface};background-image:url('${esc(whiteBgUrl)}');background-repeat:repeat;border-radius:14px 14px 0 0;padding:28px 32px 24px;" class="pad c-sf c-hd">
    <img class="logo-light c-tx" src="${esc(logoUrl)}" width="160" height="40" alt="REFAQT" style="display:block;width:160px;height:40px;border:0;outline:none;text-decoration:none;color:${C.text};font-family:${FONT};font-size:24px;font-weight:600;">
    <!--[if !mso]><!--><div class="logo-dark" style="display:none;max-height:0;overflow:hidden;mso-hide:all;"><img src="${esc(logoDarkUrl)}" width="160" height="40" alt="REFAQT" style="display:block;width:160px;height:40px;border:0;outline:none;text-decoration:none;color:${DARK.text};font-family:${FONT};font-size:24px;font-weight:600;"></div><!--<![endif]-->
  </td></tr>
  <tr><td bgcolor="${C.surface}" class="c-sf" style="background-color:${C.surface};font-size:0;line-height:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${band}</tr></table>
  </td></tr>
  <tr><td bgcolor="${C.surface}" style="background-color:${C.surface};border-radius:0 0 14px 14px;padding:32px 32px 36px;font-family:${FONT};font-size:16px;line-height:25px;color:${C.text};" class="pad c-sf c-tx">
${body}
  </td></tr>
  <tr><td style="padding:20px 32px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted};" class="pad c-mu">
${footer}
  </td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;
}

const h1 = text => `<h1 class="h1 c-tx" style="margin:0 0 20px;font-family:${FONT};font-size:28px;line-height:34px;font-weight:600;color:${C.text};">${text}</h1>`;
const p = (html, tone = 'text') => `<p class="${TONE[tone]}" style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:25px;color:${C[tone]};">${html}</p>`;

// A box with label/value rows, then the message itself.
function copyBox(rows, message) {
  const rowHtml = rows.map(([k, v]) => `
      <tr>
        <td valign="top" class="c-mu" style="padding:0 16px 8px 0;font-family:${FONT};font-size:14px;line-height:22px;color:${C.muted};white-space:nowrap;">${esc(k)}</td>
        <td valign="top" class="c-tx" style="padding:0 0 8px;font-family:${FONT};font-size:14px;line-height:22px;color:${C.text};">${v}</td>
      </tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
  <tr><td bgcolor="${C.box}" class="c-box" style="background-color:${C.box};border-left:3px solid ${C.band[1]};border-radius:6px;padding:18px 20px;">
    ${rowHtml ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">${rowHtml}
    </table>` : ''}
    <p class="c-tx" style="margin:0;font-family:${FONT};font-size:15px;line-height:24px;color:${C.text};">${vis(message)}</p>
  </td></tr>
</table>`;
}

// Email to contact@refaqt.com. "Reply" in Gmail goes to the visitor (Reply-To).
export function notifyEmail(lead, env = {}) {
  const who = lead.name ? `${lead.name} (${lead.email})` : lead.email;
  const subject = oneLine(`${lead.form === 'aqtuator' ? 'New early-access request' : 'New contact message'} from ${who}`, 150);
  const rows = [
    ['Form', esc(FORM_LABELS[lead.form] || lead.form)],
    ['Name', lead.name ? vis(lead.name) : `<span class="c-fa" style="color:${C.faint};">not given</span>`],
    ['Email', vis(lead.email)],
    ...choiceRows(lead).map(([k, v]) => [k, esc(v)]),
  ];
  const meta = [
    ['Sent', lead.created_at],
    ['Country', lead.country || 'unknown'],
    ['From page', lead.origin || 'unknown'],
    ['Lead ID', lead.id],
  ];
  const html = layout({
    title: 'New message from the website',
    preheader: unlink(oneLine(lead.message, 100)),
    ...logos(env),
    body: `${h1('New message from the website')}
${p(`Press <strong>Reply</strong> to answer ${lead.name ? vis(lead.name) : 'the visitor'} directly.`, 'muted')}
${copyBox(rows, lead.message)}
${p(meta.map(([k, v]) => `${esc(k)}: ${esc(v)}`).join('<br>'), 'faint')}`,
    footer: 'Sent by the form Worker refaqt-forms. The lead is also saved in the Cloudflare D1 database refaqt-leads.',
  });
  const text = [
    'New message from the website',
    '',
    `Form: ${FORM_LABELS[lead.form] || lead.form}`,
    `Name: ${lead.name ? unlink(lead.name) : 'not given'}`,
    `Email: ${unlink(lead.email)}`,
    ...choiceRows(lead).map(([k, v]) => `${k}: ${v}`),
    '',
    'Message:',
    unlink(lead.message),
    '',
    ...meta.map(([k, v]) => `${k}: ${v}`),
    '',
    'Press Reply to answer the visitor directly.',
  ].join('\n');
  return { subject, html, text };
}

// Thank-you email to the visitor.
export function thanksEmail(lead, env = {}) {
  const aq = lead.form === 'aqtuator';
  const subject = aq ? 'Thank you for your interest in AQTUATOR CS' : 'Thank you for your message to REFAQT';
  const hello = lead.name ? `Hello ${lead.name},` : 'Hello,';
  const intro = aq
    ? 'Thank you for your interest in AQTUATOR CS. You are on the early-access list, and a person from our team will read your message.'
    : 'Thank you for your message. We received it, and a person from our team will read it.';
  const reply = 'We do our best to reply within one business day.';
  const notYou = 'You get this email because someone sent the form on refaqt.com with this email address. If that was not you, please reply to tell us, and we will delete your details.';
  const rows = choiceRows(lead).map(([k, v]) => [k, esc(v)]);
  const html = layout({
    title: subject,
    preheader: reply,
    ...logos(env),
    body: `${h1(aq ? 'Thank you for your interest' : 'Thank you for your message')}
${p(lead.name ? `Hello ${vis(lead.name)},` : 'Hello,')}
${p(esc(intro))}
${p(`<strong>${esc(reply)}</strong>`)}
${p('Here is a copy of your message:', 'muted')}
${copyBox(rows, lead.message)}
${p('Do you want to add something? Just reply to this email.')}
${p('Kind regards,<br>The REFAQT team', 'text')}`,
    footer: `${esc(notYou)}<br><br>REFAQT &middot; refaqt.com`,
  });
  const text = [
    unlink(hello),
    '',
    intro,
    '',
    reply,
    '',
    'Here is a copy of your message:',
    '',
    ...choiceRows(lead).map(([k, v]) => `${k}: ${v}`),
    ...(choiceRows(lead).length ? [''] : []),
    unlink(lead.message).split('\n').map(l => `> ${l}`).join('\n'),
    '',
    'Do you want to add something? Just reply to this email.',
    '',
    'Kind regards,',
    'The REFAQT team',
    '',
    '--',
    notYou,
    'REFAQT - refaqt.com',
  ].join('\n');
  return { subject, html, text };
}
