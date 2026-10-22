import PageHero from '../components/ui/PageHero';
import SmartImage from '../components/ui/SmartImage';
import Reveal from '../components/ui/Reveal';
import CtaBanner from '../components/home/CtaBanner';
import images from '../data/images.json';
import { useSiteData } from '../context/SiteDataProvider';
import useSeo from '../hooks/useSeo';
import './About.css';

export default function About() {
  const { content } = useSiteData();
  const { about, stats, identity } = content;

  useSeo({
    title: 'Sobre mí',
    description: `${identity.name}, fotógrafo y filmmaker de eventos en Villapinzón. ${identity.shortBio}`,
    image: '/media/portrait-1200.jpg',
    path: '/sobre-mi',
    type: 'profile',
  });

  return (
    <>
      <PageHero eyebrow={about.eyebrow} title={about.title} />

      <section className="section about-page">
        <div className="container about-page__grid">
          <Reveal variant="left" className="about-page__text">
            <p className="about-page__intro">{about.intro}</p>
            {about.paragraphs.map((text) => (
              <p key={text.slice(0, 32)}>{text}</p>
            ))}

            <dl className="about-page__stats">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd>
                    {stat.value}
                    {stat.format === 'count' && '+'}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal variant="right" className="about-page__media" delay={110}>
            <SmartImage
              image={images.portrait}
              alt={`${identity.name}, fotógrafo de eventos`}
              sizes="(max-width: 900px) 90vw, 480px"
            />
            <SmartImage
              image={images.portraitAlt}
              alt={`${identity.name} durante una sesión`}
              sizes="(max-width: 900px) 45vw, 240px"
              className="about-page__media-small"
            />
          </Reveal>
        </div>
      </section>

      <CtaBanner content={content} />
    </>
  );
}
