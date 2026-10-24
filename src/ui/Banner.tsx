import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon, type IconName } from './Icon';

type BannerTone = 'attention' | 'danger' | 'info' | 'success';

const TONE: Record<BannerTone, { box: string; icon: IconName; iconColor: string }> = {
  attention: { box: 'bg-attention-tint border-attention', icon: 'alert', iconColor: 'text-attention' },
  danger: { box: 'bg-danger-tint border-danger', icon: 'shield', iconColor: 'text-danger' },
  info: { box: 'bg-info-tint border-info', icon: 'sparkle', iconColor: 'text-info' },
  success: { box: 'bg-success-tint border-success', icon: 'check', iconColor: 'text-success' },
};

type BannerProps = {
  tone: BannerTone;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  icon?: IconName;
  className?: string;
};

/** A prominent message about the whole page. Danger banners are announced as alerts. */
export function Banner({ tone, title, children, actions, icon, className }: BannerProps) {
  const t = TONE[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx('flex gap-3 rounded-lg border p-4 text-ink', t.box, className)}
    >
      <Icon name={icon ?? t.icon} className={cx('mt-0.5', t.iconColor)} />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-semibold">{title}</p>
        {children && <div className="space-y-2 text-sm text-ink-muted">{children}</div>}
        {actions && <div className="flex flex-wrap gap-2 pt-1">{actions}</div>}
      </div>
    </div>
  );
}
