export default function Sheet({ open, title, description, children, onClose }) {
  return open ? (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <div className="dialog-panel dialog-wide">
        <div className="dialog-header">
          <div>
            <h3 className="dialog-title">{title}</h3>
            {description ? <p className="dialog-description">{description}</p> : null}
          </div>
          <button className="button ghost" type="button" onClick={onClose}>Chiudi</button>
        </div>
        {children}
      </div>
    </div>
  ) : null;
}
