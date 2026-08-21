"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

declare global {
  interface Window {
    MAds?: {
      show: (options: { placement: string }) => Promise<unknown>;
    };
  }
}

type MAdsLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> & {
  href: string;
  placement: string;
  children: ReactNode;
};

export function MAdsLink({ href, placement, children, target, ...props }: MAdsLinkProps) {
  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const ads = window.MAds;
    if (!ads?.show) return;

    event.preventDefault();

    try {
      await ads.show({ placement });
    } catch {
      // Ads must never block the user's navigation.
    }

    if (target === "_blank") {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      window.location.assign(href);
    }
  }

  return (
    <a href={href} target={target} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
