import { FC } from 'react';
import styles from './StatusIcon.module.css';

import { StatusCode } from './types';

const ForbiddenIcon: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const NotFoundIcon: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
    <path d="M12 12.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0zM12 12.5h-5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0-5z" />
    <path d="M12 7.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2a.5.5 0 0 1 .5-.5z" />
  </svg>
);

const iconMap: Partial<Record<StatusCode, FC>> = {
  403: ForbiddenIcon,
  404: NotFoundIcon,
};

export const StatusIcon: FC<{ code: StatusCode }> = ({ code }) => {
  const Icon = iconMap[code];
  if (!Icon) return null;

  return (
    <div className={styles.iconWrapper}>
      <Icon />
    </div>
  );
};
