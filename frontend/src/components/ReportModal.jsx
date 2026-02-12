function ReportModal({ onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default ReportModal;
