import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    Users,
    ListTodo,
    Columns3,
    BarChart3,
    UserCog,
    LogOut,
    Briefcase,
    FileSearch,
    Bot,
    FileText,
    Menu,
    X,
    Shield,
    Book,
    Clock
} from 'lucide-react';

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/', icon: ListTodo, label: 'To-Do Geral' },
        { to: '/kanban', icon: Columns3, label: 'Kanban' },
        { to: '/acessos', icon: Shield, label: 'Acessos' },
        { to: '/quotes', icon: FileText, label: 'Orçamentos & Contratos' },
        { to: '/knowledge', icon: Book, label: 'Base de Conhecimento' },
        { to: '/timeline', icon: Clock, label: 'Cronograma' },
        { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
    ];

    // Close mobile menu when route changes

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname, setIsMobileMenuOpen]);

    return (
        <div className={`app-layout ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
            {/* Mobile Header */}
            <header className="mobile-header">
                <button className="menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <div className="mobile-logo">
                    <Briefcase size={24} />
                    <span>Gestão PJ</span>
                </div>
                <div style={{ width: 40 }}></div> {/* Spacer for symmetry */}
            </header>

            {/* Backdrop for mobile */}
            {isMobileMenuOpen && (
                <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
            )}

            <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Briefcase size={28} />
                        <span>Gestão PJ - ATUALIZADO</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
                        <div className="user-details">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-role">{user?.role === 'admin' ? 'Administrador' : 'Gestor'}</span>
                        </div>
                    </div>
                    <button className="nav-item logout-btn" onClick={logout}>
                        <LogOut size={20} />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}

