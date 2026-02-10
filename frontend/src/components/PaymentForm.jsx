import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import NumberInput from './NumberInput';
import { formatNumber } from '../utils/numberToArabicWords';

function PaymentForm({ property, payment, onSave, onSaveBulk, onUpdate, onCancel }) {
  const { t, monthsFull } = useLang();
  const now = new Date();
  const isEditMode = !!payment;
  const [mode, setMode] = useState('single'); // 'single' or 'bulk'
  const [year, setYear] = useState(payment ? payment.year : now.getFullYear());
  const [month, setMonth] = useState(payment ? payment.month : now.getMonth() + 1);
  const [fromMonth, setFromMonth] = useState(1);
  const [toMonth, setToMonth] = useState(now.getMonth() + 1);
  const [amount, setAmount] = useState(
    payment ? payment.amount : (property.paymentType === 'fixed' ? property.fixedRent : '')
  );

  function handleSubmit(e) {
    e.preventDefault();
    if (amount === '' || amount < 0) return;

    if (isEditMode) {
      onUpdate(payment._id, {
        year: Number(year),
        month: Number(month),
        amount: Number(amount)
      });
    } else if (mode === 'single') {
      onSave({
        year: Number(year),
        month: Number(month),
        amount: Number(amount)
      });
    } else {
      // Bulk mode - create payments for all months in range
      const payments = [];
      const start = Math.min(Number(fromMonth), Number(toMonth));
      const end = Math.max(Number(fromMonth), Number(toMonth));

      for (let m = start; m <= end; m++) {
        payments.push({
          year: Number(year),
          month: m,
          amount: Number(amount)
        });
      }
      onSaveBulk(payments);
    }
  }

  const years = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
    years.push(y);
  }

  const monthCount = Math.abs(Number(toMonth) - Number(fromMonth)) + 1;

  return (
    <form onSubmit={handleSubmit}>
      <div className="property-details" style={{ marginBottom: 15 }}>
        <strong>{property.unit}</strong> - {property.renterName || t('noRenter')}
        <br />
        {t('paymentType')}: <span className={`payment-type ${property.paymentType}`}>{t(property.paymentType)}</span>
      </div>

      {!isEditMode && (
        <div className="payment-mode-toggle">
          <button
            type="button"
            className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
            onClick={() => setMode('single')}
          >
            {t('singleMonth')}
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === 'bulk' ? 'active' : ''}`}
            onClick={() => setMode('bulk')}
          >
            {t('multipleMonths')}
          </button>
        </div>
      )}

      <div className="form-group">
        <label>{t('year')}</label>
        <select value={year} onChange={e => setYear(e.target.value)}>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {(isEditMode || mode === 'single') ? (
        <div className="form-group">
          <label>{t('month')}</label>
          <select value={month} onChange={e => setMonth(e.target.value)}>
            {monthsFull.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="form-row">
          <div className="form-group">
            <label>{t('fromMonth')}</label>
            <select value={fromMonth} onChange={e => setFromMonth(e.target.value)}>
              {monthsFull.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{t('toMonth')}</label>
            <select value={toMonth} onChange={e => setToMonth(e.target.value)}>
              {monthsFull.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="form-group">
        <label>{t('amount')}</label>
        <NumberInput
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder={t('enterAmount')}
          required
        />
        {property.paymentType === 'fixed' && (
          <small style={{ color: '#666' }}>{t('fixedRent')}: {formatNumber(property.fixedRent)}</small>
        )}
      </div>

      {mode === 'bulk' && amount && (
        <div className="bulk-summary">
          {t('bulkSummary')}: {monthCount} {t('months')} × {formatNumber(amount)} = <strong>{formatNumber(monthCount * Number(amount))}</strong>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {isEditMode ? t('update') : (mode === 'single' ? t('recordPayment') : t('recordPayments'))}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}

export default PaymentForm;
