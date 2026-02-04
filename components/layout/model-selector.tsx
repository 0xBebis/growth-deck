"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CURATED_MODELS } from "@/lib/utils/constants";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";

interface ModelSelectorProps {
  currentModelId: string;
}

export function ModelSelector({ currentModelId }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(currentModelId);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen);

  const current = CURATED_MODELS.find((m) => m.id === selectedModel) ?? CURATED_MODELS[0];

  // Reset focused index when opening
  useEffect(() => {
    if (isOpen) {
      const currentIndex = CURATED_MODELS.findIndex((m) => m.id === selectedModel);
      setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, selectedModel]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((i) => Math.min(i + 1, CURATED_MODELS.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          handleSelect(CURATED_MODELS[focusedIndex].id);
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
        case "Tab":
          e.preventDefault();
          setIsOpen(false);
          break;
        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setFocusedIndex(CURATED_MODELS.length - 1);
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, focusedIndex]);

  const handleSelect = useCallback(async (modelId: string) => {
    setSelectedModel(modelId);
    setIsOpen(false);
    buttonRef.current?.focus();

    try {
      await fetch("/api/openrouter/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultModelId: modelId }),
      });
    } catch {
      setSelectedModel(currentModelId);
    }
  }, [currentModelId]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className="flex items-center gap-2 rounded-lg glass border-border/50 px-3 py-2.5 text-sm font-medium transition-smooth hover:bg-white/5 focus:ring-2 focus:ring-primary focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="model-listbox"
        aria-label={`Select AI model. Current: ${current.name}`}
        id="model-selector-button"
      >
        <span className="text-muted-foreground">Model:</span>
        <span className="text-foreground">{current.name}</span>
        <svg
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={trapRef}
            id="model-listbox"
            role="listbox"
            aria-labelledby="model-selector-button"
            aria-activedescendant={`model-option-${focusedIndex}`}
            className="absolute right-0 z-50 mt-2 w-80 rounded-xl glass-strong p-3 shadow-xl animate-scale-in"
            tabIndex={-1}
          >
            <p className="mb-3 text-sm font-semibold text-foreground" id="model-listbox-label">
              Select Default Model
            </p>
            <div className="space-y-1" role="presentation">
              {CURATED_MODELS.map((model, index) => (
                <button
                  key={model.id}
                  id={`model-option-${index}`}
                  role="option"
                  aria-selected={selectedModel === model.id}
                  onClick={() => handleSelect(model.id)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-smooth ${
                    selectedModel === model.id
                      ? "bg-primary/20 border border-primary/30"
                      : focusedIndex === index
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`mt-0.5 h-4 w-4 rounded-full border-2 transition-colors flex-shrink-0 ${
                      selectedModel === model.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{model.name}</span>
                      {model.tag && (
                        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          {model.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ${model.inputCost.toFixed(2)} in / ${model.outputCost.toFixed(2)} out per 1M
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(model.contextLength / 1000).toFixed(0)}K context
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-3 pt-3 border-t border-border/30 text-[10px] text-muted-foreground text-center">
              <kbd className="px-1 py-0.5 bg-white/10 rounded">↑↓</kbd> navigate
              <span className="mx-2">·</span>
              <kbd className="px-1 py-0.5 bg-white/10 rounded">Enter</kbd> select
              <span className="mx-2">·</span>
              <kbd className="px-1 py-0.5 bg-white/10 rounded">Esc</kbd> close
            </p>
          </div>
        </>
      )}
    </div>
  );
}
