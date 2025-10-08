import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock pour react-router-dom - approche complète
vi.mock('react-router-dom', async () => {
  const actual: any = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: actual.BrowserRouter,
    MemoryRouter: actual.MemoryRouter,
    NavLink: actual.NavLink,
    Link: actual.Link,
    Routes: actual.Routes,
    Route: actual.Route,
    useSearchParams: actual.useSearchParams,
    // retourne une fonction de navigation mockée
    useNavigate: () => vi.fn(),
    useLocation: actual.useLocation,
    useParams: actual.useParams,
  };
})

// (pas de mock de react-dom/client; utiliser le render testing-library avec container explicite dans test-utils)

// Mock pour lucide-react
vi.mock('lucide-react', () => ({
  Recycle: () => React.createElement('div', { 'data-testid': 'recycle-icon' }, 'Recycle'),
  Home: () => React.createElement('div', { 'data-testid': 'home-icon' }, 'Home'),
  Calculator: () => React.createElement('div', { 'data-testid': 'calculator-icon' }, 'Calculator'),
  Package: () => React.createElement('div', { 'data-testid': 'package-icon' }, 'Package'),
  BarChart3: (props: any = {}) => React.createElement('div', {
    ...(props['data-testid'] ? { 'data-testid': props['data-testid'] } : {})
  }, 'BarChart3'),
  Receipt: () => React.createElement('div', { 'data-testid': 'receipt-icon' }, 'Receipt'),
  DollarSign: () => React.createElement('div', { 'data-testid': 'dollarsign-icon' }, 'DollarSign'),
  Calendar: () => React.createElement('div', { 'data-testid': 'calendar-icon' }, 'Calendar'),
  Users: () => React.createElement('div', { 'data-testid': 'users-icon' }, 'Users'),
  ArrowLeft: () => React.createElement('div', { 'data-testid': 'arrow-left-icon' }, 'ArrowLeft'),
  AlertTriangle: () => React.createElement('div', { 'data-testid': 'alert-triangle-icon' }, 'AlertTriangle'),
  CheckCircle: () => React.createElement('div', { 'data-testid': 'check-circle-icon' }, 'CheckCircle'),
  LogOut: () => React.createElement('div', { 'data-testid': 'log-out-icon' }, 'LogOut'),
  Monitor: () => React.createElement('div', { 'data-testid': 'monitor-icon' }, 'Monitor'),
  MapPin: () => React.createElement('div', { 'data-testid': 'map-pin-icon' }, 'MapPin'),
  ChevronRight: () => React.createElement('div', { 'data-testid': 'chevron-right-icon' }, 'ChevronRight'),
  Settings: () => React.createElement('div', { 'data-testid': 'settings-icon' }, 'Settings'),
  // Ajouts nécessaires pour les composants qui utilisent Plus et X
  Plus: () => React.createElement('div', { 'data-testid': 'plus-icon' }, 'Plus'),
  X: () => React.createElement('div', { 'data-testid': 'x-icon' }, 'X'),
  Loader2: (props: any = {}) => React.createElement('div', {
    ...(props['data-testid'] ? { 'data-testid': props['data-testid'] } : {}),
    'data-icon-name': 'Loader2'
  }, 'Loader2'),
  Save: (props: any = {}) => React.createElement('div', {
    ...(props['data-testid'] ? { 'data-testid': props['data-testid'] } : {}),
    'data-icon-name': 'Save'
  }, 'Save'),
  Trash2: (props: any = {}) => React.createElement('div', {
    ...(props['data-testid'] ? { 'data-testid': props['data-testid'] } : {}),
    'data-icon-name': 'Trash2'
  }, 'Trash2'),
  Edit: (props: any = {}) => React.createElement('div', {
    ...(props['data-testid'] ? { 'data-testid': props['data-testid'] } : {}),
    'data-icon-name': 'Edit'
  }, 'Edit'),
  Receipt: (props: any = {}) => React.createElement('div', {
    ...(props['data-testid'] ? { 'data-testid': props['data-testid'] } : {}),
    'data-icon-name': 'Receipt'
  }, 'Receipt'),
  Check: (props: any = {}) => React.createElement('div', {
    ...(props['data-testid'] ? { 'data-testid': props['data-testid'] } : {}),
    'data-icon-name': 'Check'
  }, 'Check'),
  TrendingUp: (props: any = {}) => React.createElement('div', {
    ...(props['data-testid'] ? { 'data-testid': props['data-testid'] } : {}),
    'data-icon-name': 'TrendingUp'
  }, 'TrendingUp'),
  Tags: (props: any = {}) => React.createElement('div', {
    ...(props['data-testid'] ? { 'data-testid': props['data-testid'] } : {}),
    'data-icon-name': 'Tags'
  }, 'Tags'),
}))

