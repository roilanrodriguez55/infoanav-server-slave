import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";

// Iconos de Lucide React
import {
  AlertTriangle,
  Wrench,
  FileText,
  Package,
  ShieldAlert,
  BarChart3,
  Calculator,
  Ship,
  ChevronDown,
  Anchor,
  LayoutDashboard,
  Users,
  Library,
} from "lucide-react";

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  hidden?: boolean;
  adminOnly?: boolean;
  group?: string;
  subItems?: {icon: React.ReactNode; name: string; path: string; pro?: boolean; new?: boolean }[];
}

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard className="w-5 h-5" />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <Anchor className="w-5 h-5" />,
    name: "Señales",
    path: "/gestion-senales",
    group: "Módulos principales",
  },
  {
    icon: <Wrench className="w-5 h-5" />,
    name: "Mantenimientos",
    path: "/gestion-mant",
    group: "Módulos principales",
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    name: "Fallas",
    path: "/gestion-fallas",
    group: "Módulos principales",
  },
  {
    icon: <Package className="w-5 h-5" />,
    name: "Equipamiento",
    path: "/equipamiento",
    group: "Módulos principales",
  },
  {
    icon: <ShieldAlert className="w-5 h-5" />,
    name: "Hechos extraordinarios",
    path: "/hechos",
    group: "Módulos principales",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    name: "Documentación",
    path: "/documentacion",
    group: "Consulta y gestión",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    name: "Estadísticas",
    path: "/estadisticas",
    group: "Consulta y gestión",
  },
  {
    icon: <Calculator className="w-5 h-5" />,
    name: "Cálculos",
    path: "/calculos",
    group: "Consulta y gestión",
  },
  {
    icon: <Ship className="w-5 h-5" />,
    name: "Flota y personal",
    path: "/flota",
    group: "Consulta y gestión",
  },
  {
    icon: <Users className="w-5 h-5" />,
    name: "Usuarios",
    path: "/usuarios",
    group: "Administración",
    adminOnly: true,
  },
  {
    icon: <Library className="w-5 h-5" />,
    name: "Catálogos",
    path: "/catalogos",
    group: "Administración",
    adminOnly: true,
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen } = useSidebar();
  const { isAdmin } = useAuth();
  const location = useLocation();
  const visibleNavItems = useMemo(
    () => navItems.filter((nav) => !nav.hidden && (!nav.adminOnly || isAdmin)),
    [isAdmin]
  );
  const { ungroupedNavItems, groupedNavItems } = useMemo(() => {
    const groups = new Map<string, NavItem[]>();
    visibleNavItems.forEach((nav) => {
      if (nav.group) groups.set(nav.group, [...(groups.get(nav.group) ?? []), nav]);
    });
    return {
      ungroupedNavItems: visibleNavItems.filter((nav) => !nav.group),
      groupedNavItems: [...groups],
    };
  }, [visibleNavItems]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => {
      if (path === "/")
        return (
          location.pathname === "/" || location.pathname === "/dashboard"
        );
      return location.pathname === path;
    },
    [location.pathname]
  );

  useEffect(() => {
    let nextOpenSubmenu: { type: "main" | "others"; index: number } | null =
      null;
    const items = visibleNavItems;
    items.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            nextOpenSubmenu = { type: "main", index };
          }
        });
      }
    });
    
    // Usar setTimeout en lugar de queueMicrotask para mejor rendimiento
    setTimeout(() => setOpenSubmenu(nextOpenSubmenu), 0);
  }, [location, isActive, visibleNavItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight ?? 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu?.type === menuType &&
        prevOpenSubmenu?.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isMobileOpen
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`menu-item-icon-size  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isMobileOpen) && (
                <ChevronDown
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-icon-strong"
                      : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {subItem.icon && (
                          <span className="menu-dropdown-icon">
                            {subItem.icon}
                          </span>
                        )}
                        {subItem.name}
                      </span>
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-card text-foreground h-screen transition-all duration-300 ease-in-out z-50 border-r border-border
        ${isExpanded || isMobileOpen ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
    >
      <div
        className={`py-8 flex items-center justify-center gap-2`}
      >
        <Link to="/" className="flex items-center gap-2 shrink-0">
          {isExpanded || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/logo.gif"
                alt="Logo"
                width={50}
              />
              <img
                className="hidden dark:block"
                src="/logo.gif"
                alt="Logo"
                width={50}
              />
              <div className="lg:flex flex-col leading-tight text-foreground">
                <span className="font-bold text-lg">INFOANAV</span>
                <span className="font-normal text-muted-foreground text-[14px]">
                  Sistema de Gestión
                </span>
              </div>
            </>
          ) : (
            <>
              <img
                src="/logo.gif"
                alt="Logo"
                width={50}
              />
            </>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {renderMenuItems(ungroupedNavItems, "main")}
            {groupedNavItems.map(([groupName, items]) => (
              <div key={groupName}>
                <h2
                  className={`mb-2 text-xs uppercase flex leading-[20px] text-muted-foreground ${
                    !isExpanded && !isMobileOpen
                      ? "lg:justify-center"
                      : "justify-start"
                    }`}
                >
                  {isExpanded || isMobileOpen ? (
                    groupName
                  ) : (
                    <span className="my-2 block h-px w-8 bg-border" />
                  )}
                </h2>
                {renderMenuItems(items, "main")}
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
