import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import SmartImage from '../components/ui/SmartImage';
import Reveal from '../components/ui/Reveal';
import Icon from '../components/ui/Icon';
import DemoNotice from '../components/ui/DemoNotice';
import { useSiteData } from '../context/SiteDataProvider';
import useSeo from '../hooks/useSeo';
import './Portfolio.css';

const ALL = 'todos';

/** "15 de noviembre de 2025" a partir de una fecha ISO. */
function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
}

export default function Portfolio() {
  const { content, albums } = useSiteData();
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get('categoria') || ALL;

  useSeo({
    title: 'Portafolio',
    description:
      'Álbumes de matrimonios, quince años, bautizos y eventos musicales fotografiados por Sebastián Sisa.',
    path: '/portafolio',
  });

  const published = useMemo(() => albums.filter((a) => a.isPublished !== false), [albums]);

  // Solo ofrecemos filtros de categorias que tengan al menos un album
  const availableCategories = useMemo(() => {
    const used = new Set(published.map((a) => a.category));
    return content.categories.filter((c) => used.has(c.slug));
  }, [content.categories, published]);

  const visible = useMemo(
    () => (active === ALL ? published : published.filter((a) => a.category === active)),
    [published, active],
  );

  const setCategory = (slug) => {
    if (slug === ALL) setSearchParams({}, { replace: true });
    else setSearchParams({ categoria: slug }, { replace: true });
  };

  const hasDemo = visible.some((a) => a.isDemo);

  return (
    <>
      <PageHero
        eyebrow="Portafolio"
        title="Cada álbum, una historia completa"
        lead="Entra a cualquier evento y recórrelo como si hubieras estado ahí."
      />

      <section className="section portfolio">
        <div className="container">
          {hasDemo && <DemoNotice />}

          <div className="portfolio__filters" role="group" aria-label="Filtrar por tipo de evento">
            <button
              type="button"
              className={`filter-pill ${active === ALL ? 'is-active' : ''}`}
              onClick={() => setCategory(ALL)}
              aria-pressed={active === ALL}
            >
              Todos
              <span className="filter-pill__count">{published.length}</span>
            </button>

            {availableCategories.map((category) => {
              const count = published.filter((a) => a.category === category.slug).length;
              return (
                <button
                  type="button"
                  key={category.slug}
                  className={`filter-pill ${active === category.slug ? 'is-active' : ''}`}
                  onClick={() => setCategory(category.slug)}
                  aria-pressed={active === category.slug}
                >
                  {category.name}
                  <span className="filter-pill__count">{count}</span>
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <div className="portfolio__empty">
              <Icon name="images" size={34} />
              <h2>Todavía no hay álbumes en esta categoría</h2>
              <p>Prueba con otro tipo de evento o mira el portafolio completo.</p>
              <button type="button" className="btn btn--ghost" onClick={() => setCategory(ALL)}>
                Ver todos
              </button>
            </div>
          ) : (
            <div className="portfolio__grid">
              {visible.map((album, i) => (
                <Reveal key={album.id || album.slug} delay={(i % 3) * 90}>
                  <Link to={`/portafolio/${album.slug}`} className="album-card">
                    <div className="album-card__media">
                      <SmartImage
                        image={album.cover}
                        alt={`Portada del álbum ${album.title}`}
                        sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 31vw"
                        aspectRatio="3 / 4"
                      />
                    </div>

                    <div className="album-card__body">
                      <p className="album-card__meta">
                        <span>{content.categories.find((c) => c.slug === album.category)?.name}</span>
                        {album.eventDate && <span>{formatDate(album.eventDate)}</span>}
                      </p>
                      <h2>{album.title}</h2>
                      <p className="album-card__count">
                        {album.photoCount ?? album.photos?.length ?? 0} fotos
                        <Icon name="arrowRight" size={16} />
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
