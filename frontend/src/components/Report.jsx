import { useState, useEffect, useRef } from 'react';
import { useLang } from '../context/LanguageContext';
import { getYearlyReport, createExpense, deleteExpense } from '../api';
import NumberInput from './NumberInput';
import DialogCloseButton from './DialogCloseButton';
import { formatNumber } from '../utils/numberToArabicWords';

function Report({ building, onClose, canManageExpenses = false }) {
  const { t, monthsShort, monthsFull, isRtl } = useLang();

  const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  const [year, setYear] = useState(new Date().getFullYear());
  const [fromMonth, setFromMonth] = useState(1);
  const [toMonth, setToMonth] = useState(12);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', expenseType: 'proportional', ownerGroupId: '' });
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

  async function handleAddExpense(e) {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;
    await createExpense({
      buildingId: building._id,
      year,
      description: newExpense.description,
      amount: Number(newExpense.amount),
      expenseType: newExpense.expenseType,
      ownerGroupId: newExpense.ownerGroupId || null
    });
    setNewExpense({ description: '', amount: '', expenseType: 'proportional', ownerGroupId: '' });
    loadReport();
  }

  async function handleDeleteExpense(id) {
    if (confirm(t('deleteExpense'))) {
      await deleteExpense(id);
      loadReport();
    }
  }

  function handlePrint() {
    const printContent = printRef.current;
    const printWindow = window.open('', '', 'width=1200,height=800');

    printWindow.document.write(`
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
        <head>
          <title>${t('yearlyReport')} - ${building.number} - ${year}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              direction: ${isRtl ? 'rtl' : 'ltr'};
              font-size: 12px;
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid #333;
            }
            .print-header h1 {
              font-size: 20px;
              margin-bottom: 5px;
            }
            .print-header p {
              color: #666;
            }
            .report-section {
              margin-bottom: 25px;
            }
            .report-section h4 {
              margin-bottom: 10px;
              padding-bottom: 5px;
              border-bottom: 1px solid #ccc;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 6px 4px;
              text-align: center;
            }
            th {
              background: #2c3e50;
              color: white;
              font-weight: 500;
            }
            td:first-child, td:nth-child(2),
            th:first-child, th:nth-child(2) {
              text-align: ${isRtl ? 'right' : 'left'};
            }
            .blocked-row {
              background: #fadbd8 !important;
              color: #999;
            }
            .has-payment {
              color: #27ae60;
              font-weight: 500;
            }
            .total-cell {
              font-weight: 600;
              background: #f0f0f0;
            }
            .subtotal-row {
              background: #e8f4fd !important;
              font-weight: 600;
            }
            .expense-table th, .expense-table td {
              text-align: ${isRtl ? 'right' : 'left'};
            }
            .expense-table td:nth-child(2) {
              color: #e74c3c;
            }
            .report-summary {
              background: #2c3e50;
              color: white;
              padding: 15px;
              border-radius: 6px;
              margin-top: 20px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            .summary-row:last-child {
              border-bottom: none;
            }
            .summary-row.total {
              font-weight: 600;
              font-size: 13px;
              padding-top: 12px;
              margin-top: 8px;
              border-top: 2px solid rgba(255,255,255,0.3);
            }
            .summary-row.expenses {
              color: #e74c3c;
            }
            .summary-row.net {
              font-weight: 700;
              font-size: 14px;
              padding-top: 12px;
              margin-top: 8px;
              border-top: 2px solid rgba(255,255,255,0.3);
              color: #2ecc71;
            }
            .no-data {
              color: #999;
              font-style: italic;
              padding: 10px 0;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${escapeHtml(t('yearlyReport'))} - ${escapeHtml(year)}</h1>
            <p>${escapeHtml(building.number)}</p>
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

  const years = [];
  const now = new Date().getFullYear();
  for (let y = now - 5; y <= now + 1; y++) {
    years.push(y);
  }

  function renderPropertyTable(properties, title) {
    if (properties.length === 0) return null;

    const sectionTotal = properties.reduce((sum, p) => sum + p.total, 0);
    const monthCount = toMonth - fromMonth + 1;

    return (
      <div className="report-section">
        <h4>{title}</h4>
        <div className="table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>{t('unit')}</th>
                <th>{t('renter')}</th>
                {monthsShort.slice(fromMonth - 1, toMonth).map(m => <th key={m}>{m}</th>)}
                <th>{t('total')}</th>
              </tr>
            </thead>
            <tbody>
              {properties.map(prop => (
                <tr key={prop._id} className={prop.paymentType === 'blocked' ? 'blocked-row' : ''}>
                  <td>{prop.unit}</td>
                  <td>{prop.renterName}</td>
                  {prop.months.slice(fromMonth - 1, toMonth).map((amount, i) => (
                    <td key={i} className={amount > 0 ? 'has-payment' : ''}>
                      {amount > 0 ? formatNumber(amount) : '-'}
                    </td>
                  ))}
                  <td className="total-cell">{formatNumber(prop.total)}</td>
                </tr>
              ))}
              <tr className="subtotal-row">
                <td colSpan={2}><strong>{title} {t('total')}</strong></td>
                <td colSpan={monthCount}></td>
                <td className="total-cell"><strong>{formatNumber(sectionTotal)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderExpensesForPrint() {
    if (!report || report.expenses.length === 0) {
      return <p className="no-data">{t('noExpenses')} {year}</p>;
    }

    return (
      <table className="expense-table">
        <thead>
          <tr>
            <th>{t('description')}</th>
            <th>{t('amount')}</th>
          </tr>
        </thead>
        <tbody>
          {report.expenses.map(exp => (
            <tr key={exp._id}>
              <td>{exp.description}</td>
              <td>{formatNumber(exp.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div>
      <div className="report-header">
        <h3>{t('yearlyReport')} - {building.number}</h3>
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
        <>
          <div ref={printRef}>
            {renderPropertyTable(report.apartments, t('apartments'))}
            {renderPropertyTable(report.stores, t('stores'))}

            <div className="report-section">
              <h4>{t('expenses')}</h4>
              {renderExpensesForPrint()}
            </div>

            <div className="report-summary">
              <div className="summary-row">
                <span>{t('apartmentsIncome')}:</span>
                <span>{formatNumber(report.apartmentsTotal)}</span>
              </div>
              <div className="summary-row">
                <span>{t('storesIncome')}:</span>
                <span>{formatNumber(report.storesTotal)}</span>
              </div>
              <div className="summary-row total">
                <span>{t('totalIncome')}:</span>
                <span>{formatNumber(report.totalIncome)}</span>
              </div>
              <div className="summary-row expenses">
                <span>{t('totalExpenses')}:</span>
                <span>-{formatNumber(report.totalExpenses)}</span>
              </div>
              <div className="summary-row net">
                <span>{t('netIncome')}:</span>
                <span>{formatNumber(report.netIncome)}</span>
              </div>
            </div>
          </div>

          {/* Expense form - not included in print */}
          {canManageExpenses && (
            <div className="expense-form-section">
              <h4>{t('addExpense')}</h4>
              <form onSubmit={handleAddExpense} className="expense-form-grid">
                <div className="expense-form-row">
                  <input
                    type="text"
                    placeholder={t('description')}
                    value={newExpense.description}
                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                  />
                  <NumberInput
                    placeholder={t('amount')}
                    value={newExpense.amount}
                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                  />
                </div>
                <div className="expense-form-row">
                  <select
                    value={newExpense.expenseType}
                    onChange={e => setNewExpense({ ...newExpense, expenseType: e.target.value, ownerGroupId: '' })}
                    className="expense-type-select"
                  >
                    <option value="proportional">{t('proportional')} ({t('allOwners')})</option>
                    <option value="equal">{t('equal')}</option>
                  </select>
                  {newExpense.expenseType === 'equal' && (
                    <select
                      value={newExpense.ownerGroupId}
                      onChange={e => setNewExpense({ ...newExpense, ownerGroupId: e.target.value })}
                      className="expense-group-select"
                    >
                      <option value="">{t('allOwners')}</option>
                      {(building.ownerGroups || []).map(group => (
                        <option key={group._id} value={group._id}>{group.name}</option>
                      ))}
                    </select>
                  )}
                  <button type="submit" className="btn btn-primary">{t('add')}</button>
                </div>
              </form>

              {report.expenses.length > 0 && (
                <table className="expense-table" style={{ marginTop: 15 }}>
                  <thead>
                    <tr>
                      <th>{t('description')}</th>
                      <th>{t('amount')}</th>
                      <th>{t('type')}</th>
                      <th>{t('appliesTo')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.expenses.map(exp => {
                      const groupName = exp.ownerGroupId
                        ? (building.ownerGroups || []).find(g => g._id === exp.ownerGroupId)?.name
                        : null;
                      return (
                        <tr key={exp._id}>
                          <td>{exp.description}</td>
                          <td>{formatNumber(exp.amount)}</td>
                          <td>
                            <span className={`expense-type-badge ${exp.expenseType || 'proportional'}`}>
                              {t(exp.expenseType || 'proportional')}
                            </span>
                          </td>
                          <td>{groupName || t('allOwners')}</td>
                          <td>
                            <button
                              className="btn btn-danger btn-small"
                              onClick={() => handleDeleteExpense(exp._id)}
                            >
                              {t('delete')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Report;
