'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useInterview } from '@/context/InterviewContext';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useTimer } from '@/hooks/useTimer';
import { AnswerEvaluation } from '@/lib/types';

export default function InterviewPage() {
  const router = useRouter();
  const { state, dispatch } = useInterview();
  const { setup, questions, currentQuestionIndex, answers } = state;

  const lang = setup?.language === 'en' ? 'en-US' : 'zh-CN';
  const { transcript, interimTranscript, isListening, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition(lang);
  const { speak, stop: stopSpeaking } = useSpeechSynthesis();
  const currentQuestion = questions[currentQuestionIndex];
  const { timeLeft, isExpired, start: startTimer, reset: resetTimer } = useTimer(currentQuestion?.timeLimit || 120);

  const [phase, setPhase] = useState<'asking' | 'answering' | 'evaluating' | 'feedback'>('asking');
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [textFallback, setTextFallback] = useState('');

  // Redirect if no questions loaded
  useEffect(() => {
    if (!questions.length || !setup) {
      router.push('/setup');
    }
  }, [questions, setup, router]);

  // Read question aloud when entering asking phase
  useEffect(() => {
    if (phase === 'asking' && currentQuestion) {
      speak(currentQuestion.question, lang);
      const timeout = setTimeout(() => {
        setPhase('answering');
        startTimer();
      }, 2000);
      return () => { clearTimeout(timeout); stopSpeaking(); };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQuestionIndex]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (isExpired && phase === 'answering') {
      handleSubmitAnswer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpired]);

  const handleSubmitAnswer = useCallback(async () => {
    if (phase !== 'answering') return;
    stopListening();
    setPhase('evaluating');
    setIsEvaluating(true);

    const userAnswer = (transcript + ' ' + textFallback).trim();
    if (!userAnswer) {
      setEvaluation({
        questionId: currentQuestion.id,
        userAnswer: '',
        score: 0,
        strengths: [],
        improvements: [setup?.language === 'zh' ? '未检测到回答内容' : 'No answer detected'],
        sampleAnswer: '',
        detailedFeedback: setup?.language === 'zh' ? '请确保麦克风权限已开启，并尝试大声回答。' : 'Please ensure microphone permission is enabled and try speaking louder.',
      });
      setPhase('feedback');
      setIsEvaluating(false);
      return;
    }

    try {
      const res = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          intent: currentQuestion.intent,
          userAnswer,
          setup,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const evalResult: AnswerEvaluation = {
        questionId: currentQuestion.id,
        userAnswer,
        score: data.score,
        strengths: data.strengths,
        improvements: data.improvements,
        sampleAnswer: data.sampleAnswer,
        detailedFeedback: data.detailedFeedback,
      };
      setEvaluation(evalResult);
      dispatch({ type: 'ADD_ANSWER', payload: evalResult });
    } catch {
      setEvaluation({
        questionId: currentQuestion.id,
        userAnswer,
        score: 0,
        strengths: [],
        improvements: ['评估失败，请继续下一题'],
        sampleAnswer: '',
        detailedFeedback: '评估请求失败，但你的回答已记录。',
      });
    }
    setPhase('feedback');
    setIsEvaluating(false);
  }, [phase, transcript, textFallback, currentQuestion, setup, dispatch, stopListening]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch({ type: 'NEXT_QUESTION' });
      resetTranscript();
      setTextFallback('');
      setEvaluation(null);
      resetTimer(questions[currentQuestionIndex + 1]?.timeLimit || 120);
      setPhase('asking');
    } else {
      dispatch({ type: 'SET_STATUS', payload: 'complete' });
      router.push('/report');
    }
  };

  if (!currentQuestion || !setup) return null;

  const isZh = setup.language === 'zh';
  const progress = currentQuestionIndex + 1;
  const total = questions.length;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLowTime = timeLeft < 30;

  const categoryLabel: Record<string, string> = {
    behavioral: isZh ? '行为面试' : 'Behavioral',
    technical: isZh ? '技术面试' : 'Technical',
    situational: isZh ? '情景面试' : 'Situational',
    'company-specific': isZh ? '公司相关' : 'Company-Specific',
  };

  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-primary">MockView</span>
          <div className="flex items-center gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-1.5 rounded-full transition-colors ${
                  i < progress ? 'bg-primary' : i === currentQuestionIndex ? 'bg-primary/50' : 'bg-border'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted">{progress} / {total}</span>
        </div>

        <div className={`flex items-center gap-2 font-mono text-lg font-bold ${isLowTime ? 'text-danger animate-pulse' : 'text-foreground'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </header>

      {/* Main Interview Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-4xl mx-auto w-full">
        {/* Interviewer Avatar */}
        <div className="mb-8">
          <div className={`w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center ${phase === 'asking' ? 'ring-4 ring-primary/30 animate-pulse' : ''}`}>
            <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
        </div>

        {/* Category Badge */}
        <div className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent mb-4">
          {categoryLabel[currentQuestion.category] || currentQuestion.category}
        </div>

        {/* Question */}
        <div className="text-center mb-10 max-w-2xl">
          <h2 className="text-xl md:text-2xl font-semibold leading-relaxed">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Answering Phase */}
        {(phase === 'answering') && (
          <div className="w-full max-w-2xl space-y-6">
            {/* Voice Recorder */}
            <div className="flex flex-col items-center gap-4">
              {isSupported ? (
                <>
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                      isListening
                        ? 'bg-danger text-white shadow-lg shadow-danger/30'
                        : 'bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-hover'
                    }`}
                  >
                    {isListening && <span className="absolute inset-0 rounded-full bg-danger/30 animate-pulse-ring" />}
                    <svg className="w-8 h-8 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                      {isListening ? (
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      ) : (
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                      )}
                    </svg>
                  </button>
                  <p className="text-sm text-muted">
                    {isListening
                      ? (isZh ? '正在录音... 点击停止' : 'Recording... Click to stop')
                      : (isZh ? '点击开始语音回答' : 'Click to start speaking')}
                  </p>

                  {/* Waveform animation */}
                  {isListening && (
                    <div className="flex items-center gap-1 h-8">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-primary rounded-full waveform-bar"
                          style={{ animationDelay: `${i * 0.1}s`, height: '4px' }}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-warning">
                  {isZh ? '当前浏览器不支持语音识别，请使用文字输入' : 'Speech recognition not supported. Please use text input.'}
                </p>
              )}
            </div>

            {/* Live Transcript */}
            <div className="bg-card border border-border rounded-xl p-4 min-h-[120px]">
              <p className="text-xs text-muted mb-2">{isZh ? '实时转录:' : 'Live transcript:'}</p>
              <p className="text-sm leading-relaxed">
                {transcript}
                {interimTranscript && <span className="text-muted">{interimTranscript}</span>}
                {!transcript && !interimTranscript && (
                  <span className="text-muted italic">{isZh ? '等待你的回答...' : 'Waiting for your answer...'}</span>
                )}
              </p>
            </div>

            {/* Text fallback */}
            {!isSupported && (
              <textarea
                value={textFallback}
                onChange={e => setTextFallback(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card"
                placeholder={isZh ? '在这里输入你的回答...' : 'Type your answer here...'}
              />
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleNextQuestion}
                className="px-6 py-3 text-sm text-muted border border-border rounded-xl hover:bg-card-hover transition-colors"
              >
                {isZh ? '跳过此题' : 'Skip'}
              </button>
              <button
                onClick={handleSubmitAnswer}
                className="px-8 py-3 text-sm bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-medium shadow-md shadow-primary/20"
              >
                {isZh ? '提交回答' : 'Submit Answer'}
              </button>
            </div>
          </div>
        )}

        {/* Asking Phase */}
        {phase === 'asking' && (
          <div className="flex items-center gap-2 text-muted">
            <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
            <span className="text-sm">{isZh ? '面试官正在提问...' : 'Interviewer is asking...'}</span>
          </div>
        )}

        {/* Evaluating Phase */}
        {phase === 'evaluating' && isEvaluating && (
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-muted">{isZh ? 'AI 正在评估你的回答...' : 'AI is evaluating your answer...'}</p>
          </div>
        )}

        {/* Feedback Phase */}
        {phase === 'feedback' && evaluation && (
          <div className="w-full max-w-2xl space-y-6 animate-[fadeIn_0.3s_ease-out]">
            {/* Score */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold text-white ${
                evaluation.score >= 8 ? 'bg-success' : evaluation.score >= 5 ? 'bg-warning' : 'bg-danger'
              }`}>
                {evaluation.score}/10
              </div>
            </div>

            {/* Your Answer */}
            {evaluation.userAnswer && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-2 text-muted">{isZh ? '你的回答' : 'Your Answer'}</h3>
                <p className="text-sm leading-relaxed">{evaluation.userAnswer}</p>
              </div>
            )}

            {/* Feedback */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-muted">{isZh ? '评估反馈' : 'Feedback'}</h3>
              <p className="text-sm leading-relaxed">{evaluation.detailedFeedback}</p>

              {evaluation.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-success mb-1">{isZh ? '✅ 做得好' : '✅ Strengths'}</p>
                  <ul className="space-y-1">
                    {evaluation.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-muted flex gap-2">
                        <span className="text-success">•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.improvements.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-warning mb-1">{isZh ? '💡 改进建议' : '💡 Improvements'}</p>
                  <ul className="space-y-1">
                    {evaluation.improvements.map((s, i) => (
                      <li key={i} className="text-sm text-muted flex gap-2">
                        <span className="text-warning">•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sample Answer */}
            {evaluation.sampleAnswer && (
              <div className="bg-primary-light/50 border border-primary/20 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-primary mb-2">{isZh ? '⭐ 优秀答案示例' : '⭐ Sample Excellent Answer'}</h3>
                <p className="text-sm leading-relaxed">{evaluation.sampleAnswer}</p>
              </div>
            )}

            {/* Next */}
            <button
              onClick={handleNextQuestion}
              className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-md shadow-primary/20"
            >
              {currentQuestionIndex < questions.length - 1
                ? (isZh ? `下一题 (${progress + 1}/${total})` : `Next Question (${progress + 1}/${total})`)
                : (isZh ? '查看面试报告' : 'View Interview Report')}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
