import { useState, useEffect, useRef } from 'react';
import { useLang } from '../context/LanguageContext';
import { createExpense, deleteExpense, getYearlyReport } from '../api';
import NumberInput from './NumberInput';
import { formatNumber } from '../utils/numberToArabicWords';

function GroupDetailsReport({ group, groupShare: initialGroupShare, year: initialYear, buildingId, buildingNumber, totalKirats, expenses: initialExpenses, onExpenseChange, onClose }) {
  const { t, isRtl } = useLang();
  const printRef = useRef();
  const [newExpense, setNewExpense] = useState({ description: '', amount: '' });
  const [year, setYear] = useState(initialYear);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // Generate year options
  const years = [];
  const now = new Date().getFullYear();
  for (let y = now - 5; y <= now + 1; y++) {
    years.push(y);
  }

  // Fetch report when year changes
  useEffect(() => {
    if (year !== initialYear) {
      loadReport();
    }
  }, [year]);

  async function loadReport() {
    setLoading(true);
    const data = await getYearlyReport(buildingId, year);
    setReport(data);
    setLoading(false);
  }

  // Calculate group share based on report data or initial value
  const netIncome = report ? report.netIncome : null;
  const expenses = report ? report.expenses : initialExpenses;
  const groupShare = netIncome !== null
    ? (group.kirats / totalKirats) * netIncome
    : initialGroupShare;

  // Filter expenses for this group
  const groupExpenses = expenses.filter(e => e.ownerGroupId === group._id);
  const groupExpensesTotal = groupExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netGroupShare = groupShare - groupExpensesTotal;

  function calculatePercentage(kirats, total) {
    if (total === 0) return 0;
    return (kirats / total) * 100;
  }

  function calculateMemberAmount(memberKirats) {
    if (group.kirats === 0) return 0;
    return (memberKirats / group.kirats) * netGroupShare;
  }

  async function handleAddExpense(e) {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;
    await createExpense({
      buildingId,
      year,
      description: newExpense.description,
      amount: Number(newExpense.amount),
      ownerGroupId: group._id
    });
    setNewExpense({ description: '', amount: '' });
    onExpenseChange();
  }

  async function handleDeleteExpense(expenseId) {
    if (!window.confirm(t('deleteExpense'))) return;
    await deleteExpense(expenseId);
    onExpenseChange();
  }

  function handlePrint() {
    const printContent = printRef.current;
    const printWindow = window.open('', '', 'width=900,height=700');

    printWindow.document.write(`
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
        <head>
          <title>${t('groupDetails')} - ${group.name} - ${year}</title>
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
            .group-summary {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 6px;
              margin-bottom: 25px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
            }
            .summary-row.total {
              font-weight: bold;
              font-size: 1.1em;
              border-top: 1px solid #ccc;
              margin-top: 10px;
              padding-top: 10px;
              color: #27ae60;
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
            th { background: #34495e; color: white; }
            .amount-col { text-align: ${isRtl ? 'left' : 'right'}; }
            .total-row { background: #d5e8f7; font-weight: bold; }
            .no-print { display: none; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${t('groupDetails')} - ${year}</h1>
            <p>${group.name}</p>
            <p>${buildingNumber}</p>
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

  return (
    <div>
      <div className="report-header">
        <h3>{t('groupDetails')} - {group.name}</h3>
        <div className="report-header-actions">
          <button className="btn btn-primary" onClick={handlePrint}>{t('print')}</button>
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
        <p>{t('loadingReport')}</p>
      ) : (
      <div ref={printRef}>
        <div className="group-summary-box">
          <div className="summary-item">
            <span className="summary-label">{t('year')}:</span>
            <span className="summary-value">{year}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('group')}:</span>
            <span className="summary-value">{group.name}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('kirats')}:</span>
            <span className="summary-value">{group.kirats}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('share')}:</span>
            <span className="summary-value">{formatNumber(groupShare)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('groupExpenses')}:</span>
            <span className="summary-value" style={{ color: groupExpensesTotal > 0 ? '#e74c3c' : 'inherit' }}>-{formatNumber(groupExpensesTotal)}</span>
          </div>
          <div className="summary-item highlight">
            <span className="summary-label">{t('netIncome')}:</span>
            <span className="summary-value">{formatNumber(netGroupShare)}</span>
          </div>
        </div>

        <div className="members-division-section">
          <h4>{t('members')} ({group.members.length})</h4>

          <table className="members-table">
            <thead>
              <tr>
                <th>{t('member')}</th>
                <th>{t('kirats')}</th>
                <th>{t('share')}</th>
                <th className="amount-col">{t('amount')}</th>
              </tr>
            </thead>
            <tbody>
              {group.members.map((member, j) => {
                const memberPercentage = calculatePercentage(member.kirats, group.kirats);
                const memberAmount = calculateMemberAmount(member.kirats);
                return (
                  <tr key={j}>
                    <td>{member.name}</td>
                    <td>{member.kirats}</td>
                    <td>{memberPercentage.toFixed(2)}%</td>
                    <td className="amount-col">{formatNumber(memberAmount)}</td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td><strong>{t('total')}</strong></td>
                <td><strong>{group.kirats}</strong></td>
                <td><strong>100%</strong></td>
                <td className="amount-col"><strong>{formatNumber(netGroupShare)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Group Expenses Section */}
        <div className="group-expenses-section">
          <h4>{t('groupExpenses')}</h4>
          <form onSubmit={handleAddExpense} className="expense-form no-print">
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
            <button type="submit" className="btn btn-primary">{t('add')}</button>
          </form>

          {groupExpenses.length > 0 && (
            <table className="expense-table">
              <thead>
                <tr>
                  <th>{t('description')}</th>
                  <th>{t('amount')}</th>
                  <th className="no-print"></th>
                </tr>
              </thead>
              <tbody>
                {groupExpenses.map(exp => (
                  <tr key={exp._id}>
                    <td>{exp.description}</td>
                    <td>{formatNumber(exp.amount)}</td>
                    <td className="no-print">
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDeleteExpense(exp._id)}
                      >
                        {t('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

export default GroupDetailsReport;
