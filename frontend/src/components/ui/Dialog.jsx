export default function Dialog({ open, title, description, children, footer, onClose, wide = false }) {
  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <div className={`dialog-panel ${wide ? 'dialog-wide' : ''}`.trim()}>
        <div className="dialog-header">
          <div>
            <h3 className="dialog-title">{title}</h3>
            {description ? <p className="dialog-description">{description}</p> : null}
          </div>
          <button className="button ghost" type="button" onClick={onClose}>Chiudi</button>
        </div>
        {children}
        {footer ? <div className="dialog-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
