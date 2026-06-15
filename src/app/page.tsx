'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-light text-primary rounded-full text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            AI 驱动的智能面试模拟
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-primary">MockView</span>
            <br />
            <span className="text-3xl md:text-5xl font-medium text-muted">你的 AI 面试教练</span>
          </h1>

          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-12 leading-relaxed">
            上传简历，输入目标公司和岗位描述，AI 将根据你的背景生成最可能的面试题目。
            全程语音作答，模拟真实面试体验，每题实时反馈 + 优秀答案示例。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/setup"
              className="px-8 py-4 bg-primary text-white text-lg font-semibold rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              开始模拟面试
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            <FeatureCard
              icon="🎯"
              title="智能出题"
              description="基于简历、公司和JD，生成最可能被问到的面试题"
            />
            <FeatureCard
              icon="🎙️"
              title="语音作答"
              description="用语音回答问题，模拟真实面试场景，不是打字"
            />
            <FeatureCard
              icon="📊"
              title="实时反馈"
              description="每题结束后给出评分、改进建议和优秀答案示例"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 text-left hover:shadow-md transition-shadow">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted text-sm leading-relaxed">{description}</p>
    </div>
  );
}
