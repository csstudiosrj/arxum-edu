import { getVideoaulas } from './actions'
import { EduflixAdminClient } from './eduflix-client'

export const dynamic = 'force-dynamic'

export default async function EduflixAdminPage() {
  const videoaulas = await getVideoaulas()
  return <EduflixAdminClient videoaulas={videoaulas} />
}