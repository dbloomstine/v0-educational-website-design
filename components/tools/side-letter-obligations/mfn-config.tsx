import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SideLetterData } from './types'

export function MFNConfig({ data, setData }: { data: SideLetterData; setData: (data: SideLetterData) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>MFN Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Tier 1 Threshold ($M)</Label>
            <Input type="number" value={data.mfnConfig.tier1Threshold} 
              onChange={(e) => setData({...data, mfnConfig: {...data.mfnConfig, tier1Threshold: +e.target.value}})} />
          </div>
          <div>
            <Label>Tier 2 Threshold ($M)</Label>
            <Input type="number" value={data.mfnConfig.tier2Threshold}
              onChange={(e) => setData({...data, mfnConfig: {...data.mfnConfig, tier2Threshold: +e.target.value}})} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
