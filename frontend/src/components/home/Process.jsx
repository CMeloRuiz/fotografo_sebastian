import SectionHeading from '../ui/SectionHeading';
import Reveal from '../ui/Reveal';
import Icon from '../ui/Icon';
import './Process.css';

const POINT_ICONS = ['heart', 'clock', 'video', 'images'];

/**
 * "Por que elegirme" y el proceso de trabajo, juntos en un solo bloque:
 * responden la objecion y explican que pasa despues de escribir.
 */
export default function Process({ content }) {
  const { process, whyMe } = content;

  return (
    <section className="process section" id="proceso">
      <div className="container">
        <SectionHeading eyebrow={whyMe.eyebrow} title={whyMe.title} align="center" />

        <div className="process__points">
          {whyMe.points.map((point, i) => (
            <Reveal className="process__point" key={point.title} delay={i * 80}>
              <span className="process__point-icon">
                <Icon name={POINT_ICONS[i % POINT_ICONS.length]} size={22} />
              </span>
              <h3>{point.title}</h3>
              <p>{point.text}</p>
            </Reveal>
          ))}
        </div>

        <div className="process__steps-header">
          <p className="eyebrow">{process.eyebrow}</p>
          <h3 className="process__steps-title">{process.title}</h3>
        </div>

        <ol className="process__steps">
          {process.steps.map((step, i) => (
            <Reveal as="li" className="process__step" key={step.n} delay={i * 90}>
              <span className="process__step-n">{step.n}</span>
              <h4>{step.title}</h4>
              <p>{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
