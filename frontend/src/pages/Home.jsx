import Hero from '../components/home/Hero';
import AboutPreview from '../components/home/AboutPreview';
import Stats from '../components/home/Stats';
import Categories from '../components/home/Categories';
import FeaturedGallery from '../components/home/FeaturedGallery';
import ServicesGrid from '../components/home/ServicesGrid';
import Process from '../components/home/Process';
import Testimonials from '../components/home/Testimonials';
import CtaBanner from '../components/home/CtaBanner';
import SectionHeading from '../components/ui/SectionHeading';
import { useSiteData } from '../context/SiteDataProvider';
import useSeo from '../hooks/useSeo';

export default function Home() {
  const { content, albums, featuredPhotos } = useSiteData();

  useSeo({
    title: 'Fotografía y video para eventos en Villapinzón',
    description:
      'Sebastián Sisa, fotógrafo y filmmaker de matrimonios, quince años, bautizos y eventos musicales en Villapinzón y Cundinamarca. Mira el portafolio y cotiza por WhatsApp.',
    path: '/',
  });

  return (
    <>
      <Hero content={content} />
      <AboutPreview content={content} />
      <Stats content={content} />
      <Categories content={content} albums={albums} />
      <FeaturedGallery photos={featuredPhotos} />

      <section className="section" id="servicios" style={{ backgroundColor: 'var(--color-surface-2)' }}>
        <div className="container">
          <SectionHeading
            eyebrow="Servicios"
            title="Lo que puedo hacer por ti"
            lead="Cobertura completa de foto y video, con un solo equipo y un solo interlocutor."
          />
          <ServicesGrid services={content.services} />
        </div>
      </section>

      <Process content={content} />
      <Testimonials content={content} />
      <CtaBanner content={content} />
    </>
  );
}
