import { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { useLang } from '../context/LanguageContext';
import { getUserReport } from '../api';
import { formatNumber } from '../utils/numberToArabicWords';

function UserReport({ user, onClose }) {
  const { t, isRtl } = useLang();
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  const years = [];
  const now = new Date().getFullYear();
  for (let y = now - 5; y <= now + 1; y++) {
    years.push(y);
  }

  useEffect(() => {
    loadReport();
  }, [year, user._id]);

  async function loadReport() {
    setLoading(true);
    try {
      const data = await getUserReport(user._id, year);
      setReport(data);
    } catch (error) {
      console.error('Failed to load user report:', error);
    }
    setLoading(false);
  }

  function handlePrint() {
    const printContent = printRef.current;
    const printWindow = window.open('', '', 'width=900,height=700');

    printWindow.document.write(`
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
        <head>
          <title>${t('userReport')} - ${user.name} - ${year}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: Arial, sans-serif;
              padding: 30px;
              direction: ${isRtl ? 'rtl' : 'ltr'};
            }
            .print-header {
              text-align: center;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 2px solid #333;
            }
            .print-header h1 { font-size: 22px; margin-bottom: 5px; }
            .print-header p { color: #666; margin-top: 5px; }
            .summary-cards {
              display: grid !important;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .summary-card {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 6px;
              text-align: center;
              border: 1px solid #ddd;
            }
            .summary-card.highlight { background: #d5f5e3; border-color: #82e0aa; }
            .summary-card.deduction { background: #fdecea; border-color: #f5b7b1; }
            .card-value { font-size: 1.3em; font-weight: bold; display: block; margin-bottom: 5px; }
            .card-label { color: #666; font-size: 0.85em; display: block; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: ${isRtl ? 'right' : 'left'};
            }
            th { background: #2c3e50; color: white; }
            .amount-col { text-align: ${isRtl ? 'left' : 'right'}; }
            .total-row { background: #e8f4fd; font-weight: bold; }
            .rent-deduction { color: #e74c3c; }
            .totals-summary {
              background: #2c3e50;
              color: white;
              padding: 20px;
              border-radius: 8px;
              margin-top: 25px;
              page-break-inside: avoid;
            }
            .totals-summary h5 {
              margin: 0 0 15px 0;
              font-size: 1.1rem;
            }
            .totals-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
            .total-item {
              background: rgba(255, 255, 255, 0.1);
              padding: 12px 15px;
              border-radius: 6px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-item span:first-child {
              font-size: 0.9rem;
              opacity: 0.9;
            }
            .total-item span:last-child {
              font-size: 1.1rem;
              font-weight: 600;
            }
            .total-item.expense span:last-child { color: #e74c3c; }
            .total-item.net {
              background: #27ae60;
              grid-column: span 2;
            }
            .rent-note {
              background: #fef9e7;
              border: 1px solid #f9e79f;
              padding: 12px;
              border-radius: 6px;
              margin-top: 15px;
              color: #7d6608;
              font-size: 0.9rem;
            }
            @media print {
              body { padding: 20px; }
              .totals-summary { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${t('userReport')} - ${year}</h1>
            <p>${user.name}</p>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  function handleSave() {
    const printContent = printRef.current;

    const container = document.createElement('div');
    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #333;">
        <h1 style="font-size: 22px; margin-bottom: 5px;">${t('userReport')} - ${year}</h1>
        <p style="color: #666; margin-top: 5px;">${user.name}</p>
      </div>
      ${printContent.innerHTML}
    `;
    container.style.direction = isRtl ? 'rtl' : 'ltr';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.padding = '30px';

    const opt = {
      margin: 10,
      filename: `${t('userReport')}-${user.name}-${year}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(container).save();
  }

  return (
    <div className="user-report">
      <div className="report-header">
        <h3>{t('userReport')} - {user.name}</h3>
        <div className="report-header-actions">
          {!loading && report && (
            <>
              <button className="btn btn-primary" onClick={handleSave}>{t('saveAsPdf')}</button>
              <button className="btn btn-primary" onClick={handlePrint}>{t('print')}</button>
            </>
          )}
          <button className="btn btn-secondary" onClick={onClose}>{t('close')}</button>
        </div>
      </div>

      <div className="form-group" style={{ maxWidth: 200 }}>
        <label>{t('selectYear')}</label>
        <select value={year} onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('loadingReport')}</p>
        </div>
      ) : report && (
        <div ref={printRef}>
          {/* Buildings Breakdown */}
          <h4>{t('allBuildings')} ({report.buildings.length})</h4>

          {report.buildings.length === 0 ? (
            <p className="no-data">{t('noOwnershipConfigured')}</p>
          ) : (
            report.buildings.map((building, i) => (
              <div key={i} className="building-report-card">
                <div className="building-report-header">
                  <h5>{t('buildingNumber')} {building.buildingNumber}</h5>
                  <span className="ownership-info">
                    {building.kirats} {t('kirats')} ({building.ownershipPercentage.toFixed(2)}%)
                  </span>
                </div>

                <div className="building-income-row">
                  <span>{t('grossIncome')}</span>
                  <span className="amount">{formatNumber(building.grossIncome)}</span>
                </div>

                {building.expenseDetails && building.expenseDetails.length > 0 && (
                  <div className="expenses-breakdown">
                    <div className="expenses-header">{t('expenses')}:</div>
                    {building.expenseDetails.map((exp, j) => (
                      <div key={j} className="expense-detail-row">
                        <span className="expense-desc">
                          {exp.description}
                          <span className="expense-type-badge">{exp.type === 'equal' ? t('equal') : t('proportional')}</span>
                        </span>
                        <span className="amount expense">-{formatNumber(exp.userShare)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {building.rentDeduction > 0 && (
                  <div className="building-income-row rent-row">
                    <span>{t('rentDeduction')}</span>
                    <span className="amount expense">-{formatNumber(building.rentDeduction)}</span>
                  </div>
                )}

                <div className="building-income-row net-row">
                  <span>{t('netIncome')}</span>
                  <span className="amount net">{formatNumber(building.netIncome)}</span>
                </div>
              </div>
            ))
          )}

          {/* Totals Summary */}
          {report.buildings.length > 1 && (
            <div className="totals-summary">
              <h5>{t('total')}</h5>
              <div className="totals-grid">
                <div className="total-item">
                  <span>{t('grossIncome')}</span>
                  <span>{formatNumber(report.summary.totalGrossIncome)}</span>
                </div>
                <div className="total-item expense">
                  <span>{t('totalExpenses')}</span>
                  <span>-{formatNumber(report.summary.totalExpenses)}</span>
                </div>
                {report.summary.totalRentDeduction > 0 && (
                  <div className="total-item expense">
                    <span>{t('rentDeduction')}</span>
                    <span>-{formatNumber(report.summary.totalRentDeduction)}</span>
                  </div>
                )}
                <div className="total-item net">
                  <span>{t('netIncome')}</span>
                  <span>{formatNumber(report.summary.netIncome)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Rent Deduction Note */}
          {report.summary.totalRentDeduction > 0 && (
            <div className="rent-note">
              <p>
                <strong>{t('rentDeduction')}:</strong> {t('ownerAndRenter')} -
                {user.name} rents properties in buildings they own. The rent paid is deducted from their owner income.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserReport;
