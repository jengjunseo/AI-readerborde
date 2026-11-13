import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GuideSourceTitle } from "../src/components/guide-source-title";
import { resolveModelGuide } from "../src/lib/model-guides";

describe("readable model introductions", () => {
  it("makes a descriptive subtitle the source link without repeated source/date labels", () => {
    const guide = resolveModelGuide({ slug: "gpt-6-luna", name: "GPT-6 Luna", provider: "OpenAI", version: "max" });
    const item = guide.useCases.find((entry) => entry.title === "반복 업무 자동화")!;
    const html = renderToStaticMarkup(createElement(GuideSourceTitle, { label: item.title, sourceIds: item.sourceIds, sources: guide.sources }));
    expect(html).toContain('href="https://developers.openai.com/api/docs/models"');
    expect(html).toContain(">반복 업무 자동화</a>");
    expect(html).not.toContain("2026-09-23");
    expect(html).not.toContain("OpenAI API 모델 문서");
    expect(html).toContain("새 탭");
  });

  it("does not invent a source link when no reviewed source exists", () => {
    expect(renderToStaticMarkup(createElement(GuideSourceTitle, { label: "정보 확인 중" }))).toBe("<span>정보 확인 중</span>");
  });

  it("gives Luna its own explanatory paragraph rather than the generic GPT introduction", () => {
    const guide = resolveModelGuide({ slug: "gpt-6-luna", name: "GPT-6 Luna", provider: "OpenAI", version: "max" });
    expect(guide.introduction.length).toBeGreaterThan(350);
    expect(guide.introduction).toContain("고객 문의");
    expect(guide.introduction).toContain("보장하는 것은 아닙니다");
    expect(guide.introduction).not.toBe(guide.summary);
  });

  it("shares a verified base introduction without changing the evaluation identity or claiming API setting availability", () => {
    const guide=resolveModelGuide({slug:"gpt-6-astra-high",name:"GPT-6 Astra (High)",provider:"OpenAI",version:"gpt-6-astra-high"});
    expect(guide.baseGuideSlug).toBe("gpt-6-astra");
    expect(guide.slug).toBe("gpt-6-astra-high");
    expect(guide.status).toBe("published");
    expect(guide.configurationNote).toContain("GPT-6 Astra (High)");
    expect(guide.configurationNote).toContain("따로 확인");
    expect(resolveModelGuide({slug:"gpt-6-astra-high",name:"Different model (High)",provider:"OpenAI",version:"high"}).status).toBe("pending");
  });
});
