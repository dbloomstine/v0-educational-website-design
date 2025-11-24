import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SideLetterData } from './types'

export function ClausesManager({ data }: { data: SideLetterData; setData: (data: SideLetterData) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Side Letter Clauses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.investors.map(investor => {
            const clauses = data.clauses.filter(c => c.investorId === investor.id)
            return (
              <div key={investor.id} className="border rounded-lg p-4">
                <div className="font-semibold mb-2">{investor.name}</div>
                {clauses.map(c => (
                  <div key={c.id} className="text-sm p-2 bg-muted rounded mb-2">
                    <span className="font-medium">[{c.category}]</span> {c.description}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
