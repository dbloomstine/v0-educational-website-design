import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ArticleCTAProps {
  topic: string
}

export function ArticleCTA({ topic }: ArticleCTAProps) {
  return (
    <div className="my-12 rounded-lg border-2 border-accent bg-accent/10 p-8 text-center">
      <h3 className="mb-3 text-xl font-semibold">Looking for tailored guidance on {topic}?</h3>
      <p className="mb-6 text-muted-foreground">
        Get expert support for your specific fund operations challenges
      </p>
      <Button size="lg" asChild>
        <Link href="/contact">Let's Talk</Link>
      </Button>
    </div>
  )
}
