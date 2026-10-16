import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../pages/Terms/Terms.scss';

export type LegalLang = 'en' | 'de';

export type LegalContent = Record<
  LegalLang,
  {
    label: string;
    title: string;
    subtitle: string;
    toc: string;
    sections: { number: string; title: string; items: string[] }[];
  }
>;

// Shared layout for legal pages (Terms & Conditions, Privacy Policy):
// EN/DE toggle, table of contents and numbered sections.
const LegalPage: React.FC<{ content: LegalContent }> = ({ content }) => {
  const [lang, setLang] = useState<LegalLang>('en');
  const t = content[lang];

  return (
    <div className="terms">
      <div className="terms__nav">
        <Link to="/" className="terms__nav__logo">
          <img src="/svg/logo-color.svg" alt="Matt Digging" />
        </Link>
      </div>

      <div className="terms__header">
        <div className="terms__header__top">
          <p className="terms__label">{t.label}</p>
          {/* Language toggle */}
          <div className="terms__lang-toggle">
            <button
              className={`terms__lang-toggle__btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              EN
            </button>
            <span className="terms__lang-toggle__sep" />
            <button
              className={`terms__lang-toggle__btn ${lang === 'de' ? 'active' : ''}`}
              onClick={() => setLang('de')}
            >
              DE
            </button>
          </div>
        </div>
        <h1 className="terms__title">{t.title}</h1>
        <p className="terms__subtitle">{t.subtitle}</p>
      </div>

      <div className="terms__body">
        <div className="terms__toc">
          <p className="terms__toc__heading">{t.toc}</p>
          <ol className="terms__toc__list">
            {t.sections.map((s) => (
              <li key={s.number}>
                <a
                  href={`#section-${s.number}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`section-${s.number}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span className="terms__toc__num">{s.number}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </div>

        <div className="terms__content">
          {t.sections.map((s) => (
            <section
              key={s.number}
              id={`section-${s.number}`}
              className="terms__section"
            >
              <div className="terms__section__header">
                <span className="terms__section__number">{s.number}</span>
                <h2 className="terms__section__title">{s.title}</h2>
              </div>
              <ol className="terms__section__list">
                {s.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