// Mock pour styled-components - approche avec styles simulés
vi.mock('styled-components', () => {
  const h = (tag: string) =>
    (_strings?: TemplateStringsArray, ..._exprs: any[]) =>
      (props: any) => {
        const { children, ...restProps } = props || {}
        // Simuler les styles basés sur les props
        const style = {}
        
        // Simuler les variants de Button
        if (tag === 'button') {
          if (props.variant === 'primary') {
            style.background = '#2c5530'
          } else if (props.variant === 'secondary') {
            style.background = '#6c757d'
          } else if (props.variant === 'danger') {
            style.background = '#dc3545'
          }
          
          if (props.disabled) {
            style.background = '#ccc'
          }
          
          if (props.size === 'small') {
            style.padding = '8px 16px'
            style.fontSize = '14px'
          }
        }
        
        // Simuler les styles d'Input
        if (tag === 'input') {
          if (props.error) {
            style.borderColor = '#dc3545'
          }
          if (props.disabled) {
            style.backgroundColor = '#f8f9fa'
          }
          if (props.size === 'small') {
            style.padding = '8px 12px'
            style.fontSize = '14px'
          } else if (props.size === 'large') {
            style.padding = '16px 20px'
            style.fontSize = '18px'
          }
        }
        
        // Simuler les styles de Button pour toutes les tailles
        if (tag === 'button') {
          if (props.size === 'large') {
            style.padding = '16px 32px'
            style.fontSize = '18px'
          }
        }
        
        // Simuler les styles de Modal
        if (tag === 'div' && props.role === 'dialog') {
          if (props.size === 'small') {
            style.maxWidth = '400px'
          } else if (props.size === 'large') {
            style.maxWidth = '800px'
          }
        }
        
        // Simuler les styles d'ErrorMessage
        if (tag === 'span' && props.className?.includes('error')) {
          style.color = '#dc3545'
        }
        
        // Gérer les props spéciales styled-components comme $active
        const filteredProps = { ...restProps }
        Object.keys(filteredProps).forEach(key => {
          if (key.startsWith('$')) {
            // Garder les props $ pour la logique de style
            // mais aussi les ajouter comme attributs data pour les tests
            filteredProps[`data-${key.slice(1)}`] = filteredProps[key]
          }
        })
        
        return React.createElement(tag, { ...filteredProps, style }, children)
      };

  const styled: any = (tag: string) => h(tag);
  ['div','button','input','label','span','h1','h2','h3','h4','nav','header','form','select','textarea','p','a','table','thead','tbody','tr','th','td','main','ul','li']
    .forEach(t => { styled[t] = h(t); });

  styled.css = () => '';
  styled.keyframes = () => '';
  styled.ThemeProvider = ({ children }: any) => children;

  return { __esModule: true, default: styled, ...styled };
})

// Mock pour axios
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() }
  }
}

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance)
  }
}))

// Mock pour les modules de services - SUPPRIMÉ
// Les tests API doivent contrôler leurs propres mocks axios

