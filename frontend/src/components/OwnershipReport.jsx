import { useState, useEffect, useRef } from 'react';
import { useLang } from '../context/LanguageContext';
import { getYearlyReport } from '../api';
import { formatNumber } from '../utils/numberToArabicWords';
import DialogCloseButton from './DialogCloseButton';

function OwnershipReport({ building, onClose, onViewGroupDetails }) {
  const { t, monthsFull, isRtl } = useLang();
  const [year, setYear] = useState(new Date().getFullYear());
  const [fromMonth, setFromMonth] = useState(1);
  const [toMonth, setToMonth] = useState(12);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    loadReport();
  }, [year, fromMonth, toMonth]);

  async function loadReport() {
    setLoading(true);
    const data = await getYearlyReport(building._id, year, fromMonth, toMonth);
    setReport(data);
    setLoading(false);
  }

  const years = [];
  const now = new Date().getFullYear();
  for (let y = now - 5; y <= now + 1; y++) {
    years.push(y);
  }

  const totalKirats = building.totalKirats || 24;
  const ownerGroups = building.ownerGroups || [];
  const netIncome = report ? report.netIncome : 0;

  function calculateGroupShare(groupKirats) {
    if (totalKirats === 0) return 0;
    return (groupKirats / totalKirats) * netIncome;
  }

  function getGroupExpenses(groupId) {
    if (!report || !report.expenses) return 0;
    return report.expenses
      .filter(e => e.ownerGroupId === groupId)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  function getNetGroupShare(groupKirats, groupId) {
    const baseShare = calculateGroupShare(groupKirats);
    const groupExpenses = getGroupExpenses(groupId);
    return baseShare - groupExpenses;
  }

  function calculatePercentage(kirats, total) {
    if (total === 0) return 0;
    return (kirats / total) * 100;
  }

  function handlePrint() {
    const printContent = printRef.current;
    const printWindow = window.open('', '', 'width=900,height=700');

    printWindow.document.write(`
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
        <head>
          <title>${t('divisionReport')} - ${building.number} - ${year}</title>
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
            .print-header p { color: #666; }
            .income-summary {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 6px;
              margin-bottom: 25px;
            }
            .income-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
            }
            .income-row.net {
              font-weight: bold;
              font-size: 1.1em;
              border-top: 1px solid #ccc;
              margin-top: 10px;
              padding-top: 10px;
            }
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
            .no-print { display: none; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${t('divisionReport')} - ${year}</h1>
            <p>${building.number} (${totalKirats} ${t('kirats')})</p>
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

  if (ownerGroups.length === 0) {
    return (
      <div>
        <div className="report-header">
          <h3>{t('divisionReport')} - {building.number}</h3>
          <DialogCloseButton onClick={onClose} />
        </div>
        <div className="empty-state">
          <p>{t('noOwnershipConfigured')}</p>
          <p>{t('configureOwnershipFirst')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="report-header">
        <h3>{t('divisionReport')} - {building.number}</h3>
        <div className="report-header-actions">
          {!loading && report && (
            <button className="btn btn-primary" onClick={handlePrint}>{t('print')}</button>
          )}
          <DialogCloseButton onClick={onClose} />
        </div>
      </div>

      <div className="report-filters" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div className="form-group" style={{ maxWidth: 150 }}>
          <label>{t('selectYear')}</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ maxWidth: 150 }}>
          <label>{t('fromMonth')}</label>
          <select value={fromMonth} onChange={e => setFromMonth(Number(e.target.value))}>
            {monthsFull.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ maxWidth: 150 }}>
          <label>{t('toMonth')}</label>
          <select value={toMonth} onChange={e => setToMonth(Number(e.target.value))}>
            {monthsFull.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p>{t('loadingReport')}</p>
      ) : report && (
        <div ref={printRef}>
          <div className="income-summary-box">
            <div className="income-row">
              <span>{t('totalIncome')}:</span>
              <span>{formatNumber(report.totalIncome)}</span>
            </div>
            <div className="income-row">
              <span>{t('sharedExpenses')}:</span>
              <span className="expense-amount">-{formatNumber(report.buildingExpensesTotal)}</span>
            </div>
            <div className="income-row net">
              <span>{t('netIncome')}:</span>
              <span className="net-amount">{formatNumber(report.netIncome)}</span>
            </div>
          </div>

          {/* Shared Expenses Details */}
          {report.expenses && report.expenses.filter(e => !e.ownerGroupId).length > 0 && (
            <div className="shared-expenses-section">
              <h4>{t('sharedExpenses')}</h4>
              <table className="expense-table">
                <thead>
                  <tr>
                    <th>{t('description')}</th>
                    <th className="amount-col">{t('amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.expenses.filter(e => !e.ownerGroupId).map(exp => (
                    <tr key={exp._id}>
                      <td>{exp.description}</td>
                      <td className="amount-col">{formatNumber(exp.amount)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td><strong>{t('total')}</strong></td>
                    <td className="amount-col"><strong>{formatNumber(report.buildingExpensesTotal)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Group Expenses Details */}
          {report.expenses && report.expenses.filter(e => e.ownerGroupId).length > 0 && (
            <div className="group-expenses-details-section">
              <h4>{t('groupExpenses')}</h4>
              <table className="expense-table">
                <thead>
                  <tr>
                    <th>{t('group')}</th>
                    <th>{t('description')}</th>
                    <th className="amount-col">{t('amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.expenses.filter(e => e.ownerGroupId).map(exp => {
                    const group = ownerGroups.find(g => g._id === exp.ownerGroupId);
                    return (
                      <tr key={exp._id}>
                        <td>{group ? group.name : '-'}</td>
                        <td>{exp.description}</td>
                        <td className="amount-col">{formatNumber(exp.amount)}</td>
                      </tr>
                    );
                  })}
                  <tr className="total-row">
                    <td colSpan="2"><strong>{t('total')}</strong></td>
                    <td className="amount-col">
                      <strong>{formatNumber(report.expenses.filter(e => e.ownerGroupId).reduce((sum, e) => sum + e.amount, 0))}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="division-section">
            <h4>{t('ownershipDivision')} ({totalKirats} {t('kirats')})</h4>

            <table className="division-table">
              <thead>
                <tr>
                  <th>{t('group')}</th>
                  <th>{t('kirats')}</th>
                  <th>{t('share')}</th>
                  <th className="amount-col">{t('amount')}</th>
                  <th className="no-print"></th>
                </tr>
              </thead>
              <tbody>
                {ownerGroups.map((group, i) => {
                  const groupShare = calculateGroupShare(group.kirats);
                  const groupExpenses = getGroupExpenses(group._id);
                  const netGroupShare = getNetGroupShare(group.kirats, group._id);
                  const percentage = calculatePercentage(group.kirats, totalKirats);
                  return (
                    <tr key={i} className="group-row">
                      <td>{group.name}</td>
                      <td>{group.kirats}</td>
                      <td>{percentage.toFixed(2)}%</td>
                      <td className="amount-col">
                        {groupExpenses > 0 ? (
                          <span title={`${formatNumber(groupShare)} - ${formatNumber(groupExpenses)}`}>
                            {formatNumber(netGroupShare)}
                          </span>
                        ) : (
                          formatNumber(netGroupShare)
                        )}
                      </td>
                      <td className="no-print">
                        <button
                          className="btn btn-secondary btn-small"
                          onClick={() => onViewGroupDetails(group, groupShare, year, report.expenses)}
                        >
                          {t('viewDetails')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                <tr className="total-row">
                  <td><strong>{t('total')}</strong></td>
                  <td><strong>{totalKirats}</strong></td>
                  <td><strong>100%</strong></td>
                  <td className="amount-col"><strong>{formatNumber(netIncome)}</strong></td>
                  <td className="no-print"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnershipReport;
