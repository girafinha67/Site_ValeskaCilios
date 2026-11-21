import { db, type Booking } from './supabase.js';
import { loadStudio, mailConfigured, sendInvite, type InviteKind } from './mail.js';

export interface NotifyResult {
  sent: boolean;
  kind?: InviteKind;
  reason?: 'smtp' | 'no_email' | 'migration' | 'nothing' | 'error';
  message?: string;
}

const hashOf = (b: Booking) => `${b.starts_at}|${b.ends_at}|${b.service_title}`;

/**
 * Envia (ou atualiza/cancela) o convite de calendário por e-mail, conforme o status atual do agendamento.
 * Funciona no Google Agenda, iPhone e Outlook, sem usar nenhuma API do Google.
 */
export async function notifyBooking(b: Booking): Promise<NotifyResult> {
  if (b.source === 'bloqueio') return { sent: false, reason: 'nothing' };
  if (!('invite_hash' in b)) return { sent: false, reason: 'migration', message: 'Rode o SQL supabase/migrations/2026-11-21_convite_agenda.sql no Supabase.' };

  let kind: InviteKind | null = null;
  if (b.status === 'confirmado') {
    if (b.invite_hash !== hashOf(b)) kind = b.invite_hash ? 'update' : 'request';
  } else if ((b.status === 'cancelado' || b.status === 'faltou') && b.invite_hash) {
    kind = 'cancel';
  }
  if (!kind) return { sent: false, reason: 'nothing' };
  if (!b.client_email) return { sent: false, reason: 'no_email' };
  if (!mailConfigured()) return { sent: false, reason: 'smtp' };

  try {
    await sendInvite(b, kind, await loadStudio());
    await db().from('bookings').update({ invite_hash: kind === 'cancel' ? null : hashOf(b) }).eq('id', b.id);
    return { sent: true, kind };
  } catch (e) {
    console.error('Falha ao enviar convite por e-mail:', (e as Error).message);
    return { sent: false, reason: 'error', message: (e as Error).message };
  }
}
