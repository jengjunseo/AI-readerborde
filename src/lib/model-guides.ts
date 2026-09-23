import type { GuideSource, ModelFamilyGuide, ModelVersionGuide, ResolvedModelGuide } from "./model-guide-types";
import type { Model } from "./types";

const checked = "2026-09-23";
const source = (id: string, label: string, url: string, kind: GuideSource["kind"]): GuideSource => ({ id, label, url, kind, verifiedAt: checked });

const families: Record<string, ModelFamilyGuide> = {
  openai: {
    key: "openai", officialName: "OpenAI GPT", provider: "OpenAI",
    introduction: "OpenAI의 GPT 모델은 질문에 답하고, 문서를 분석하고, 코드를 작성하며, 연결된 도구를 사용하도록 설계된 인공지능입니다. 이 페이지의 ‘max’는 별도 제품명이 아니라 답을 만들 때 더 많은 추론 자원을 쓰도록 한 평가 설정입니다.",
    useCases: [
      { title: "복잡한 질문과 자료 분석", description: "긴 문서와 이미지를 입력해 핵심을 정리하거나 여러 조건을 함께 검토할 수 있습니다.", sourceIds: ["openai-models"] },
      { title: "프로그램 개발", description: "코드 작성, 오류 수정, 저장소 단위 작업과 도구 호출에 사용할 수 있습니다.", sourceIds: ["openai-models"] },
      { title: "반복 업무 자동화", description: "API*의 Responses 기능과 검색·파일·컴퓨터 도구를 연결해 여러 단계의 작업을 구성할 수 있습니다.", sourceIds: ["openai-models"] },
    ],
    strengths: [{ title: "도구를 쓰는 작업", description: "공식 API 문서는 함수 호출, 웹 검색, 파일 검색과 컴퓨터 사용 도구를 지원한다고 안내합니다.", sourceIds: ["openai-models"] }],
    cautions: [
      { title: "설정에 따라 비용이 달라짐", description: "긴 입력, Fast 처리, 지역 처리와 높은 추론 노력은 기본 단가와 다른 비용이 적용될 수 있습니다.", sourceIds: ["openai-pricing"] },
      { title: "결과 확인 필요", description: "AI 답변에는 환각*이 있을 수 있으므로 중요한 사실과 코드는 원문·테스트로 확인해야 합니다.", sourceIds: ["openai-models"] },
    ],
    glossaryTerms: ["API", "토큰", "컨텍스트 윈도", "추론", "멀티모달", "에이전트", "환각"],
    sources: [
      source("openai-models", "OpenAI API 모델 문서", "https://developers.openai.com/api/docs/models", "documentation"),
      source("openai-pricing", "OpenAI API 가격표", "https://developers.openai.com/api/docs/pricing", "pricing"),
      source("openai-chatgpt", "ChatGPT 요금제", "https://chatgpt.com/pricing/", "access"),
    ],
  },
  anthropic: {
    key: "anthropic", officialName: "Claude", provider: "Anthropic",
    introduction: "Claude는 Anthropic이 만든 인공지능 모델입니다. 글과 이미지를 이해하고, 문서 작업과 코딩, 여러 단계의 지식 업무를 수행할 수 있습니다. 리더보드의 Adaptive Reasoning·Max Effort·Default Fallback 표기는 모델명이 아니라 평가 때 사용한 추론 및 안전 라우팅 설정입니다.",
    useCases: [
      { title: "문서와 지식 업무", description: "긴 자료를 읽고 요약·비교하거나 구조화된 결과물을 만드는 작업에 사용할 수 있습니다.", sourceIds: ["anthropic-models"] },
      { title: "코딩과 에이전트 작업", description: "Claude Code나 API*에서 코드를 탐색하고 도구를 호출하는 여러 단계 작업에 사용할 수 있습니다.", sourceIds: ["anthropic-models"] },
    ],
    strengths: [{ title: "긴 작업을 이어가는 능력", description: "공식 소개는 코딩과 지식 업무, 장기 실행 작업을 주요 용도로 설명합니다.", sourceIds: ["anthropic-models"] }],
    cautions: [
      { title: "안전 제한과 대체 라우팅", description: "일부 생물학·보안 요청은 제한되거나 설정에 따라 다른 모델로 연결될 수 있습니다.", sourceIds: ["anthropic-models"] },
      { title: "구독과 API는 별도", description: "Claude 앱 구독료와 Claude API 사용료는 서로 다른 결제 항목입니다.", sourceIds: ["anthropic-pricing"] },
    ],
    glossaryTerms: ["API", "토큰", "컨텍스트 윈도", "추론", "에이전트", "벤치마크", "환각"],
    sources: [
      source("anthropic-models", "Anthropic 모델 문서", "https://docs.anthropic.com/en/docs/about-claude/models/overview", "documentation"),
      source("anthropic-pricing", "Anthropic API 가격표", "https://docs.anthropic.com/en/docs/about-claude/pricing", "pricing"),
      source("anthropic-plans", "Claude 요금제", "https://claude.com/pricing", "access"),
    ],
  },
  muse: {
    key: "muse", officialName: "Muse Spark", provider: "Meta",
    introduction: "Muse Spark는 Meta가 코딩과 에이전트* 작업을 위해 공개한 인공지능 모델입니다. Muse Code 명령줄 도구 또는 Meta Model API*에서 사용할 수 있으며, 현재 모델 가중치는 공개되지 않았습니다.",
    useCases: [
      { title: "코드베이스 작업", description: "Muse Code에서 프로젝트를 살펴보고 코드를 작성·수정하는 작업에 사용할 수 있습니다.", sourceIds: ["muse-release"] },
      { title: "문서·이미지·영상 이해", description: "공식 모델 페이지는 텍스트와 이미지·영상 입력, 긴 컨텍스트를 지원한다고 안내합니다.", sourceIds: ["muse-model"] },
    ],
    strengths: [{ title: "코딩 중심 도구 연결", description: "Muse Code와 Meta Model API에서 도구를 사용하는 작업을 중심으로 제공됩니다.", sourceIds: ["muse-release"] }],
    cautions: [{ title: "오픈 웨이트가 아님", description: "Meta는 가중치 공개를 향후 계획으로 설명했습니다. 현재는 API와 Muse Code를 사용해야 합니다.", sourceIds: ["muse-release"] }],
    glossaryTerms: ["API", "토큰", "컨텍스트 윈도", "멀티모달", "에이전트", "오픈 웨이트"],
    sources: [
      source("muse-release", "Meta Muse Spark 1.3 발표", "https://research.meta.ai/blog/introducing-muse-spark-1-3", "release"),
      source("muse-model", "Meta Muse Spark 모델 페이지", "https://dev.meta.ai/models/muse-spark", "documentation"),
    ],
  },
  glm: {
    key: "glm", officialName: "GLM 5.3", provider: "Z AI",
    introduction: "GLM 5.3 계열은 Z AI가 공개한 대규모 혼합 전문가 모델입니다. 공식 서비스와 API*에서 쓰거나 모델 가중치를 내려받아 서버에서 직접 실행할 수 있습니다.",
    useCases: [
      { title: "코딩과 도구 사용", description: "공식 저장소는 코딩, 함수 호출과 에이전트* 작업을 주요 용도로 안내합니다.", sourceIds: ["glm-github"] },
      { title: "직접 배포", description: "가중치를 내려받아 Transformers, vLLM 또는 SGLang으로 자체 서버에 배포할 수 있습니다.", sourceIds: ["glm-github"] },
    ],
    strengths: [{ title: "오픈 웨이트*", description: "가중치가 공개되어 라이선스 조건을 확인한 뒤 자체 환경에서 실행·연구할 수 있습니다.", sourceIds: ["glm-hf"] }],
    cautions: [{ title: "개인 PC급 모델이 아님", description: "전체 가중치 파일이 매우 커서 원본 정밀도 실행은 여러 GPU가 있는 서버가 필요합니다. 파일 크기는 최소 VRAM과 같지 않습니다.", sourceIds: ["glm-hf"] }],
    glossaryTerms: ["오픈 웨이트", "오픈 소스", "API", "파라미터", "양자화", "GPU 및 VRAM", "에이전트"],
    sources: [
      source("glm-github", "Z AI GLM-5 공식 저장소", "https://github.com/zai-org/GLM-5", "documentation"),
      source("glm-hf", "GLM-5.3 공식 가중치", "https://huggingface.co/zai-org/GLM-5.3", "runtime"),
      source("glm-pricing", "Z AI 공식 가격표", "https://z.ai/pricing", "pricing"),
      source("glm-access", "Z AI 서비스", "https://chat.z.ai/", "access"),
    ],
  },
  mimo: {
    key: "mimo", officialName: "MiMo V2.6", provider: "Xiaomi",
    introduction: "MiMo V2.6은 Xiaomi가 만든 멀티모달* 인공지능 모델입니다. 텍스트뿐 아니라 이미지·영상·음성을 입력으로 받고, API*와 공식 도구 또는 공개 가중치로 사용할 수 있습니다.",
    useCases: [
      { title: "여러 형식의 자료 분석", description: "문서, 이미지, 영상과 음성을 함께 입력해 내용을 파악하는 작업에 사용할 수 있습니다.", sourceIds: ["mimo-model"] },
      { title: "코딩과 에이전트 작업", description: "도구 호출, 구조화 출력과 긴 컨텍스트를 이용한 개발 작업을 지원합니다.", sourceIds: ["mimo-model"] },
    ],
    strengths: [{ title: "공식 API와 공개 가중치", description: "호스팅 API를 바로 쓰거나 공개된 모델 가중치를 직접 배포할 수 있습니다.", sourceIds: ["mimo-release"] }],
    cautions: [{ title: "로컬 실행 자원", description: "Pro 가중치는 매우 커서 원본 정밀도 실행은 대형 서버가 필요합니다. 커뮤니티 양자화는 공식 품질과 다를 수 있습니다.", sourceIds: ["mimo-weights"] }],
    glossaryTerms: ["멀티모달", "API", "오픈 웨이트", "파라미터", "양자화", "GPU 및 VRAM", "컨텍스트 윈도"],
    sources: [
      source("mimo-model", "MiMo V2.6 Pro 모델 문서", "https://mimo.mi.com/models/zh-CN/mimo-v2.6-pro", "documentation"),
      source("mimo-release", "MiMo V2.6 공식 발표", "https://mimo.mi.com/docs/en-US/news/latest/v2-6", "release"),
      source("mimo-weights", "MiMo V2.6 Pro 공식 가중치", "https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL", "runtime"),
    ],
  },
  grok: {
    key: "grok", officialName: "Grok", provider: "SpaceXAI",
    introduction: "Grok은 SpaceXAI가 제공하는 인공지능 모델입니다. Grok Build와 API*에서 코딩, 조사, 지식 업무와 여러 단계의 에이전트* 작업에 사용할 수 있습니다.",
    useCases: [
      { title: "코딩과 앱 제작", description: "Grok Build에서 프로젝트를 만들고 코드를 수정하는 작업에 사용할 수 있습니다.", sourceIds: ["grok-release"] },
      { title: "조사와 지식 업무", description: "공식 발표는 자료 조사와 여러 단계의 지식 업무를 주요 용도로 설명합니다.", sourceIds: ["grok-release"] },
    ],
    strengths: [{ title: "Grok Build와 API 제공", description: "웹·모바일의 Grok Build와 개발자 API에서 공식 모델을 선택할 수 있습니다.", sourceIds: ["grok-release"] }],
    cautions: [{ title: "추론 노력에 따른 차이", description: "high와 xhigh는 별도 모델이 아니라 답변에 쓰는 추론 자원의 설정입니다. 속도와 비용·결과가 달라질 수 있습니다.", sourceIds: ["grok-docs"] }],
    glossaryTerms: ["API", "토큰", "추론", "에이전트", "벤치마크", "환각"],
    sources: [],
  },
  kimi: {
    key: "kimi", officialName: "Kimi K3", provider: "Moonshot AI",
    introduction: "Kimi K3는 Moonshot AI가 공개한 멀티모달* 혼합 전문가 모델입니다. Kimi 웹 서비스와 개발 도구, API*를 쓰거나 공개 가중치를 직접 내려받아 실행할 수 있습니다.",
    useCases: [
      { title: "문서와 시각 자료 작업", description: "긴 문서와 이미지를 함께 읽고 답하거나 결과물을 만드는 데 사용할 수 있습니다.", sourceIds: ["kimi-release"] },
      { title: "코딩과 에이전트 작업", description: "Kimi Code 또는 API에서 도구 호출과 긴 작업 흐름을 구성할 수 있습니다.", sourceIds: ["kimi-code"] },
    ],
    strengths: [{ title: "웹·API·공개 가중치", description: "초보자는 Kimi 웹을, 개발자는 API나 공식 가중치를 선택할 수 있습니다.", sourceIds: ["kimi-release"] }],
    cautions: [{ title: "라이선스의 대규모 상업 조건", description: "Kimi K3 License는 일정 매출 이상의 Model-as-a-Service와 대규모 상업 제품에 별도 조건을 둡니다. 배포 전 원문을 확인해야 합니다.", sourceIds: ["kimi-license"] }],
    glossaryTerms: ["멀티모달", "오픈 웨이트", "API", "파라미터", "양자화", "GPU 및 VRAM", "에이전트"],
    sources: [
      source("kimi-release", "Kimi K3 공식 소개", "https://www.kimi.com/en/blog/kimi-k3", "release"),
      source("kimi-code", "Kimi Code 모델 문서", "https://www.kimi.com/code/docs/en/kimi-code/models.html", "documentation"),
      source("kimi-license", "Kimi K3 License", "https://huggingface.co/moonshotai/Kimi-K3/blob/main/LICENSE", "license"),
      source("kimi-weights", "Kimi K3 공식 가중치", "https://huggingface.co/moonshotai/Kimi-K3", "runtime"),
      source("kimi-platform", "Kimi API 플랫폼", "https://platform.kimi.com/", "pricing"),
    ],
  },
  step: {
    key: "step", officialName: "Step 5 Preview", provider: "StepFun",
    introduction: "Step 5 Preview는 StepFun이 미리보기 형태로 제공하는 에이전트* 모델입니다. 공식 웹 제품과 개발자 API*에서 사용할 수 있고, 모델 가중치는 아직 공개되지 않았습니다.",
    useCases: [
      { title: "코딩과 긴 작업", description: "공식 소개는 소프트웨어 개발과 여러 단계의 에이전트 작업을 주요 용도로 제시합니다.", sourceIds: ["step-model"] },
      { title: "이미지와 긴 문서 이해", description: "공식 모델 페이지는 이미지 입력과 최대 100만 토큰 컨텍스트를 안내합니다.", sourceIds: ["step-model"] },
    ],
    strengths: [{ title: "긴 컨텍스트", description: "대규모 문서와 코드 문맥을 한 요청에서 다룰 수 있도록 100만 토큰 컨텍스트를 제공합니다.", sourceIds: ["step-model"] }],
    cautions: [{ title: "Preview 버전", description: "미리보기 모델이므로 동작, 가격과 이용 조건이 바뀔 수 있습니다. 가중치 공개는 예고됐지만 현재 페이지 기준 아직 제공되지 않았습니다.", sourceIds: ["step-model"] }],
    glossaryTerms: ["API", "토큰", "컨텍스트 윈도", "멀티모달", "에이전트", "오픈 웨이트"],
    sources: [source("step-model", "Step 5 Preview 공식 페이지", "https://www.stepfun.com/step-5-preview", "release"), source("step-platform", "StepFun 개발자 플랫폼", "https://platform.stepfun.com/", "access")],
  },
  gemini: {
    key: "gemini", officialName: "Gemini 3.8 Flash", provider: "Google",
    introduction: "Gemini 3.8 Flash는 Google이 긴 작업 흐름과 코딩, 도구 사용을 위해 제공하는 멀티모달* 인공지능 모델입니다. Gemini 앱처럼 바로 쓰는 제품과 Gemini API*처럼 개발자가 연결하는 서비스는 이용 조건과 가격이 서로 다릅니다.",
    useCases: [
      { title: "긴 문서와 자료 분석", description: "최대 100만 토큰 컨텍스트 윈도*에서 긴 문서, 코드와 여러 형식의 입력을 함께 다룰 수 있습니다.", sourceIds: ["gemini-docs"] },
      { title: "코딩과 여러 단계 작업", description: "공식 발표는 장기 코딩, 자율 에이전트*와 복잡한 워크플로를 주요 용도로 안내합니다.", sourceIds: ["gemini-release"] },
    ],
    strengths: [{ title: "속도와 추론 수준 조절", description: "low·medium·high 추론 수준을 지원해 작업 난이도에 맞춰 응답 속도와 계산량을 조절할 수 있습니다.", sourceIds: ["gemini-docs"] }],
    cautions: [
      { title: "소개 가격은 기간 한정", description: "공식 발표의 할인 API 가격은 2026년 12월 31일까지이며, 2027년부터 표준 가격이 적용될 예정입니다.", sourceIds: ["gemini-release"] },
      { title: "앱과 API는 별도", description: "Gemini 앱 요금제와 Gemini API 종량제는 별도 서비스이므로 자신의 이용 경로에 맞는 조건을 확인해야 합니다.", sourceIds: ["gemini-release"] },
    ],
    glossaryTerms: ["API", "토큰", "컨텍스트 윈도", "멀티모달", "추론", "에이전트", "환각"],
    sources: [
      source("gemini-release", "Google Gemini 3.8 Flash 발표", "https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/", "release"),
      source("gemini-docs", "Gemini API 최신 모델 문서", "https://ai.google.dev/gemini-api/docs/latest-model", "documentation"),
    ],
  },
  "qwen-open": {
    key: "qwen-open", officialName: "Qwen3.8 2.4T A95B", provider: "Alibaba",
    introduction: "Qwen3.8 2.4T A95B는 Alibaba가 공개한 대규모 텍스트 인공지능 모델입니다. 전체 2.4조 파라미터* 중 요청을 처리할 때 약 950억 개를 사용하는 혼합 전문가 구조이며, 공식 API*를 쓰거나 공개 가중치를 직접 배포할 수 있습니다.",
    useCases: [
      { title: "텍스트와 코드 작업", description: "긴 문서 처리, 코드 작성, 함수 호출과 구조화된 텍스트 출력을 지원합니다.", sourceIds: ["qwen-open-docs"] },
      { title: "자체 서버 배포", description: "공식 가중치를 내려받아 vLLM, SGLang 또는 TokenSpeed로 여러 GPU 서버에 배포할 수 있습니다.", sourceIds: ["qwen-open-weights"] },
    ],
    strengths: [{ title: "공식 오픈 웨이트*", description: "가중치와 실행 자료가 공개되어 라이선스 조건에 따라 자체 서버에서 운영할 수 있습니다.", sourceIds: ["qwen-open-weights", "qwen-open-license"] }],
    cautions: [
      { title: "이미지 입력은 지원하지 않음", description: "공식 모델 카드 기준 이 버전은 텍스트 입력·출력 모델입니다. 호스팅 Qwen3.8 Max의 멀티모달 기능과 혼동하면 안 됩니다.", sourceIds: ["qwen-open-weights"] },
      { title: "대규모 서버가 필요", description: "공식 BF16 저장소가 약 4.89TB이므로 개인 PC에서 전체 모델을 실행하기 어렵습니다. 파일 크기는 실제 최소 VRAM과 같지 않습니다.", sourceIds: ["qwen-open-weights"] },
    ],
    glossaryTerms: ["오픈 웨이트", "오픈 소스", "API", "파라미터", "양자화", "GPU 및 VRAM", "컨텍스트 윈도", "추론"],
    sources: [
      source("qwen-open-docs", "Alibaba Cloud Qwen3.8 2.4T A95B 문서", "https://www.alibabacloud.com/help/en/model-studio/qwen3-8-2-4t-a95b", "documentation"),
      source("qwen-open-release", "Alibaba Cloud 신규 모델 목록", "https://www.alibabacloud.com/help/en/model-studio/newly-released-models", "release"),
      source("qwen-open-weights", "Qwen3.8 2.4T A95B 공식 가중치", "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B", "runtime"),
      source("qwen-open-license", "Qwen3.8 Max License", "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B/blob/main/LICENSE", "license"),
      source("qwen-open-fp8", "Qwen3.8 2.4T A95B 공식 FP8 가중치", "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B-FP8", "runtime"),
    ],
  },
  qwen: {
    key: "qwen", officialName: "Qwen3.8 Max", provider: "Alibaba",
    introduction: "Qwen3.8 Max는 Alibaba Cloud Model Studio에서 제공하는 호스팅 인공지능 모델입니다. 이 리더보드의 0902 표기는 2026년 9월 2일 버전의 고정 모델 ID를 뜻합니다.",
    useCases: [
      { title: "코딩과 에이전트 작업", description: "공식 문서는 코딩, 함수 호출, 구조화 출력과 장기 에이전트 작업을 지원한다고 안내합니다.", sourceIds: ["qwen-docs"] },
      { title: "이미지·영상 이해", description: "텍스트와 함께 이미지·영상 입력을 받아 텍스트로 답할 수 있습니다.", sourceIds: ["qwen-docs"] },
    ],
    strengths: [{ title: "고정 버전 선택", description: "날짜가 붙은 모델 ID를 사용하면 애플리케이션에서 같은 모델 버전을 지정할 수 있습니다.", sourceIds: ["qwen-docs"] }],
    cautions: [{ title: "이 버전은 호스팅 API 모델", description: "다른 Qwen 공개 모델과 혼동하면 안 됩니다. 현재 0902 Max 버전의 공식 가중치 다운로드는 확인되지 않았습니다.", sourceIds: ["qwen-docs"] }],
    glossaryTerms: ["API", "토큰", "컨텍스트 윈도", "멀티모달", "에이전트", "오픈 웨이트"],
    sources: [source("qwen-docs", "Alibaba Cloud Qwen3.8 Max 문서", "https://docs.modelstudio.console.alibabacloud.com/en/model-studio/qwen3-8-max", "documentation"), source("qwen-pricing", "Alibaba Cloud Model Studio 가격표", "https://www.alibabacloud.com/help/en/model-studio/model-pricing", "pricing")],
  },
};

