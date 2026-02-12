import { useState, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';
import { getPaymentsByYear, deletePayment } from '../api';
import { formatNumber } from '../utils/numberToArabicWords';

function PaymentHistory({ property, onClose, onEdit, onConfirmDelete }) {
  const { t, monthsShort } = useLang();
  const [year, setYear] = useState(new Date().getFullYear());
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, [year]);

  async function loadPayments() {
    setLoading(true);
    const data = await getPaymentsByYear(property._id, year);
    setPayments(data);
    setLoading(false);
  }

  const paymentMap = {};
  payments.forEach(p => {
    paymentMap[p.month] = p; // Store full payment object (includes _id)
  });

  async function handleDeletePayment(paymentId) {
    const ok = onConfirmDelete ? await onConfirmDelete() : window.confirm(t('confirmDeletePayment'));
    if (!ok) return;
    await deletePayment(paymentId);
    loadPayments();
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const years = [];
  const now = new Date().getFullYear();
  for (let y = now - 3; y <= now + 1; y++) {
    years.push(y);
  }

  return (
    <div>
      <div className="form-group">
        <label>{t('year')}</label>
        <select value={year} onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="stats">
            <div className="stat">
              {t('totalPaidIn')} {year}: <span className="stat-value">{formatNumber(totalPaid)}</span>
            </div>
            {property.paymentType === 'fixed' && (
              <div className="stat">
                {t('expected')}: <span className="stat-value">{formatNumber(property.fixedRent * 12)}</span>
              </div>
            )}
          </div>

          <div className="month-grid">
            {monthsShort.map((monthName, i) => {
              const monthNum = i + 1;
              const payment = paymentMap[monthNum];
              const isPaid = payment !== undefined;

              return (
                <div key={monthNum} className={`month-item ${isPaid ? 'paid' : ''}`}>
                  <div className="month-name">{monthName}</div>
                  <div className={`month-amount ${!isPaid ? 'empty' : ''}`}>
                    {isPaid ? formatNumber(payment.amount) : '-'}
                  </div>
                  {isPaid && (
                    <div style={{ marginTop: 4, display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => onEdit(payment)}
                        style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                      >
                        {t('edit')}
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDeletePayment(payment._id)}
                        style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                      >
                        {t('delete')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="form-actions" style={{ marginTop: 20 }}>
        <button className="btn btn-secondary" onClick={onClose}>
          {t('close')}
        </button>
      </div>
    </div>
  );
}

export default PaymentHistory;
