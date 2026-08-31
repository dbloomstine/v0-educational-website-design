import { fetchDeskRows } from '@/lib/crm/queries'
import DeskGrid from './DeskGrid'
import styles from './desk.module.css'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DeskPage() {
  try {
    const rows = await fetchDeskRows()
    return <DeskGrid rows={rows} />
  } catch (err) {
    return (
      <div className={styles.shell}>
        <div className={styles.empty}>
          <p className={styles.err}>Could not load Lead Desk.</p>
          <p className={styles.soft} style={{ marginTop: 8, fontSize: 12 }}>
            {err instanceof Error ? err.message : 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }
}
