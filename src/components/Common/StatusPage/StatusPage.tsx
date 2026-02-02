'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useI18n } from '@/context/I18nContext';
import styles from './StatusPage.module.css';

type StatusCode = 400 | 401 | 403 | 404;

const getDefaultCopyKeyPrefix = (code: StatusCode) => {
  if (code === 400) return 'Error.400';
  if (code === 401) return 'Error.401';
  if (code === 403) return 'Error.403';
  return 'Error.404';
};

export default function StatusPage({
  code,
  homeHref = '/',
  secondaryHref,
}: {
  code: StatusCode;
  homeHref?: string;
  secondaryHref?: { href: string; labelKey: string };
}) {
  const { t } = useI18n();

  const prefix = useMemo(() => getDefaultCopyKeyPrefix(code), [code]);

  return (
    <div className={styles.page}>
      <section className={styles.container} aria-labelledby="status-title">
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
    </div>
  );
}

