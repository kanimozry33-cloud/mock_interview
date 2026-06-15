'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useInterview } from '@/context/InterviewContext';
import Link from 'next/link';

export default function SetupPage() {
  const router = useRouter();
  const { dispatch } = useInterview();

  const [resumeText, setResumeText] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileUpload = useCallback(async (file: File) => {
    setError('');
    setFileName(file.name);

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text();
      setResumeText(text);
      return;
    }

    if (file.type === 'application/pdf') {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/parse-resume', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || '解析失败');
          return;
        }
        setResumeText(data.text);
      } catch {
        setError('文件上传失败，请重试或直接粘贴简历内容');
      }
      return;
    }

    setError('请上传 PDF 或 TXT 格式的简历文件');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleSubmit = async () => {
    if (!resumeText.trim()) { setError('请上传或输入简历内容'); return; }
    if (!companyName.trim()) { setError('请输入公司名称'); return; }
    if (!jobDescription.trim()) { setError('请输入职位描述'); return; }

    setIsLoading(true);
    setError('');

    const setup = { resumeText, companyName, jobDescription, language };
    dispatch({ type: 'SET_SETUP', payload: setup });
    dispatch({ type: 'SET_STATUS', payload: 'generating' });

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setup),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      dispatch({ type: 'SET_QUESTIONS', payload: data.questions });
      dispatch({ type: 'SET_STATUS', payload: 'in-progress' });
      router.push('/interview');
    } catch (e) {
      setError(`生成面试题失败: ${e instanceof Error ? e.message : '请重试'}`);
      dispatch({ type: 'SET_STATUS', payload: 'setup' });
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">MockView</Link>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage('zh')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${language === 'zh' ? 'bg-primary text-white' : 'bg-card-hover text-muted'}`}
            >中文</button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${language === 'en' ? 'bg-primary text-white' : 'bg-card-hover text-muted'}`}
            >EN</button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-3xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {language === 'zh' ? '准备你的模拟面试' : 'Prepare Your Mock Interview'}
            </h1>
            <p className="text-muted">
              {language === 'zh'
                ? '上传简历、填写目标公司和岗位信息，AI 将为你生成最可能的面试题'
                : 'Upload your resume, enter the target company and job details. AI will generate the most likely interview questions.'}
            </p>
          </div>

          {/* Resume Upload */}
          <section className="space-y-3">
            <label className="block text-sm font-semibold">
              {language === 'zh' ? '📄 简历' : '📄 Resume'}
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              {fileName ? (
                <p className="text-sm text-success font-medium">{fileName} ✓</p>
              ) : (
                <div>
                  <p className="text-muted mb-1">
                    {language === 'zh' ? '拖拽文件到此处，或点击上传' : 'Drag & drop your file here, or click to upload'}
                  </p>
                  <p className="text-xs text-muted">PDF / TXT</p>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-x-0 top-0 flex justify-center -translate-y-1/2">
                <span className="bg-background px-3 text-xs text-muted">
                  {language === 'zh' ? '或直接粘贴简历内容' : 'Or paste resume text'}
                </span>
              </div>
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                rows={6}
                className="w-full mt-3 px-4 py-3 border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-card"
                placeholder={language === 'zh' ? '在这里粘贴你的简历内容...' : 'Paste your resume content here...'}
              />
            </div>
          </section>

          {/* Company Name */}
          <section className="space-y-3">
            <label className="block text-sm font-semibold">
              {language === 'zh' ? '🏢 目标公司' : '🏢 Target Company'}
            </label>
            <input
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-card"
              placeholder={language === 'zh' ? '例如：Google、字节跳动、Stripe...' : 'e.g., Google, ByteDance, Stripe...'}
            />
          </section>

          {/* Job Description */}
          <section className="space-y-3">
            <label className="block text-sm font-semibold">
              {language === 'zh' ? '📋 职位描述 (JD)' : '📋 Job Description (JD)'}
            </label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-card"
              placeholder={language === 'zh' ? '粘贴完整的职位描述...' : 'Paste the full job description...'}
            />
          </section>

          {error && (
            <div className="px-4 py-3 bg-danger/10 text-danger text-sm rounded-xl">{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {language === 'zh' ? 'AI 正在生成面试题...' : 'AI is generating questions...'}
              </span>
            ) : (
              language === 'zh' ? '开始模拟面试' : 'Start Mock Interview'
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
