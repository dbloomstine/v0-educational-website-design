import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SideLetterData } from './types'

export function InvestorsManager({ data }: { data: SideLetterData; setData: (data: SideLetterData) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>LP Base Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">Manage your investor base</p>
        <div className="space-y-3">
          {data.investors.map(inv => (
            <div key={inv.id} className="p-4 border rounded-lg">
              <div className="font-semibold">{inv.name}</div>
              <div className="text-sm text-muted-foreground">${inv.commitment}M • {inv.category}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
