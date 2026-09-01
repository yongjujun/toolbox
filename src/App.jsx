import { useState, useEffect } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, History, RotateCcw } from "lucide-react";

const INDUSTRIES = ["개발/IT", "마케팅", "영업", "디자인", "기획/전략", "인사/총무", "기타"];

const SAMPLE_TEXT = `저는 대학 시절 학과 프로젝트에서 팀장을 맡아 협업 능력을 길렀습니다. 처음에는 팀원 간 의견 차이로 진행이 더뎠지만, 매주 정기 회의를 만들어 각자의 역할과 일정을 명확히 하면서 문제를 해결했습니다. 그 결과 프로젝트를 기한 내에 완성할 수 있었고, 교내 발표회에서 우수상을 수상했습니다. 이 경험을 통해 책임감과 소통의 중요성을 배웠고, 입사 후에도 이를 바탕으로 팀에 기여하고 싶습니다.`;

const HISTORY_KEY = "coverletter-history";
const USAGE_KEY = "coverletter-daily-usage";
const DAILY_LIMIT = 3;

function todayStr() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function readUsage() {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && parsed.date === todayStr()) return parsed.count;
    return 0;
  } catch (e) {
    return 0;
  }
}

export default function App() {
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {
      setHistory([]);
    }
    setUsageCount(readUsage());
  }, []);

  const scoreColor = (score) => {
    if (score >= 75) return "var(--blue-stamp)";
    if (score >= 50) return "var(--ink-soft)";
    return "var(--red-pen)";
  };

  const verdictLabel = (score) => {
    if (score >= 85) return "우수";
    if (score >= 70) return "양호";
    if (score >= 50) return "보완 필요";
    return "재작성 권장";
  };

  const handleSubmit = async () => {
    setError(null);
    if (text.trim().length < 80) {
      setError("본문이 너무 짧아요. 80자 이상 입력해주세요.");
      return;
    }
    const currentUsage = readUsage();
    if (currentUsage >= DAILY_LIMIT) {
      setError(`오늘 무료 사용 횟수(${DAILY_LIMIT}회)를 모두 사용했어요. 내일 다시 이용해주세요.`);
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, text: text.trim() }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || "API 요청 실패");
      }
      const parsed = await response.json();
      setResult(parsed);

      const newUsage = currentUsage + 1;
      setUsageCount(newUsage);
      try {
        localStorage.setItem(USAGE_KEY, JSON.stringify({ date: todayStr(), count: newUsage }));
      } catch (e) {
        /* usage tracking failure shouldn't block showing the result */
      }

      const entry = {
        id: Date.now(),
        industry,
        score: parsed.overall_score,
        date: new Date().toLocaleDateString("ko-KR"),
        snippet: text.trim().slice(0, 36) + (text.trim().length > 36 ? "…" : ""),
        result: parsed,
        text: text.trim(),
      };
      const newHistory = [entry, ...history].slice(0, 8);
      setHistory(newHistory);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      } catch (e) {
        /* storage save failure shouldn't block showing the result */
      }
    } catch (e) {
      setError("첨삭을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (entry) => {
    setIndustry(entry.industry);
    setText(entry.text || "");
    setResult(entry.result);
    setShowHistory(false);
    setError(null);
  };

  return (
    <div
      style={{
        fontFamily: "'Noto Sans KR', sans-serif",
        background: "var(--paper)",
        color: "var(--ink)",
        minHeight: "100vh",
        padding: "2.5rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto", position: "relative" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700;900&family=Noto+Sans+KR:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
          :root {
            --paper: #FBF8F2;
            --paper-line: #E5DFCF;
            --ink: #221F1B;
            --ink-soft: #635B4E;
            --red-pen: #B3392C;
            --blue-stamp: #2B5C82;
            --folder-tan: #CBB98C;
          }
          * { box-sizing: border-box; }
          body { margin: 0; }
          .clr-textarea::placeholder { color: #ADA695; }
          .clr-select:focus, .clr-textarea:focus { outline: 2px solid var(--blue-stamp); outline-offset: 2px; }
          .clr-btn-primary:active { transform: scale(0.98); }
          .clr-hist-item:hover { background: #F1ECDD; }
          @keyframes stampIn {
            0% { transform: scale(1.4) rotate(-6deg); opacity: 0; }
            60% { transform: scale(0.95) rotate(-6deg); opacity: 1; }
            100% { transform: scale(1) rotate(-6deg); opacity: 1; }
          }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .clr-stamp { animation: stampIn 0.4s ease-out; }
          .clr-spin { animation: spin 1s linear infinite; }
          @media (prefers-reduced-motion: reduce) {
            .clr-stamp, .clr-spin { animation: none; }
          }
        `}</style>

        <div
          style={{
            display: "inline-block",
            background: "var(--folder-tan)",
            color: "var(--ink)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            padding: "4px 12px",
            borderRadius: "4px 4px 0 0",
            marginBottom: "-1px",
          }}
        >
          DOCUMENT REVIEW
        </div>

        <div
          style={{
            border: "1px solid var(--paper-line)",
            borderRadius: "2px",
            padding: "2rem",
            background: "var(--paper)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
            <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "26px", margin: 0, lineHeight: 1.3 }}>
              AI 자소서 첨삭소
            </h1>
            <button
              onClick={() => setShowHistory(!showHistory)}
              aria-label="첨삭 기록"
              style={{
                background: "none",
                border: "1px solid var(--paper-line)",
                borderRadius: "4px",
                padding: "6px 10px",
                cursor: "pointer",
                color: "var(--ink-soft)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <History size={14} /> {history.length}
            </button>
          </div>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", margin: "0 0 1.75rem" }}>
            제출 전, 인사담당자의 눈으로 한 번 더 확인하세요.
          </p>

          {showHistory && (
            <div style={{ border: "1px solid var(--paper-line)", borderRadius: "4px", marginBottom: "1.5rem", maxHeight: "220px", overflowY: "auto" }}>
              {history.length === 0 ? (
                <div style={{ padding: "1rem", fontSize: "13px", color: "var(--ink-soft)" }}>아직 첨삭 기록이 없어요.</div>
              ) : (
                history.map((h) => (
                  <div
                    key={h.id}
                    className="clr-hist-item"
                    onClick={() => loadFromHistory(h)}
                    style={{ padding: "10px 14px", borderBottom: "1px solid var(--paper-line)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.snippet}</div>
                      <div style={{ fontSize: "11px", color: "var(--ink-soft)", fontFamily: "'JetBrains Mono', monospace" }}>{h.industry} · {h.date}</div>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "15px", color: scoreColor(h.score), flexShrink: 0 }}>{h.score}점</div>
                  </div>
                ))
              )}
            </div>
          )}

          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px", color: "var(--ink-soft)" }}>직무 분야</label>
          <select
            className="clr-select"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--paper-line)", borderRadius: "4px", background: "var(--paper)", color: "var(--ink)", fontSize: "14px", marginBottom: "1.25rem", fontFamily: "'Noto Sans KR', sans-serif" }}
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink-soft)" }}>자기소개서 본문</label>
            <button onClick={() => setText(SAMPLE_TEXT)} style={{ background: "none", border: "none", color: "var(--blue-stamp)", fontSize: "12px", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
              예시로 채우기
            </button>
          </div>
          <textarea
            className="clr-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="첨삭받고 싶은 자기소개서 문항과 답변을 붙여넣어 주세요."
            rows={8}
            style={{ width: "100%", padding: "14px", border: "1px solid var(--paper-line)", borderRadius: "4px", background: "repeating-linear-gradient(var(--paper), var(--paper) 27px, var(--paper-line) 28px)", color: "var(--ink)", fontSize: "14px", lineHeight: "28px", resize: "vertical", fontFamily: "'Noto Sans KR', sans-serif" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--ink-soft)", fontFamily: "'JetBrains Mono', monospace" }}>{text.trim().length}자</span>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--red-pen)", fontSize: "13px", marginTop: "10px" }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            className="clr-btn-primary"
            onClick={handleSubmit}
            disabled={loading || usageCount >= DAILY_LIMIT}
            style={{ width: "100%", marginTop: "1.25rem", padding: "13px", background: "var(--ink)", color: "var(--paper)", border: "none", borderRadius: "4px", fontSize: "15px", fontWeight: 500, cursor: loading || usageCount >= DAILY_LIMIT ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: loading || usageCount >= DAILY_LIMIT ? 0.5 : 1 }}
          >
            {loading ? (<><Loader2 size={16} className="clr-spin" /> 첨삭 중...</>) : (<><Sparkles size={16} /> AI 첨삭 받기</>)}
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>
              오늘 남은 무료 첨삭: {Math.max(DAILY_LIMIT - usageCount, 0)}/{DAILY_LIMIT}회
            </span>
            <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>
              무료 AI 모델을 사용하고 있어 입력한 내용이 서비스 개선에 활용될 수 있어요.
            </span>
          </div>

          {result && (
            <div style={{ marginTop: "2.5rem", borderTop: "1px solid var(--paper-line)", paddingTop: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
                <div className="clr-stamp" style={{ width: "120px", height: "120px", borderRadius: "50%", border: `3px double ${scoreColor(result.overall_score)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: "rotate(-6deg)", color: scoreColor(result.overall_score) }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "30px", lineHeight: 1 }}>{result.overall_score}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", marginTop: "4px" }}>{verdictLabel(result.overall_score)}</span>
                </div>
              </div>

              <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: "16px", fontWeight: 700, margin: "0 0 12px" }}>항목별 평가</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.75rem" }}>
                {(result.categories || []).map((c, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 500 }}>{c.name}</span>
                      <span style={{ color: "var(--ink-soft)" }}>{c.comment}</span>
                    </div>
                    <div style={{ height: "6px", background: "var(--paper-line)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${c.score}%`, height: "100%", background: scoreColor(c.score), borderRadius: "3px" }} />
                    </div>
                  </div>
                ))}
              </div>

              <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: "16px", fontWeight: 700, margin: "0 0 10px" }}>강점</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "1.75rem" }}>
                {(result.strengths || []).map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", alignItems: "flex-start" }}>
                    <CheckCircle2 size={16} color="var(--blue-stamp)" style={{ flexShrink: 0, marginTop: "1px" }} />
                    <span>{s}</span>
                  </div>
                ))}
              </div>

              <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: "16px", fontWeight: 700, margin: "0 0 10px" }}>개선이 필요한 부분</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {(result.improvements || []).map((imp, i) => (
                  <div key={i} style={{ borderLeft: "3px solid var(--red-pen)", paddingLeft: "12px" }}>
                    <div style={{ fontSize: "13px", fontStyle: "italic", color: "var(--ink-soft)", marginBottom: "3px" }}>"{imp.excerpt}"</div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--red-pen)", marginBottom: "2px" }}>{imp.issue}</div>
                    <div style={{ fontSize: "13px" }}>{imp.suggestion}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setResult(null); setError(null); }}
                style={{ marginTop: "2rem", width: "100%", padding: "10px", background: "none", border: "1px solid var(--paper-line)", borderRadius: "4px", color: "var(--ink-soft)", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <RotateCcw size={13} /> 다시 첨삭받기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
