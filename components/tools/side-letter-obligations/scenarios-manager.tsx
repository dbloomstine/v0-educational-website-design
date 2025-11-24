import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SideLetterData } from './types'

export function ScenariosManager({ data }: { data: SideLetterData; setData: (data: SideLetterData) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Modeling</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Create scenarios to model side letter changes</p>
      </CardContent>
    </Card>
  )
}
