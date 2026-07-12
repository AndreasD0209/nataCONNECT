export type NotebookAICapability = 'summary' | 'assist' | 'explain';

export type NotebookAIContext = {
  question: string;
  mode: NotebookAICapability;
  hardware: 'AMD Instinct GPU' | 'AMD AI PC' | 'AMD Developer Cloud';
};

export async function enableNotebookAIAssist(context: NotebookAIContext): Promise<{ status: string; note: string }> {
  return {
    status: 'enabled',
    note: `Notebook AI is staged for ${context.hardware} and ready to summarize the request using the NataConnect Guide context.`,
  };
}

export async function collectNotebookAISnapshot(question: string): Promise<string> {
  return `Notebook AI snapshot recorded for: ${question}`;
}
