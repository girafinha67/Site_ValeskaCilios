import nodemailer, { type Transporter } from 'nodemailer';
import { esc, fold, stamp } from './feed.js';
import { db, type Booking } from './supabase.js';

const TZ = 'America/Sao_Paulo';
const env = (k: string) => (process.env[k] || '').trim();

export const mailConfigured = () => !!(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS'));

let transport: Transporter | null = null;
function getTransport(): Transporter {
  if (transport) return transport;
  const host = env('SMTP_HOST');
  const port = Number(env('SMTP_PORT') || 465);
  const pass = /gmail/i.test(host) ? env('SMTP_PASS').replace(/\s+/g, '') : env('SMTP_PASS');
  transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: env('SMTP_USER'), pass } });
  return transport;
}

const fromRaw = () => env('MAIL_FROM') || `"Valeska Rocha" <${env('SMTP_USER')}>`;
const fromAddress = () => (fromRaw().match(/<([^>]+)>/)?.[1] || fromRaw()).trim();

export interface Studio {
  name: string;
  address: string;
  whatsapp: string;
  siteUrl: string;
}

export async function loadStudio(): Promise<Studio> {
  let biz: Record<string, string> = {};
  try {
    const { data } = await db().from('settings').select('value').eq('key', 'business').maybeSingle();
    biz = (data?.value as Record<string, string>) || {};
  } catch { /* usa os padrões */ }
  return {
    name: biz.name || 'Valeska Rocha',
    address: biz.address || 'Rua das Flores, 456 – Jardins, São Paulo – SP',
    whatsapp: (biz.whatsapp || '5598981848193').replace(/\D/g, ''),
    siteUrl: (env('VITE_SITE_URL') || 'https://www.maravaleska.com.br').replace(/\/$/, ''),
  };
}

const h = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, ...o }).format(new Date(iso));
const whenLong = (iso: string) => {
  const d = fmt(iso, { weekday: 'long', day: 'numeric', month: 'long' });
  return d.charAt(0).toUpperCase() + d.slice(1);
};
const hhmm = (iso: string) => fmt(iso, { hour: '2-digit', minute: '2-digit' });

// ---------------------------------------------------------------- convite (.ics)
export type InviteKind = 'request' | 'update' | 'cancel';