// Mock pour window.matchMedia pour Mantine
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock pour @tabler/icons-react - Version complète pour tous les composants
vi.mock('@tabler/icons-react', () => {
  // Fonction helper pour créer des composants d'icônes mockés
  const createIconComponent = (name: string, testId: string) => {
    return React.forwardRef<HTMLDivElement, any>((props, ref) => 
      React.createElement('div', { 
        ...props, 
        ref,
        'data-testid': testId,
        'data-icon-name': name
      }, name)
    );
  };

  return {
    IconUser: createIconComponent('IconUser', 'icon-user'),
    IconShield: createIconComponent('IconShield', 'icon-shield'),
    IconCash: createIconComponent('IconCash', 'icon-cash'),
    IconCurrencyEuro: createIconComponent('IconCurrencyEuro', 'icon-currency-euro'),
    IconSettings: createIconComponent('IconSettings', 'icon-settings'),
    IconSearch: createIconComponent('IconSearch', 'icon-search'),
    IconFilter: createIconComponent('IconFilter', 'icon-filter'),
    IconRefresh: createIconComponent('IconRefresh', 'icon-refresh'),
    IconAlertCircle: createIconComponent('IconAlertCircle', 'icon-alert'),
    IconEye: createIconComponent('IconEye', 'icon-eye'),
    IconEdit: createIconComponent('IconEdit', 'icon-edit'),
    IconTrash: createIconComponent('IconTrash', 'icon-trash'),
    IconHistory: createIconComponent('IconHistory', 'icon-history'),
    IconCheck: createIconComponent('IconCheck', 'icon-check'),
    IconX: createIconComponent('IconX', 'icon-x'),
    IconCalendar: createIconComponent('IconCalendar', 'icon-calendar'),
    IconShoppingCart: createIconComponent('IconShoppingCart', 'icon-shopping-cart'),
    IconTruck: createIconComponent('IconTruck', 'icon-truck'),
    IconBuilding: createIconComponent('IconBuilding', 'icon-building'),
    IconCashRegister: createIconComponent('IconCashRegister', 'icon-cash-register'),
  };
})

// Mock pour @mantine/notifications (v7 expose Notifications, pas NotificationsProvider)
vi.mock('@mantine/notifications', () => {
  const Notifications = ({ children }: any) => React.createElement('div', { 'data-testid': 'notifications' }, children)
  const NotificationsProvider = ({ children }: any) => React.createElement('div', { 'data-testid': 'notifications-provider' }, children)
  return {
    Notifications,
    NotificationsProvider,
    notifications: {
      show: vi.fn(),
    },
    showNotification: vi.fn(),
  };
})

// Stubs pour navigation/téléchargement jsdom
// @ts-ignore
window.URL.createObjectURL = vi.fn(() => 'blob:test');
// @ts-ignore
HTMLAnchorElement.prototype.click = vi.fn();

// Mock global pour window.alert pour éviter les erreurs jsdom dans les tests
vi.spyOn(window, 'alert').mockImplementation(() => {});

// Mock pour ResizeObserver (requis par Mantine)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock pour scrollIntoView (requis par Mantine Combobox)
Element.prototype.scrollIntoView = vi.fn()

// Mock pour console methods to avoid noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn()
}

// Configuration pour les portals Mantine
// Créer un div pour les portals
const portalRoot = document.createElement('div')
portalRoot.setAttribute('data-mantine-portal', 'true')
document.body.appendChild(portalRoot)

// Mock spécifique pour @mantine/dates
vi.mock('@mantine/dates', async () => {
  const actual = await vi.importActual('@mantine/dates')

  return {
    ...actual,
    DatePickerInput: ({ label, placeholder, leftSection, value, onChange, ...props }: any) => {
      return React.createElement('input', {
        'data-testid': 'date-picker-input',
        'data-label': label,
        'data-placeholder': placeholder,
        'value': value ? value.toISOString().split('T')[0] : '',
        'onChange': (e: any) => {
          if (e.target.value) {
            onChange(new Date(e.target.value))
          } else {
            onChange(null)
          }
        },
        'type': 'date',
        ...props
      })
    }
  }
})

