import { useLang } from '../context/LanguageContext';

function DialogCloseButton({ onClick }) {
  const { t } = useLang();

  return (
    <button className="btn btn-secondary dialog-header-close" onClick={onClick} aria-label={t('close')} title={t('close')}>
      <span className="close-text">{t('close')}</span>
      <span className="close-icon">×</span>
    </button>
  );
}

export default DialogCloseButton;
