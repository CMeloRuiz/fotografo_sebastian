import PageHero from '../components/ui/PageHero';
import ServicesGrid from '../components/home/ServicesGrid';
import Process from '../components/home/Process';
import CtaBanner from '../components/home/CtaBanner';
import { useSiteData } from '../context/SiteDataProvider';
import useSeo from '../hooks/useSeo';

export default function Services() {
  const { content } = useSiteData();

  useSeo({
    title: 'Servicios y paquetes',
    description:
      'Cobertura de eventos sociales, videografía, sesiones de estudio y fotografía comercial en Villapinzón y Cundinamarca.',
    path: '/servicios',
  });

  return (
    <>
      <PageHero
        eyebrow="Servicios"
        title="Lo que puedo hacer por ti"
        lead="Cada evento es distinto, así que no vendo paquetes cerrados: me cuentas qué necesitas y armamos la cobertura que te sirve."
      />

      <section className="section" style={{ backgroundColor: 'var(--color-surface-2)' }}>
        <div className="container">
          <ServicesGrid services={content.services} />
        </div>
      </section>

      <Process content={content} />
      <CtaBanner content={content} />
    </>
  );
}
