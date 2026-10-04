function NavButton({
  active,
  icon,
  label,
  count,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`nav-button ${active ? "active" : ""}`}
      onClick={onClick}
    >

      <span className="nav-icon">
        {icon}
      </span>

      <span className="nav-label">
        {label}
      </span>

      {count > 0 && (
        <span className="nav-count">
          {count}
        </span>
      )}

    </button>
  );
}

export default NavButton;
