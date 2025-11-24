import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SideLetterData } from './types'

export function ObligationsMatrix({ data }: { data: SideLetterData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Obligations Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Investor</th>
                <th className="p-2 text-left">Commitment</th>
                <th className="p-2 text-left">Fees</th>
                <th className="p-2 text-left">MFN</th>
                <th className="p-2 text-left">Other</th>
              </tr>
            </thead>
            <tbody>
              {data.investors.map(inv => (
                <tr key={inv.id} className="border-b">
                  <td className="p-2">{inv.name}</td>
                  <td className="p-2">${inv.commitment}M</td>
                  <td className="p-2">{data.clauses.filter(c => c.investorId === inv.id && c.category === 'fees').length || '—'}</td>
                  <td className="p-2">{data.clauses.filter(c => c.investorId === inv.id && c.category === 'mfn').length || '—'}</td>
                  <td className="p-2">{data.clauses.filter(c => c.investorId === inv.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
