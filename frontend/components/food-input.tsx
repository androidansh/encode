"use client"

import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, ImageIcon } from "lucide-react"

interface FoodInputProps {
  inputText: string
  setInputText: (text: string) => void
  selectedImage: File | null
  setSelectedImage: (file: File | null) => void
  onAnalyze: () => void
}

export function FoodInput({ inputText, setInputText, selectedImage, setSelectedImage, onAnalyze }: FoodInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const canAnalyze = inputText.trim() || selectedImage

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-5">
          {/* Text Input */}
          <div>
            <Textarea
              placeholder="Paste ingredients or product name here…"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-32 resize-none border-border/60 bg-background text-base placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Image Upload */}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              ref={fileInputRef}
              className="hidden"
              id="image-upload"
            />

            {!selectedImage ? (
              <label
                htmlFor="image-upload"
                className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border/60 bg-muted/30 p-6 transition-colors hover:border-primary/40 hover:bg-muted/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <span className="font-medium text-foreground">Upload ingredient photo</span>
                  <p className="mt-1 text-sm text-muted-foreground">Works best with clear ingredient photos</p>
                </div>
              </label>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-foreground">{selectedImage.name}</p>
                  <p className="text-sm text-muted-foreground">{(selectedImage.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeImage}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove image</span>
                </Button>
              </div>
            )}
          </div>

          {/* Analyze Button */}
          <Button onClick={onAnalyze} disabled={!canAnalyze} className="w-full py-6 text-base font-medium" size="lg">
            Analyze Food
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
