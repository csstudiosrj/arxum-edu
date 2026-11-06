import { getVideosAdmin } from './actions'
import { EduflixAdminClient } from './eduflix-client'

export const dynamic = 'force-dynamic'

export default async function AdminEduflixPage() {
  const videos = await getVideosAdmin()
  return <EduflixAdminClient videosIniciais={videos} />
}
