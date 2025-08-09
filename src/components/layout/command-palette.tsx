"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Brain, FileText, Home, Lightbulb, Library, Plus, Search, Waypoints } from "lucide-react"

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Open with Cmd/Ctrl + K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search actions, pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/dashboard")}>
            <Home className="mr-2 h-4 w-4" /> Dashboard <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/idea-mission")}>
            <Lightbulb className="mr-2 h-4 w-4" /> Idea Mission <CommandShortcut>G I</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/research")}>
            <FileText className="mr-2 h-4 w-4" /> Research <CommandShortcut>G R</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/documents")}>
            <Library className="mr-2 h-4 w-4" /> Documents <CommandShortcut>G L</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go("/idea-mission?new=1")}>
            <Plus className="mr-2 h-4 w-4" /> New Idea Mission
          </CommandItem>
          <CommandItem onSelect={() => go("/research?new=1")}>
            <Plus className="mr-2 h-4 w-4" /> New Research Mission
          </CommandItem>
          <CommandItem onSelect={() => go("/documents?import=1")}>
            <Waypoints className="mr-2 h-4 w-4" /> Import Documents
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Help">
          <CommandItem onSelect={() => go("/dashboard#search")}>
            <Search className="mr-2 h-4 w-4" /> Search tips
          </CommandItem>
          <CommandItem onSelect={() => setOpen(false)}>
            <Brain className="mr-2 h-4 w-4" /> About agents
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}


