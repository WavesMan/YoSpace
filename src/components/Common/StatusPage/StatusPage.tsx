'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useI18n } from '@/context/I18nContext';
import styles from './StatusPage.module.css';
import { StatusIcon } from './StatusIcon';
import { StatusCode } from './types';

// NOTE: 通用状态页组件，用于展示 400/401/403/404 等错误信息
// 使用示例：
// <StatusPage code={404} homeHref="/" />
interface StatusPageProps {
  // NOTE: 状态码，根据不同状态渲染对应的文案与图标
  code: StatusCode;
  // NOTE: 返回首页按钮的跳转地址
  homeHref?: string;
  // NOTE: 可选的辅助操作按钮，例如“前往帮助中心”
  secondaryHref?: { href: string; labelKey: string };
}

export default function StatusPage({
  code,
  homeHref = '/',
  secondaryHref,
}: StatusPageProps) {
  // NOTE: 根据状态码生成多语言文案 key 的前缀，例如 Error.404
  const getCopyKeyPrefix = (code: StatusCode) => {
    const prefixMap: Record<StatusCode, string> = {
      400: 'Error.400',
      401: 'Error.401',
      403: 'Error.403',
      404: 'Error.404',
    };
    return prefixMap[code] || 'Error.404';
  };

  const { t } = useI18n();

  // NOTE: 使用 useMemo 避免在渲染过程中重复计算前缀字符串
  const prefix = useMemo(() => getCopyKeyPrefix(code), [code]);

  // NOTE: 页面主体包含图标、标题、描述以及操作按钮，背景渲染状态码装饰文本
  return (
    <div className={styles.page}>
      <section className={styles.container} aria-labelledby="status-title">
        <StatusIcon code={code} />
        <header className={styles.header}>
          <div className={styles.code}>{code}</div>
          <h1 id="status-title" className={styles.title}>
            {t(`${prefix}.Title`)}
          </h1>
          <p className={styles.description}>{t(`${prefix}.Description`)}</p>
        </header>

        <div className={styles.actions}>
          <Link className={`${styles.button} ${styles.primary}`} href={homeHref}>
            {t('Error.Back')}
          </Link>

          {secondaryHref ? (
            <Link className={styles.button} href={secondaryHref.href}>
              {t(secondaryHref.labelKey)}
            </Link>
          ) : null}
        </div>
      </section>
      <div className={styles.backgroundText}>{`<${code}>`}</div>
    </div>
  );
}
