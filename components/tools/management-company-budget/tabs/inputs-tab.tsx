'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBudgetStore } from '../store'
import { TYPICAL_RANGES } from '../types'
import { Plus, Trash2, DollarSign, Users, Building, Briefcase } from 'lucide-react'

function CurrencyInput({
  value,
  onChange,
  label,
  hint
}: {
  value: number
  onChange: (value: number) => void
  label: string
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="pl-7"
          min={0}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function FundsSection() {
  const data = useBudgetStore(state => state.data)
  const addFund = useBudgetStore(state => state.addFund)
  const updateFund = useBudgetStore(state => state.updateFund)
  const removeFund = useBudgetStore(state => state.removeFund)

  const [newFund, setNewFund] = useState({ name: '', size: 50, feeRate: 2 })

  const handleAddFund = () => {
    if (!newFund.name.trim()) return
    addFund({
      name: newFund.name,
      size: newFund.size,
      feeRate: newFund.feeRate,
      firstCloseYear: new Date().getFullYear()
    })
    setNewFund({ name: '', size: 50, feeRate: 2 })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Briefcase className="h-5 w-5" />
          Funds
        </CardTitle>
        <CardDescription>
          Revenue sources from management fees
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing funds */}
        {data.funds.map((fund) => (
          <div key={fund.id} className="flex items-end gap-3 p-3 bg-accent/30 rounded-lg">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Fund Name</Label>
              <Input
                value={fund.name}
                onChange={(e) => updateFund(fund.id, { name: e.target.value })}
                placeholder="Fund I"
              />
            </div>
            <div className="w-28 space-y-1.5">
              <Label className="text-xs">Size ($M)</Label>
              <Input
                type="number"
                value={fund.size}
                onChange={(e) => updateFund(fund.id, { size: Number(e.target.value) || 0 })}
                min={0}
              />
            </div>
            <div className="w-24 space-y-1.5">
              <Label className="text-xs">Fee Rate (%)</Label>
              <Input
                type="number"
                value={fund.feeRate}
                onChange={(e) => updateFund(fund.id, { feeRate: Number(e.target.value) || 0 })}
                min={0}
                max={5}
                step={0.25}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeFund(fund.id)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Add new fund */}
        <div className="flex items-end gap-3 pt-2 border-t">
          <div className="flex-1">
            <Input
              value={newFund.name}
              onChange={(e) => setNewFund({ ...newFund, name: e.target.value })}
              placeholder="New fund name"
            />
          </div>
          <div className="w-28">
            <Input
              type="number"
              value={newFund.size}
              onChange={(e) => setNewFund({ ...newFund, size: Number(e.target.value) || 0 })}
              placeholder="Size ($M)"
              min={0}
            />
          </div>
          <div className="w-24">
            <Input
              type="number"
              value={newFund.feeRate}
              onChange={(e) => setNewFund({ ...newFund, feeRate: Number(e.target.value) || 0 })}
              placeholder="Fee %"
              min={0}
              max={5}
              step={0.25}
            />
          </div>
          <Button onClick={handleAddFund} size="icon" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function TeamSection() {
  const data = useBudgetStore(state => state.data)
  const addTeamMember = useBudgetStore(state => state.addTeamMember)
  const updateTeamMember = useBudgetStore(state => state.updateTeamMember)
  const removeTeamMember = useBudgetStore(state => state.removeTeamMember)

  const [newMember, setNewMember] = useState({ role: '', monthlyCost: 15000 })

  const handleAddMember = () => {
    if (!newMember.role.trim()) return
    addTeamMember({
      role: newMember.role,
      monthlyCost: newMember.monthlyCost
    })
    setNewMember({ role: '', monthlyCost: 15000 })
  }

  const roleOptions = Object.keys(TYPICAL_RANGES.team)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Team
        </CardTitle>
        <CardDescription>
          Personnel costs (salary + bonus + benefits)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing team members */}
        {data.expenses.team.map((member) => (
          <div key={member.id} className="flex items-end gap-3 p-3 bg-accent/30 rounded-lg">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Input
                value={member.role}
                onChange={(e) => updateTeamMember(member.id, { role: e.target.value })}
                placeholder="Role"
                list="role-options"
              />
              <datalist id="role-options">
                {roleOptions.map(role => <option key={role} value={role} />)}
              </datalist>
            </div>
            <div className="w-36 space-y-1.5">
              <Label className="text-xs">Monthly Cost</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  value={member.monthlyCost}
                  onChange={(e) => updateTeamMember(member.id, { monthlyCost: Number(e.target.value) || 0 })}
                  className="pl-7"
                  min={0}
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeTeamMember(member.id)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Add new team member */}
        <div className="flex items-end gap-3 pt-2 border-t">
          <div className="flex-1">
            <Input
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              placeholder="New role"
              list="role-options-new"
            />
            <datalist id="role-options-new">
              {roleOptions.map(role => <option key={role} value={role} />)}
            </datalist>
          </div>
          <div className="w-36">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                value={newMember.monthlyCost}
                onChange={(e) => setNewMember({ ...newMember, monthlyCost: Number(e.target.value) || 0 })}
                className="pl-7"
                min={0}
              />
            </div>
          </div>
          <Button onClick={handleAddMember} size="icon" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Typical ranges: Partner $12-30K, Associate $6-12K, Analyst $4-8K
        </p>
      </CardContent>
    </Card>
  )
}

function ExpensesSection({
  title,
  description,
  icon: Icon,
  items,
  onAdd,
  onUpdate,
  onRemove,
  typicalRanges
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  items: Array<{ id: string; name: string; monthlyCost: number }>
  onAdd: (item: { name: string; monthlyCost: number }) => void
  onUpdate: (id: string, updates: { name?: string; monthlyCost?: number }) => void
  onRemove: (id: string) => void
  typicalRanges: Record<string, { min: number; max: number; typical: number; note?: string }>
}) {
  const [newItem, setNewItem] = useState({ name: '', monthlyCost: 5000 })

  const handleAdd = () => {
    if (!newItem.name.trim()) return
    onAdd({ name: newItem.name, monthlyCost: newItem.monthlyCost })
    setNewItem({ name: '', monthlyCost: 5000 })
  }

  const itemOptions = Object.keys(typicalRanges)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-end gap-3 p-3 bg-accent/30 rounded-lg">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Item</Label>
              <Input
                value={item.name}
                onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                placeholder="Item name"
              />
            </div>
            <div className="w-36 space-y-1.5">
              <Label className="text-xs">Monthly Cost</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  value={item.monthlyCost}
                  onChange={(e) => onUpdate(item.id, { monthlyCost: Number(e.target.value) || 0 })}
                  className="pl-7"
                  min={0}
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(item.id)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Add new item */}
        <div className="flex items-end gap-3 pt-2 border-t">
          <div className="flex-1">
            <Input
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="New item"
              list={`${title.toLowerCase()}-options`}
            />
            <datalist id={`${title.toLowerCase()}-options`}>
              {itemOptions.map(opt => <option key={opt} value={opt} />)}
            </datalist>
          </div>
          <div className="w-36">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                value={newItem.monthlyCost}
                onChange={(e) => setNewItem({ ...newItem, monthlyCost: Number(e.target.value) || 0 })}
                className="pl-7"
                min={0}
              />
            </div>
          </div>
          <Button onClick={handleAdd} size="icon" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function InputsTab() {
  const data = useBudgetStore(state => state.data)
  const setStartingCash = useBudgetStore(state => state.setStartingCash)
  const addOperationsExpense = useBudgetStore(state => state.addOperationsExpense)
  const updateOperationsExpense = useBudgetStore(state => state.updateOperationsExpense)
  const removeOperationsExpense = useBudgetStore(state => state.removeOperationsExpense)
  const addOverheadExpense = useBudgetStore(state => state.addOverheadExpense)
  const updateOverheadExpense = useBudgetStore(state => state.updateOverheadExpense)
  const removeOverheadExpense = useBudgetStore(state => state.removeOverheadExpense)

  return (
    <div className="space-y-6">
      {/* Starting Cash */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            Starting Cash
          </CardTitle>
          <CardDescription>
            Seed capital available before management fees begin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CurrencyInput
            value={data.startingCash}
            onChange={setStartingCash}
            label="Amount"
            hint="Typical range: $250K - $1M for emerging managers"
          />
        </CardContent>
      </Card>

      {/* Funds */}
      <FundsSection />

      {/* Team */}
      <TeamSection />

      {/* Operations */}
      <ExpensesSection
        title="Operations"
        description="Fund-level operational costs"
        icon={Building}
        items={data.expenses.operations}
        onAdd={addOperationsExpense}
        onUpdate={updateOperationsExpense}
        onRemove={removeOperationsExpense}
        typicalRanges={TYPICAL_RANGES.operations}
      />

      {/* Overhead */}
      <ExpensesSection
        title="Overhead"
        description="Management company overhead"
        icon={Briefcase}
        items={data.expenses.overhead}
        onAdd={addOverheadExpense}
        onUpdate={updateOverheadExpense}
        onRemove={removeOverheadExpense}
        typicalRanges={TYPICAL_RANGES.overhead}
      />
    </div>
  )
}
