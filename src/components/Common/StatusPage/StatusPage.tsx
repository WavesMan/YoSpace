'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useI18n } from '@/context/I18nContext';
import styles from './StatusPage.module.css';
import { StatusIcon } from './StatusIcon';
import { StatusCode } from './types';

export default function StatusPage({
  code,
  homeHref = '/',
  secondaryHref,
}: {
  code: StatusCode;
  homeHref?: string;
  secondaryHref?: { href: string; labelKey: string };
}) {
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

  const prefix = useMemo(() => getCopyKeyPrefix(code), [code]);

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

