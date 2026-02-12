import { useRef } from 'react';
import { useLang } from '../context/LanguageContext';

function BlankReceipt({ property, building, onClose }) {
  const { t, isRtl } = useLang();
  const receiverDisplayName =
    (typeof building?.moderatorAdminUserId === 'object' && building?.moderatorAdminUserId?.name)
      ? building.moderatorAdminUserId.name
      : t('receiverName');
  const printRef = useRef();

  function handlePrint() {
    const printContent = printRef.current;
    const printWindow = window.open('', '', 'width=800,height=600');

    printWindow.document.write(`
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
        <head>
          <title>${t('rentReceipt')}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              direction: ${isRtl ? 'rtl' : 'ltr'};
            }
            .receipt {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #333;
              padding: 30px;
            }
            .receipt-title {
              text-align: center;
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 2px solid #333;
            }
            .receipt-line {
              margin-bottom: 15px;
              font-size: 15px;
              line-height: 2;
            }
            .dotted-value {
              border-bottom: 1px dotted #333;
              padding: 0 8px;
              display: inline;
              min-width: 100px;
            }
            .dots {
              letter-spacing: 2px;
            }
            .receipt-footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
            }
            .footer-row {
              margin-bottom: 15px;
              font-size: 14px;
            }
            .signature-area {
              margin-top: 25px;
            }
            .signature-line {
              border-bottom: 1px solid #333;
              width: 180px;
              display: inline-block;
              margin-${isRtl ? 'right' : 'left'}: 10px;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  return (
    <div>
      <div ref={printRef} className="receipt-preview">
        <div className="receipt arabic-receipt">
          <div className="receipt-title">
            {t('rentReceipt')}
          </div>

          <div className="receipt-body-lines">
            {/* Line 1: I received from + Amount (blank) */}
            <div className="receipt-line">
              {t('iReceivedFrom')} <span className="dotted-value">{property.renterName || '-'}</span> {t('amountOf')} <span className="dots">........................</span> {t('pounds')} (<span className="dots">................................................................</span> {t('egyptianPoundsOnly')})
            </div>

            {/* Line 2: Legal rent + property type + location */}
            <div className="receipt-line">
              {t('forLegalRent')} ({property.type === 'apartment' ? t('theApartment') : t('theStore')}) {t('unitNumber')} <span className="dotted-value">{property.unit}</span> {t('locatedInBuilding')} <span className="dotted-value">{building.number}</span> {t('street')} <span className="dotted-value">{building.address || '-'}</span>
            </div>

            {/* Line 3: Month, Year (blank) and Legal text */}
            <div className="receipt-line">
              {t('forMonthOf')} <span className="dots">............</span> {t('yearOf')} <span className="dots">............</span> {t('asPerLaw')}
            </div>

            {/* Line 4: Reserve rights */}
            <div className="receipt-line">
              {t('reserveRights')}
            </div>
          </div>

          <div className="receipt-footer">
            <div className="footer-row">
              {t('receiptDate')}: <span className="dots">..../..../........</span>
            </div>
            <div className="footer-row">
              {t('receiver')}: {receiverDisplayName}
            </div>
            <div className="signature-area">
              {t('theSignature')}: <span className="signature-line"></span>
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" onClick={handlePrint}>
          {t('print')}
        </button>
        <button className="btn btn-secondary" onClick={onClose}>
          {t('close')}
        </button>
      </div>
    </div>
  );
}

export default BlankReceipt;
