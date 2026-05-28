import { type ReactNode } from 'react'
import { NavLink as RouterNavLink } from 'react-router-dom'
import {
  Container,
  Header,
  HeaderBrand,
  HeaderContent,
  HeaderRightZone,
  Headers,
  Icon,
  Sidebar,
} from 'design-react-kit'
import { useMe } from '../../hooks/useMe'

interface NavEntry {
  label: string
  to: string
  iconName: string
}

const NAV: NavEntry[] = [
  { label: 'Dashboard', to: '/dashboard', iconName: 'it-pa' },
  { label: 'Repository', to: '/repositories', iconName: 'it-folder' },
  { label: 'Harvest', to: '/harvest', iconName: 'it-refresh' },
  { label: 'Audit', to: '/audit', iconName: 'it-files' },
  { label: 'Validate', to: '/validate', iconName: 'it-check-circle' },
]

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const me = useMe()

  return (
    <>
      <Headers>
        <Header type="center" theme="">
          <HeaderContent>
            <HeaderBrand iconName="it-pa">
              <h2>NDC Admin</h2>
              <h3>National Data Catalog</h3>
            </HeaderBrand>
            <HeaderRightZone>
              <div className="d-flex align-items-center gap-3 me-3 text-white">
                {me.data && (
                  <span>
                    <Icon icon="it-user" size="sm" className="me-2" color="white" />
                    {me.data.name}
                  </span>
                )}
                <a className="btn btn-outline-white btn-sm" href="/logout">
                  Logout
                </a>
              </div>
            </HeaderRightZone>
          </HeaderContent>
        </Header>
      </Headers>

      <Container fluid className="px-0">
        <div className="row g-0">
          <aside
            className="col-12 col-md-3 col-lg-2 border-end bg-light"
            style={{ minHeight: 'calc(100vh - 120px)' }}
          >
            <Sidebar>
              <div className="link-list-wrapper">
                <ul className="link-list">
                  {NAV.map((entry) => (
                    <li key={entry.to}>
                      <RouterNavLink
                        to={entry.to}
                        className={({ isActive }) =>
                          `list-item${isActive ? ' active' : ''}`
                        }
                      >
                        <Icon icon={entry.iconName} size="sm" className="me-2" />
                        <span>{entry.label}</span>
                      </RouterNavLink>
                    </li>
                  ))}
                </ul>
              </div>
            </Sidebar>
          </aside>
          <main className="col-12 col-md-9 col-lg-10 p-4">{children}</main>
        </div>
      </Container>
    </>
  )
}
