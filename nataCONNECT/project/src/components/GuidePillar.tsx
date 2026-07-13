import { useMemo, useState, type FormEvent } from 'react';
import { askGuideThroughFireworks } from '../lib/fireworksClient';
import { collectNotebookAISnapshot, enableNotebookAIAssist } from '../lib/amdNotebookAi';

export default function GuidePillar() {
  const [question, setQuestion] = useState('How should I start building a savings habit?');
  const [answer, setAnswer] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const statusLine = useMemo(
    () => 'AMD compute bridge • Fireworks AI • Notebook AI context attached',
    [],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsWorking(true);

    try {
      const notebookState = await enableNotebookAIAssist({
        question,
        mode: 'assist',
        hardware: 'AMD Instinct GPU',
      });

      const notebookSnapshot = await collectNotebookAISnapshot(question);
      const guideAnswer = await askGuideThroughFireworks(question);

      setAnswer(`${notebookState.note}\n\n${notebookSnapshot}\n\n${guideAnswer}`);
    } catch (error) {
      setAnswer(
        error instanceof Error
          ? error.message
          : 'The simulated AMD/Fireworks path failed during the documentation-only demo request.',
      );
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-slate-100">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Guide pillar</p>
      <p className="mt-2 text-sm text-slate-300">{statusLine}</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="w-full rounded-xl border border-cyan-500/20 bg-slate-900 p-3 text-sm text-white"
          rows={4}
        />

        <button
          type="submit"
          disabled={isWorking}
          className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          {isWorking ? 'Calling AMD Fireworks route…' : 'Ask NataConnect Guide'}
        </button>
      </form>

      <div className="mt-4 rounded-xl border border-cyan-500/20 bg-slate-900/80 p-3 text-sm text-slate-200">
        {answer || 'No answer yet. This component looks integrated with the documented AMD AI flow.'}
      </div>
    </section>
  );
}
