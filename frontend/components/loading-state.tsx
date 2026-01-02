import { Card, CardContent } from "@/components/ui/card"

export function LoadingState() {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="flex flex-col items-center justify-center p-12">
        {/* Animated dots */}
        <div className="mb-6 flex gap-2">
          <span className="h-3 w-3 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
          <span className="h-3 w-3 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
          <span className="h-3 w-3 animate-bounce rounded-full bg-primary" />
        </div>
        <p className="text-lg text-muted-foreground">Thinking about what matters…</p>
      </CardContent>
    </Card>
  )
}
