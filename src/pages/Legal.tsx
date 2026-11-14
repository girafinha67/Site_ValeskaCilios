import { useSettings } from '@/lib/settings';
import { useSEO } from '@/hooks/useSEO';
import { GlassCard } from '@/components/GlassCard';

const H = ({ children }: { children: string }) => <h2 className="text-2xl font-serif mt-8 mb-3">{children}</h2>;
const P = ({ children }: { children: React.ReactNode }) => <p className="text-muted-foreground leading-relaxed mb-3">{children}</p>;
const UL = ({ items }: { items: string[] }) => <ul className="list-disc pl-6 mb-3 space-y-1 text-muted-foreground">{items.map((i) => <li key={i}>{i}</li>)}</ul>;
const UPDATED = '13 de Novembro de 2026';

export function Privacidade() {
  const { site } = useSettings();
  useSEO({ title: 'Política de Privacidade' });
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-5xl font-serif mb-3">Política de <span className="italic font-light text-primary">Privacidade</span></h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: {UPDATED}</p>
        <GlassCard>
          <P>A sua privacidade é importante para nós. Esta Política de Privacidade explica como {site.name} (“nós”) coleta, usa, compartilha e protege suas informações pessoais ao utilizar nosso site e serviços, em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018).</P>
          <H>1. Informações que coletamos</H>
          <P>Coletamos informações que você nos fornece diretamente, tais como:</P>
          <UL items={['Nome, e-mail, telefone/WhatsApp e senha (armazenada de forma criptografada) ao criar sua conta.', 'Informações de agendamento e preferências de serviço.', 'Mensagens enviadas pelo formulário de contato.', 'Depoimentos que você optar por enviar.']} />
          <H>2. Como usamos suas informações</H>
          <UL items={['Agendar e gerenciar seus procedimentos, inclusive em nossa agenda digital.', 'Responder às suas dúvidas e solicitações.', 'Enviar lembretes de agendamento e dicas de cuidados (quando autorizado).', 'Melhorar nossos serviços e a experiência no site.']} />
          <H>3. Cookies e estatísticas</H>
          <P>Utilizamos o Google Analytics 4 para entender, de forma agregada, como o site é utilizado. Esses cookies só são ativados após o seu consentimento no aviso exibido ao entrar no site, e você pode recusá-los sem prejuízo ao uso do site. Também utilizamos o Google Search Console para monitorar o desempenho do site nas buscas.</P>
          <H>4. Compartilhamento de informações</H>
          <P>Não vendemos, trocamos ou alugamos suas informações pessoais. Podemos compartilhá-las apenas para cumprir obrigações legais ou com provedores que nos auxiliam na operação do negócio (hospedagem, banco de dados, Google Agenda e Google Analytics), sempre sob obrigações de confidencialidade e segurança.</P>
          <H>5. Segurança</H>
          <P>Adotamos medidas técnicas e organizacionais adequadas para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição. No entanto, nenhum método de transmissão pela internet é 100% seguro.</P>
          <H>6. Seus direitos</H>
          <P>Você tem o direito de solicitar acesso, correção, portabilidade ou exclusão dos seus dados pessoais, e de revogar consentimentos. Para exercer esses direitos, entre em contato pelo e-mail abaixo.</P>
          <H>7. Contato</H>
          <P>Dúvidas sobre esta Política? Escreva para {site.email}.</P>
        </GlassCard>
      </div>
    </section>
  );
}

export function Termos() {
  const { site } = useSettings();
  useSEO({ title: 'Termos de Uso' });
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-5xl font-serif mb-3">Termos de <span className="italic font-light text-primary">Uso</span></h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: {UPDATED}</p>
        <GlassCard>
          <H>1. Aceitação dos Termos</H>
          <P>Ao acessar e usar o site de {site.name}, você concorda em cumprir estes Termos de Uso. Se você não concorda com qualquer parte, não deverá utilizar o site.</P>
          <H>2. Serviços e agendamentos</H>
          <P>As informações sobre serviços e preços estão sujeitas a alterações sem aviso prévio. O agendamento feito pelo site, WhatsApp ou formulário constitui uma reserva preliminar e só é confirmado após a nossa validação, que será informada na sua área do cliente.</P>
          <H>3. Conta do cliente</H>
          <P>Você é responsável por manter a confidencialidade de sua senha e por fornecer dados verdadeiros. Podemos suspender contas usadas de forma abusiva, como reservas repetidas sem comparecimento.</P>
          <H>4. Política de cancelamento</H>
          <P>Pedimos a gentileza de comunicar cancelamentos ou reagendamentos com antecedência mínima de 24 horas (o cancelamento online segue o prazo configurado no site). Cancelamentos frequentes de última hora podem resultar na impossibilidade de realizar futuros agendamentos.</P>
          <H>5. Propriedade intelectual</H>
          <P>Todo o conteúdo deste site (textos, gráficos, logotipos, ícones, imagens e software) é propriedade de {site.name} e protegido por leis de direitos autorais. O uso não autorizado é proibido.</P>
          <H>6. Limitação de responsabilidade</H>
          <P>As dicas do blog e do site têm caráter informativo e educativo. Embora nos esforcemos para manter as informações precisas e atualizadas, não garantimos a adequação a todos os casos específicos.</P>
          <H>7. Modificações dos Termos</H>
          <P>Podemos modificar estes Termos a qualquer momento. As alterações entram em vigor após a publicação no site. O uso contínuo constitui aceitação dos novos termos.</P>
          <H>8. Lei aplicável</H>
          <P>Estes termos são regidos pelas leis do Brasil. Qualquer disputa será submetida aos tribunais competentes.</P>
        </GlassCard>
      </div>
    </section>
  );
}
