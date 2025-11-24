import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2 } from 'lucide-react'
import { Fund } from './types'

interface FundsEditorProps {
  funds: Fund[]
  onChange: (funds: Fund[]) => void
}

export function FundsEditor({ funds, onChange }: FundsEditorProps) {
  const addFund = () => {
    const newFund: Fund = {
      id: Date.now().toString(),
      name: `Fund ${funds.length + 1}`,
      size: 100,
      feeRate: 2.0,
      feeBase: 'committed',
      stepDown: { enabled: true, year: 6, newRate: 1.5 },
      gpCommitment: 2.5,
      gpFundedByMgmtCo: false
    }
    onChange([...funds, newFund])
  }

  const removeFund = (id: string) => {
    onChange(funds.filter(f => f.id !== id))
  }

  const updateFund = (id: string, updates: Partial<Fund>) => {
    onChange(funds.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const updateStepDown = (id: string, updates: Partial<Fund['stepDown']>) => {
    onChange(funds.map(f => f.id === id ? { ...f, stepDown: { ...f.stepDown, ...updates } } : f))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Active Funds
          <Button size="sm" onClick={addFund}>
            <Plus className="h-4 w-4 mr-2" />
            Add Fund
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {funds.map((fund) => (
          <div key={fund.id} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Input
                value={fund.name}
                onChange={(e) => updateFund(fund.id, { name: e.target.value })}
                className="font-semibold max-w-xs"
              />
              <Button variant="ghost" size="sm" onClick={() => removeFund(fund.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fund Size ($M)</Label>
                <Input
                  type="number"
                  value={fund.size}
                  onChange={(e) => updateFund(fund.id, { size: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Management Fee Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={fund.feeRate}
                  onChange={(e) => updateFund(fund.id, { feeRate: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Fee Base</Label>
                <Select
                  value={fund.feeBase}
                  onValueChange={(value: any) => updateFund(fund.id, { feeBase: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="committed">Committed Capital</SelectItem>
                    <SelectItem value="invested">Invested Cost</SelectItem>
                    <SelectItem value="nav">NAV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={fund.stepDown.enabled}
                  onCheckedChange={(checked) => updateStepDown(fund.id, { enabled: checked })}
                />
                <Label>Fee Step-Down</Label>
              </div>

              {fund.stepDown.enabled && (
                <div className="grid md:grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label>Step-Down Year</Label>
                    <Input
                      type="number"
                      value={fund.stepDown.year}
                      onChange={(e) => updateStepDown(fund.id, { year: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>New Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={fund.stepDown.newRate}
                      onChange={(e) => updateStepDown(fund.id, { newRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {funds.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No funds configured. Click "Add Fund" to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
