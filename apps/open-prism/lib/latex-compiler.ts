export async function compileLatex(latex: string): Promise<string> {
  const response = await fetch("/api/compile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ latex }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Compilation failed");
  }

  // Get the PDF blob and create an object URL
  const pdfBlob = await response.blob();
  const pdfUrl = URL.createObjectURL(pdfBlob);

  return pdfUrl;
}
