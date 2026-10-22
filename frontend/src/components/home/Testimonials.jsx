import SectionHeading from '../ui/SectionHeading';
import Reveal from '../ui/Reveal';
import DemoNotice from '../ui/DemoNotice';
import './Testimonials.css';

export default function Testimonials({ content }) {
  const items = content.testimonials.filter((t) => t.text);
  if (!items.length) return null;

  const hasDemo = items.some((t) => t.isDemo);

  return (
    <section className="testimonials section" id="testimonios">
      <div className="container">
        <SectionHeading
          eyebrow="Lo que dicen"
          title="Clientes que ya confiaron"
        />

        {hasDemo && (
          <div className="testimonials__notice">
            <DemoNotice>
              Testimonios de ejemplo. Reemplázalos por reseñas reales desde el panel.
            </DemoNotice>
          </div>
        )}

        <div className="testimonials__grid">
          {items.map((item, i) => (
            <Reveal as="figure" className="testimonial" key={item.id} delay={i * 90}>
              <blockquote>{item.text}</blockquote>
              <figcaption>
                <span className="testimonial__author">{item.author}</span>
                <span className="testimonial__event">{item.eventType}</span>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
