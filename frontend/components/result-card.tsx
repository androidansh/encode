"use client"

import type { AnalysisResult } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RotateCcw } from "lucide-react"

interface ResultCardProps {
  result: AnalysisResult
  onReset: () => void
}

const decisionConfig = {
  good: {
    emoji: "✅",
    label: "Good choice",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
  },
  okay: {
    emoji: "🟡",
    label: "Okay occasionally",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
  },
  avoid: {
    emoji: "⚠️",
    label: "Better avoid",
    bgColor: "bg-rose-50",
    textColor: "text-rose-700",
    borderColor: "border-rose-200",
  },
}

export function ResultCard({ result, onReset }: ResultCardProps) {
  const normalize = (d: string) => {
    const lower = d.toLowerCase()

    if (lower.includes("good")) return "good"
    if (lower.includes("avoid") || lower.includes("bad")) return "avoid"
    return "okay"
  }

  const safeDecision = normalize(result.decision)
  const config = decisionConfig[safeDecision as "good" | "okay" | "avoid"]

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        {/* Decision Header */}
        <div className={`${config.bgColor} ${config.borderColor} border-b px-6 py-8 text-center`}>
          <span className="text-5xl" role="img" aria-label={config.label}>
            {config.emoji}
          </span>
          <h2 className={`mt-3 text-2xl font-bold ${config.textColor}`}>{config.label}</h2>
        </div>

        {/* Explanation */}
        <div className="p-6">
          <p className="text-base leading-relaxed text-foreground">{result.explanation}</p>
        </div>

        {/* Caution Section */}
        {result.caution.length > 0 && (
          <div className="border-t border-border/50 bg-muted/30 p-6">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Who should be cautious?</h3>
            </div>
            <ul className="space-y-2">
              {result.caution.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground/50" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reset Action */}
        <div className="border-t border-border/50 p-6">
          <Button onClick={onReset} variant="outline" className="w-full py-5 bg-transparent" size="lg">
            <RotateCcw className="mr-2 h-4 w-4" />
            Try another food
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
