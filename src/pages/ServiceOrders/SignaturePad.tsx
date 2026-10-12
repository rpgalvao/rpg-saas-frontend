import { EraserIcon } from 'lucide-react'
import { useLayoutEffect, useRef, type PointerEvent } from 'react'

import { Button } from '@/components/ui/button'

type SignaturePadProps = {
  disabled?: boolean
  onChange: (signature: string | null) => void
}

function prepareContext(canvas: HTMLCanvasElement) {
  const ratio = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = Math.max(1, Math.floor(rect.width * ratio))
  canvas.height = Math.max(1, Math.floor(rect.height * ratio))

  const context = canvas.getContext('2d')
  if (!context) return

  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.lineWidth = 1.8
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.strokeStyle = '#111111'
}

export function SignaturePad({ disabled = false, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const hasInkRef = useRef(false)
  const onChangeRef = useRef(onChange)

  useLayoutEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const syncSize = () => {
      if (hasInkRef.current) return
      prepareContext(canvas)
    }

    syncSize()
    const observer = new ResizeObserver(syncSize)
    observer.observe(canvas)

    return () => observer.disconnect()
  }, [])

  function publish() {
    if (!hasInkRef.current) {
      onChangeRef.current(null)
      return
    }

    const signature = canvasRef.current?.toDataURL('image/png') ?? ''
    onChangeRef.current(signature.length >= 20 ? signature : null)
  }

  function clear() {
    const canvas = canvasRef.current
    hasInkRef.current = false
    drawingRef.current = false
    if (canvas) prepareContext(canvas)
    onChangeRef.current(null)
  }

  function pointFromEvent(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (disabled) return

    const context = canvasRef.current?.getContext('2d')
    if (!context) return

    event.currentTarget.setPointerCapture(event.pointerId)
    drawingRef.current = true
    hasInkRef.current = true

    const point = pointFromEvent(event)
    context.beginPath()
    context.moveTo(point.x, point.y)
    context.lineTo(point.x + 0.01, point.y + 0.01)
    context.stroke()
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || disabled) return

    const context = canvasRef.current?.getContext('2d')
    if (!context) return

    const point = pointFromEvent(event)
    context.lineTo(point.x, point.y)
    context.stroke()
  }

  function stopDrawing() {
    if (!drawingRef.current) return
    drawingRef.current = false
    publish()
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-dashed border-border bg-white">
      <canvas
        ref={canvasRef}
        className="h-36 w-full touch-none sm:h-40"
        aria-label="Área de assinatura"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
      />
      <Button
        type="button"
        variant="outline"
        size="xs"
        className="absolute top-2 right-2 bg-white text-foreground"
        disabled={disabled}
        onClick={clear}
      >
        <EraserIcon />
        Limpar
      </Button>
    </div>
  )
}
