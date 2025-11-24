import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SideLetterData } from './types'

export function FundSetup({ data, setData }: { data: SideLetterData; setData: (data: SideLetterData) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fund Context</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Fund Name</Label>
            <Input value={data.fund.name} onChange={(e) => setData({...data, fund: {...data.fund, name: e.target.value}})} />
          </div>
          <div>
            <Label>Fund Type</Label>
            <Select value={data.fund.type} onValueChange={(v: any) => setData({...data, fund: {...data.fund, type: v}})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Venture Capital">Venture Capital</SelectItem>
                <SelectItem value="Private Equity Buyout">Private Equity Buyout</SelectItem>
                <SelectItem value="Growth Equity">Growth Equity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Vintage Year</Label>
            <Input type="number" value={data.fund.vintage} onChange={(e) => setData({...data, fund: {...data.fund, vintage: +e.target.value}})} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
