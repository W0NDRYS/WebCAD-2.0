import { jsPDF } from "jspdf";
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = SVG_W;
      canvas.height = SVG_H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, SVG_W, SVG_H);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = "drawing.png";
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function exportPdf() {
    const svgString = shapesToSvg(shapes, { showGrid: false, gridMm });
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = SVG_W;
      canvas.height = SVG_H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, SVG_W, SVG_H);
      ctx.drawImage(img, 0, 0);
      const data = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [SVG_W * 0.75, SVG_H * 0.75] });
      pdf.addImage(data, "PNG", 0, 0, SVG_W * 0.75, SVG_H * 0.75);
      pdf.save("drawing.pdf");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  async function importJson(evt) {
    const file = evt.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text);
    commitShapes(parsed.shapes || [], shapes, "Projekt načten z JSON.");
    if (parsed.gridMm) setGridMm(parsed.gridMm);
    setSelectedId(null);
    evt.target.value = "";
  }

  return { exportSvg, exportJson, exportDxf, exportPng, exportPdf, importJson };
}