export function buildInviteIcs(b: Booking, kind: InviteKind, studio: Studio): string {
  const cancel = kind === 'cancel';
  const seq = Math.floor(Date.parse(b.updated_at || new Date().toISOString()) / 60000);
  const attendee = (b.client_name || 'Cliente').replace(/["\r\n]/g, '');
  const desc = [`${b.service_title} com ${studio.name}`, `Endereço: ${studio.address}`, `Dúvidas: https://wa.me/${studio.whatsapp}`].join('\n');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Valeska Cilios//Convite//PT-BR', 'CALSCALE:GREGORIAN', `METHOD:${cancel ? 'CANCEL' : 'REQUEST'}`,
    'BEGIN:VEVENT',
    `UID:${b.id}@valeska-cilios`, `DTSTAMP:${stamp(new Date().toISOString())}`, `SEQUENCE:${seq}`,
    `DTSTART:${stamp(b.starts_at)}`, `DTEND:${stamp(b.ends_at)}`,
    `SUMMARY:${esc(`${b.service_title} – ${studio.name}`)}`,
    `LOCATION:${esc(studio.address)}`,
    `DESCRIPTION:${esc(desc)}`,
    `STATUS:${cancel ? 'CANCELLED' : 'CONFIRMED'}`, 'TRANSP:OPAQUE',
    `ORGANIZER;CN="${studio.name.replace(/"/g, '')}":mailto:${fromAddress()}`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=FALSE;CN="${attendee}":mailto:${b.client_email}`,
  ];
  if (!cancel) lines.push('BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Seu horário é daqui a 1 hora', 'END:VALARM');
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

// ---------------------------------------------------------------- layout do e-mail (mesmo visual do site)
const C = { bg: '#f4efe4', card: '#faf6ed', line: '#e6d49a', gold: '#b98c00', goldBtn: '#d8b44a', ink: '#171a33', muted: '#7a6f5a' };
const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "Inter, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function layout(o: { preheader: string; badge: string; badgeColor?: string; title: string; intro: string; rows?: [string, string][]; cta?: { label: string; href: string }; foot?: string; studio: Studio }) {
  const { studio } = o;
  const rows = (o.rows || [])
    .map(([k, v]) => `<tr><td style="padding:8px 0;font:500 12px ${SANS};color:${C.muted};text-transform:uppercase;letter-spacing:.08em;width:96px;vertical-align:top">${h(k)}</td><td style="padding:8px 0;font:500 15px ${SANS};color:${C.ink};vertical-align:top">${h(v)}</td></tr>`)
    .join('');
  const cta = o.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0"><tr><td align="center" bgcolor="${C.goldBtn}" style="border-radius:999px;border:1px solid ${C.gold}"><a href="${h(o.cta.href)}" style="display:inline-block;padding:14px 32px;font:600 15px ${SANS};color:#3d2c00;text-decoration:none;border-radius:999px">${h(o.cta.label)}</a></td></tr></table>`
    : '';
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${h(o.title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${h(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:36px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
<tr><td align="center" style="padding:0 0 22px;font:600 30px ${SERIF};color:${C.gold}">${h(studio.name)}</td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:28px;padding:36px 32px;box-shadow:0 8px 32px rgba(0,0,0,.07)">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center"><span style="display:inline-block;padding:6px 14px;border-radius:999px;background:${o.badgeColor || '#e5f4ec'};font:600 12px ${SANS};color:#1d6b46;letter-spacing:.04em">${h(o.badge)}</span></td></tr>
<tr><td align="center" style="padding:18px 0 8px;font:500 28px/1.2 ${SERIF};color:${C.ink}">${h(o.title)}</td></tr>
<tr><td align="center" style="padding:0 0 22px;font:400 15px/1.6 ${SANS};color:${C.muted}">${o.intro}</td></tr>
${rows ? `<tr><td style="border:1px solid ${C.line};border-radius:18px;padding:12px 20px;background:#fffdf8"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>` : ''}
<tr><td>${cta}</td></tr>
${o.foot ? `<tr><td align="center" style="padding:24px 0 0;font:400 13px/1.6 ${SANS};color:${C.muted}">${o.foot}</td></tr>` : ''}
</table></td></tr>
<tr><td align="center" style="padding:22px 12px 0;font:400 12px/1.6 ${SANS};color:${C.muted}">${h(studio.name)} · Design e Alongamento de Cílios<br><a href="https://wa.me/${studio.whatsapp}" style="color:${C.gold};text-decoration:none">WhatsApp</a> &nbsp;·&nbsp; <a href="${h(studio.siteUrl)}" style="color:${C.gold};text-decoration:none">${h(studio.siteUrl.replace(/^https?:\/\//, ''))}</a></td></tr>
</table></td></tr></table></body></html>`;
}

function content(b: Booking, kind: InviteKind, studio: Studio) {
  const first = (b.client_name || '').split(' ')[0] || 'tudo bem';
  const rows: [string, string][] = [['Serviço', b.service_title], ['Data', whenLong(b.starts_at)], ['Horário', `${hhmm(b.starts_at)} às ${hhmm(b.ends_at)}`], ['Endereço', studio.address]];
  const manage = { label: 'Ver meus agendamentos', href: `${studio.siteUrl}/minha-conta` };
  if (kind === 'cancel') {
    return {
      subject: `Horário cancelado – ${b.service_title}`,
      html: layout({ studio, preheader: `Seu horário de ${b.service_title} foi cancelado.`, badge: 'CANCELADO', badgeColor: '#fbe9e7', title: 'Horário cancelado', intro: `Olá, ${h(first)}. O horário abaixo foi cancelado e já saiu do seu calendário. Quer escolher outro dia? É rapidinho.`, rows, cta: { label: 'Agendar novo horário', href: `${studio.siteUrl}/agendar` } }),
      text: `Olá, ${first}. Seu horário de ${b.service_title} (${whenLong(b.starts_at)}, ${hhmm(b.starts_at)}) foi cancelado. Agende outro em ${studio.siteUrl}/agendar`,
    };
  }
  const upd = kind === 'update';
  return {
    subject: `${upd ? 'Horário remarcado' : 'Seu horário está confirmado'} ✨ – ${b.service_title}`,
    html: layout({
      studio, preheader: `${upd ? 'Novo horário' : 'Confirmado'}: ${whenLong(b.starts_at)} às ${hhmm(b.starts_at)}`, badge: upd ? 'REMARCADO' : 'CONFIRMADO', title: upd ? 'Seu horário foi remarcado' : 'Seu horário está confirmado!',
      intro: `Olá, ${h(first)}! ${upd ? 'Atualizamos o seu horário.' : 'A Valeska confirmou o seu atendimento.'} Ele já aparece no seu <strong style="color:${C.ink}">Google Agenda</strong>: se não aparecer sozinho, toque em <strong style="color:${C.ink}">Sim</strong> no convite deste e-mail.`,
      rows, cta: manage, foot: `Precisa mudar algo? Responda este e-mail ou chame no <a href="https://wa.me/${studio.whatsapp}" style="color:${C.gold}">WhatsApp</a>.`,
    }),
    text: `Olá, ${first}! ${upd ? 'Seu horário foi remarcado' : 'Seu horário está confirmado'}: ${b.service_title}, ${whenLong(b.starts_at)} das ${hhmm(b.starts_at)} às ${hhmm(b.ends_at)}. Local: ${studio.address}. O convite de calendário está anexo.`,
  };
}

export async function sendInvite(b: Booking, kind: InviteKind, studio?: Studio) {
  if (!b.client_email) throw new Error('Cliente sem e-mail.');
  const s = studio || (await loadStudio());
  const c = content(b, kind, s);
  await getTransport().sendMail({
    from: fromRaw(),
    to: b.client_email,
    replyTo: fromAddress(),
    subject: c.subject,
    html: c.html,
    text: c.text,
    icalEvent: { method: kind === 'cancel' ? 'CANCEL' : 'REQUEST', filename: 'convite.ics', content: buildInviteIcs(b, kind, s) },
  });
}