const apiAccess = (label: string, platform: string, url: string, sourceIds: string[], requirements = "계정, API 키와 결제 수단이 필요합니다.") => ({
  kind: "api" as const, label, platform, freeAccess: "no" as const, requirements, technicalLevel: "개발자용" as const,
  steps: ["공식 개발자 페이지에서 계정을 만듭니다.", "API 키를 발급하고 결제 한도를 확인합니다.", "공식 예제의 모델 ID로 첫 요청을 보냅니다."], url, sourceIds,
});

const versions: Record<string, ModelVersionGuide> = {
  "muse-spark-1-3": {
    slug: "muse-spark-1-3", familyKey: "muse", officialName: "Muse Spark 1.3", releaseDate: "2026-09-02", modelType: "코딩·에이전트 모델", summary: "Muse Code와 Meta Model API에서 사용하는 Meta의 코딩 중심 모델입니다.", configurationNote: "‘max’는 공식 모델명의 일부가 아니라 리더보드 평가에서 사용한 최대 추론 노력 설정입니다.", capabilities: ["텍스트·이미지·영상 입력", "코드 작성과 수정", "도구 호출", "100만 토큰 컨텍스트"],
    access: [
      { kind: "app", label: "Muse Code", platform: "macOS · Linux 명령줄", freeAccess: "unknown", requirements: "명령줄 설치가 필요하며 공식 이용 조건을 확인해야 합니다.", technicalLevel: "보통", steps: ["공식 발표의 설치 명령을 확인합니다.", "터미널에서 Muse Code를 설치합니다.", "프로젝트 폴더에서 실행하고 모델을 선택합니다."], url: "https://research.meta.ai/blog/introducing-muse-spark-1-3", sourceIds: ["muse-release"] },
      apiAccess("Meta Model API", "Meta 개발자 플랫폼", "https://dev.meta.ai/models/muse-spark", ["muse-model"]),
    ],
    prices: [{ label: "Meta Model API Standard", billingType: "api", price: "입력 $1.25 · 캐시 입력 $0.15 · 출력 $4.25", unit: "미화 / 100만 토큰", note: "Contributor 요금은 입력·출력이 제품 개선에 사용되는 별도 조건입니다.", observedAt: checked, sourceIds: ["muse-model"] }],
    glossaryTerms: [], sources: [], status: "published", lastVerifiedAt: checked,
  },
  "gpt-6-astra": {
    slug: "gpt-6-astra", familyKey: "openai", officialName: "GPT-6 Astra", releaseDate: "2026-09-03", modelType: "프런티어 추론·코딩 모델", summary: "OpenAI가 가장 어려운 장기 작업과 복잡한 추론을 위해 제공하는 GPT-6 상위 모델입니다.", configurationNote: "‘max’는 별도 모델이 아니라 API의 reasoning.effort를 가장 높게 둔 평가 설정입니다.", capabilities: ["텍스트·이미지 입력", "코딩과 컴퓨터 사용", "검색·파일·도구 호출", "105만 토큰 컨텍스트"],
    access: [
      { kind: "web", label: "ChatGPT", platform: "웹 · 모바일 앱", freeAccess: "no", requirements: "공식 발표 기준 Plus, Pro, Business 또는 Enterprise 등 지원 요금제가 필요합니다.", technicalLevel: "쉬움", steps: ["ChatGPT에 로그인합니다.", "지원 요금제를 확인합니다.", "모델 선택 메뉴에서 GPT-6 Astra를 선택합니다."], url: "https://chatgpt.com/", sourceIds: ["astra-release", "openai-chatgpt"] },
      apiAccess("OpenAI API", "Responses API", "https://developers.openai.com/api/docs/models/gpt-6-astra", ["astra-docs", "openai-pricing"]),
    ],
    prices: [{ label: "OpenAI API Standard · 짧은 컨텍스트", billingType: "api", price: "입력 $10 · 캐시 입력 $1 · 출력 $50", unit: "미화 / 100만 토큰", note: "272K를 넘는 긴 입력과 Fast·지역 처리에는 다른 배수가 적용됩니다.", observedAt: checked, sourceIds: ["astra-docs", "openai-pricing"] }],
    glossaryTerms: ["프런티어 모델"], sources: [source("astra-docs", "GPT-6 Astra 모델 문서", "https://developers.openai.com/api/docs/models/gpt-6-astra", "documentation"), source("astra-release", "GPT-6 Astra 발표", "https://openai.com/index/gpt-6-astra/", "release")], status: "published", lastVerifiedAt: checked,
  },
  "gpt-6-sol": {
    slug: "gpt-6-sol", familyKey: "openai", officialName: "GPT-6 Sol", releaseDate: "2026-09-22", modelType: "코딩·에이전트 추론 모델", summary: "복잡한 코딩과 에이전트 작업에서 성능과 비용의 균형을 목표로 한 GPT-6 모델입니다.", configurationNote: "‘max’는 평가에 쓴 최대 추론 노력 설정입니다. 기본 API 설정은 medium입니다.", capabilities: ["텍스트·이미지 입력", "코딩과 컴퓨터 사용", "검색·파일·도구 호출", "105만 토큰 컨텍스트"],
    access: [
      { kind: "app", label: "ChatGPT Work · Codex", platform: "웹 · 데스크톱", freeAccess: "no", requirements: "공식 출시 안내 기준 Plus, Pro, Business, Enterprise 또는 Edu의 지원 범위를 확인해야 합니다.", technicalLevel: "쉬움", steps: ["지원 제품에 로그인합니다.", "모델 선택 메뉴에서 GPT-6 Sol을 선택합니다.", "사용량 한도와 추론 설정을 확인합니다."], url: "https://chatgpt.com/", sourceIds: ["sol-release"] },
      apiAccess("OpenAI API", "Responses API", "https://developers.openai.com/api/docs/models/gpt-6-sol", ["sol-docs", "openai-pricing"]),
    ],
    prices: [{ label: "OpenAI API Standard · 짧은 컨텍스트", billingType: "api", price: "입력 $2 · 캐시 입력 $0.20 · 출력 $10", unit: "미화 / 100만 토큰", note: "272K 초과 입력과 Fast·지역 처리 가격은 공식 표를 확인해야 합니다.", observedAt: checked, sourceIds: ["sol-docs", "openai-pricing"] }],
    glossaryTerms: [], sources: [source("sol-docs", "GPT-6 Sol 모델 문서", "https://developers.openai.com/api/docs/models/gpt-6-sol", "documentation"), source("sol-release", "GPT-6 Sol 출시 안내", "https://community.openai.com/t/announcing-gpt-6-sol-and-gpt-6-luna/1399925", "release")], status: "published", lastVerifiedAt: checked,
  },
  "gpt-6-luna": {
    slug: "gpt-6-luna", familyKey: "openai", officialName: "GPT-6 Luna", contextTokens: 1_050_000, releaseDate: "2026-09-22", modelType: "고효율 추론 모델", summary: "명확한 반복 작업과 대량 처리를 낮은 비용과 지연으로 수행하도록 설계된 GPT-6 모델입니다.", configurationNote: "Luna는 GPT-6의 고효율 모델입니다. reasoning.effort는 none부터 max까지 지원하지만, 높은 설정은 더 많은 시간과 토큰을 쓸 수 있습니다.", capabilities: ["텍스트·이미지 입력", "검색·파일·도구 호출", "105만 토큰 컨텍스트", "대량 반복 작업"],
    access: [
      { kind: "app", label: "ChatGPT Work · Codex", platform: "웹 · 데스크톱", freeAccess: "limited", requirements: "공식 출시 안내에 따라 제품·요금제별 모델 선택 가능 여부와 사용량 한도를 확인해야 합니다.", technicalLevel: "쉬움", steps: ["ChatGPT Work 또는 Codex에 로그인합니다.", "모델 선택 메뉴에서 GPT-6 Luna를 찾습니다.", "작업에 맞는 추론 노력을 선택합니다."], url: "https://chatgpt.com/", sourceIds: ["luna-release", "openai-chatgpt"] },
      apiAccess("OpenAI API", "Responses API", "https://developers.openai.com/api/docs/models/gpt-6-luna", ["luna-docs", "openai-pricing"]),
    ],
    prices: [{ label: "OpenAI API Standard · 짧은 컨텍스트", billingType: "api", price: "입력 $0.10 · 캐시 입력 $0.01 · 출력 $0.50", unit: "미화 / 100만 토큰", note: "272K를 넘는 긴 입력과 Fast·지역 처리에는 다른 배수가 적용됩니다.", observedAt: checked, sourceIds: ["luna-docs", "openai-pricing"] }],
    glossaryTerms: [], sources: [source("luna-docs", "GPT-6 Luna 모델 문서", "https://developers.openai.com/api/docs/models/gpt-6-luna", "documentation"), source("luna-release", "OpenAI API 2026년 9월 변경 기록", "https://developers.openai.com/api/docs/changelog", "release")], status: "published", lastVerifiedAt: checked,
  },
  "gpt-5-6-sol": {
    slug: "gpt-5-6-sol", familyKey: "openai", officialName: "GPT-5.6 Sol", modelType: "추론·코딩 모델", summary: "복잡한 코딩과 범용 지식 업무를 위한 OpenAI의 GPT-5.6 모델입니다.", configurationNote: "‘max’는 모델명이 아니라 평가의 추론 노력 설정입니다.", capabilities: ["텍스트·이미지 입력", "도구 호출", "105만 토큰 컨텍스트"], access: [apiAccess("OpenAI API", "Responses API", "https://developers.openai.com/api/docs/models/gpt-5.6-sol", ["gpt56sol-docs", "openai-pricing"])], prices: [{ label: "OpenAI API", billingType: "api", price: "입력 $4 · 출력 $20", unit: "미화 / 100만 토큰", note: "프로모션 및 처리 모드에 따라 공식 가격표의 단가가 달라질 수 있습니다.", observedAt: checked, sourceIds: ["gpt56sol-docs", "openai-pricing"] }], glossaryTerms: [], sources: [source("gpt56sol-docs", "GPT-5.6 Sol 모델 문서", "https://developers.openai.com/api/docs/models/gpt-5.6-sol", "documentation")], status: "published", lastVerifiedAt: checked,
  },
  "gpt-5-6-terra": {
    slug: "gpt-5-6-terra", familyKey: "openai", officialName: "GPT-5.6 Terra", modelType: "균형형 추론 모델", summary: "성능, 속도와 비용의 균형을 목표로 한 OpenAI의 GPT-5.6 모델입니다.", configurationNote: "‘max’는 모델명이 아니라 평가의 추론 노력 설정입니다.", capabilities: ["텍스트·이미지 입력", "도구 호출", "105만 토큰 컨텍스트"], access: [apiAccess("OpenAI API", "Responses API", "https://developers.openai.com/api/docs/models/gpt-5.6-terra", ["gpt56terra-docs", "openai-pricing"])], prices: [{ label: "OpenAI API", billingType: "api", price: "입력 $2 · 캐시 입력 $0.20 · 출력 $12", unit: "미화 / 100만 토큰", observedAt: checked, sourceIds: ["gpt56terra-docs", "openai-pricing"] }], glossaryTerms: [], sources: [source("gpt56terra-docs", "GPT-5.6 Terra 모델 문서", "https://developers.openai.com/api/docs/models/gpt-5.6-terra", "documentation")], status: "published", lastVerifiedAt: checked,
  },
  "claude-opus-5-5": {
    slug: "claude-opus-5-5", familyKey: "anthropic", officialName: "Claude Opus 5.5", releaseDate: "2026-09-22", modelType: "코딩·지식 업무 모델", summary: "Anthropic이 복잡한 코딩과 지식 업무를 위해 출시한 Claude 5.5 계열 모델입니다.", configurationNote: "괄호 안 표기는 공식 제품명이 아니라 리더보드 평가 설정입니다. 일부 안전 분류 요청은 fallback 설정에 따라 다른 모델로 처리될 수 있습니다.", capabilities: ["텍스트·이미지 입력", "코딩과 도구 사용", "적응형 추론"],
    access: [{ kind: "web", label: "Claude", platform: "웹 · 모바일 · 데스크톱", freeAccess: "limited", requirements: "공식 발표 기준 Pro, Max, Team 등 요금제의 사용량 한도가 적용됩니다.", technicalLevel: "쉬움", steps: ["Claude에 로그인합니다.", "현재 요금제의 모델 이용 가능 여부를 확인합니다.", "모델 선택 메뉴에서 Opus 5.5를 선택합니다."], url: "https://claude.ai/", sourceIds: ["opus55-release", "anthropic-plans"] }, apiAccess("Claude API", "Anthropic Console", "https://console.anthropic.com/", ["opus55-release", "anthropic-pricing"])],
    prices: [{ label: "Claude API", billingType: "api", price: "입력 $4 · 캐시 읽기 $0.20 · 출력 $20", unit: "미화 / 100만 토큰", observedAt: checked, sourceIds: ["opus55-release"] }, { label: "Claude 앱 구독", billingType: "subscription", price: "요금제별 상이", unit: "월 구독 · 공식 요금표 확인", observedAt: checked, sourceIds: ["anthropic-plans"] }],
    glossaryTerms: [], sources: [source("opus55-release", "Claude Opus 5.5 발표", "https://www.anthropic.com/claude-opus-5-5", "release")], status: "published", lastVerifiedAt: checked,
  },
  "claude-fable-5-1": {
    slug: "claude-fable-5-1", familyKey: "anthropic", officialName: "Claude Fable 5.1", releaseDate: "2026-09-01", modelType: "장기 실행 코딩·지식 업무 모델", summary: "오래 이어지는 비동기 코딩과 복잡한 지식 업무를 위해 Anthropic이 제공하는 모델입니다.", configurationNote: "Adaptive Reasoning·Max Effort·Default Fallback은 평가 설정이며 공식 모델명은 Claude Fable 5.1입니다.", capabilities: ["텍스트·이미지 입력", "장기 코딩 작업", "도구 호출", "적응형 추론"],
    access: [{ kind: "web", label: "Claude · Claude Code", platform: "웹 · 앱 · 개발 도구", freeAccess: "no", requirements: "공식 발표 기준 Pro, Max, Team 또는 Enterprise 등 지원 요금제가 필요합니다.", technicalLevel: "쉬움", steps: ["Claude 또는 Claude Code에 로그인합니다.", "지원 요금제와 사용량 크레딧을 확인합니다.", "모델 선택 메뉴에서 Fable 5.1을 선택합니다."], url: "https://claude.ai/", sourceIds: ["fable51-release", "anthropic-plans"] }, apiAccess("Claude API", "Anthropic Console", "https://console.anthropic.com/", ["fable51-release", "anthropic-pricing"])],
    prices: [{ label: "Claude API", billingType: "api", price: "입력 $10 · 캐시 읽기 $0.25 · 출력 $50", unit: "미화 / 100만 토큰", observedAt: checked, sourceIds: ["fable51-release"] }, { label: "Claude 앱 구독", billingType: "subscription", price: "요금제별 상이", unit: "월 구독 · 공식 요금표 확인", observedAt: checked, sourceIds: ["anthropic-plans"] }],
    glossaryTerms: [], sources: [source("fable51-release", "Claude Fable 5.1 발표", "https://www.anthropic.com/claude-fable-and-mythos-5-1?frmapp=yes", "release")], status: "published", lastVerifiedAt: checked,
  },
  "claude-opus-5": {
    slug: "claude-opus-5", familyKey: "anthropic", officialName: "Claude Opus 5", releaseDate: "2026-07-24", modelType: "코딩·지식 업무 모델", summary: "일상적인 고난도 코딩과 지식 업무를 위해 Anthropic이 출시한 Opus 모델입니다.", configurationNote: "괄호 안 표기는 리더보드 평가의 추론 노력과 안전 fallback 설정입니다.", capabilities: ["텍스트·이미지 입력", "코딩과 지식 업무", "노력 수준 조절"], access: [{ kind: "web", label: "Claude · Claude Code", platform: "웹 · 앱 · 개발 도구", freeAccess: "no", requirements: "공식 발표 기준 Claude Pro와 Max 등 지원 요금제가 필요합니다.", technicalLevel: "쉬움", steps: ["Claude에 로그인합니다.", "지원 요금제를 확인합니다.", "모델 선택 메뉴에서 Opus 5를 선택합니다."], url: "https://claude.ai/", sourceIds: ["opus5-release", "anthropic-plans"] }, apiAccess("Claude API", "Anthropic Console", "https://console.anthropic.com/", ["opus5-release", "anthropic-pricing"])], prices: [{ label: "Claude API", billingType: "api", price: "입력 $5 · 출력 $25", unit: "미화 / 100만 토큰", note: "Fast mode는 기본 API 가격의 2배입니다.", observedAt: checked, sourceIds: ["opus5-release"] }], glossaryTerms: [], sources: [source("opus5-release", "Claude Opus 5 발표", "https://www.anthropic.com/news/claude-opus-5", "release")], status: "published", lastVerifiedAt: checked,
  },
  "glm-5-3": {
    slug: "glm-5-3", familyKey: "glm", officialName: "GLM-5.3", modelType: "오픈 웨이트 혼합 전문가 모델", summary: "744B 전체 파라미터 중 요청마다 약 40B를 활성화하는 Z AI의 대형 모델입니다.", configurationNote: "‘max’는 리더보드 평가의 추론 설정입니다.", capabilities: ["텍스트 생성", "코딩", "함수 호출", "직접 배포"], access: [{ kind: "web", label: "Z AI Chat", platform: "웹", freeAccess: "limited", requirements: "Z AI 계정이 필요하며 이용 한도는 공식 서비스에서 확인해야 합니다.", technicalLevel: "쉬움", steps: ["Z AI Chat에 로그인합니다.", "모델 선택 메뉴에서 GLM-5.3 이용 가능 여부를 확인합니다."], url: "https://chat.z.ai/", sourceIds: ["glm-access"] }, apiAccess("Z AI API", "Z AI 개발자 플랫폼", "https://z.ai/model-api", ["glm-pricing"]), { kind: "local", label: "공식 가중치", platform: "다중 GPU 서버", freeAccess: "yes", requirements: "라이선스 확인, 대용량 저장소와 여러 GPU가 필요합니다.", technicalLevel: "개발자용", steps: ["공식 Hugging Face 저장소에서 라이선스를 읽습니다.", "Transformers, vLLM 또는 SGLang 환경을 준비합니다.", "원하는 정밀도의 가중치를 내려받아 서버에서 실행합니다."], url: "https://huggingface.co/zai-org/GLM-5.3", sourceIds: ["glm-github", "glm-hf"] }], prices: [{ label: "Z AI API", billingType: "api", price: "공식 가격 확인 필요", unit: "사용 전 공식 가격표 확인", observedAt: checked, sourceIds: ["glm-pricing"] }, { label: "공식 가중치", billingType: "open-weights", price: "다운로드 가능", unit: "인프라 비용은 별도", observedAt: checked, sourceIds: ["glm-hf"] }],
    openWeights: { license: "GLM-5.3 License — 상업 이용 전 원문 확인", licenseUrl: "https://huggingface.co/zai-org/GLM-5.3/blob/main/LICENSE", downloadUrl: "https://huggingface.co/zai-org/GLM-5.3", meaning: "모델 가중치를 받을 수 있지만 라이선스 조건과 실행 프로그램의 소스 공개 여부는 별개입니다.", parameterScale: "총 744B · 활성 40B", precisions: "공식 저장소 FP8 중심, BF16 정보 제공", estimatedWeightMemory: "FP8 원시 가중치만 약 744GB, BF16 환산 약 1.49TB. 공식 저장소 파일은 약 756GB입니다.", runtimeMemoryNote: "이 값은 최소 VRAM이 아닙니다. 실행 시 KV 캐시, 프레임워크와 컨텍스트 길이에 따른 추가 메모리가 필요합니다.", cpuGpuNote: "CPU만으로도 이론상 가능하지만 매우 느리고 대용량 RAM이 필요합니다. 실사용은 여러 서버급 GPU가 현실적입니다.", tools: [{ name: "Transformers", url: "https://huggingface.co/docs/transformers" }, { name: "vLLM", url: "https://docs.vllm.ai/" }, { name: "SGLang", url: "https://docs.sglang.ai/" }], steps: ["라이선스와 저장 공간을 확인합니다.", "공식 저장소의 최신 실행 지침을 선택합니다.", "여러 GPU에 가중치를 분산하고 짧은 컨텍스트로 먼저 검증합니다."], sourceIds: ["glm-github", "glm-hf"] }, glossaryTerms: [], sources: [], status: "published", lastVerifiedAt: checked,
  },
  "glm-5-3-flash": {
    slug: "glm-5-3-flash", familyKey: "glm", officialName: "GLM-5.3-Flash", releaseDate: "2026-09-22", modelType: "오픈 웨이트 고속 혼합 전문가 모델", summary: "GLM-5.3 계열에서 속도와 배포 효율을 우선한 320B 규모 모델입니다.", capabilities: ["텍스트·이미지 입력", "코딩", "함수 호출", "직접 배포"], access: [{ kind: "web", label: "Z AI Chat", platform: "웹", freeAccess: "limited", requirements: "Z AI 계정과 서비스 한도 확인이 필요합니다.", technicalLevel: "쉬움", steps: ["Z AI Chat에 로그인합니다.", "모델 메뉴에서 GLM-5.3-Flash를 선택합니다."], url: "https://chat.z.ai/", sourceIds: ["glm-flash-release"] }, apiAccess("Z AI API", "Z AI 개발자 플랫폼", "https://z.ai/model-api", ["glm-pricing"]), { kind: "local", label: "공식 가중치", platform: "다중 GPU 서버", freeAccess: "yes", requirements: "라이선스 확인과 대용량 GPU 메모리가 필요합니다.", technicalLevel: "개발자용", steps: ["공식 저장소에서 라이선스를 확인합니다.", "vLLM·SGLang 등의 공식 예제로 배포합니다."], url: "https://huggingface.co/zai-org/GLM-5.3-Flash", sourceIds: ["glm-flash-release", "glm-flash-weights"] }], prices: [{ label: "Z AI API", billingType: "api", price: "공식 가격 확인 필요", unit: "사용 전 공식 가격표 확인", observedAt: checked, sourceIds: ["glm-pricing"] }, { label: "공식 가중치", billingType: "open-weights", price: "다운로드 가능", unit: "인프라 비용은 별도", observedAt: checked, sourceIds: ["glm-flash-weights"] }], openWeights: { license: "GLM-5.3 License — 상업 이용 전 원문 확인", licenseUrl: "https://huggingface.co/zai-org/GLM-5.3-Flash/blob/main/LICENSE", downloadUrl: "https://huggingface.co/zai-org/GLM-5.3-Flash", meaning: "공개 가중치를 자체 서버에서 실행할 수 있습니다. 소스코드 전체 공개와는 다른 개념입니다.", parameterScale: "총 320B · 활성 18B", precisions: "공식 저장소 FP8/BF16 정보 제공", estimatedWeightMemory: "FP8 원시 가중치 약 320GB, BF16 환산 약 640GB로 추정됩니다.", runtimeMemoryNote: "추정 가중치 메모리이며 최소 VRAM이 아닙니다. KV 캐시와 긴 컨텍스트에 추가 메모리가 듭니다.", cpuGpuNote: "CPU 실행은 매우 느릴 수 있습니다. 원본 정밀도 실사용은 여러 서버급 GPU가 적합합니다.", tools: [{ name: "vLLM", url: "https://docs.vllm.ai/" }, { name: "SGLang", url: "https://docs.sglang.ai/" }], steps: ["라이선스를 읽고 정밀도를 선택합니다.", "다중 GPU 실행 환경을 준비합니다.", "공식 예제로 짧은 요청부터 검증합니다."], sourceIds: ["glm-flash-weights"] }, glossaryTerms: [], sources: [source("glm-flash-release", "GLM-5.3-Flash 발표", "https://autoclaw.z.ai/blog/model/glm-5.3-flash/", "release"), source("glm-flash-weights", "GLM-5.3-Flash 공식 가중치", "https://huggingface.co/zai-org/GLM-5.3-Flash", "runtime")], status: "published", lastVerifiedAt: checked,
  },
  "mimo-v2-6-pro": {
    slug: "mimo-v2-6-pro", familyKey: "mimo", officialName: "MiMo-V2.6-Pro", modelType: "오픈 웨이트 멀티모달 모델", summary: "Xiaomi가 API와 공개 가중치로 제공하는 100만 토큰 멀티모달 모델입니다.", capabilities: ["텍스트·이미지·영상·음성 입력", "코딩과 도구 호출", "100만 토큰 컨텍스트", "직접 배포"], access: [{ kind: "app", label: "MiMo Claw", platform: "공식 에이전트 도구", freeAccess: "limited", requirements: "공식 페이지의 제한된 무료 체험과 현재 이용 조건을 확인해야 합니다.", technicalLevel: "보통", steps: ["MiMo 공식 페이지에 로그인합니다.", "MiMo Claw 체험 가능 여부를 확인합니다.", "V2.6 Pro 모델로 새 작업을 시작합니다."], url: "https://mimo.mi.com/", sourceIds: ["mimo-model"] }, apiAccess("MiMo API", "OpenAI·Anthropic 호환 API", "https://mimo.mi.com/", ["mimo-model"]), { kind: "local", label: "공식 가중치", platform: "다중 GPU 서버", freeAccess: "yes", requirements: "라이선스와 대용량 서버 자원이 필요합니다.", technicalLevel: "개발자용", steps: ["공식 저장소의 라이선스와 모델 카드를 확인합니다.", "지원 런타임과 여러 GPU를 준비합니다.", "공식 실행 예제로 먼저 검증합니다."], url: "https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL", sourceIds: ["mimo-release", "mimo-weights"] }], prices: [{ label: "MiMo API", billingType: "api", price: "입력 $0.435 · 캐시 입력 $0.0036 · 출력 $0.87", unit: "미화 / 100만 토큰", observedAt: checked, sourceIds: ["mimo-model"] }, { label: "공식 가중치", billingType: "open-weights", price: "다운로드 가능", unit: "인프라 비용은 별도", observedAt: checked, sourceIds: ["mimo-weights"] }], openWeights: { license: "공식 모델 저장소 LICENSE 적용 — 상업 이용 전 원문 확인", licenseUrl: "https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL/blob/main/LICENSE", downloadUrl: "https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL", meaning: "가중치와 연구 자료가 공개됐습니다. 가중치 공개와 전체 서비스 소스 공개는 같은 뜻이 아닙니다.", parameterScale: "공식 저장소 표기 524B", precisions: "공식 저장소 제공 파일 기준 확인", estimatedWeightMemory: "BF16 단순 환산은 약 1.05TB입니다. 실제 배포 파일과 양자화 방식에 따라 달라집니다.", runtimeMemoryNote: "단순 환산치는 최소 VRAM이 아닙니다. KV 캐시, 영상·긴 컨텍스트와 런타임 메모리가 더 필요합니다.", cpuGpuNote: "원본 모델은 개인 PC보다 다중 GPU 서버에 적합합니다. 작은 Distill 모델은 별도 모델이므로 성능을 동일시하면 안 됩니다.", tools: [{ name: "공식 모델 카드", url: "https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL" }], steps: ["라이선스와 모델 카드의 지원 런타임을 확인합니다.", "정밀도와 다중 GPU 구성을 정합니다.", "짧은 컨텍스트로 기능을 검증한 뒤 확장합니다."], sourceIds: ["mimo-release", "mimo-weights"] }, glossaryTerms: [], sources: [], status: "published", lastVerifiedAt: checked,
  },
  "grok-4-6": {
    slug: "grok-4-6", familyKey: "grok", officialName: "Grok 4.6", releaseDate: "2026-08-12", modelType: "코딩·에이전트 모델", summary: "장기 에이전트와 시각적·대화형 프로젝트 작업을 위해 SpaceXAI가 출시한 모델입니다.", configurationNote: "‘high’는 리더보드 평가의 추론 노력 설정입니다.", capabilities: ["코딩", "조사와 지식 업무", "도구 사용", "50만 토큰 컨텍스트"], access: [{ kind: "web", label: "Grok Build", platform: "웹 · 모바일 · 명령줄", freeAccess: "limited", requirements: "공식 안내의 무료 포함량과 현재 요금제를 확인해야 합니다.", technicalLevel: "쉬움", steps: ["Grok Build에 로그인합니다.", "모델 선택에서 Grok 4.6을 확인합니다.", "새 프로젝트나 대화를 시작합니다."], url: "https://x.ai/build", sourceIds: ["grok46-release"] }, apiAccess("SpaceXAI API", "SpaceXAI Console", "https://console.x.ai/", ["grok46-release"])], prices: [{ label: "SpaceXAI API", billingType: "api", price: "입력 $2 · 출력 $6부터", unit: "미화 / 100만 토큰", note: "Fast 변형은 2배 가격입니다.", observedAt: checked, sourceIds: ["grok46-release"] }], glossaryTerms: [], sources: [source("grok-release", "Grok 4.6 발표", "https://x.ai/news/grok-4-6", "release"), source("grok-docs", "Grok 모델 문서", "https://docs.x.ai/developers/models", "documentation"), source("grok46-release", "Grok 4.6 발표", "https://x.ai/news/grok-4-6", "release")], status: "published", lastVerifiedAt: checked,
  },
  "grok-4-7": {
    slug: "grok-4-7", familyKey: "grok", officialName: "Grok 4.7", releaseDate: "2026-09-21", modelType: "코딩·지식 업무 모델", summary: "SpaceXAI가 코딩과 지식 업무를 위해 출시한 Grok 4 계열 최신 모델입니다.", configurationNote: "‘xhigh’는 가장 높은 추론 노력 설정이며 별도 모델명이 아닙니다.", capabilities: ["코딩", "지식 업무", "도구 사용", "추론 노력 조절"], access: [{ kind: "web", label: "Grok Build", platform: "웹 · 모바일 · 명령줄", freeAccess: "limited", requirements: "공식 안내의 무료 포함량과 현재 요금제를 확인해야 합니다.", technicalLevel: "쉬움", steps: ["Grok Build에 로그인합니다.", "모델 선택에서 Grok 4.7을 선택합니다.", "필요한 추론 노력을 설정합니다."], url: "https://x.ai/build", sourceIds: ["grok47-release"] }, apiAccess("SpaceXAI API", "SpaceXAI Console", "https://console.x.ai/", ["grok47-release", "grok47-docs"])], prices: [{ label: "SpaceXAI API", billingType: "api", price: "입력 $2 · 출력 $6부터", unit: "미화 / 100만 토큰", note: "Fast 처리와 긴 컨텍스트는 공식 가격표를 확인해야 합니다.", observedAt: checked, sourceIds: ["grok47-release"] }], glossaryTerms: [], sources: [source("grok-release", "Grok 4.7 발표", "https://x.ai/news/grok-4-7", "release"), source("grok-docs", "Grok 모델 문서", "https://docs.x.ai/developers/models", "documentation"), source("grok47-release", "Grok 4.7 발표", "https://x.ai/news/grok-4-7", "release"), source("grok47-docs", "Grok 4.7 모델 문서", "https://docs.x.ai/developers/models/grok-4.7", "documentation")], status: "published", lastVerifiedAt: checked,
  },
  "kimi-k3": {
    slug: "kimi-k3", familyKey: "kimi", officialName: "Kimi K3", releaseDate: "2026-07-16", modelType: "오픈 웨이트 멀티모달 혼합 전문가 모델", summary: "Kimi 웹·개발 도구·API와 공개 가중치로 이용할 수 있는 Moonshot AI의 모델입니다.", configurationNote: "‘max’는 리더보드 평가의 추론 노력 설정입니다.", capabilities: ["텍스트·이미지 입력", "100만 토큰 컨텍스트", "코딩과 에이전트 작업", "직접 배포"], access: [{ kind: "web", label: "Kimi", platform: "웹", freeAccess: "limited", requirements: "Kimi 계정과 현재 사용량 한도 확인이 필요합니다.", technicalLevel: "쉬움", steps: ["Kimi 웹에 로그인합니다.", "모델 메뉴에서 K3를 선택합니다.", "문서나 이미지를 첨부해 대화를 시작합니다."], url: "https://www.kimi.com/", sourceIds: ["kimi-release"] }, { kind: "app", label: "Kimi Code", platform: "명령줄 · 개발 도구", freeAccess: "limited", requirements: "설치와 Kimi 계정 또는 API 설정이 필요합니다.", technicalLevel: "보통", steps: ["공식 Kimi Code 문서를 엽니다.", "도구를 설치하고 로그인합니다.", "/model에서 Kimi K3를 선택합니다."], url: "https://www.kimi.com/code/docs/en/kimi-code/models.html", sourceIds: ["kimi-code"] }, apiAccess("Kimi API", "Moonshot AI 플랫폼", "https://platform.kimi.com/", ["kimi-platform"]), { kind: "local", label: "공식 가중치", platform: "대규모 다중 GPU 서버", freeAccess: "yes", requirements: "Kimi K3 License와 대규모 서버 자원이 필요합니다.", technicalLevel: "개발자용", steps: ["Kimi K3 License의 상업 조건을 읽습니다.", "공식 모델 카드의 지원 런타임을 준비합니다.", "가중치를 여러 GPU에 분산해 실행합니다."], url: "https://huggingface.co/moonshotai/Kimi-K3", sourceIds: ["kimi-weights", "kimi-license"] }], prices: [{ label: "Kimi API", billingType: "api", price: "캐시 적중 입력 $0.30 · 입력 $3 · 출력 $15", unit: "미화 / 100만 토큰", observedAt: checked, sourceIds: ["kimi-release", "kimi-platform"] }, { label: "공식 가중치", billingType: "open-weights", price: "다운로드 가능", unit: "인프라 비용은 별도", observedAt: checked, sourceIds: ["kimi-weights"] }], openWeights: { license: "Kimi K3 License — 대규모 상업 서비스에 추가 조건", licenseUrl: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/LICENSE", downloadUrl: "https://huggingface.co/moonshotai/Kimi-K3", meaning: "가중치와 실행 자료를 내려받을 수 있습니다. 일정 규모 이상의 Model-as-a-Service와 대형 상업 제품에는 라이선스 추가 조건이 있습니다.", parameterScale: "총 2.8T · 896개 전문가 중 16개 활성", precisions: "공식 저장소 제공 형식 기준", estimatedWeightMemory: "파라미터 수만으로 실제 최소 VRAM을 정할 수 없습니다. 공식 체크포인트 파일 크기와 선택한 정밀도를 먼저 확인해야 합니다.", runtimeMemoryNote: "KV 캐시와 100만 토큰 컨텍스트 사용량이 매우 크므로 가중치 외 메모리를 별도로 잡아야 합니다.", cpuGpuNote: "전체 K3는 개인 PC용이 아니라 대규모 다중 GPU 서버용입니다. 외부 호스팅 API가 초보자에게 현실적입니다.", tools: [{ name: "공식 모델 카드", url: "https://huggingface.co/moonshotai/Kimi-K3" }], steps: ["라이선스의 상업 조건을 확인합니다.", "공식 모델 카드에서 체크포인트와 런타임을 확인합니다.", "다중 GPU 서버에서 짧은 컨텍스트로 먼저 검증합니다."], sourceIds: ["kimi-weights", "kimi-license"] }, glossaryTerms: [], sources: [], status: "published", lastVerifiedAt: checked,
  },
  "step-5": {
    slug: "step-5", familyKey: "step", officialName: "Step 5 Preview", releaseDate: "2026-09", modelType: "Preview 에이전트 모델", summary: "StepFun이 공식 서비스와 API에서 미리보기로 제공하는 대형 에이전트 모델입니다.", capabilities: ["텍스트·이미지 입력", "코딩", "100만 토큰 컨텍스트", "도구 사용"], access: [{ kind: "web", label: "StepFun 공식 제품", platform: "웹", freeAccess: "unknown", requirements: "계정과 지역·요금제별 이용 가능 여부를 공식 페이지에서 확인해야 합니다.", technicalLevel: "쉬움", steps: ["공식 Step 5 페이지를 엽니다.", "지원 제품으로 이동해 로그인합니다.", "Preview 이용 가능 여부를 확인합니다."], url: "https://www.stepfun.com/step-5-preview", sourceIds: ["step-model"] }, apiAccess("StepFun API", "StepFun 개발자 플랫폼", "https://platform.stepfun.com/", ["step-platform"], "계정, API 키가 필요하며 공개된 가격표를 사용 전에 확인해야 합니다.")], prices: [{ label: "StepFun API", billingType: "api", price: "공식 가격 확인 필요", unit: "사용 전 개발자 플랫폼 확인", observedAt: checked, sourceIds: ["step-platform"] }], glossaryTerms: [], sources: [], status: "published", lastVerifiedAt: checked,
  },
  "gemini-3-8-flash": {
    slug: "gemini-3-8-flash", familyKey: "gemini", officialName: "Gemini 3.8 Flash", releaseDate: "2026-09-02", modelType: "멀티모달 추론·에이전트 모델", summary: "Google이 긴 코딩 작업, 도구 사용과 빠른 응답을 위해 제공하는 Gemini 3 계열 모델입니다.", configurationNote: "리더보드의 ‘high’는 공식 모델명의 일부가 아니라 지원되는 추론 수준 중 높은 설정을 사용했다는 뜻입니다.", capabilities: ["텍스트·이미지 등 멀티모달 입력", "코딩과 도구 호출", "100만 토큰 컨텍스트", "추론 수준 조절"],
    access: [
      { kind: "web", label: "Gemini 앱", platform: "웹 · 모바일 앱", freeAccess: "no", requirements: "공식 발표 기준 이 모델 선택은 Google AI Pro 또는 Ultra 등 지원 요금제가 필요합니다.", technicalLevel: "쉬움", steps: ["Gemini 앱에 로그인합니다.", "지원 요금제를 확인합니다.", "모델 선택 메뉴에서 Gemini 3.8 Flash를 선택합니다."], url: "https://gemini.google.com/", sourceIds: ["gemini-release"] },
      { kind: "api", label: "Google AI Studio · Gemini API", platform: "웹 개발자 도구 · API", freeAccess: "limited", requirements: "Google 계정과 API 키가 필요하며 무료 할당량과 결제 조건은 AI Studio에서 확인해야 합니다.", technicalLevel: "개발자용", steps: ["Google AI Studio에 로그인합니다.", "Gemini API 키와 현재 할당량을 확인합니다.", "gemini-3.8-flash 모델 ID로 첫 요청을 보냅니다."], url: "https://aistudio.google.com/", sourceIds: ["gemini-release", "gemini-docs"] },
    ],
    prices: [
      { label: "Gemini API 소개 가격", billingType: "api", price: "입력 $0.75 · 출력 $3.75", unit: "미화 / 100만 토큰", note: "2026년 12월 31일까지 적용되는 공식 소개 가격입니다.", observedAt: checked, sourceIds: ["gemini-release"] },
      { label: "Gemini API 표준 가격", billingType: "api", price: "입력 $1.50 · 출력 $7.50", unit: "미화 / 100만 토큰", note: "공식 발표 기준 2027년 1월 1일부터 적용 예정입니다.", observedAt: checked, sourceIds: ["gemini-release"] },
      { label: "Gemini 앱", billingType: "subscription", price: "지원 요금제의 현재 가격 확인 필요", unit: "Google 공식 요금제", observedAt: checked, sourceIds: ["gemini-release"] },
    ],
    glossaryTerms: [], sources: [], status: "published", lastVerifiedAt: checked,
  },
  "qwen3-8-2-4t-a95b": {
    slug: "qwen3-8-2-4t-a95b", familyKey: "qwen-open", officialName: "Qwen3.8-2.4T-A95B", releaseDate: "2026-08-12", modelType: "오픈 웨이트 텍스트 혼합 전문가 모델", summary: "Alibaba가 API와 공개 가중치로 제공하는 2.4T 규모의 텍스트 모델입니다.", capabilities: ["텍스트 입력·출력", "코딩", "함수 호출과 구조화 출력", "최대 약 100만 토큰 확장 컨텍스트", "직접 배포"],
    access: [
      apiAccess("Alibaba Cloud Model Studio", "Qwen API · 국제 리전", "https://modelstudio.console.alibabacloud.com/", ["qwen-open-docs"], "Alibaba Cloud 계정과 API 키가 필요하며 선택한 리전의 가격과 가용성을 확인해야 합니다."),
      { kind: "local", label: "공식 가중치", platform: "대규모 다중 GPU 서버", freeAccess: "yes", requirements: "Qwen3.8 Max License 확인과 수 TB 규모 가중치를 처리할 서버 인프라가 필요합니다.", technicalLevel: "개발자용", steps: ["공식 라이선스의 상업 이용 조건을 읽습니다.", "BF16 또는 FP8 가중치와 지원 런타임을 선택합니다.", "여러 GPU 서버에서 짧은 컨텍스트 요청부터 검증합니다."], url: "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B", sourceIds: ["qwen-open-weights", "qwen-open-license", "qwen-open-fp8"] },
    ],
    prices: [
      { label: "Model Studio API · 싱가포르 국제 리전", billingType: "api", price: "입력 $2 · 출력 $6 · 캐시 적중 입력 $0.25", unit: "미화 / 100만 토큰", note: "리전별 가격이 다르므로 다른 리전의 단가와 혼합하지 않았습니다.", observedAt: checked, sourceIds: ["qwen-open-docs"] },
      { label: "공식 가중치", billingType: "open-weights", price: "다운로드 가능", unit: "스토리지·GPU·운영비 별도", observedAt: checked, sourceIds: ["qwen-open-weights", "qwen-open-license"] },
    ],
    openWeights: { license: "Qwen3.8 Max License — 대규모 상업 서비스 및 제품 표시에 추가 조건", licenseUrl: "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B/blob/main/LICENSE", downloadUrl: "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B", meaning: "모델이 학습한 가중치를 내려받아 라이선스 조건에 따라 직접 실행할 수 있습니다. 서비스 전체 소스코드가 공개됐다는 뜻은 아닙니다.", parameterScale: "총 2.4T · 요청당 약 95B 활성", precisions: "공식 BF16 및 FP8 체크포인트", estimatedWeightMemory: "BF16 단순 환산은 약 4.8TB이고 공식 BF16 저장소는 약 4.89TB입니다. FP8 단순 환산은 약 2.4TB입니다.", runtimeMemoryNote: "가중치 크기는 최소 VRAM이 아닙니다. 런타임, KV 캐시, 배치와 긴 컨텍스트에 추가 메모리가 필요합니다.", cpuGpuNote: "전체 모델의 CPU 실행은 실용적이지 않습니다. 여러 서버급 GPU에 분산하는 배포가 적합하며 초보자는 공식 API가 현실적입니다.", tools: [{ name: "vLLM", url: "https://docs.vllm.ai/" }, { name: "SGLang", url: "https://docs.sglang.ai/" }, { name: "TokenSpeed", url: "https://github.com/QwenLM/TokenSpeed" }], steps: ["라이선스와 상업 이용 조건을 확인합니다.", "BF16·FP8 중 정밀도와 여러 GPU 구성을 선택합니다.", "공식 모델 카드의 명령으로 짧은 요청을 먼저 검증합니다.", "컨텍스트 길이를 늘리며 KV 캐시와 전체 메모리를 측정합니다."], sourceIds: ["qwen-open-weights", "qwen-open-license", "qwen-open-fp8"] },
    glossaryTerms: [], sources: [], status: "published", lastVerifiedAt: checked,
  },
  "qwen3-8-max": {
    slug: "qwen3-8-max", familyKey: "qwen", officialName: "Qwen3.8-Max-0902", releaseDate: "2026-09-02", modelType: "호스팅 멀티모달 모델", summary: "Alibaba Cloud Model Studio에서 API로 사용하는 Qwen3.8 Max의 2026년 9월 2일 고정 버전입니다.", capabilities: ["텍스트·이미지·영상 입력", "코딩", "함수 호출과 구조화 출력", "100만 토큰 컨텍스트"], access: [apiAccess("Alibaba Cloud Model Studio", "Qwen API", "https://modelstudio.console.alibabacloud.com/", ["qwen-docs", "qwen-pricing"], "Alibaba Cloud 계정, API 키와 지원 지역 확인이 필요합니다.")], prices: [{ label: "Model Studio API", billingType: "api", price: "공식 가격 확인 필요", unit: "지역별 공식 가격표 확인", observedAt: checked, sourceIds: ["qwen-pricing"] }], glossaryTerms: [], sources: [], status: "published", lastVerifiedAt: checked,
  },
};

export const publishedGuideSlugs = Object.keys(versions);
export const modelGuideFamilies = families;
export const modelVersionGuides = versions;

export function resolveModelGuide(model: Pick<Model, "slug" | "name" | "provider" | "version">): ResolvedModelGuide {
  const version = versions[model.slug];
  if (!version) {
    return {
      slug: model.slug, familyKey: `pending:${model.provider.toLowerCase()}`, officialName: model.name, provider: model.provider,
      modelType: "모델 유형 확인 중", summary: `${model.provider}의 ${model.name}에 대한 공식 소개와 이용 조건을 확인하고 있습니다.`,
      introduction: `현재 확인된 정보는 리더보드에 등록된 모델명, 제공사와 버전(${model.version})뿐입니다. 확인되지 않은 기능, 가격 또는 사용 경로는 표시하지 않습니다.`,
      capabilities: [], access: [], prices: [], useCases: [], strengths: [],
      cautions: [{ title: "정보 확인 중", description: "공식 발표, 가격표와 이용 문서가 검증될 때까지 추측한 설명을 공개하지 않습니다.", sourceIds: [] }],
      glossaryTerms: ["벤치마크", "환각"], sources: [], status: "pending", lastVerifiedAt: checked,
    };
  }
  const family = families[version.familyKey];
  const sources = [...family.sources, ...version.sources].filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
  return { ...version, provider: family.provider, introduction: family.introduction, useCases: family.useCases, strengths: family.strengths, cautions: family.cautions, glossaryTerms: [...new Set([...family.glossaryTerms, ...version.glossaryTerms])], sources };
}
