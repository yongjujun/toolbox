# AI 자소서 첨삭소

Google Gemini API(무료 티어)를 이용해 자기소개서를 첨삭해주는 웹앱입니다.

## 로컬에서 미리보기 (선택)

```bash
npm install
npm run dev
```

이 상태로는 화면만 뜨고, "AI 첨삭 받기"는 아직 동작하지 않습니다. `/api/review`는 Vercel에 배포해야 정상 동작합니다 (아래 참고).

## 배포 방법 요약

1. aistudio.google.com 에서 Gemini API 키 발급 (신용카드 불필요, 무료)
2. 이 폴더를 GitHub 저장소로 업로드
3. Vercel(https://vercel.com)에서 GitHub 저장소 연결 후 Import
4. Vercel 프로젝트 Settings > Environment Variables 에 `GEMINI_API_KEY` 등록
5. Deploy 클릭 → 발급된 주소가 실제 서비스 링크

## 알아두면 좋은 것

- Gemini API 무료 티어는 분당/일일 요청 수 제한이 있어요 (모델에 따라 다름, 보통 하루 수백 건 수준). 방문자가 많아지면 응답이 잠시 늦어지거나 실패할 수 있어요.
- 무료 티어 사용 시 입력한 내용이 Google의 서비스 개선에 활용될 수 있어요. 개인정보가 담긴 자소서를 다루는 만큼, 실제 서비스로 키우려면 이 점을 사용자에게 투명하게 안내하는 게 좋아요.
- 코드에는 하루 3회로 사용량을 제한하는 로직이 들어있어요(브라우저 저장소 기준이라 우회는 가능하지만, 무료 한도를 지키는 기본 방어선 역할을 해요).
- 나중에 트래픽이 늘어나면 Vercel Analytics로 방문자 수를 확인하고, 유료 API(Anthropic/OpenAI)로 업그레이드하는 것도 고려해보세요.

자세한 배포 단계는 대화창의 안내를 참고하세요.
