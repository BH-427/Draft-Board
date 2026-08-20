"use client";

import { useEffect, useRef, type RefObject } from "react";

const CLICK_SUPPRESS_THRESHOLD = 5; // px of movement before a drag should swallow the trailing click

/** Adds click-and-drag horizontal panning to a scrollable element (touch already scrolls natively). */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onDown = (e: MouseEvent) => {
      dragState.current = { isDown: true, startX: e.pageX, scrollLeft: el.scrollLeft, moved: false };
    };
    const onUp = () => {
      dragState.current.isDown = false;
    };
    const onMove = (e: MouseEvent) => {
      if (!dragState.current.isDown) return;
      const delta = e.pageX - dragState.current.startX;
      if (Math.abs(delta) > CLICK_SUPPRESS_THRESHOLD) dragState.current.moved = true;
      el.scrollLeft = dragState.current.scrollLeft - delta;
    };
    // A drag that actually panned the board shouldn't also register as a tile click —
    // capture-phase so it runs before any child's own onClick handler.
    const onClickCapture = (e: MouseEvent) => {
      if (dragState.current.moved) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    el.addEventListener("mousedown", onDown);
    el.addEventListener("click", onClickCapture, true);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    return () => {
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
    };
  }, [ref]);
}
