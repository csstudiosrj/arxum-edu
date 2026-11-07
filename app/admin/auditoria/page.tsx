import { getLogsAuditoria } from './actions'
import { AuditoriaClient } from './auditoria-client'

export const dynamic = 'force-dynamic'

export default async function AuditoriaPage() {
  const logs = await getLogsAuditoria()
  return <AuditoriaClient logsIniciais={logs} />
}