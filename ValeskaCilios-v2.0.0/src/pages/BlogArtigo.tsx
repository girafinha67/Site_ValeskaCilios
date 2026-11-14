import { Link, useRoute } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { blogPosts } from '@/data/blogPosts';
import { useSEO } from '@/hooks/useSEO';
import { GlassButton } from '@/components/GlassButton';
import NotFound from './not-found';

export default function BlogArtigo() {
  const [, params] = useRoute('/blog/:slug');
  const post = blogPosts.find((p) => p.slug === params?.slug);
  useSEO({ title: post?.title, description: post?.excerpt, ogType: 'article', noindex: !post });
  if (!post) return <NotFound />;
  return (
    <article className="pt-32 pb-16 px-6">
      <div className="container mx-auto max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-primary mb-8"><ArrowLeft size={16} /> Voltar ao blog</Link>
        <p className="text-xs text-muted-foreground mb-3">{post.category} · {new Date(post.date).toLocaleDateString('pt-BR')} · {post.readTime} de leitura</p>
        <h1 className="text-4xl md:text-5xl font-serif leading-tight mb-8">{post.title}</h1>
        <div className="prose-blog" dangerouslySetInnerHTML={{ __html: post.content }} />
        <div className="mt-12 glass rounded-3xl p-8 text-center">
          <h2 className="font-serif text-2xl mb-3">Gostou das dicas?</h2>
          <p className="text-muted-foreground mb-6">Agende seu horário e cuide do seu olhar com quem entende.</p>
          <GlassButton href="/agendar" trackName="cta_agendar_blog">Agendar agora</GlassButton>
        </div>
      </div>
    </article>
  );
}
