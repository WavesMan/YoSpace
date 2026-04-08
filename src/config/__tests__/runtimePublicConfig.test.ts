import { describe, expect, it } from "vitest";
import {
  DEFAULT_RUNTIME_PUBLIC_CONFIG,
  normalizeRuntimePublicConfig,
  parseSupportedUiLocales,
} from "@/config/runtimePublicConfig";

describe("normalizeRuntimePublicConfig", () => {
  it("应在缺省输入时补齐默认值", () => {
    const normalized = normalizeRuntimePublicConfig({});
    expect(normalized).toEqual(DEFAULT_RUNTIME_PUBLIC_CONFIG);
  });

  it("应正确解析字符串形式的布尔值与数字", () => {
    const normalized = normalizeRuntimePublicConfig({
      NEXT_PUBLIC_I18N: "false",
      NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE: "24",
      NEXT_PUBLIC_BLOG_TAGS_ENABLED: "false",
      NEXT_PUBLIC_BLOG_RELATED_LIMIT: "88",
    });

    expect(normalized.NEXT_PUBLIC_I18N).toBe(false);
    expect(normalized.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE).toBe(24);
    expect(normalized.NEXT_PUBLIC_BLOG_TAGS_ENABLED).toBe(false);
    expect(normalized.NEXT_PUBLIC_BLOG_RELATED_LIMIT).toBe(88);
  });

  it("应在非法输入时回退默认值", () => {
    const normalized = normalizeRuntimePublicConfig({
      NEXT_PUBLIC_I18N: "invalid",
      NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE: "NaN",
      NEXT_PUBLIC_DEFAULT_LOCALE: "ja-JP",
      NEXT_PUBLIC_BLOG_MODE: "unknown",
    });

    expect(normalized.NEXT_PUBLIC_I18N).toBe(DEFAULT_RUNTIME_PUBLIC_CONFIG.NEXT_PUBLIC_I18N);
    expect(normalized.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE).toBe(DEFAULT_RUNTIME_PUBLIC_CONFIG.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE);
    expect(normalized.NEXT_PUBLIC_DEFAULT_LOCALE).toBe("zh-CN");
    expect(normalized.NEXT_PUBLIC_BLOG_MODE).toBe("internal");
  });
});

describe("parseSupportedUiLocales", () => {
  it("应返回去重且有序的语言列表", () => {
    const locales = parseSupportedUiLocales("en-US,zh-CN,en-US");
    expect(locales).toEqual(["en-US", "zh-CN"]);
  });

  it("应在输入为空时回退默认语言集合", () => {
    const locales = parseSupportedUiLocales(" ,, ");
    expect(locales).toEqual(["zh-CN", "en-US"]);
  });
});
