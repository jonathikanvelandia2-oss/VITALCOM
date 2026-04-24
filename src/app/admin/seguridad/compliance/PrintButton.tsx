'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
    >
      Imprimir / Guardar PDF
    </button>
  )
}