// Mock pour Mantine Portal et Modal - approche complète
vi.mock('@mantine/core', async () => {
  const actual = await vi.importActual('@mantine/core')

  // Créer un contexte mock pour Mantine
  const mockTheme = {
    primaryColor: 'blue',
    colors: {
      blue: ['#e7f3ff', '#b3d9ff', '#80bfff', '#4da6ff', '#1a8cff', '#0073e6', '#0066cc', '#0059b3', '#004d99', '#004080']
    },
    spacing: {
      xs: 4, sm: 8, md: 16, lg: 24, xl: 32
    },
    fontSizes: {
      xs: 12, sm: 14, md: 16, lg: 18, xl: 20
    }
  }

  return {
    ...actual,
    Portal: ({ children }: any) => {
      // Rendre le contenu directement dans le DOM de test
      return React.createElement('div', { 'data-testid': 'mantine-portal' }, children)
    },
    Modal: ({ children, opened, title, ...props }: any) => {
      if (!opened) return null
      return React.createElement('div', { 
        ...props, 
        role: 'dialog',
        'aria-modal': 'true',
        'data-testid': 'role-change-modal',
        'aria-label': title || undefined,
        title: title || undefined,
        style: { display: 'block' }
      }, title ? React.createElement('div', {}, title) : null, children)
    },
    Table: Object.assign(
      ({ children, ...props }: any) => React.createElement('table', { ...props, 'data-testid': 'table' }, children),
      {
        Root: ({ children, ...props }: any) => React.createElement('table', { ...props, 'data-testid': 'table' }, children),
        Thead: ({ children, ...props }: any) => React.createElement('thead', props, children),
        Tbody: ({ children, ...props }: any) => React.createElement('tbody', props, children),
        Tr: ({ children, ...props }: any) => React.createElement('tr', props, children),
        Th: ({ children, ...props }: any) => React.createElement('th', props, children),
        Td: ({ children, ...props }: any) => React.createElement('td', props, children),
      }
    ),
    Select: ({ children, value, onChange, data, leftSection, label, placeholder, name, ...props }: any) => {
      const testId = props['data-testid'] || 'select'
      const id = props.id || `select-${(name || String(label) || placeholder || Math.random()).toString().replace(/\s+/g,'-').toLowerCase()}`
      const handleChange = (e: any) => {
        const nextValue = e && e.target ? e.target.value : e
        if (onChange) onChange(nextValue)
      }
      return React.createElement('div', {},
        label && React.createElement('label', { htmlFor: id }, label),
        React.createElement('select', { 
          ...props, 
          id,
          name,
          'data-testid': testId,
          value,
          'aria-label': label || placeholder,
          onChange: handleChange
        }, 
          (data || []).map((option: any) => 
            React.createElement('option', { 
              key: option.value, 
              value: option.value,
              onClick: () => onChange && onChange(option.value)
            }, option.label)
          )
        )
      )
    },
    MultiSelect: ({ value = [], data = [], onChange, label, placeholder, name, ...props }: any) => {
      const testId = props['data-testid'] || 'multi-select'
      const handleChange = (event: any) => {
        if (!onChange) {
          return
        }

        if (event && event.target) {
          const nextValues = Array.from(event.target.selectedOptions || [], (option: any) => option.value)
          onChange(nextValues)
        } else if (Array.isArray(event)) {
          onChange(event)
        } else {
          onChange([])
        }
      }

      return React.createElement('div', {},
        label && React.createElement('label', {}, label),
        React.createElement('select', {
          ...props,
          name,
          multiple: true,
          'data-testid': testId,
          value: value || [],
          placeholder,
          onChange: handleChange
        },
          (data || []).map((option: any) =>
            React.createElement('option', {
              key: option.value,
              value: option.value
            }, option.label)
          )
        )
      )
    },
    Button: ({ children, onClick, disabled, loading, leftSection, ...props }: any) => {
      return React.createElement('button', { 
        ...props, 
        'data-testid': props['data-testid'] || 'button',
        onClick,
        disabled: disabled || loading,
        style: { 
          padding: '8px 16px', 
          border: '1px solid #ccc', 
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1
        }
      }, leftSection, children)
    },
    Stack: ({ children, gap, ...props }: any) => {
      return React.createElement('div', { 
        ...props, 
        'data-testid': 'stack',
        style: { display: 'flex', flexDirection: 'column', gap: gap || '8px' }
      }, children)
    },
    Badge: ({ children, color, variant, ...props }: any) => {
      return React.createElement('span', { 
        ...props, 
        'data-testid': 'badge',
        'data-color': color,
        'data-variant': variant,
        style: { 
          padding: '4px 8px', 
          borderRadius: '4px', 
          backgroundColor: color === 'green' ? '#d4edda' : color === 'yellow' ? '#fff3cd' : color === 'red' ? '#f8d7da' : '#e2e3e5',
          color: color === 'green' ? '#155724' : color === 'yellow' ? '#856404' : color === 'red' ? '#721c24' : '#383d41'
        }
      }, children)
    },
    Group: ({ children, gap, justify, ...props }: any) => {
      return React.createElement('div', { 
        ...props, 
        'data-testid': 'group',
        style: { 
          display: 'flex', 
          gap: gap || '8px', 
          alignItems: 'center',
          justifyContent: justify || 'flex-start'
        }
      }, children)
    },
    Text: ({ children, fw, size, c, ...props }: any) => {
      const testId = (props as any)['data-testid'] || 'text'
      return React.createElement('p', { 
        ...props, 
        'data-testid': testId,
        style: { 
          fontWeight: fw ? String(fw) : 'normal',
          fontSize: size === 'sm' ? '14px' : '16px',
          color: c === 'dimmed' ? '#6c757d' : 'inherit',
          margin: 0
        }
      }, children)
    },
    ActionIcon: ({ children, variant, color, onClick, 'data-testid': testId, ...props }: any) => {
      return React.createElement('button', { 
        ...props, 
        'data-testid': testId || 'action-icon',
        onClick,
        style: { 
          border: 'none', 
          background: 'transparent', 
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px'
        }
      }, children)
    },
    Tooltip: ({ children, label, ...props }: any) => {
      return React.createElement('div', { 
        ...props, 
        'data-testid': 'tooltip',
        title: label
      }, children)
    },
    Skeleton: ({ height, width, ...props }: any) => {
      return React.createElement('div', { 
        ...props, 
        'data-testid': 'skeleton',
        style: { 
          height: height || '20px', 
          width: width || '100%', 
          backgroundColor: '#f0f0f0',
          borderRadius: '4px'
        }
      })
    },
    Alert: ({ children, title, icon, ...props }: any) => {
      return React.createElement('div', { 
        ...props, 
        'data-testid': 'error-message' 
      }, 
        title && React.createElement('div', { 'data-testid': 'alert-title' }, title),
        children
      )
    },
    Divider: ({ orientation = 'horizontal', ...props }: any) => {
      const style = orientation === 'vertical' 
        ? { width: '1px', height: '100%', background: '#e0e0e0' }
        : { height: '1px', width: '100%', background: '#e0e0e0' };
      return React.createElement('div', { ...props, 'data-testid': 'divider', style })
    },
    Container: ({ children, size, py, px, ...props }: any) => {
      return React.createElement('div', {
        ...props,
        'data-testid': 'container',
        style: {
          maxWidth: size === 'xl' ? '1200px' : size === 'lg' ? '992px' : '100%',
          margin: '0 auto',
          paddingTop: py ? '16px' : undefined,
          paddingBottom: py ? '16px' : undefined,
          paddingLeft: px ? '16px' : undefined,
          paddingRight: px ? '16px' : undefined,
        }
      }, children)
    },
    Textarea: ({ label, placeholder, value, onChange, ...props }: any) => {
      return React.createElement('div', { ...props, 'data-testid': 'textarea-wrapper' },
        label && React.createElement('label', {}, label),
        React.createElement('textarea', {
          placeholder,
          value,
          onChange,
          style: { width: '100%', padding: '8px', margin: '8px 0 16px' }
        })
      )
    },
    Paper: ({ children, p, withBorder, ...props }: any) => {
      return React.createElement('div', { 
        ...props, 
        'data-testid': 'paper',
        style: { 
          padding: p || '16px',
          border: withBorder ? '1px solid #e0e0e0' : 'none',
          borderRadius: '8px'
        }
      }, children)
    },
    // Replace Tabs mock with a component that has static subcomponents
    Tabs: Object.assign(
      ({ children, value, onChange, ...props }: any) => {
        const enhancedChildren = React.Children.map(children, (child: any) => {
          if (!child || typeof child !== 'object') return child;
          return React.cloneElement(child, { onChange, 'data-tabs-value': value });
        });
        return React.createElement('div', { 
          ...props, 
          'data-testid': 'tabs',
          'data-value': value
        }, enhancedChildren)
      },
      {
        List: ({ children, onChange, 'data-tabs-value': tabsValue, ...props }: any) => {
          const enhancedChildren = React.Children.map(children, (child: any) => {
            if (!child || typeof child !== 'object') return child;
            return React.cloneElement(child, { onChange, 'data-tabs-value': tabsValue });
          });
          return React.createElement('div', { 
            ...props, 
            'data-testid': 'tabs-list',
            style: { display: 'flex', gap: '8px' }
          }, enhancedChildren)
        },
        Tab: ({ children, value, leftSection, onChange, 'data-tabs-value': tabsValue, ...props }: any) => {
          const isActive = tabsValue === value;
          const handleClick = () => {
            if (onChange) onChange(value);
          };
          return React.createElement('button', { 
            ...props, 
            'data-testid': 'tabs-tab',
            'data-value': value,
            'data-active': isActive ? 'true' : 'false',
            onClick: handleClick,
            style: { 
              padding: '8px 16px',
              border: '1px solid #ccc',
              background: isActive ? '#eef' : 'white',
              cursor: 'pointer'
            }
          }, leftSection, children)
        },
        Panel: ({ children, value, 'data-tabs-value': tabsValue, ...props }: any) => {
          const isActive = tabsValue === value;
          return React.createElement('div', { 
            ...props, 
            'data-testid': 'tabs-panel',
            'data-value': value,
            style: { display: isActive ? 'block' : 'none' }
          }, children)
        }
      }
    ),
    TextInput: ({ label, placeholder, leftSection, error, value, defaultValue, onChange, name, id: givenId, ...props }: any) => {
      return React.createElement('div', { 
        ...props, 
        'data-testid': 'text-input'
      }, 
        (() => {
          const id = givenId || `input-${(name || String(label) || placeholder || Math.random()).toString().replace(/\s+/g,'-').toLowerCase()}`
          const inputProps: any = {
            id,
            placeholder,
            onChange,
            'aria-label': label || placeholder,
            style: { 
              padding: '8px 12px',
              border: error ? '1px solid red' : '1px solid #ccc',
              borderRadius: '4px',
              width: '100%'
            },
            ...props,
          }
          if (value !== undefined) {
            inputProps.value = value
          } else if (defaultValue !== undefined || props.defaultValue !== undefined) {
            inputProps.defaultValue = defaultValue ?? props.defaultValue
          }
          return React.createElement(React.Fragment, {},
            label && React.createElement('label', { htmlFor: id }, label),
            React.createElement('input', inputProps)
          )
        })(),
        error && React.createElement('span', { style: { color: 'red' } }, error)
      )
    },
    Switch: ({ label, checked, onChange, ...props }: any) => {
      return React.createElement('div', { 
        ...props, 
        'data-testid': 'switch'
      }, 
        React.createElement('input', { 
          type: 'checkbox',
          checked,
          onChange: (e) => onChange && onChange(e.target.checked),
          style: { marginRight: '8px' }
        }),
        label
      )
    },
    Timeline: ({ children, active, bulletSize, lineWidth, ...props }: any) => {
      return React.createElement('div', { 
        ...props, 
        'data-testid': 'timeline',
        style: { position: 'relative' }
      }, children)
    },
    'Timeline.Item': ({ children, bullet, title, ...props }: any) => {
      return React.createElement('div', { 
        ...props, 
        'data-testid': 'timeline-item',
        style: { marginBottom: '16px' }
      }, 
        bullet,
        title && React.createElement('div', { 'data-testid': 'timeline-title' }, title),
        children
      )
    },
    Pagination: ({ value, onChange, total, size, ...props }: any) => {
      return React.createElement('div', { 
        ...props, 
        'data-testid': 'pagination',
        style: { display: 'flex', gap: '4px' }
      }, 
        Array.from({ length: total }, (_, i) => 
          React.createElement('button', {
            key: i + 1,
            onClick: () => onChange && onChange(i + 1),
            style: { 
              padding: '4px 8px',
              border: '1px solid #ccc',
              background: value === i + 1 ? '#007bff' : 'white',
              color: value === i + 1 ? 'white' : 'black',
              cursor: 'pointer'
            }
          }, i + 1)
        )
      )
    },
    Avatar: ({ children, size, color, ...props }: any) => {
      return React.createElement('div', { 
        ...props, 
        'data-testid': 'avatar',
        style: { 
          width: size === 'lg' ? '60px' : size === 'md' ? '40px' : '32px',
          height: size === 'lg' ? '60px' : size === 'md' ? '40px' : '32px',
          borderRadius: '50%',
          backgroundColor: color === 'blue' ? '#007bff' : '#6c757d',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size === 'lg' ? '24px' : '16px',
          fontWeight: 'bold'
        }
      }, children)
    },
    Title: ({ children, order = 1, ...props }: any) => {
      const Tag = `h${order}` as any
      return React.createElement(Tag, { ...props, 'data-testid': 'title' }, children)
    },
    Grid: Object.assign(
      ({ children, ...props }: any) => React.createElement('div', { ...props, 'data-testid': 'grid' }, children),
      {
        Col: ({ children, span, ...props }: any) => React.createElement('div', { ...props, 'data-testid': 'grid-col', 'data-span': JSON.stringify(span || null) }, children)
      }
    ),
  }
})
