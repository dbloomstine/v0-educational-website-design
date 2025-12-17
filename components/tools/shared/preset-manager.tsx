"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Save, Trash2, FolderOpen } from 'lucide-react'
import type { Preset } from '@/lib/hooks/use-presets'

interface PresetManagerProps<T> {
  /** List of saved presets */
  presets: Preset<T>[]
  /** Whether presets have been loaded from storage */
  isLoaded: boolean
  /** Callback to save current state as a preset */
  onSave: (name: string) => void
  /** Callback when a preset is selected to load */
  onLoad: (presetId: string) => void
  /** Callback to delete a preset */
  onDelete: (presetId: string) => void
  /** Whether there's data to save (disable save if empty) */
  canSave?: boolean
  /** Compact mode for tight spaces */
  compact?: boolean
}

/**
 * PresetManager - UI for saving, loading, and managing user presets
 */
export function PresetManager<T>({
  presets,
  isLoaded,
  onSave,
  onLoad,
  onDelete,
  canSave = true,
  compact = false
}: PresetManagerProps<T>) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string>('')

  const handleSave = () => {
    if (presetName.trim()) {
      onSave(presetName.trim())
      setPresetName('')
      setSaveDialogOpen(false)
    }
  }

  const handleLoad = () => {
    if (selectedPreset) {
      onLoad(selectedPreset)
      setSelectedPreset('')
    }
  }

  const handleDelete = () => {
    if (selectedPreset) {
      onDelete(selectedPreset)
      setSelectedPreset('')
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (!isLoaded) {
    return null
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Load Preset */}
        {presets.length > 0 && (
          <Select value={selectedPreset} onValueChange={(value) => {
            setSelectedPreset(value)
            onLoad(value)
          }}>
            <SelectTrigger className="w-[160px] h-8">
              <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Load preset" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Save Dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={!canSave} className="h-8">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Scenario</DialogTitle>
              <DialogDescription>
                Save your current inputs as a preset to quickly load later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  placeholder="e.g., Fund I Base Case"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!presetName.trim()}>
                Save Preset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">My Scenarios</h4>
        <span className="text-xs text-muted-foreground">
          {presets.length} saved
        </span>
      </div>

      {/* Load Preset Section */}
      {presets.length > 0 ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="load-preset" className="text-xs">Load a saved scenario</Label>
            <Select value={selectedPreset} onValueChange={setSelectedPreset}>
              <SelectTrigger id="load-preset">
                <SelectValue placeholder="Select a preset..." />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <div className="flex items-center justify-between gap-4">
                      <span>{preset.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(preset.createdAt)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPreset && (
            <div className="flex gap-2">
              <Button onClick={handleLoad} size="sm" className="flex-1">
                <FolderOpen className="h-4 w-4 mr-2" />
                Load
              </Button>
              <Button
                onClick={handleDelete}
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No saved scenarios yet. Save your current inputs to quickly load them later.
        </p>
      )}

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={!canSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Current Scenario
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Scenario</DialogTitle>
            <DialogDescription>
              Save your current inputs as a preset to quickly load later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name-full">Preset Name</Label>
              <Input
                id="preset-name-full"
                placeholder="e.g., Fund I Base Case"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
            {presets.length >= 10 && (
              <p className="text-xs text-muted-foreground">
                You have {presets.length} presets. Saving a new one will remove the oldest.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!presetName.trim()}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
