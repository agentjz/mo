import wechatQR from '../../assets/wechat-qr.png';
import RichText from '../../components/RichText.tsx';
import { landingContent } from '../../content/landing.ts';
import { useLandingPage } from './useLandingPage.ts';
import './landing.css';

function LandingPage(): JSX.Element {
  const {
    showQRCode,
    openQRCode,
    closeQRCode,
    openEditor,
    openStatement,
  } = useLandingPage();

  return (
    <main className="landing-twine">
      <div className="landing-twine-container">
        <header className="landing-twine-logo">
          <h1 className="logo-text">{landingContent.title}</h1>
        </header>

        <section className="landing-twine-description" aria-label={landingContent.descriptionLabel}>
          {landingContent.paragraphs.map((paragraph, index) => (
            <p key={index}><RichText content={paragraph.content} /></p>
          ))}
        </section>

        <nav className="landing-twine-buttons" aria-label={landingContent.actions.label}>
          <button className="twine-button twine-button-primary" onClick={openQRCode}>
            {landingContent.actions.local}
          </button>
          <button className="twine-button twine-button-secondary" onClick={openEditor}>
            {landingContent.actions.editor}
          </button>
          <button className="twine-button twine-button-tertiary" onClick={openStatement}>
            {landingContent.actions.statement}
          </button>
        </nav>

        <p className="landing-twine-version">
          {landingContent.version.prefix}
          <strong>{landingContent.version.number}</strong>
          {landingContent.version.suffix}
        </p>
      </div>

      {showQRCode && (
        <div className="qr-modal-overlay" onClick={closeQRCode}>
          <section
            className="qr-modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-modal-title"
            onClick={event => event.stopPropagation()}
          >
            <button className="qr-modal-close" onClick={closeQRCode} aria-label={landingContent.qrCode.closeLabel}>×</button>
            <h2 className="qr-modal-title" id="qr-modal-title">{landingContent.qrCode.title}</h2>
            <p className="qr-modal-subtitle">{landingContent.qrCode.subtitle}</p>
            <img src={wechatQR} alt={landingContent.qrCode.imageAlt} className="qr-modal-image" />
          </section>
        </div>
      )}
    </main>
  );
}

export default LandingPage;
