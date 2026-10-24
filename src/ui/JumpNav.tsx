import { cx } from './cx';
import { Icon, type IconName } from './Icon';

export type JumpItem = { href: string; label: string; count: number; tone?: 'neutral' | 'attention' | 'human'; icon?: IconName };

const TONE = {
  neutral: 'text-ink',
  attention: 'text-attention',
  human: 'text-human',
};

/** Shortcuts to sections of a long page, with counts. Links, not tabs: the page stays one page. One scrolling row on phones. */
export function JumpNav({ items, label }: { items: JumpItem[]; label: string }) {
  return (
    <nav aria-label={label} className="min-w-0">
      <ul className="-m-1 flex gap-2 overflow-x-auto p-1">
        {items.map((item) => (
          <li key={item.href} className="shrink-0">
            <a
              href={item.href}
              className={cx(
                'inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line-input bg-surface px-3 text-sm font-medium',
                'hover:border-ink focus-visible:focus-ring pointer-coarse:min-h-11',
                TONE[item.tone ?? 'neutral'],
              )}
            >
              {item.icon && <Icon name={item.icon} size="sm" />}
              {item.label}
              <span className="rounded-sm bg-sunken px-1.5 text-xs text-ink-muted">{item.count}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
