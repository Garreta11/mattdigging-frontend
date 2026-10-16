import React from 'react';
import LegalPage, { LegalContent } from '../../components/LegalPage/LegalPage';

// Privacy policy for mattdigging.com and the Mattdigging app (iOS / Android).
// Describes the data the website, app and backend actually process. Keep it in sync
// when adding services (analytics, newsletters, new providers…).
const content: LegalContent = {
  en: {
    label: 'Legal',
    title: 'Privacy Policy',
    subtitle: 'mattdigging.com and the Mattdigging app · Last updated: 16 October 2026',
    toc: 'Contents',
    sections: [
      {
        number: '01',
        title: 'Controller and Contact',
        items: [
          "The controller responsible for processing personal data on the website mattdigging.com and in the Mattdigging app for iOS and Android is mattmosphere (hereinafter 'we').",
          'For any questions about privacy or to exercise your rights, contact us at: mattdigging@gmx.de',
        ],
      },
      {
        number: '02',
        title: 'Data We Process',
        items: [
          'Account data: your email address, your password (stored only in encrypted form by our authentication provider; we cannot read it), and the display name and username you choose when signing up.',
          'Data you create: the tracks you save as favourites.',
          'Membership data: whether you are a member, your plan (monthly or annual), and the start and expiry dates of your membership.',
          'Payment data: payments are processed by Stripe. We do not receive or store your full card details; Stripe tells us the status of your subscription.',
          'Technical data: when you use the website, app or our servers, technical information such as your IP address, device or browser type and the time of the request is processed by our hosting providers to deliver the service and keep it secure.',
          'Messages: if you contact us by email, we process your email address and the content of your message.',
        ],
      },
      {
        number: '03',
        title: 'Purposes and Legal Bases',
        items: [
          'Providing your account, the streaming service, favourites and your membership (Art. 6(1)(b) GDPR – performance of a contract).',
          'Processing payments and keeping billing records required by tax and commercial law (Art. 6(1)(b) and (c) GDPR).',
          'Operating the website, app and servers securely and preventing misuse (Art. 6(1)(f) GDPR – legitimate interest in a secure and working service).',
          'Answering your messages (Art. 6(1)(b) or (f) GDPR).',
        ],
      },
      {
        number: '04',
        title: 'Service Providers',
        items: [
          'Supabase: user accounts, login, database (account, favourites and membership data) and file storage for music and images.',
          'Vercel: hosting of the website mattdigging.com.',
          'Cloudflare: hosting of our API, which the website and app use to load content.',
          'Stripe: payment processing for memberships.',
          'Apple (App Store, TestFlight) and Google (Google Play): distribution of the app, under their own privacy policies.',
          'These providers process data on our behalf or as independent controllers for their own services. Some of them may process data outside the European Union; such transfers take place on the basis of the safeguards offered by the respective provider, such as the EU–U.S. Data Privacy Framework or the EU Standard Contractual Clauses.',
        ],
      },
      {
        number: '05',
        title: 'Storage on Your Device',
        items: [
          "To keep you logged in, the website stores your login session in your browser's local storage, and the app stores it on your device.",
          'We do not use analytics, advertising or tracking cookies, and the website does not load fonts or other resources from third-party servers.',
        ],
      },
      {
        number: '06',
        title: 'Retention',
        items: [
          'We keep your account, favourites and membership data for as long as your account exists. When you delete your account, this data is deleted and any active membership is cancelled.',
          'Billing records are kept for the periods required by law (in Germany, up to 10 years).',
          'Technical log data is kept by our hosting providers only for a short period for security and operation.',
        ],
      },
      {
        number: '07',
        title: 'Your Rights',
        items: [
          'You have the right to access your personal data, to have it corrected or deleted, to restrict its processing, to data portability, and to object to processing based on legitimate interests (Art. 15–21 GDPR).',
          'You can delete your account and data at any time in the Mattdigging app under Profile → Delete account, or by writing to mattdigging@gmx.de. To exercise any other right, write to the same address.',
          'You also have the right to lodge a complaint with a data protection supervisory authority.',
        ],
      },
      {
        number: '08',
        title: 'Changes',
        items: [
          'We may update this privacy policy when our service or the law changes. The current version is always available on this page.',
        ],
      },
    ],
  },
  de: {
    label: 'Rechtliches',
    title: 'Datenschutzerklärung',
    subtitle: 'mattdigging.com und die Mattdigging-App · Stand: 16. Oktober 2026',
    toc: 'Inhalt',
    sections: [
      {
        number: '01',
        title: 'Verantwortlicher und Kontakt',
        items: [
          'Verantwortlich für die Verarbeitung personenbezogener Daten auf der Website mattdigging.com und in der Mattdigging-App für iOS und Android ist mattmosphere (nachfolgend „wir“).',
          'Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte erreichen Sie uns unter: mattdigging@gmx.de',
        ],
      },
      {
        number: '02',
        title: 'Welche Daten wir verarbeiten',
        items: [
          'Kontodaten: Ihre E-Mail-Adresse, Ihr Passwort (nur verschlüsselt bei unserem Authentifizierungsanbieter gespeichert; wir können es nicht lesen) sowie der Anzeigename und Benutzername, die Sie bei der Registrierung wählen.',
          'Von Ihnen erstellte Daten: die Titel, die Sie als Favoriten speichern.',
          'Mitgliedschaftsdaten: ob Sie Mitglied sind, Ihr Tarif (monatlich oder jährlich) sowie Beginn und Ablauf Ihrer Mitgliedschaft.',
          'Zahlungsdaten: Zahlungen werden von Stripe abgewickelt. Wir erhalten oder speichern keine vollständigen Kartendaten; Stripe teilt uns den Status Ihres Abonnements mit.',
          'Technische Daten: Bei der Nutzung der Website, der App oder unserer Server werden technische Informationen wie Ihre IP-Adresse, Geräte- oder Browsertyp und der Zeitpunkt der Anfrage von unseren Hosting-Anbietern verarbeitet, um den Dienst bereitzustellen und abzusichern.',
          'Nachrichten: Wenn Sie uns per E-Mail kontaktieren, verarbeiten wir Ihre E-Mail-Adresse und den Inhalt Ihrer Nachricht.',
        ],
      },
      {
        number: '03',
        title: 'Zwecke und Rechtsgrundlagen',
        items: [
          'Bereitstellung Ihres Kontos, des Streaming-Dienstes, der Favoriten und Ihrer Mitgliedschaft (Art. 6 Abs. 1 lit. b DSGVO – Vertragserfüllung).',
          'Abwicklung von Zahlungen und Aufbewahrung steuer- und handelsrechtlich vorgeschriebener Belege (Art. 6 Abs. 1 lit. b und c DSGVO).',
          'Sicherer Betrieb von Website, App und Servern sowie Schutz vor Missbrauch (Art. 6 Abs. 1 lit. f DSGVO – berechtigtes Interesse an einem sicheren und funktionierenden Dienst).',
          'Beantwortung Ihrer Nachrichten (Art. 6 Abs. 1 lit. b oder f DSGVO).',
        ],
      },
      {
        number: '04',
        title: 'Dienstleister',
        items: [
          'Supabase: Benutzerkonten, Anmeldung, Datenbank (Konto-, Favoriten- und Mitgliedschaftsdaten) und Dateispeicher für Musik und Bilder.',
          'Vercel: Hosting der Website mattdigging.com.',
          'Cloudflare: Hosting unserer API, über die Website und App Inhalte laden.',
          'Stripe: Zahlungsabwicklung für Mitgliedschaften.',
          'Apple (App Store, TestFlight) und Google (Google Play): Vertrieb der App gemäß deren eigenen Datenschutzerklärungen.',
          'Diese Anbieter verarbeiten Daten in unserem Auftrag oder als eigenständige Verantwortliche für ihre eigenen Dienste. Einige von ihnen können Daten außerhalb der Europäischen Union verarbeiten; solche Übermittlungen erfolgen auf Grundlage der vom jeweiligen Anbieter angebotenen Garantien, etwa des EU-U.S. Data Privacy Framework oder der EU-Standardvertragsklauseln.',
        ],
      },
      {
        number: '05',
        title: 'Speicherung auf Ihrem Gerät',
        items: [
          'Damit Sie angemeldet bleiben, speichert die Website Ihre Sitzung im lokalen Speicher Ihres Browsers und die App auf Ihrem Gerät.',
          'Wir verwenden keine Analyse-, Werbe- oder Tracking-Cookies, und die Website lädt keine Schriftarten oder anderen Ressourcen von Servern Dritter.',
        ],
      },
      {
        number: '06',
        title: 'Speicherdauer',
        items: [
          'Konto-, Favoriten- und Mitgliedschaftsdaten speichern wir, solange Ihr Konto besteht. Wenn Sie Ihr Konto löschen, werden diese Daten gelöscht und eine aktive Mitgliedschaft wird beendet.',
          'Abrechnungsbelege bewahren wir für die gesetzlich vorgeschriebenen Fristen auf (in Deutschland bis zu 10 Jahre).',
          'Technische Protokolldaten werden von unseren Hosting-Anbietern nur kurzzeitig zu Sicherheits- und Betriebszwecken gespeichert.',
        ],
      },
      {
        number: '07',
        title: 'Ihre Rechte',
        items: [
          'Sie haben das Recht auf Auskunft über Ihre personenbezogenen Daten, auf Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie auf Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 15–21 DSGVO).',
          'Sie können Ihr Konto und Ihre Daten jederzeit in der Mattdigging-App unter Profil → Konto löschen („Delete account“) löschen oder uns dazu unter mattdigging@gmx.de schreiben. Für alle weiteren Rechte wenden Sie sich bitte an dieselbe Adresse.',
          'Außerdem haben Sie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.',
        ],
      },
      {
        number: '08',
        title: 'Änderungen',
        items: [
          'Wir können diese Datenschutzerklärung anpassen, wenn sich unser Dienst oder die Rechtslage ändert. Die aktuelle Fassung ist stets auf dieser Seite abrufbar.',
        ],
      },
    ],
  },
};

const Privacy: React.FC = () => <LegalPage content={content} />;

export default Privacy;
