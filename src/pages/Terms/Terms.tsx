import React, { useState } from 'react';
import './Terms.scss';

type Lang = 'en' | 'de';

const content: Record<Lang, { label: string; title: string; subtitle: string; toc: string; sections: { number: string; title: string; items: string[] }[] }> = {
  en: {
    label: 'Legal',
    title: 'Terms & Conditions',
    subtitle: 'mattdigging.com — operated by Mattmosphere',
    toc: 'Contents',
    sections: [
      {
        number: '01',
        title: 'Scope and Provider',
        items: [
          "These T&Cs apply to all contracts regarding the use of the curated music streaming service on the website mattdigging.com, operated by: Mattmosphere (hereinafter 'Provider').",
          'The offer is directed exclusively at consumers within the meaning of Section 13 of the German Civil Code (BGB).',
          'A consumer is any natural person who enters into a legal transaction for purposes that are predominantly neither commercial nor related to their independent professional activity.',
        ],
      },
      {
        number: '02',
        title: 'Subject Matter and Services',
        items: [
          'The Provider provides the user with a digital service in the form of a curated music streaming offer.',
          'The scope of services includes: Access to weekly updated Music Selections via the platform. Provision of a total of at least 50 new music tracks per calendar month. Access to an artist database and playlists with filter functions.',
          'The content is provided exclusively as a stream for temporary playback.',
          'Downloading, permanent storage, or any other reproduction is technically not provided for and is contractually prohibited.',
          'The Provider provides necessary technical updates.',
        ],
      },
      {
        number: '03',
        title: 'Conclusion of Contract and Memberships',
        items: [
          'The contract is concluded upon registration and completion of the paid ordering process.',
          'Two membership models are available: Monthly Subscription (Member): EUR 5.00 incl. VAT per month. Billing occurs in advance on the 01st. Initial billing is pro-rata if joining during a month. Annual Membership (One-time payment): EUR 50.00 incl. VAT for a fixed term of 12 months.',
        ],
      },
      {
        number: '04',
        title: 'Term and Termination',
        items: [
          'The monthly subscription runs for an indefinite period and can be terminated at any time without notice.',
          'Payment obligation ends at the next billing date (01st of the following month). Access remains available until the end of the paid period.',
          'The annual membership ends automatically after 12 months.',
          'The right to extraordinary termination for good cause remains unaffected.',
          "Users may use the 'Cancel now' button on the website.",
        ],
      },
      {
        number: '05',
        title: 'Usage Restrictions and Content',
        items: [
          'Content is protected by copyright.',
          'Users are granted a simple, non-transferable right for private use via streaming.',
          'Commercial use, public performance, reproduction, or recording (e.g., stream ripping) is prohibited.',
          'Access may be blocked upon violations.',
          'The Provider responds to rights infringement notices (Notice-and-Take-Down).',
        ],
      },
      {
        number: '06',
        title: 'Right of Withdrawal for Consumers',
        items: [
          'Consumers generally have a statutory 14-day right of withdrawal.',
          "This right expires prematurely for digital services if performance has begun with the user's express consent and acknowledgment of the loss of the right of withdrawal.",
        ],
      },
      {
        number: '07',
        title: 'Liability for Defects and Liability',
        items: [
          'Statutory warranty rights for digital products pursuant to Sections 327 et seq. BGB apply.',
          'The Provider is liable for defects regarding functionality or availability.',
          'Liability for slight negligence is limited to contract-typical, foreseeable damage.',
          'Liability for intent, gross negligence, and personal injury remains unlimited.',
        ],
      },
      {
        number: '08',
        title: 'Final Provisions',
        items: [
          'The law of the Federal Republic of Germany shall apply, excluding the CISG.',
          'If individual provisions are ineffective, the remaining contract remains valid.',
          'Statutory regulations apply in place of ineffective provisions.',
        ],
      },
    ],
  },
  de: {
    label: 'Rechtliches',
    title: 'AGB',
    subtitle: 'mattdigging.com — betrieben durch Mattmosphere',
    toc: 'Inhalt',
    sections: [
      {
        number: '01',
        title: 'Geltungsbereich und Anbieter',
        items: [
          'Diese AGB gelten für alle Verträge über die Nutzung des kuratierten Musik-Streaming-Dienstes auf der Website mattdigging.com, betrieben durch Mattmosphere (nachfolgend „Anbieter").',
          'Das Angebot richtet sich ausschließlich an Verbraucher im Sinne des § 13 BGB.',
          'Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbstständigen beruflichen Tätigkeit zugerechnet werden können.',
        ],
      },
      {
        number: '02',
        title: 'Vertragsgegenstand und Leistungen',
        items: [
          'Der Anbieter stellt dem Nutzer eine digitale Dienstleistung in Form eines kuratierten Musik-Streaming-Angebots bereit.',
          'Der Leistungsumfang umfasst: Den Zugang zu wöchentlich aktualisierten Musik Selektionen über die Plattform. Die Bereitstellung von insgesamt mindestens 50 neuen Musikstücken pro Kalendermonat. Den Zugriff auf eine Künstler-Datenbank sowie Playlisten mit Filterfunktionen.',
          'Die Inhalte werden ausschließlich als Stream zur vorübergehenden Wiedergabe bereitgestellt.',
          'Ein Download, eine dauerhafte Speicherung oder eine sonstige Vervielfältigung ist technisch nicht vorgesehen und vertraglich untersagt.',
          'Der Anbieter stellt notwendige technische Aktualisierungen bereit.',
        ],
      },
      {
        number: '03',
        title: 'Vertragsschluss und Mitgliedschaften',
        items: [
          'Der Vertrag kommt durch die Registrierung und den Abschluss des kostenpflichtigen Bestellvorgangs zustande.',
          'Es stehen zwei Mitgliedschaftsmodelle zur Auswahl: Monatliche Subscription (Member): 5,00 EUR inkl. MwSt. monatlich. Abbuchung zum 01. im Voraus. Bei Beitritt während des Monats erfolgt die Abrechnung anteilig. Jahresmitgliedschaft: 50,00 EUR inkl. MwSt. als Einmalzahlung für 12 Monate.',
        ],
      },
      {
        number: '04',
        title: 'Laufzeit und Kündigung',
        items: [
          'Die monatliche Subscription läuft auf unbestimmte Zeit und ist jederzeit fristlos kündbar.',
          'Die Zahlungsverpflichtung endet zum nächsten Abbuchungstermin (01. des Folgemonats).',
          'Der Zugang bleibt bis zum Ende des bezahlten Zeitraums bestehen.',
          'Die Jahresmitgliedschaft endet automatisch nach 12 Monaten.',
          'Das Recht zur außerordentlichen Kündigung bleibt unberührt.',
          'Zur Kündigung kann der Button „Jetzt kündigen" genutzt werden.',
        ],
      },
      {
        number: '05',
        title: 'Nutzungsbeschränkungen und Inhalte',
        items: [
          'Die Inhalte sind urheberrechtlich geschützt.',
          'Es wird ein einfaches, nicht übertragbares Recht zur privaten Nutzung via Streaming eingeräumt.',
          'Gewerbliche Nutzung, öffentliche Wiedergabe, Vervielfältigung oder Mitschneiden sind untersagt.',
          'Bei Verstößen kann der Zugang gesperrt werden.',
          'Der Anbieter prüft bei Hinweisen mögliche Rechtsverletzungen (Notice-and-Take-Down).',
        ],
      },
      {
        number: '06',
        title: 'Widerrufsrecht',
        items: [
          'Verbrauchern steht ein 14-tägiges Widerrufsrecht zu.',
          'Das Recht erlischt vorzeitig, wenn die Ausführung mit Zustimmung des Nutzers und Kenntnis über den Verlust des Widerrufsrechts begonnen hat.',
        ],
      },
      {
        number: '07',
        title: 'Mängelhaftung und Haftung',
        items: [
          'Es gelten die gesetzlichen Mängelrechte gemäß §§ 327 ff. BGB.',
          'Der Anbieter haftet für Mängel bei Nichterfüllung subjektiver oder objektiver Anforderungen.',
          'Bei leichter Fahrlässigkeit ist die Haftung auf vertragstypische Schäden begrenzt.',
          'Die Haftung für Vorsatz, grobe Fahrlässigkeit und Personenschäden bleibt unbeschränkt.',
        ],
      },
      {
        number: '08',
        title: 'Schlussbestimmungen',
        items: [
          'Es gilt das Recht der Bundesrepublik Deutschland.',
          'Die Unwirksamkeit einzelner Bestimmungen berührt die Wirksamkeit des restlichen Vertrages nicht.',
          'Es gelten stattdessen die gesetzlichen Vorschriften.',
        ],
      },
    ],
  },
};

const Terms: React.FC = () => {
  const [lang, setLang] = useState<Lang>('en');
  const t = content[lang];

  return (
    <div className="terms">
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
                <a href={`#section-${s.number}`}>
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

export default Terms;