export interface Service {
  id: number;
  title: string;
  description: string;
  duration_min: number;
  price_cents: number;
  price_prefix: string;
  tag: string | null;
  icon: string;
  active: boolean;
  sort: number;
}

export type BookingStatus = 'pendente' | 'confirmado' | 'concluido' | 'cancelado' | 'faltou';

export interface Booking {
  id: string;
  client_id: string | null;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  service_id: number | null;
  service_title: string;
  price_cents: number;
  final_price_cents: number | null;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  notes: string | null;
  admin_notes: string | null;
  source: string;
  cancelled_by: string | null;
  google_event_id: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  birthday: string | null;
  role: 'client' | 'admin';
  admin_notes: string | null;
  marketing_opt_in: boolean;
  created_at: string;
}

export interface BusinessHour {
  weekday: number;
  is_open: boolean;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
}

export interface BookingSettings {
  slot_step_min: number;
  min_notice_hours: number;
  max_days_ahead: number;
  cancel_hours: number;
  buffer_min: number;
  auto_confirm: boolean;
}

export interface Testimonial {
  id: number;
  client_id: string | null;
  name: string;
  role: string | null;
  text: string;
  rating: number;
  approved: boolean;
  created_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  faltou: 'Faltou',
};
