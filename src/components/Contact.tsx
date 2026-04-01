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
          <div className="mt-2 flex w-full max-w-md flex-col items-center justify-self-center px-0 md:mt-8 md:items-start md:justify-self-start md:pl-32">
            <SectionTitle
              title="Contato"
              subtitle="Me encontre nas redes"
              subtitleClassName="max-md:whitespace-normal whitespace-nowrap"
              responsiveAlign
            />
          </div>

          <ScrollReveal
            delay={0.1}
            fadeOnly
            className="flex w-full max-w-full justify-center overflow-visible max-md:min-w-0 md:block"
          >
            <div className="flex w-full justify-center max-md:overflow-visible md:contents">
              <ul
                className="contact-social-stack mt-10 md:-ml-20 md:mt-40 md:justify-self-center"
                aria-label="Redes sociais"
              >
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
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
