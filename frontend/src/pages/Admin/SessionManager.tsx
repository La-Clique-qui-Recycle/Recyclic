import React, { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Calendar, Users, Scale, ShoppingCart, Euro, Search } from 'lucide-react'
import { cashSessionsService, CashSessionFilters, CashSessionKPIs, CashSessionListItem } from '../../services/cashSessionsService'
import { UsersApi, SitesApi } from '../../generated/api'
import axiosClient from '../../api/axiosClient'
import { getUsers, User } from '../../services/usersService'

const Container = styled.div`
  padding: 24px;
`

const Title = styled.h1`
  margin: 0 0 20px 0;
  font-size: 1.8rem;
  color: #1f2937;
`

const FiltersBar = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr)) 1fr;
  gap: 12px;
  margin-bottom: 16px;
`

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
`

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  background: #fff;
`

const KPICards = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(180px, 1fr));
  gap: 12px;
  margin: 12px 0 20px 0;
`

const Card = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
`

const CardIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f3f4f6;
  color: #111827;
`

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
`

const CardLabel = styled.div`
  font-size: 0.8rem;
  color: #6b7280;
`

const CardValue = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: #111827;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
`

const Th = styled.th`
  text-align: left;
  padding: 12px;
  background: #f9fafb;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
`

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.95rem;
  color: #1f2937;
`

const StatusDot = styled.span<{ variant: 'open' | 'closed' }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  margin-right: 8px;
  background: ${p => p.variant === 'open' ? '#16a34a' : '#ef4444'};
`

const ActionsCell = styled.div`
  display: flex;
  gap: 8px;
`

const Button = styled.button<{ $variant?: 'primary' | 'ghost' }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: ${p => p.$variant === 'ghost' ? '1px solid #e5e7eb' : 'none'};
  background: ${p => p.$variant === 'ghost' ? '#fff' : '#111827'};
  color: ${p => p.$variant === 'ghost' ? '#111827' : '#fff'};
  cursor: pointer;
