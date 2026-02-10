import { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { useLang } from '../context/LanguageContext';
import * as api from '../api';
import { formatNumber } from '../utils/numberToArabicWords';

function PayoutReport({ onClose }) {
  const { t, isRtl } = useLang();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [year, setYear] = useState(new Date().getFullYear());
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const printRef = useRef();

  const years = [];
  const now = new Date().getFullYear();
  for (let y = now - 5; y <= now + 1; y++) {
    years.push(y);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUsers.size > 0) {
      loadSelectedReports();
    }
  }, [selectedUsers, year]);

  async function loadUsers() {
    setLoading(true);
    const data = await api.getUsers({ status: 'active' });
    setUsers(data);
    setLoading(false);
  }

  async function loadSelectedReports() {
    setLoadingReports(true);
    const newReports = {};

    for (const userId of selectedUsers) {
      try {
        const report = await api.getUserReport(userId, year);
        newReports[userId] = report;
      } catch (error) {
        console.error(`Failed to load report for user ${userId}:`, error);
      }
    }

    setReports(newReports);
    setLoadingReports(false);
  }

  function toggleUser(userId) {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  }

  function selectAll() {
    setSelectedUsers(new Set(users.map(u => u._id)));
  }

  function clearAll() {
    setSelectedUsers(new Set());
    setReports({});
  }

  const selectedReports = Array.from(selectedUsers)
    .map(userId => reports[userId])
    .filter(Boolean);

  const totalPayout = selectedReports.reduce(
    (sum, r) => sum + r.summary.netIncome, 0
  );

  function handlePrint() {
    const printContent = printRef.current;
    const printWindow = window.open('', '', 'width=900,height=700');

    printWindow.document.write(`
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
        <head>
          <title>${t('payoutReport')} - ${year}</title>
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
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: ${isRtl ? 'right' : 'left'};
            }
            th { background: #2c3e50; color: white; }
            .amount-col { text-align: ${isRtl ? 'left' : 'right'}; }
            .total-row { background: #27ae60; color: white; font-weight: bold; font-size: 1.1em; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${t('payoutReport')} - ${year}</h1>
            <p>${new Date().toLocaleDateString()}</p>
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
        <h1 style="font-size: 22px; margin-bottom: 5px;">${t('payoutReport')} - ${year}</h1>
        <p style="color: #666; margin-top: 5px;">${new Date().toLocaleDateString()}</p>
      </div>
      ${printContent.innerHTML}
    `;
    container.style.direction = isRtl ? 'rtl' : 'ltr';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.padding = '30px';

    const opt = {
      margin: 10,
      filename: `${t('payoutReport')}-${year}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(container).save();
  }

  return (
    <div className="payout-report">
      <div className="report-header">
        <h3>{t('payoutReport')}</h3>
        <div className="report-header-actions">
          {selectedReports.length > 0 && !loadingReports && (
            <>
              <button className="btn btn-primary" onClick={handleSave}>{t('saveAsPdf')}</button>
              <button className="btn btn-primary" onClick={handlePrint}>{t('print')}</button>
            </>
          )}
          <button className="btn btn-secondary" onClick={onClose}>{t('close')}</button>
        </div>
      </div>

      <div className="payout-controls">
        <div className="form-group" style={{ maxWidth: 150 }}>
          <label>{t('selectYear')}</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="selection-buttons">
          <button className="btn btn-secondary btn-small" onClick={selectAll}>{t('selectAll')}</button>
          <button className="btn btn-secondary btn-small" onClick={clearAll}>{t('clearAll')}</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="payout-content">
          <div className="users-selection">
            <h4>{t('selectOwners')} ({selectedUsers.size} {t('selected')})</h4>
            <div className="users-checkboxes">
              {users.map(user => (
                <label key={user._id} className={`user-checkbox ${selectedUsers.has(user._id) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user._id)}
                    onChange={() => toggleUser(user._id)}
                  />
                  <span className="user-name">{user.name}</span>
                  {user.buildingsOwned && user.buildingsOwned.length > 0 && (
                    <span className="user-buildings">
                      ({user.buildingsOwned.map(b => b.buildingNumber).join(', ')})
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {selectedUsers.size > 0 && (
            <div className="payout-results">
              {loadingReports ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>{t('loadingReport')}</p>
                </div>
              ) : (
                <div ref={printRef}>
                  <table className="payout-table">
                    <thead>
                      <tr>
                        <th>{t('userName')}</th>
                        <th>{t('buildings')}</th>
                        <th className="amount-col">{t('grossIncome')}</th>
                        <th className="amount-col">{t('totalExpenses')}</th>
                        <th className="amount-col">{t('rentDeduction')}</th>
                        <th className="amount-col">{t('netIncome')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReports.map((report, i) => (
                        <tr key={i}>
                          <td><strong>{report.user.name}</strong></td>
                          <td>{report.buildings.map(b => b.buildingNumber).join(', ')}</td>
                          <td className="amount-col">{formatNumber(report.summary.totalGrossIncome)}</td>
                          <td className="amount-col expense-amount">-{formatNumber(report.summary.totalExpenses)}</td>
                          <td className="amount-col expense-amount">
                            {report.summary.totalRentDeduction > 0 ? `-${formatNumber(report.summary.totalRentDeduction)}` : '-'}
                          </td>
                          <td className="amount-col">{formatNumber(report.summary.netIncome)}</td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td colSpan="5"><strong>{t('totalPayout')}</strong></td>
                        <td className="amount-col"><strong>{formatNumber(totalPayout)}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PayoutReport;
