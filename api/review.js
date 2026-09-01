export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { industry, text } = req.body || {};

  if (!text || typeof text !== "string" || text.trim().length < 80) {
    res.status(400).json({ error: "본문이 너무 짧습니다." });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: "서버에 API 키가 설정되어 있지 않습니다." });
    return;
  }

  const safeIndustry = typeof industry === "string" && industry.trim() ? industry.trim() : "기타";

  const systemPrompt = `너는 한국 기업 인사담당자 출신의 자기소개서 첨삭 전문가다. 지원 직무 분야는 "${safeIndustry}"다. 아래 자기소개서 본문을 냉정하고 실질적으로 평가하라.

반드시 아래 JSON 형식으로만 응답하라. 다른 텍스트, 설명 없이 순수 JSON만 출력하라. 모든 텍스트는 한국어로, 각 문자열은 최대한 간결하게(핵심만) 작성하라.

{
  "overall_score": (0-100 정수),
  "categories": [
    {"name": "구체성", "score": (0-100), "comment": "20자 이내 코멘트"},
    {"name": "논리적 흐름", "score": (0-100), "comment": "20자 이내 코멘트"},
    {"name": "직무 적합성", "score": (0-100), "comment": "20자 이내 코멘트"},
    {"name": "진정성", "score": (0-100), "comment": "20자 이내 코멘트"}
  ],
  "strengths": ["강점1 (25자 이내)", "강점2 (25자 이내)"],
  "improvements": [
    {"excerpt": "원문에서 그대로 발췌한 짧은 구절(15자 이내)", "issue": "문제점 15자 이내", "suggestion": "개선 제안 30자 이내"},
    {"excerpt": "원문에서 그대로 발췌한 짧은 구절(15자 이내)", "issue": "문제점 15자 이내", "suggestion": "개선 제안 30자 이내"}
  ]
}`;

  const MODEL = "gemini-3.6-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function callGemini() {
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: text.trim() }] }],
        generationConfig: {
          maxOutputTokens: 1000,
          responseMimeType: "application/json",
        },
      }),
    });
  }

  try {
    let geminiRes = await callGemini();

    // 503 = 모델이 일시적으로 과부하 상태. 짧게 대기 후 최대 2번까지 재시도.
    let attempts = 1;
    while (!geminiRes.ok && geminiRes.status === 503 && attempts < 3) {
      await sleep(900 * attempts);
      geminiRes = await callGemini();
      attempts += 1;
    }

    if (!geminiRes.ok) {
      const detail = await geminiRes.text();
      console.error("Gemini API error:", detail);
      if (geminiRes.status === 429) {
        res.status(429).json({ error: "지금 요청이 많아 잠시 제한됐어요. 1분 후 다시 시도해주세요." });
        return;
      }
      if (geminiRes.status === 503) {
        res.status(503).json({ error: "지금 무료 모델에 요청이 몰려있어요. 잠시 후 다시 시도해주세요." });
        return;
      }
      res.status(502).json({ error: "AI 응답을 받아오지 못했습니다." });
      return;
    }

    const data = await geminiRes.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n") || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.status(200).json(parsed);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}
