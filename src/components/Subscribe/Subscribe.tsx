"use client";

import React, { useState } from "react";
import blogStyle from "../Blog/Blog.module.css";
import style from "./Subscribe.module.css";
import Background from "../Common/Background/Background";
import { useI18n } from "@/context/I18nContext";
import { useRuntimePublicConfig } from "@/context/RuntimePublicConfigContext";

/**
 * 订阅页面内容组件
 *
 * 展示 RSS 和 Atom 订阅链接，并提供复制与跳转交互能力。
 * 复用博客页面布局，保持站点整体视觉与交互风格一致。
 */
const Subscribe: React.FC = () => {
  const { t } = useI18n();
  const runtimeConfig = useRuntimePublicConfig();
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});

  const envBaseUrl = runtimeConfig.NEXT_PUBLIC_SITE_URL;
  const rssFeedPath = runtimeConfig.NEXT_PUBLIC_RSS_FEED_PATH;
  const atomFeedPath = runtimeConfig.NEXT_PUBLIC_ATOM_FEED_PATH;

  const normalizedBase = envBaseUrl.replace(/\/+$/, "");
  const feedUrls = {
    rss: normalizedBase ? `${normalizedBase}${rssFeedPath}` : rssFeedPath,
    atom: normalizedBase ? `${normalizedBase}${atomFeedPath}` : atomFeedPath,
  };

  /**
   * 复制订阅链接到剪贴板
   *
   * @param text 需要复制的链接文本
   * @param feedType 订阅类型标识（rss 或 atom），用于更新对应按钮的状态
   */
  const copyToClipboard = async (text: string, feedType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus((prev) => ({ ...prev, [feedType]: true }));
      setTimeout(() => {
        setCopyStatus((prev) => ({ ...prev, [feedType]: false }));
      }, 3000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      setCopyStatus((prev) => ({ ...prev, [feedType]: true }));
      setTimeout(() => {
        setCopyStatus((prev) => ({ ...prev, [feedType]: false }));
      }, 3000);
    }
  };

  return (
    <>
      <div className={blogStyle.blog_wrapper}>
        <div className={blogStyle.blog_container}>
          <h1 className={blogStyle.blog_title}>{t("Subscribe.Title")}</h1>
          <p className={style.subscribe_description}>{t("Subscribe.Description")}</p>

          <div className={style.feed_cards}>
            <div className={style.feed_card}>
              <div className={style.card_header}>
                <h3 className={style.card_title}>{t("Subscribe.RSS")}</h3>
                <div className={style.feed_type}>RSS 2.0</div>
              </div>
              <div className={style.url_display}>
                <code>{feedUrls.rss}</code>
              </div>
              <div className={style.card_actions}>
                <button
                  className={`${style.action_btn} ${copyStatus.rss ? style.copied : ""}`}
                  onClick={() => copyToClipboard(feedUrls.rss, "rss")}
                  aria-label={t("Subscribe.CopyURL")}
                  type="button"
                >
                  {copyStatus.rss ? t("Subscribe.CopySuccess") : t("Subscribe.CopyURL")}
                </button>
                <a
                  className={style.action_link}
                  href={feedUrls.rss}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("Subscribe.OpenInApp")}
                >
                  {t("Subscribe.OpenInApp")}
                </a>
              </div>
            </div>

            <div className={style.feed_card}>
              <div className={style.card_header}>
                <h3 className={style.card_title}>{t("Subscribe.Atom")}</h3>
                <div className={style.feed_type}>Atom 1.0</div>
              </div>
              <div className={style.url_display}>
                <code>{feedUrls.atom}</code>
              </div>
              <div className={style.card_actions}>
                <button
                  className={`${style.action_btn} ${copyStatus.atom ? style.copied : ""}`}
                  onClick={() => copyToClipboard(feedUrls.atom, "atom")}
                  aria-label={t("Subscribe.CopyURL")}
                  type="button"
                >
                  {copyStatus.atom ? t("Subscribe.CopySuccess") : t("Subscribe.CopyURL")}
                </button>
                <a
                  className={style.action_link}
                  href={feedUrls.atom}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("Subscribe.OpenInApp")}
                >
                  {t("Subscribe.OpenInApp")}
                </a>
              </div>
            </div>
          </div>

          <div className={style.instructions}>
            <h3 className={style.instructions_title}>{t("Subscribe.Instructions.Title")}</h3>
            <div className={style.instruction_item}>
              <strong>RSS:</strong> {t("Subscribe.Instructions.RSS")}
            </div>
            <div className={style.instruction_item}>
              <strong>Atom:</strong> {t("Subscribe.Instructions.Atom")}
            </div>
            <div className={style.instruction_item}>{t("Subscribe.Instructions.Browser")}</div>
          </div>
        </div>
      </div>
      <Background text="SUBSCRIBE" />
    </>
  );
};

export default Subscribe;
