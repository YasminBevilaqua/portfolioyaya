import ScrollReveal from './ScrollReveal';
import SectionTitle from './SectionTitle';
import { Instagram, Linkedin, Mail, MessageCircle } from 'lucide-react';

export default function Contact() {
  const socialLinks = [
    { name: 'Instagram', href: 'https://www.instagram.com/bevilaquadev/', icon: Instagram },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/in/yasmin-bevilaqua/', icon: Linkedin },
    { name: 'WhatsApp', href: 'https://wa.me/', icon: MessageCircle },
    { name: 'Email', href: 'mailto:yayabevilaqua@gmail.com', icon: Mail },
  ];

  return (
    <section
      id="contact"
      className="section-soft-bg section-padding-top relative z-10 flex min-h-screen min-h-dvh flex-col pb-32 px-6"
    >
      <div className="container min-h-[55vh] max-w-6xl">
        <div className="grid items-start gap-16 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="mt-2 max-w-md justify-self-start pl-16 md:mt-8 md:pl-32">
            <SectionTitle
              title="Contato"
              subtitle="Me encontre nas redes"
              subtitleClassName="whitespace-nowrap"
            />
          </div>

          <ScrollReveal delay={0.1}>
            <ul className="contact-social-stack mt-10 justify-self-center md:-ml-20 md:mt-40 md:justify-self-center" aria-label="Redes sociais">
              {socialLinks.map(({ name, href, icon: Icon }) => (
                <li key={name}>
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={name}>
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <Icon size={20} />
                  </a>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
