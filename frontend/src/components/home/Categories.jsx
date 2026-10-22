import { Link } from 'react-router-dom';
import SectionHeading from '../ui/SectionHeading';
import SmartImage from '../ui/SmartImage';
import Reveal from '../ui/Reveal';
import Icon from '../ui/Icon';
import DemoNotice from '../ui/DemoNotice';
import './Categories.css';

/**
 * Rejilla de categorias de evento.
 *
 * Reemplaza el carrusel infinito del sitio antiguo: aquel repetia las
 * tarjetas dos veces en el HTML y animaba 14 imagenes a resolucion completa
 * sin parar, aunque nadie las estuviera mirando.
 */
export default function Categories({ content, albums }) {
  const coverFor = (slug) => albums.find((a) => a.category === slug)?.cover;
  const hasDemoCovers = albums.some((a) => a.isDemo);

  return (
    <section className="categories section" id="categorias">
      <div className="container">
        <SectionHeading
          eyebrow="Qué fotografío"
          title="Cada celebración, con su propio lenguaje"
          lead="Elige el tipo de evento y mira cómo lo cuento."
        />

        {hasDemoCovers && (
          <div className="categories__notice">
            <DemoNotice />
          </div>
        )}

        <div className="categories__grid">
          {content.categories.map((category, i) => {
            const cover = coverFor(category.slug);
            return (
              <Reveal key={category.slug} delay={i * 70}>
                <Link
                  to={`/portafolio?categoria=${category.slug}`}
                  className="category-card"
                >
                  <div className="category-card__media">
                    {cover ? (
                      <SmartImage
                        image={cover}
                        alt={`Fotografía de ${category.name.toLowerCase()}`}
                        sizes="(max-width: 600px) 92vw, (max-width: 1000px) 46vw, 31vw"
                        aspectRatio="4 / 5"
                      />
                    ) : (
                      <div className="category-card__empty" aria-hidden="true">
                        <Icon name="camera" size={28} />
                      </div>
                    )}
                  </div>

                  <div className="category-card__body">
                    <h3>{category.name}</h3>
                    <p>{category.blurb}</p>
                    <span className="category-card__link">
                      Ver álbumes
                      <Icon name="arrowRight" size={16} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
