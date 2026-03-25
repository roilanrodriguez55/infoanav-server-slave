import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; 
import { useSidebar } from "../context/SidebarContext";

// Iconos de Lucide React
import { 
  LayoutList, 
  AlertTriangle, 
  Wrench, 
  FileText, 
  Grid3x3,
  Calculator,
  ChevronDown,
  LayoutGrid,
  MoreHorizontal,
  List,
  Anchor,
  ClipboardList,
  ShieldAlert,
  Settings
} from "lucide-react";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: {icon: React.ReactNode; name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <Anchor className="w-5 h-5" />,
    name: "Señales",
    path: "/gestion-senales"
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    name: "Fallas",
    path: "/gestion-fallas"
  },
  {
    icon: <Wrench className="w-5 h-5" />,
    name: "Mantenimientos",
    path: "/gestion-mant"
  },
  {
    icon: <FileText className="w-5 h-5" />,
    name: "Documentación",
    path: "/documentacion",
  },
  {
    icon: <Grid3x3 className="w-5 h-5" />,
    name: "Control de Equipamiento",
    path: "/cont-equipamiento",
  },
  {
    icon: <Calculator className="w-5 h-5" />,
    name: "Cálculo de Parámetros",
    path: "/calculo-parametros",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate(); 

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let nextOpenSubmenu: { type: "main" | "others"; index: number } | null =
      null;
    const items = navItems;
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
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const handleGestionANAVClick = () => {
    navigate("/gestion-anav");
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isMobileOpen
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
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
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
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
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                      onClick={
                        subItem.name === "Gestión de ANAV" 
                          ? handleGestionANAVClick 
                          : undefined
                      }
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
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
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
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
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
              <div className="lg:flex flex-col leading-tight text-gray-700 dark:text-gray-300">
                <span className="font-bold text-lg">INFOANAV</span>
                <span className="font-normal text-gray-400 text-[14px] dark:text-gray-400">
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
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isMobileOpen
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isMobileOpen ? (
                  "Gestión"
                ) : (
                  <MoreHorizontal className="w-6 h-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;