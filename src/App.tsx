/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  RotateCcw, 
  Copy, 
  ExternalLink, 
  Award, 
  BookOpen, 
  Sparkles,
  ChevronRight,
  Check,
  Film
} from 'lucide-react';
import { 
  QUESTIONS_DATA, 
  TYNAME, 
  Question, 
  QuestionType, 
  Section, 
  MatchQuestion, 
  OrderQuestion, 
  MultiQuestion, 
  McQuestion, 
  OxQuestion 
} from './data/questions';

// Hash algorithm identical to benchmark
function hash(s: string): string {
  let h = 5381;
  for (const c of s) {
    h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
  }
  return h.toString(16).padStart(8, '0').slice(-4);
}

function codeFor(name: string, t: number, score: number): string {
  const grade = 'ABCDEFGHIJK'[10 - score] || 'K';
  return `${t}${grade}-${hash(`${name.trim()}|${t}|${score}|voice-day5`)}`;
}

function stripHtml(h: string): string {
  return h.replace(/<[^>]*>/g, '');
}

function eqArr<T>(x: T[], y: T[]): boolean {
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

type AnswerState = (number | boolean | number[] | (number | null)[] | null)[][];

export default function App() {
  const [tab, setTab] = useState<number>(0);
  const [name, setName] = useState<string>('');
  const [graded, setGraded] = useState<boolean[]>([false, false, false, false]);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showAnimationModal, setShowAnimationModal] = useState<boolean>(false);

  // Initialize answers matrix
  const [ans, setAns] = useState<AnswerState>(() => {
    return QUESTIONS_DATA.map(s =>
      s.qs.map(q => {
        if (q.ty === 'multi') return [] as number[];
        if (q.ty === 'match') return q.left.map(() => null as number | null);
        if (q.ty === 'order') return [] as number[];
        return null;
      })
    );
  });

  const activeSection = QUESTIONS_DATA[tab];
  const isCurrentGraded = graded[tab];

  // Helper validation
  const isAnswered = (q: Question, a: any): boolean => {
    if (a === null || a === undefined) return false;
    if (q.ty === 'mc' || q.ty === 'ox') return a !== null;
    if (q.ty === 'multi') return Array.isArray(a) && a.length > 0;
    if (q.ty === 'match') return Array.isArray(a) && a.every(x => x !== null);
    if (q.ty === 'order') return Array.isArray(a) && a.length === q.steps.length;
    return false;
  };

  const isCorrect = (q: Question, a: any): boolean => {
    if (!isAnswered(q, a)) return false;
    if (q.ty === 'multi') {
      const sortedA = [...(a as number[])].sort((x, y) => x - y);
      return eqArr(sortedA, q.a);
    }
    if (q.ty === 'match' || q.ty === 'order') {
      return eqArr(a as number[], q.a);
    }
    return a === q.a;
  };

  const scoreOf = (secIndex: number): number => {
    return ans[secIndex].filter((a, k) => isCorrect(QUESTIONS_DATA[secIndex].qs[k], a)).length;
  };

  const nAns = (secIndex: number): number => {
    return ans[secIndex].filter((a, k) => isAnswered(QUESTIONS_DATA[secIndex].qs[k], a)).length;
  };

  const formatAnswerText = (q: Question, a: any): string => {
    if (!isAnswered(q, a)) return '미응답';
    if (q.ty === 'mc') {
      return '①②③④'[a as number] + ' ' + stripHtml(q.o[a as number]);
    }
    if (q.ty === 'ox') {
      return a ? 'O' : 'X';
    }
    if (q.ty === 'multi') {
      return [...(a as number[])]
        .sort((x, y) => x - y)
        .map(j => 'ABCDEFGH'[j])
        .join(', ');
    }
    if (q.ty === 'match') {
      return (a as number[])
        .map((r, i) => `${i + 1}-${'ABCDEFGH'[r]}`)
        .join(' · ');
    }
    if (q.ty === 'order') {
      return (a as number[]).map(j => 'ABCDEFGH'[j]).join(' → ');
    }
    return '';
  };

  // Option selection handlers
  const handleSelectMc = (qIndex: number, optIndex: number) => {
    if (isCurrentGraded) return;
    setAns(prev => {
      const next = prev.map(sec => [...sec]);
      next[tab][qIndex] = next[tab][qIndex] === optIndex ? null : optIndex;
      return next;
    });
  };

  const handleSelectOx = (qIndex: number, val: boolean) => {
    if (isCurrentGraded) return;
    setAns(prev => {
      const next = prev.map(sec => [...sec]);
      next[tab][qIndex] = next[tab][qIndex] === val ? null : val;
      return next;
    });
  };

  const handleToggleMulti = (qIndex: number, optIndex: number) => {
    if (isCurrentGraded) return;
    setAns(prev => {
      const next = prev.map(sec => [...sec]);
      const currentList = [...((next[tab][qIndex] as number[]) || [])];
      const p = currentList.indexOf(optIndex);
      if (p >= 0) {
        currentList.splice(p, 1);
      } else {
        currentList.push(optIndex);
      }
      next[tab][qIndex] = currentList;
      return next;
    });
  };

  const handleMatchSelect = (qIndex: number, leftIndex: number, rightVal: string) => {
    if (isCurrentGraded) return;
    setAns(prev => {
      const next = prev.map(sec => [...sec]);
      const currentArr = [...((next[tab][qIndex] as (number | null)[]) || [])];
      currentArr[leftIndex] = rightVal === '' ? null : Number(rightVal);
      next[tab][qIndex] = currentArr;
      return next;
    });
  };

  const handleOrderStep = (qIndex: number, stepIndex: number) => {
    if (isCurrentGraded) return;
    setAns(prev => {
      const next = prev.map(sec => [...sec]);
      const currentArr = [...((next[tab][qIndex] as number[]) || [])];
      const p = currentArr.indexOf(stepIndex);
      if (p >= 0) {
        // If clicking an already selected step, slice back from there
        currentArr.splice(p);
      } else {
        currentArr.push(stepIndex);
      }
      next[tab][qIndex] = currentArr;
      return next;
    });
  };

  const handleResetOrder = (qIndex: number) => {
    if (isCurrentGraded) return;
    setAns(prev => {
      const next = prev.map(sec => [...sec]);
      next[tab][qIndex] = [];
      return next;
    });
  };

  // Grade action
  const handleGrade = () => {
    const answeredCount = nAns(tab);
    if (answeredCount < 10) {
      const confirmContinue = window.confirm(
        `아직 ${10 - answeredCount}문항을 끝까지 답하지 않았습니다. 그래도 채점할까요? (미응답은 오답 처리)`
      );
      if (!confirmContinue) return;
    }

    setGraded(prev => {
      const next = [...prev];
      next[tab] = true;
      return next;
    });
  };

  const handleResetCurrentSection = () => {
    if (!window.confirm(`${tab + 1}교시 답안을 초기화하고 다시 풀겠습니까?`)) return;
    setGraded(prev => {
      const next = [...prev];
      next[tab] = false;
      return next;
    });
    setAns(prev => {
      const next = prev.map(sec => [...sec]);
      next[tab] = QUESTIONS_DATA[tab].qs.map(q => {
        if (q.ty === 'multi') return [] as number[];
        if (q.ty === 'match') return q.left.map(() => null as number | null);
        if (q.ty === 'order') return [] as number[];
        return null;
      });
      return next;
    });
  };

  // Build Notion / Markdown report
  const buildReport = () => {
    const trimmedName = name.trim() || '(이름 없음)';
    const dateStr = new Date().toLocaleString('ko-KR');

    let html = `<h3>음성 AI Day 5 개념 워크시트 — 오답 정리</h3><div class="meta" style="color:#8a9bb8;font-size:13px;margin-bottom:12px;font-family:monospace">${trimmedName} · ${dateStr}</div>`;
    let text = `음성 AI Day 5 개념 워크시트 — 오답 정리\n이름: ${trimmedName}\n일시: ${dateStr}\n\n`;

    QUESTIONS_DATA.forEach((s, i) => {
      if (!graded[i]) return;
      const wrong = s.qs
        .map((q, k) => ({ q, k, a: ans[i][k] }))
        .filter(x => !isCorrect(x.q, x.a));

      html += `<div style="margin:16px 0 6px;color:#2dd4bf;font-weight:700;font-size:14px">${s.t} — ${scoreOf(i)}/10</div>`;
      text += `### ${s.t} — ${scoreOf(i)}/10\n`;

      if (wrong.length === 0) {
        html += `<div style="color:#4ade80;margin:4px 0 10px;font-weight:500">오답 없음</div>`;
        text += `오답 없음\n\n`;
        return;
      }

      html += `<table border="1" style="width:100%;border-collapse:collapse;font-size:13px;border-color:#1f2b45;margin-bottom:12px;">
        <tr style="background:#111a2e;color:#8a9bb8">
          <th style="padding:6px 8px;text-align:left;border:1px solid #1f2b45">#</th>
          <th style="padding:6px 8px;text-align:left;border:1px solid #1f2b45">유형</th>
          <th style="padding:6px 8px;text-align:left;border:1px solid #1f2b45">문항</th>
          <th style="padding:6px 8px;text-align:left;border:1px solid #1f2b45">내 답</th>
          <th style="padding:6px 8px;text-align:left;border:1px solid #1f2b45">정답</th>
        </tr>`;
      text += `| # | 유형 | 문항 | 내 답 | 정답 |\n|---|---|---|---|---|\n`;

      wrong.forEach(({ q, k, a }) => {
        const my = formatAnswerText(q, a);
        const co = formatAnswerText(q, q.a);
        const qt = stripHtml(q.p).replace(/\s+/g, ' ').slice(0, 60);

        html += `<tr>
          <td style="padding:6px 8px;font-family:monospace;border:1px solid #1f2b45;text-align:center">${k + 1}</td>
          <td style="padding:6px 8px;border:1px solid #1f2b45">${TYNAME[q.ty]}</td>
          <td style="padding:6px 8px;border:1px solid #1f2b45">${qt}</td>
          <td style="padding:6px 8px;border:1px solid #1f2b45;color:#f87171">${my}</td>
          <td style="padding:6px 8px;border:1px solid #1f2b45;color:#4ade80;font-weight:600">${co}</td>
        </tr>`;
        text += `| ${k + 1} | ${TYNAME[q.ty]} | ${qt.replace(/\|/g, '/')} | ${my.replace(/\|/g, '/')} | ${co.replace(/\|/g, '/')} |\n`;
      });

      html += `</table>`;
      text += `\n`;
    });

    const notGraded = QUESTIONS_DATA
      .map((s, i) => (graded[i] ? null : s.k || `${i + 1}교시`))
      .filter(Boolean);

    if (notGraded.length > 0) {
      html += `<div style="color:#8a9bb8;font-size:12px;margin-top:12px">미채점: ${notGraded.join(', ')}</div>`;
      text += `미채점: ${notGraded.join(', ')}\n`;
    }

    return { html, text };
  };

  const handleOpenSubmit = () => {
    if (!graded.some(Boolean)) {
      alert('먼저 채점하기를 눌러 주세요.');
      return;
    }
    setToastMessage('');
    setShowSubmitModal(true);
  };

  const handleCapture = async () => {
    const { html, text } = buildReport();
    const htmlDoc = `<meta charset="utf-8">` + html;

    // 1) Clipboard Item API
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([htmlDoc], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' })
          })
        ]);
        setToastMessage('복사됨 — 노션 페이지에서 Ctrl+V 로 붙여 넣으세요.');
        return;
      }
    } catch {
      // Fallback below
    }

    // 2) Text fallback
    try {
      await navigator.clipboard.writeText(text);
      setToastMessage('텍스트(마크다운 표)로 복사됨 — 노션에서 Ctrl+V.');
    } catch {
      setToastMessage('복사 실패 — 대화상자 내용을 드래그해 Ctrl+C 로 복사하세요.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#dbe4f0] antialiased">
      <div className="max-w-[920px] mx-auto px-4 py-6 md:py-8 sm:px-6">
        
        {/* Header */}
        <header className="mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
            <h1 className="text-2xl md:text-[26px] font-bold text-[#f5b942] tracking-tight flex items-center gap-2">
              <span>음성 AI Day 5 개념 워크시트</span>
            </h1>
            <button
              onClick={() => setShowAnimationModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold bg-[#112433] text-[#2dd4bf] border border-[#1d4e5b] hover:bg-[#16354c] transition-colors"
            >
              <Film className="w-4 h-4" />
              <span>🎬 애니메이션 뷰어</span>
            </button>
          </div>

          <p className="text-[13.5px] leading-relaxed text-[#8a9bb8] mt-2">
            딥러닝 오디오 분류 — Speech Commands · 화자 분할 · Log-Mel 입력 · Dataset/DataLoader · CNN · 출력 크기 · 파라미터 수 · softmax · cross-entropy · 경사 하강법 · 학습 루프 · 혼동 행렬 · SpecAugment · 4교시 × 10문항 (객관식 5 · OX 2 · 선잇기 1 · 순서 맞추기 1 · 모두 고르기 1). 🎬 표시는{' '}
            <button
              onClick={() => setShowAnimationModal(true)}
              className="text-[#2dd4bf] underline hover:text-[#5eead4] font-medium"
            >
              animation.html
            </button>
            의 애니메이션 번호입니다. 선잇기는 드롭다운으로, 순서 맞추기는 단계를 일어나는 순서대로 눌러서, 모두 고르기는 여러 개를 눌러서 답합니다. 답을 고른 뒤 아래 <b className="text-[#2dd4bf]">채점하기</b>를 누르면 정오·해설과 결과 코드가 나타납니다. 채점 전에는 답을 바꿀 수 있고, 채점 후에는 잠깁니다. 모든 교시를 마치면 <b className="text-[#f5b942]">제출</b>로 오답 정리를 열고, <b>캡처</b>로 복사해 노션에 붙여 넣으세요.
          </p>
        </header>

        {/* Name input panel */}
        <div className="bg-[#111a2e] border border-[#1f2b45] rounded-xl p-3.5 mb-3.5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-[#8a9bb8] text-sm flex items-center gap-2 font-medium">
              <span>이름</span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="홍길동"
                className="bg-[#0a0f1c] text-[#dbe4f0] border border-[#1f2b45] rounded-md px-3 py-1.5 font-mono text-sm focus:outline-none focus:border-[#f5b942] transition-colors w-40"
              />
            </label>
            <span className="text-xs text-[#8a9bb8]">
              이름은 결과 코드 계산에만 쓰이며 저장되지 않습니다.
            </span>
          </div>
        </div>

        {/* Tab selection panel */}
        <div className="bg-[#111a2e] border border-[#1f2b45] rounded-xl p-3.5 mb-3.5 shadow-sm">
          <h2 className="text-xs font-semibold text-[#8a9bb8] uppercase tracking-wider mb-2.5">
            교시 선택
          </h2>
          <div className="flex flex-wrap gap-2">
            {QUESTIONS_DATA.map((s, i) => {
              const isActive = i === tab;
              const isSecGraded = graded[i];
              const score = scoreOf(i);
              const answeredNum = nAns(i);

              return (
                <button
                  key={i}
                  onClick={() => {
                    setTab(i);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#3a2e12] border border-[#f5b942] text-[#f5b942] shadow-sm'
                      : 'bg-[#172239] border border-[#2a3a5c] text-[#dbe4f0] hover:border-[#f5b942]'
                  }`}
                >
                  <span>{s.k || `${i + 1}교시`}</span>
                  <span
                    className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                      isSecGraded
                        ? 'bg-[#0d2216] text-[#4ade80] font-semibold'
                        : 'bg-[#0a0f1c] text-[#8a9bb8]'
                    }`}
                  >
                    {isSecGraded ? `${score}/10` : `${answeredNum}/10`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Worksheet Questions Sheet */}
        <div className="bg-[#111a2e] border border-[#1f2b45] rounded-xl p-4 md:p-5 mb-3.5 shadow-md">
          {/* Section Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#1f2b45]">
            <div className="flex items-center gap-2">
              <span className="text-[#f5b942] text-lg font-bold">
                {activeSection.t}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#2dd4bf] bg-[#0c1f28] px-2.5 py-1 rounded border border-[#1a424a]">
              <span>🎬 {activeSection.anim}</span>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {activeSection.qs.map((q, k) => {
              const currentAns = ans[tab][k];
              const ok = isCorrect(q, currentAns);
              const answeredStatus = isAnswered(q, currentAns);
              const unansClass = isCurrentGraded && !answeredStatus ? 'border-[#8c4b1d]' : 'border-[#1f2b45]';

              return (
                <div
                  key={k}
                  className={`bg-[#0e1628] border ${unansClass} rounded-xl p-3.5 md:p-4 transition-all`}
                >
                  {/* Question number and badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#8a9bb8] font-semibold">
                        문항 {k + 1}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          q.ty === 'mc'
                            ? 'bg-[#1b2a4a] text-[#60a5fa]'
                            : q.ty === 'ox'
                            ? 'bg-[#2a2410] text-[#f5b942]'
                            : q.ty === 'match'
                            ? 'bg-[#13302c] text-[#2dd4bf]'
                            : q.ty === 'order'
                            ? 'bg-[#2a1a3a] text-[#c084fc]'
                            : 'bg-[#2a1616] text-[#fca5a5]'
                        }`}
                      >
                        {TYNAME[q.ty]}
                      </span>
                    </div>

                    {isCurrentGraded && (
                      <div className="flex items-center gap-1 text-xs font-medium">
                        {ok ? (
                          <span className="text-[#4ade80] flex items-center gap-1 bg-[#0d2216] px-2 py-0.5 rounded border border-[#164e2e]">
                            <Check className="w-3.5 h-3.5" /> 정답
                          </span>
                        ) : (
                          <span className="text-[#f87171] flex items-center gap-1 bg-[#2a1212] px-2 py-0.5 rounded border border-[#5c1d1d]">
                            <XCircle className="w-3.5 h-3.5" /> {!answeredStatus ? '미응답' : '오답'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Question prompt */}
                  <p className="text-[15px] font-medium leading-relaxed text-[#dbe4f0] mb-3">
                    {q.p}
                  </p>

                  {/* Code snippet if any */}
                  {q.c && (
                    <pre className="font-mono bg-[#0a0f1c] border border-[#1f2b45] border-l-4 border-l-[#60a5fa] rounded-md p-3 my-2 text-xs md:text-sm text-[#dbe4f3] overflow-x-auto">
                      {q.c}
                    </pre>
                  )}

                  {/* Interactive Question Body based on type */}
                  <div className="mt-2.5">
                    {/* Multiple Choice */}
                    {q.ty === 'mc' && (
                      <div className="grid gap-2">
                        {(q as McQuestion).o.map((opt, j) => {
                          const isSelected = currentAns === j;
                          let btnStyle = 'bg-[#172239] border-[#2a3a5c] text-[#dbe4f0] hover:border-[#f5b942]';

                          if (isCurrentGraded) {
                            if (j === q.a) {
                              btnStyle = 'bg-[#0d2216] border-[#4ade80] text-[#4ade80] font-semibold';
                            } else if (isSelected) {
                              btnStyle = 'bg-[#2a1212] border-[#f87171] text-[#f87171] line-through';
                            } else {
                              btnStyle = 'bg-[#121929] border-[#1f2b45] text-[#6b7b95] opacity-75';
                            }
                          } else if (isSelected) {
                            btnStyle = 'bg-[#1f1a0c] border-[#f5b942] text-[#f5b942] font-semibold ring-1 ring-[#f5b942]';
                          }

                          return (
                            <button
                              key={j}
                              disabled={isCurrentGraded}
                              onClick={() => handleSelectMc(k, j)}
                              className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-sm transition-all flex items-start gap-2.5 ${btnStyle} ${
                                isCurrentGraded ? 'cursor-default' : 'cursor-pointer'
                              }`}
                            >
                              <span className="font-mono text-xs opacity-80 mt-0.5">
                                {'①②③④'[j]}
                              </span>
                              <span className="flex-1">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* OX Question */}
                    {q.ty === 'ox' && (
                      <div className="grid grid-cols-2 gap-3 max-w-[360px]">
                        {[true, false].map((val, idx) => {
                          const isSelected = currentAns === val;
                          let btnStyle = 'bg-[#172239] border-[#2a3a5c] text-[#dbe4f0] hover:border-[#f5b942]';

                          if (isCurrentGraded) {
                            if (val === q.a) {
                              btnStyle = 'bg-[#0d2216] border-[#4ade80] text-[#4ade80] font-bold';
                            } else if (isSelected) {
                              btnStyle = 'bg-[#2a1212] border-[#f87171] text-[#f87171]';
                            } else {
                              btnStyle = 'bg-[#121929] border-[#1f2b45] text-[#6b7b95] opacity-75';
                            }
                          } else if (isSelected) {
                            btnStyle = 'bg-[#1f1a0c] border-[#f5b942] text-[#f5b942] font-bold ring-1 ring-[#f5b942]';
                          }

                          return (
                            <button
                              key={idx}
                              disabled={isCurrentGraded}
                              onClick={() => handleSelectOx(k, val)}
                              className={`py-3 text-center text-2xl font-bold rounded-lg border transition-all ${btnStyle} ${
                                isCurrentGraded ? 'cursor-default' : 'cursor-pointer'
                              }`}
                            >
                              {val ? 'O' : 'X'}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Multi Choice (Select all that apply) */}
                    {q.ty === 'multi' && (
                      <div className="grid gap-2">
                        {(q as MultiQuestion).o.map((opt, j) => {
                          const list = (currentAns as number[]) || [];
                          const isSelected = list.includes(j);
                          const isRight = (q as MultiQuestion).a.includes(j);

                          let btnStyle = 'bg-[#172239] border-[#2a3a5c] text-[#dbe4f0] hover:border-[#f5b942]';
                          let prefixIcon = '☐ ';

                          if (isCurrentGraded) {
                            if (isSelected && isRight) {
                              btnStyle = 'bg-[#0d2216] border-[#4ade80] text-[#4ade80] font-medium';
                              prefixIcon = '☑ ';
                            } else if (isSelected && !isRight) {
                              btnStyle = 'bg-[#2a1212] border-[#f87171] text-[#f87171]';
                              prefixIcon = '☒ ';
                            } else if (!isSelected && isRight) {
                              btnStyle = 'bg-[#0e241b] border-[#4ade80] border-dashed text-[#4ade80]';
                              prefixIcon = '☐ ';
                            } else {
                              btnStyle = 'bg-[#121929] border-[#1f2b45] text-[#6b7b95] opacity-75';
                            }
                          } else if (isSelected) {
                            btnStyle = 'bg-[#1f1a0c] border-[#f5b942] text-[#f5b942] font-medium ring-1 ring-[#f5b942]';
                            prefixIcon = '☑ ';
                          }

                          return (
                            <button
                              key={j}
                              disabled={isCurrentGraded}
                              onClick={() => handleToggleMulti(k, j)}
                              className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-sm transition-all flex items-start gap-2.5 ${btnStyle} ${
                                isCurrentGraded ? 'cursor-default' : 'cursor-pointer'
                              }`}
                            >
                              <span className="font-mono text-sm">{prefixIcon}</span>
                              <span className="font-mono text-xs opacity-75 mt-0.5">
                                {'ABCDEFGH'[j]}.
                              </span>
                              <span className="flex-1">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Match pairs */}
                    {q.ty === 'match' && (
                      <div>
                        {/* Reference bank */}
                        <div className="grid gap-1.5 mb-3 p-3 border border-dashed border-[#1f2b45] rounded-lg bg-[#0a0f1c] text-xs md:text-sm">
                          <div className="text-[11px] font-semibold text-[#8a9bb8] mb-1">
                            [선택지 목록]
                          </div>
                          {(q as MatchQuestion).right.map((r, j) => (
                            <div key={j} className="flex items-start gap-2">
                              <b className="font-mono text-[#2dd4bf] min-w-[20px]">
                                {'ABCDEFGH'[j]}.
                              </b>
                              <span className="text-[#dbe4f0]">{r}</span>
                            </div>
                          ))}
                        </div>

                        {/* Left items mapping */}
                        <div className="space-y-2">
                          {(q as MatchQuestion).left.map((l, i) => {
                            const selectedRight = (currentAns as (number | null)[])?.[i];
                            const correctRight = (q as MatchQuestion).a[i];
                            const isMatchOk = isCurrentGraded && selectedRight === correctRight;
                            const isMatchBad = isCurrentGraded && selectedRight !== correctRight;

                            let selectClass = 'bg-[#0a0f1c] border-[#2a3a5c] text-[#dbe4f0]';
                            if (isMatchOk) selectClass = 'bg-[#0d2216] border-[#4ade80] text-[#4ade80] font-semibold';
                            if (isMatchBad) selectClass = 'bg-[#2a1212] border-[#f87171] text-[#f87171]';

                            return (
                              <div
                                key={i}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 items-center py-2 border-t border-[#1f2b45] first:border-t-0"
                              >
                                <div className="text-sm">
                                  <b className="font-mono text-[#8a9bb8] mr-2">{i + 1}.</b>
                                  <span>{l}</span>
                                </div>
                                <div>
                                  <select
                                    disabled={isCurrentGraded}
                                    value={selectedRight === null || selectedRight === undefined ? '' : selectedRight}
                                    onChange={e => handleMatchSelect(k, i, e.target.value)}
                                    className={`w-full rounded-md px-3 py-2 text-sm border focus:outline-none focus:border-[#f5b942] transition-colors ${selectClass}`}
                                  >
                                    <option value="">— 고르기 —</option>
                                    {(q as MatchQuestion).right.map((r, j) => (
                                      <option key={j} value={j}>
                                        {'ABCDEFGH'[j]}. {stripHtml(r)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Step ordering */}
                    {q.ty === 'order' && (
                      <div>
                        <div className="grid gap-2">
                          {(q as OrderQuestion).steps.map((step, j) => {
                            const orderList = (currentAns as number[]) || [];
                            const pos = orderList.indexOf(j);
                            const isChosen = pos >= 0;

                            let btnStyle = 'bg-[#172239] border-[#2a3a5c] text-[#dbe4f0] hover:border-[#f5b942]';
                            let badgeStyle = 'border-[#2a3a5c] text-[#8a9bb8] bg-[#0a0f1c]';

                            if (isCurrentGraded) {
                              const isStepPosCorrect = isChosen && pos < (q as OrderQuestion).a.length && (q as OrderQuestion).a[pos] === j;
                              if (isStepPosCorrect) {
                                btnStyle = 'bg-[#0d2216] border-[#4ade80] text-[#4ade80]';
                                badgeStyle = 'bg-[#4ade80] text-[#0b1220] border-[#4ade80] font-bold';
                              } else {
                                btnStyle = 'bg-[#2a1212] border-[#f87171] text-[#f87171]';
                                badgeStyle = 'bg-[#f87171] text-[#0b1220] border-[#f87171] font-bold';
                              }
                            } else if (isChosen) {
                              btnStyle = 'bg-[#21162d] border-[#c084fc] text-[#e9d5ff] ring-1 ring-[#c084fc]';
                              badgeStyle = 'bg-[#c084fc] text-[#0b1220] border-[#c084fc] font-bold';
                            }

                            return (
                              <button
                                key={j}
                                disabled={isCurrentGraded}
                                onClick={() => handleOrderStep(k, j)}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm transition-all text-left ${btnStyle} ${
                                  isCurrentGraded ? 'cursor-default' : 'cursor-pointer'
                                }`}
                              >
                                <span className={`flex-none w-6 h-6 rounded-full border grid place-items-center font-mono text-xs ${badgeStyle}`}>
                                  {isChosen ? pos + 1 : 'ABCDEFGH'[j]}
                                </span>
                                <span>
                                  <b className="font-mono text-xs opacity-70 mr-1.5">{'ABCDEFGH'[j]}.</b>
                                  {step}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Sequence preview bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 p-2.5 rounded-lg bg-[#0a0f1c] border border-[#1f2b45] font-mono text-xs text-[#8a9bb8]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#c084fc]">순서:</span>
                            <span>
                              {((currentAns as number[]) || []).length > 0
                                ? ((currentAns as number[]) || [])
                                    .map(j => 'ABCDEFGH'[j])
                                    .join(' → ')
                                : '단계를 일어나는 순서대로 누르세요'}
                            </span>
                          </div>
                          {!isCurrentGraded && ((currentAns as number[]) || []).length > 0 && (
                            <button
                              onClick={() => handleResetOrder(k)}
                              className="px-2.5 py-1 text-xs rounded bg-[#172239] border border-[#2a3a5c] text-[#dbe4f0] hover:border-[#f5b942]"
                            >
                              다시 선택
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feedback explanation after grading */}
                  {isCurrentGraded && (
                    <div
                      className={`mt-3.5 p-3 rounded-lg border-l-4 text-xs md:text-sm leading-relaxed ${
                        ok
                          ? 'border-l-[#4ade80] bg-[#0c1f15] text-[#bbf7d0]'
                          : 'border-l-[#f87171] bg-[#221215] text-[#fecaca]'
                      }`}
                    >
                      <div className="font-medium mb-1">
                        {!answeredStatus
                          ? '미응답. '
                          : ok
                          ? '정답입니다! '
                          : '오답입니다. '}
                        {q.ty !== 'mc' && !ok && (
                          <span className="font-bold underline decoration-[#4ade80] underline-offset-4 text-[#4ade80]">
                            정답: {formatAnswerText(q, q.a)} ·{' '}
                          </span>
                        )}
                        <span className="text-[#dbe4f0]">{q.w}</span>
                      </div>
                      <div className="font-mono text-xs text-[#2dd4bf] mt-1.5 flex items-center gap-1">
                        <span>확인: {q.an}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions panel */}
        <div className="bg-[#111a2e] border border-[#1f2b45] rounded-xl p-4 shadow-md sticky bottom-3 z-10 backdrop-blur-md bg-opacity-95">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                disabled={isCurrentGraded}
                onClick={handleGrade}
                className="px-5 py-2.5 rounded-lg font-bold text-sm bg-[#123d33] border border-[#2dd4bf] text-[#2dd4bf] hover:bg-[#164f43] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isCurrentGraded ? '채점 완료' : '채점하기'}</span>
              </button>

              {isCurrentGraded && (
                <button
                  onClick={handleResetCurrentSection}
                  className="px-3 py-2 rounded-lg text-xs bg-[#172239] border border-[#2a3a5c] text-[#8a9bb8] hover:text-[#dbe4f0] hover:border-[#f5b942] transition-colors flex items-center gap-1.5"
                  title="이 교시를 다시 풉니다"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>다시 풀기</span>
                </button>
              )}

              {/* Status & Code */}
              <div className="flex items-center gap-2.5 pl-1">
                <span className="font-mono text-lg font-bold text-[#f5b942] tracking-wider">
                  {isCurrentGraded && name.trim()
                    ? codeFor(name, tab + 1, scoreOf(tab))
                    : '—'}
                </span>
                {isCurrentGraded && (
                  <span className="font-mono text-base font-bold text-[#4ade80]">
                    {scoreOf(tab)}/10
                  </span>
                )}
                <span className="text-xs text-[#8a9bb8] hidden sm:inline">
                  {isCurrentGraded
                    ? name.trim()
                      ? '결과 코드'
                      : '이름을 입력하면 결과 코드가 나옵니다.'
                    : `${activeSection.k || `${tab + 1}교시`}: ${nAns(tab)}/10 답했습니다. 채점하기를 누르면 잠깁니다.`}
                </span>
              </div>
            </div>

            <button
              onClick={handleOpenSubmit}
              className="px-5 py-2.5 rounded-lg font-bold text-sm bg-[#3a2e12] border border-[#f5b942] text-[#f5b942] hover:bg-[#4d3d17] transition-all shadow-sm flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>제출 & 오답 정리</span>
            </button>
          </div>
          
          <div className="text-xs text-[#8a9bb8] sm:hidden mt-2 pt-2 border-t border-[#1f2b45]">
            {isCurrentGraded
              ? name.trim()
                ? '결과 코드'
                : '이름을 입력하면 결과 코드가 나옵니다.'
              : `${activeSection.k || `${tab + 1}교시`}: ${nAns(tab)}/10 답했습니다. 채점하기를 누르면 잠깁니다.`}
          </div>
        </div>

      </div>

      {/* Submit / Wrong-Answers Summary Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111a2e] text-[#dbe4f0] border border-[#1f2b45] rounded-2xl w-full max-w-[840px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#1f2b45] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#f5b942]">
                  음성 AI Day 5 개념 워크시트 — 오답 정리
                </h3>
                <div className="font-mono text-xs text-[#8a9bb8] mt-1">
                  {name.trim() || '(이름 없음)'} · {new Date().toLocaleString('ko-KR')}
                </div>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-[#8a9bb8] hover:text-[#dbe4f0] p-1.5 rounded-lg hover:bg-[#172239]"
              >
                ✕
              </button>
            </div>

            {/* Modal Body with Report content */}
            <div className="p-5 overflow-y-auto space-y-5 text-sm flex-1">
              {QUESTIONS_DATA.map((s, i) => {
                if (!graded[i]) return null;
                const score = scoreOf(i);
                const wrong = s.qs
                  .map((q, k) => ({ q, k, a: ans[i][k] }))
                  .filter(x => !isCorrect(x.q, x.a));

                return (
                  <div key={i} className="border border-[#1f2b45] rounded-xl p-4 bg-[#0e1628]">
                    <div className="flex items-center justify-between mb-3 border-b border-[#1f2b45] pb-2">
                      <span className="font-bold text-[#2dd4bf] text-base">
                        {s.t}
                      </span>
                      <span className="font-mono text-sm font-semibold text-[#4ade80] bg-[#0d2216] px-2.5 py-0.5 rounded border border-[#1a4a2c]">
                        {score} / 10
                      </span>
                    </div>

                    {wrong.length === 0 ? (
                      <div className="text-[#4ade80] font-medium py-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>오답 없음 (만점)</span>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs md:text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-[#1f2b45] text-[#8a9bb8] text-left">
                              <th className="py-2 px-2 font-mono w-10">#</th>
                              <th className="py-2 px-2 w-20">유형</th>
                              <th className="py-2 px-2">문항</th>
                              <th className="py-2 px-2 w-32">내 답</th>
                              <th className="py-2 px-2 w-36">정답</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#16203a]">
                            {wrong.map(({ q, k, a }) => {
                              const my = formatAnswerText(q, a);
                              const co = formatAnswerText(q, q.a);
                              const qt = stripHtml(q.p).replace(/\s+/g, ' ').slice(0, 60);

                              return (
                                <tr key={k}>
                                  <td className="py-2.5 px-2 font-mono text-[#8a9bb8]">{k + 1}</td>
                                  <td className="py-2.5 px-2 text-[#8a9bb8]">{TYNAME[q.ty]}</td>
                                  <td className="py-2.5 px-2 text-[#dbe4f0]">{qt}</td>
                                  <td className="py-2.5 px-2 text-[#f87171] font-mono break-all">{my}</td>
                                  <td className="py-2.5 px-2 text-[#4ade80] font-mono font-medium break-all">{co}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Ungraded warning */}
              {QUESTIONS_DATA.some((_, i) => !graded[i]) && (
                <div className="text-xs text-[#8a9bb8] font-mono p-3 bg-[#172239] rounded-lg border border-[#2a3a5c]">
                  미채점 교시:{' '}
                  {QUESTIONS_DATA
                    .map((s, i) => (graded[i] ? null : s.k || `${i + 1}교시`))
                    .filter(Boolean)
                    .join(', ')}
                </div>
              )}
            </div>

            {/* Modal Bottom Toolbar */}
            <div className="px-5 py-3 border-t border-[#1f2b45] bg-[#0c1424] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-mono text-[#4ade80]">
                {toastMessage}
              </span>
              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  onClick={handleCapture}
                  className="px-4 py-2 rounded-lg font-bold text-sm bg-[#123d33] border border-[#2dd4bf] text-[#2dd4bf] hover:bg-[#184e41] flex items-center gap-2 transition-all"
                >
                  <Copy className="w-4 h-4" />
                  <span>📋 캡처 (노션용 복사)</span>
                </button>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-lg text-sm bg-[#172239] border border-[#2a3a5c] text-[#dbe4f0] hover:border-[#f5b942] transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Animation viewer companion modal */}
      {showAnimationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#111a2e] text-[#dbe4f0] border border-[#1f2b45] rounded-2xl w-full max-w-[1080px] h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#1f2b45] flex items-center justify-between bg-[#0e1628]">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#2dd4bf]" />
                <h3 className="text-lg font-bold text-[#f5b942]">
                  음성 AI Day 5 애니메이션 뷰어 (animation.html)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/animation.html"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#2dd4bf] hover:underline flex items-center gap-1 px-2.5 py-1 rounded bg-[#172239] border border-[#2a3a5c]"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> 새 창으로 열기
                </a>
                <button
                  onClick={() => setShowAnimationModal(false)}
                  className="text-[#8a9bb8] hover:text-[#dbe4f0] p-1.5 rounded-lg hover:bg-[#172239]"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 w-full h-full bg-[#0b1220]">
              <iframe
                src="/animation.html"
                title="Animation Viewer"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
