import { Link, NavLink } from "react-router-dom";
import { Logo } from "./Logo";

const ITEMS = [
  { to: "/app/dashboard", label: "Dashboard", icon: <IconGrid /> },
  { to: "/app/equipamentos", label: "Equipamentos", icon: <IconWrench /> },
  { to: "/app/ocorrencia/nova", label: "Reportar Ocorrência", icon: <IconAlert />, badge: "novo" },
];

export function AppSidebar() {
  return (
    <div className="sidebar">
      <div className="brand-block">
        <Link className="back-link" to="/">
          <IconArrowLeft /> Voltar ao site
        </Link>
        <Logo />
      </div>

      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          {item.icon}
          {item.label}
          {item.badge && <span className="nav-num">{item.badge}</span>}
        </NavLink>
      ))}

      <div className="sidebar-footer">
        <span className="pulse-dot" />
        Análise simulada por regras.
        <br />
        Nenhum modelo de IA está integrado nesta versão.
      </div>
    </div>
  );
}

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}
function IconWrench() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.18A2 2 0 004.18 21h15.64a2 2 0 001.87-2.96L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
