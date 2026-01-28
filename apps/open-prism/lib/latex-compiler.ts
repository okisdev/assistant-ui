export async function compileLatex(latex: string): Promise<Uint8Array> {
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

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
