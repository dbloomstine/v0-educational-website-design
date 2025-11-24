import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { Expenses, PeopleExpense, ExpenseItem } from './types'

interface ExpensesEditorProps {
  expenses: Expenses
  onChange: (expenses: Expenses) => void
}

export function ExpensesEditor({ expenses, onChange }: ExpensesEditorProps) {
  // People expenses
  const addPeople = () => {
    const newPerson: PeopleExpense = {
      id: Date.now().toString(),
      role: '',
      fte: 1,
      baseSalary: 0,
      bonusPercent: 0
    }
    onChange({ ...expenses, people: [...expenses.people, newPerson] })
  }

  const removePeople = (id: string) => {
    onChange({ ...expenses, people: expenses.people.filter(p => p.id !== id) })
  }

  const updatePeople = (id: string, updates: Partial<PeopleExpense>) => {
    onChange({
      ...expenses,
      people: expenses.people.map(p => p.id === id ? { ...p, ...updates } : p)
    })
  }

  // Generic expense functions
  const addExpense = (category: keyof Omit<Expenses, 'people'>) => {
    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      description: '',
      amount: 0,
      type: 'fixed'
    }
    onChange({ ...expenses, [category]: [...expenses[category] as ExpenseItem[], newItem] })
  }

  const removeExpense = (category: keyof Omit<Expenses, 'people'>, id: string) => {
    onChange({
      ...expenses,
      [category]: (expenses[category] as ExpenseItem[]).filter(e => e.id !== id)
    })
  }

  const updateExpense = (category: keyof Omit<Expenses, 'people'>, id: string, updates: Partial<ExpenseItem>) => {
    onChange({
      ...expenses,
      [category]: (expenses[category] as ExpenseItem[]).map(e => e.id === id ? { ...e, ...updates } : e)
    })
  }

  return (
    <>
      {/* People Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            People Costs
            <Button size="sm" onClick={addPeople}>
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Investment team, operations, platform roles, and support staff
          </p>
          <div className="space-y-3">
            {expenses.people.map((person) => (
              <div key={person.id} className="grid md:grid-cols-5 gap-3 items-end p-3 border rounded-lg">
                <div className="space-y-2">
                  <Label className="text-xs">Role / Title</Label>
                  <Input
                    placeholder="Role"
                    value={person.role}
                    onChange={(e) => updatePeople(person.id, { role: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">FTE</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={person.fte}
                    onChange={(e) => updatePeople(person.id, { fte: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Base Salary ($)</Label>
                  <Input
                    type="number"
                    value={person.baseSalary}
                    onChange={(e) => updatePeople(person.id, { baseSalary: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Bonus %</Label>
                  <Input
                    type="number"
                    value={person.bonusPercent}
                    onChange={(e) => updatePeople(person.id, { bonusPercent: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePeople(person.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Other expense categories */}
      {[
        { key: 'services' as const, title: 'Outsourced Services', subtitle: 'Fund admin, audit, tax, compliance, legal, IT, cybersecurity' },
        { key: 'technology' as const, title: 'Technology & Data Stack', subtitle: 'Fund accounting, CRM, portfolio monitoring, data providers' },
        { key: 'office' as const, title: 'Office & Overhead', subtitle: 'Rent, coworking, utilities, office supplies, equipment' },
        { key: 'marketing' as const, title: 'Travel, Fundraising & Marketing', subtitle: 'T&E, conferences, LP events, branding, website' },
        { key: 'insurance' as const, title: 'Insurance & Other', subtitle: 'D&O, E&O, general liability, contingency budget' }
      ].map(({ key, title, subtitle }) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {title}
              <Button size="sm" onClick={() => addExpense(key)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
            <div className="space-y-3">
              {(expenses[key] as ExpenseItem[]).map((item) => (
                <div key={item.id} className="flex items-end gap-3 p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs">Description</Label>
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateExpense(key, item.id, { description: e.target.value })}
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label className="text-xs">Annual Cost ($)</Label>
                    <Input
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateExpense(key, item.id, { amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="w-28 space-y-2">
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={item.type}
                      onValueChange={(value: any) => updateExpense(key, item.id, { type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="variable">Variable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExpense(key, item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  )
}
