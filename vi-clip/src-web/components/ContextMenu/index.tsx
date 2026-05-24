import { useEffect, useRef, useState, useCallback, memo } from "react";
import { createPortal } from "react-dom";

export interface ContextMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  children?: ContextMenuItem[];
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

function getPortalContainer(): HTMLElement {
  const id = "context-menu-portal";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    document.body.appendChild(el);
  }
  return el;
}

const MENU_EST_WIDTH = 180;
const SUBMENU_EST_WIDTH = 140;

export const ContextMenu = memo(function ContextMenu({
  items,
  position,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [openSubKey, setOpenSubKey] = useState<string | null>(null);
  const [subRight, setSubRight] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => {
      setOpenSubKey(null);
    }, 180);
  }, []);

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Use estimated dimensions to decide edge anchoring BEFORE render.
  // This is the key fix: by anchoring to `right` when near the right edge,
  // we don't need accurate width measurement — the menu flows leftward
  // from the window edge, guaranteed to stay in bounds.
  const flipX = position.x + MENU_EST_WIDTH > vw;
  const flipY = position.y + 200 > vh;

  // Submenu flip: if we're already anchoring right, submenu opens left of parent
  const shouldSubRight = flipX || position.x + MENU_EST_WIDTH + SUBMENU_EST_WIDTH > vw;

  useEffect(() => {
    setSubRight(shouldSubRight);
  }, [shouldSubRight]);

  // Auto-close on click outside / Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);
    document.addEventListener("keydown", handleKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  const style: React.CSSProperties = {};

  if (flipX) {
    // Anchor to right edge: menu stays within window, extends leftward
    style.right = Math.max(4, vw - position.x);
    // Prevent left-edge overflow: right can't push menu off the left side
    const maxRight = vw - 4;
    if (style.right > maxRight - MENU_EST_WIDTH) {
      style.right = maxRight - MENU_EST_WIDTH;
    }
  } else {
    style.left = Math.max(4, position.x);
  }

  if (flipY) {
    // Cap top so menu stays above viewport bottom
    style.bottom = Math.max(4, vh - position.y);
  } else {
    style.top = Math.max(4, Math.min(position.y, vh - 220));
  }

  const menu = (
    <div
      ref={menuRef}
      className={`context-menu ${flipX ? "flip-x" : ""} ${flipY ? "flip-y" : ""}`}
      style={style}
      onMouseLeave={scheduleClose}
      onMouseEnter={clearCloseTimer}
    >
      {items.map((item) => {
        if (item.children && item.children.length > 0) {
          const isOpen = openSubKey === item.key;
          return (
            <div
              key={item.key}
              className={`context-menu-item has-submenu ${item.disabled ? "disabled" : ""}`}
              onMouseEnter={() => {
                if (!item.disabled) {
                  clearCloseTimer();
                  setOpenSubKey(item.key);
                }
              }}
            >
              {item.icon && <span className="context-menu-item-icon">{item.icon}</span>}
              <span className="context-menu-item-label">{item.label}</span>
              <span className="context-menu-item-arrow">&#8250;</span>
              {isOpen && (
                <div
                  className={`context-submenu ${subRight ? "submenu-left" : ""}`}
                  onMouseEnter={clearCloseTimer}
                  onMouseLeave={scheduleClose}
                >
                  {item.children.map((child) => (
                    <button
                      key={child.key}
                      className={`context-menu-item ${child.disabled ? "disabled" : ""}`}
                      disabled={child.disabled}
                      onClick={() => {
                        child.onClick?.();
                        onClose();
                      }}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <button
            key={item.key}
            className={`context-menu-item ${item.danger ? "danger" : ""} ${item.disabled ? "disabled" : ""}`}
            onClick={() => {
              if (!item.disabled) {
                item.onClick?.();
                onClose();
              }
            }}
            disabled={item.disabled}
          >
            {item.icon && <span className="context-menu-item-icon">{item.icon}</span>}
            <span className="context-menu-item-label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  return createPortal(menu, getPortalContainer());
});
