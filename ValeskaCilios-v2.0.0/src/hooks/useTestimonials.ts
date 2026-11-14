import { useEffect, useState } from 'react';
import { supabase, supabaseReady } from '@/lib/supabase';
import { testimonials as fallback } from '@/data/testimonials';

export interface PublicTestimonial { id: number | string; name: string; role: string | null; text: string; rating: number }

export function useTestimonials(): PublicTestimonial[] {
  const [items, setItems] = useState<PublicTestimonial[]>(fallback);
  useEffect(() => {
    if (!supabaseReady) return;
    supabase.from('testimonials').select('id,name,role,text,rating').eq('approved', true).order('created_at', { ascending: false }).limit(9)
      .then(({ data }) => data && data.length && setItems(data as PublicTestimonial[]));
  }, []);
  return items;
}
