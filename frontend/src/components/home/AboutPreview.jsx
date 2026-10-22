import { Link } from 'react-router-dom';
import SmartImage from '../ui/SmartImage';
import Reveal from '../ui/Reveal';
import Icon from '../ui/Icon';
import images from '../../data/images.json';
import './AboutPreview.css';

export default function AboutPreview({ content }) {
  const { about } = content;
  const portrait = content.aboutPhoto || images.portrait;

  return (
    <section className="about section" id="sobre-mi">
      <div className="container about__grid">
        <Reveal variant="left" className="about__text">
          <p className="eyebrow">{about.eyebrow}</p>
          <h2 className="about__title">{about.title}</h2>
          <p className="about__intro">{about.intro}</p>

          {about.paragraphs.slice(0, 2).map((text) => (
            <p key={text.slice(0, 32)}>{text}</p>
          ))}

          <Link to="/sobre-mi" className="btn btn--ghost about__cta">
            Conoce mi historia
            <Icon name="arrowRight" size={18} />
          </Link>
        </Reveal>

        <Reveal variant="right" className="about__media" delay={120}>
          <SmartImage
            image={portrait}
            alt="Sebastián Sisa, fotógrafo de eventos en Villapinzón"
            sizes="(max-width: 900px) 90vw, 460px"
          />
        </Reveal>
      </div>
    </section>
  );
}
