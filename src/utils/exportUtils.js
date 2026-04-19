import { saveAs } from 'file-saver'
import { canvasToBlob, flattenCanvas } from './canvasUtils'

export async function exportPNG(canvas) {
  const blob = await canvasToBlob(canvas, 'image/png')
  saveAs(blob, `air-writer-${Date.now()}.png`)
}

export async function exportJPG(canvas) {
  const flat = flattenCanvas(canvas, '#ffffff')
  const blob = await canvasToBlob(flat, 'image/jpeg', 0.92)
  saveAs(blob, `air-writer-${Date.now()}.jpg`)
}

export async function exportPDF(canvas) {
  const { jsPDF } = await import('jspdf')
  const flat    = flattenCanvas(canvas, '#ffffff')
  const imgData = flat.toDataURL('image/jpeg', 0.92)

  const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait'
  const pdf = new jsPDF({ orientation, unit: 'px', format: [canvas.width, canvas.height] })
  pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height)
  pdf.save(`air-writer-${Date.now()}.pdf`)
}

export async function exportDOCX(canvas) {
  const { Document, Packer, Paragraph, ImageRun } = await import('docx')
  const blob = await canvasToBlob(canvas, 'image/png')
  const buf  = await blob.arrayBuffer()

  // Scale to ~A4 width at 96dpi (≈ 794px wide)
  const scale = Math.min(1, 700 / canvas.width)
  const w = Math.round(canvas.width  * scale)
  const h = Math.round(canvas.height * scale)

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [
            new ImageRun({ data: buf, transformation: { width: w, height: h } }),
          ],
        }),
      ],
    }],
  })

  const docBlob = await Packer.toBlob(doc)
  saveAs(docBlob, `air-writer-${Date.now()}.docx`)
}
