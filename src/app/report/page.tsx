'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInterview } from '@/context/InterviewContext';
import Link from 'next/link';

export default function ReportPage() {
  const router = useRouter();
  const { state, dispatch } = useInterview();
  const { setup, questions, answers } = state;

  useEffect(() => {
    if (!setup || answers.length === 0) {
      router.push('/setup');
    }
  }, [setup, answers, router]);

  if (!setup || answers.length === 0) return null;

  const isZh = setup.language === 'zh';
  const scoredAnswers = answers.filter(a => a.score > 0);
  const avgScore = scoredAnswers.length
    ? (scoredAnswers.reduce((sum, a) => sum + a.score, 0) / scoredAnswers.length).toFixed(1)
    : '0';

  const categoryScores: Record<string, number[]> = {};
  answers.forEach(a => {
    const q = questions.find(q => q.id === a.questionId);
    if (q && a.score > 0) {
      if (!categoryScores[q.category]) categoryScores[q.category] = [];
      categoryScores[q.category].push(a.score);
    }
  });

  const categoryLabel: Record<string, string> = {
    behavioral: isZh ? '行为面试' : 'Behavioral',
    technical: isZh ? '技术面试' : 'Technical',
    situational: isZh ? '情景面试' : 'Situational',
    'company-specific': isZh ? '公司相关' : 'Company-Specific',
  };

  const scoreColor = (score: number) =>
    score >= 8 ? 'text-success' : score >= 5 ? 'text-warning' : 'text-danger';

  const scoreBg = (score: number) =>
    score >= 8 ? 'bg-success' : score >= 5 ? 'bg-warning' : 'bg-danger';

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border px-6 py-4 bg-card">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">MockView</Link>
          <Link
            href="/setup"
            onClick={() => dispatch({ type: 'RESET' })}
            className="text-sm text-primary hover:underline"
          >
            {isZh ? '重新开始' : 'Start Over'}
          </Link>
        </div>
      </header>

      <div className="flex-1 px-6 py-10">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Summary Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">{isZh ? '面试报告' : 'Interview Report'}</h1>
            <p className="text-muted">
              {setup.companyName} · {questions.length} {isZh ? '道题目' : 'questions'}
            </p>

            {/* Overall Score */}
            <div className="inline-flex flex-col items-center">
              <div className={`w-28 h-28 rounded-full flex items-center justify-center text-white text-3xl font-bold ${
                Number(avgScore) >= 8 ? 'bg-success' : Number(avgScore) >= 5 ? 'bg-warning' : 'bg-danger'
              }`}>
                {avgScore}
              </div>
              <p className="text-sm text-muted mt-2">{isZh ? '综合评分' : 'Overall Score'}</p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(categoryScores).map(([cat, scores]) => {
              const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
              return (
                <div key={cat} className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-xs text-muted mb-1">{categoryLabel[cat] || cat}</p>
                  <p className={`text-2xl font-bold ${scoreColor(avg)}`}>{avg.toFixed(1)}</p>
                </div>
              );
            })}
          </div>

          {/* Per-Question Details */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">{isZh ? '逐题详情' : 'Question Details'}</h2>

            {questions.map((q, i) => {
              const answer = answers.find(a => a.questionId === q.id);
              if (!answer) return null;
              return (
                <div key={q.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  {/* Question Header */}
                  <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                          {categoryLabel[q.category] || q.category}
                        </span>
                        <span className="text-xs text-muted">Q{i + 1}</span>
                      </div>
                      <p className="font-medium">{q.question}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${scoreBg(answer.score)}`}>
                      {answer.score}
                    </div>
                  </div>

                  <div className="px-6 py-4 space-y-4">
                    {/* User Answer */}
                    {answer.userAnswer && (
                      <div>
                        <p className="text-xs font-semibold text-muted mb-1">{isZh ? '你的回答' : 'Your Answer'}</p>
                        <p className="text-sm leading-relaxed bg-card-hover rounded-lg p-3">{answer.userAnswer}</p>
                      </div>
                    )}

                    {/* Feedback */}
                    <div>
                      <p className="text-xs font-semibold text-muted mb-1">{isZh ? '反馈' : 'Feedback'}</p>
                      <p className="text-sm leading-relaxed">{answer.detailedFeedback}</p>
                    </div>

                    {/* Strengths & Improvements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {answer.strengths.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-success mb-1">{isZh ? '✅ 亮点' : '✅ Strengths'}</p>
                          <ul className="space-y-1">
                            {answer.strengths.map((s, j) => (
                              <li key={j} className="text-sm text-muted">• {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {answer.improvements.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-warning mb-1">{isZh ? '💡 改进' : '💡 Improve'}</p>
                          <ul className="space-y-1">
                            {answer.improvements.map((s, j) => (
                              <li key={j} className="text-sm text-muted">• {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Sample Answer */}
                    {answer.sampleAnswer && (
                      <div className="bg-primary-light/50 border border-primary/20 rounded-lg p-4">
                        <p className="text-xs font-semibold text-primary mb-1">{isZh ? '⭐ 优秀答案示例' : '⭐ Sample Answer'}</p>
                        <p className="text-sm leading-relaxed">{answer.sampleAnswer}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Restart */}
          <div className="text-center pb-10">
            <Link
              href="/setup"
              onClick={() => dispatch({ type: 'RESET' })}
              className="inline-block px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
            >
              {isZh ? '再来一次模拟面试' : 'Start Another Mock Interview'}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