`

function formatCurrency(value: number): string {
  return (value ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

const SessionManager: React.FC = () => {
  const [filters, setFilters] = useState<CashSessionFilters>({ limit: 20, skip: 0 })
  const [kpis, setKpis] = useState<CashSessionKPIs | null>(null)
  const [rows, setRows] = useState<CashSessionListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [operators, setOperators] = useState<{ id: string, label: string }[]>([])
  const [sites, setSites] = useState<{ id: string, name: string }[]>([])
  const [users, setUsers] = useState<User[]>([])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [kpiRes, listRes] = await Promise.all([
        cashSessionsService.getKPIs({ date_from: filters.date_from, date_to: filters.date_to, site_id: filters.site_id }),
        cashSessionsService.list(filters)
      ])
      setKpis(kpiRes)
      setRows(Array.isArray(listRes?.data) ? listRes.data : Array.isArray(listRes) ? listRes : [])
      setTotal((listRes as any)?.total ?? (Array.isArray(listRes) ? listRes.length : 0))
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement des sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    ;(async () => {
      try {
        const [ops, sts, usersData] = await Promise.all([
          UsersApi.activeoperatorsapiv1usersactiveoperatorsget().catch(() => []),
          SitesApi.sitesapiv1sitesget().catch(() => []),
          getUsers().catch(() => [])
        ])
        const opsOpts = (ops as any[]).map((u) => ({ id: String(u.id), label: u.username || u.full_name || u.telegram_id || String(u.id) }))
        const siteOpts = (sts as any[]).map((s) => ({ id: String(s.id), name: s.name || String(s.id) }))
        setOperators(opsOpts)
        setSites(siteOpts)
        setUsers(usersData)
      } catch {}
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onFilterChange = (patch: Partial<CashSessionFilters>) => {
    const next = { ...filters, ...patch }
    setFilters(next)
  }

  const onApplyFilters = () => {
    // Forcer un rechargement basé sur l'état courant
    load()
  }

  // Fonction pour récupérer le nom de l'utilisateur
  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId)
    return user ? (user.full_name || user.first_name || user.username || userId) : userId
  }

  return (
    <Container>
      <Title>Gestionnaire de Sessions de Caisse</Title>

      <FiltersBar>
        <Input type="date" value={filters.date_from || ''} onChange={e => onFilterChange({ date_from: e.target.value })} />
        <Input type="date" value={filters.date_to || ''} onChange={e => onFilterChange({ date_to: e.target.value })} />
        <Select value={filters.status || ''} onChange={e => onFilterChange({ status: (e.target.value || undefined) as any })}>
          <option value="">Tous statuts</option>
          <option value="open">Ouvertes</option>
          <option value="closed">Fermées</option>
        </Select>
        <Select value={filters.operator_id || ''} onChange={e => onFilterChange({ operator_id: e.target.value || undefined })}>
          <option value="">Tous opérateurs</option>
          {operators.map(op => (
            <option key={op.id} value={op.id}>{op.label}</option>
          ))}
        </Select>
      </FiltersBar>

      <FiltersBar>
        <Select value={filters.site_id || ''} onChange={e => onFilterChange({ site_id: e.target.value || undefined })}>
          <option value="">Tous sites</option>
          {sites.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} />
          <Input placeholder="Recherche (opérateur ou ID session)" value={filters.search || ''} onChange={e => onFilterChange({ search: e.target.value || undefined })} onKeyDown={e => e.key === 'Enter' && onApplyFilters()} />
        </div>
        <div />
        <div />
        <div />
      </FiltersBar>

      <div style={{ marginBottom: 8 }}>
        <Button onClick={onApplyFilters}>Appliquer les filtres</Button>
      </div>

      <KPICards>
        <Card>
          <CardIcon><Euro size={18} /></CardIcon>
          <CardContent>
            <CardLabel>Chiffre d'Affaires Total</CardLabel>
            <CardValue>{formatCurrency(kpis?.total_sales || 0)}</CardValue>
          </CardContent>
        </Card>
        <Card>
          <CardIcon><ShoppingCart size={18} /></CardIcon>
          <CardContent>
            <CardLabel>Nombre de Ventes</CardLabel>
            <CardValue>{kpis?.number_of_sales ?? 0}</CardValue>
          </CardContent>
        </Card>
        <Card>
          <CardIcon><Scale size={18} /></CardIcon>
          <CardContent>
            <CardLabel>Poids Total Vendu</CardLabel>
            <CardValue>{(kpis?.total_weight_sold ?? 0).toLocaleString('fr-FR')} kg</CardValue>
          </CardContent>
        </Card>
        <Card>
          <CardIcon><Euro size={18} /></CardIcon>
          <CardContent>
            <CardLabel>Total des Dons</CardLabel>
            <CardValue>{formatCurrency(kpis?.total_donations || 0)}</CardValue>
          </CardContent>
        </Card>
        <Card>
          <CardIcon><Users size={18} /></CardIcon>
          <CardContent>
            <CardLabel>Nombre de Sessions</CardLabel>
            <CardValue>{kpis?.total_sessions ?? 0}</CardValue>
          </CardContent>
        </Card>
      </KPICards>

      <Table>
        <thead>
          <tr>
            <Th>Statut</Th>
            <Th>Ouverture</Th>
            <Th>Opérateur</Th>
            <Th>Nb ventes</Th>
            <Th>Total ventes</Th>
            <Th>Total dons</Th>
            <Th>Écart</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => window.location.assign(`/admin/cash-sessions/${row.id}`)} style={{ cursor: 'pointer' }}>
              <Td><StatusDot variant={row.status} />{row.status === 'open' ? 'Ouverte' : 'Fermée'}</Td>
              <Td>{new Date(row.opened_at).toLocaleString('fr-FR')}</Td>
              <Td>{row.operator_id ? getUserName(row.operator_id) : '-'}</Td>
              <Td>{row.number_of_sales || 0}</Td>
              <Td>{formatCurrency(row.total_sales || 0)}</Td>
              <Td>{formatCurrency(row.total_donations || 0)}</Td>
              <Td>{row.variance !== undefined ? formatCurrency(row.variance) : '-'}</Td>
              <Td>
                <ActionsCell>
                  <Button onClick={(e) => {
                    e.stopPropagation()
                    window.location.assign(`/admin/cash-sessions/${row.id}`)
                  }}>Voir Détail</Button>
                  <Button $variant='ghost' onClick={async (e) => {
                    e.stopPropagation()
                    try {
                      // Utiliser le nouvel endpoint qui génère le rapport directement par session ID
                      const blobRes = await axiosClient.get(`/v1/admin/reports/cash-sessions/by-session/${row.id}`, { responseType: 'blob' })
                      const url = URL.createObjectURL(blobRes.data)
                      const a = document.createElement('a')
                      a.href = url
                      // Extraire le nom de fichier depuis le Content-Disposition header si disponible
                      const contentDisposition = blobRes.headers['content-disposition'] || blobRes.headers['Content-Disposition']
                      let filename = `session_caisse_${row.id}.csv`
                      if (contentDisposition) {
                        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
                        if (filenameMatch && filenameMatch[1]) {
                          filename = filenameMatch[1].replace(/['"]/g, '')
                        }
                      }
                      a.download = filename
                      a.click()
                      URL.revokeObjectURL(url)
                    } catch (err) {
                      console.error('Erreur lors du téléchargement du rapport:', err)
                    }
                  }}>Télécharger CSV</Button>
                </ActionsCell>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  )
}

export default SessionManager


