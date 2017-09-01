export function waitForAnimation(element: Element, callback: (e?: Event) => any): void {
  requestAnimationFrame(() => {
    let computedStyle = window.getComputedStyle(element);

    if (computedStyle.animationName !== 'none' &&
        computedStyle.animationPlayState === 'running') {
      return once(element, 'animationend', callback);
    }

    callback();
  });
}

function once(element: Node, eventName: string, listener: (e: Event) => any): void {
  element.addEventListener(eventName, function listenOnce(e) {
    element.removeEventListener(eventName, listenOnce);

    return listener(e);
  });
}

export const closest: (element: Element, selector: string) => Element | null
  = (window as any).Element && Element.prototype.closest ?
    (el, s) => el.closest(s) :
    function closest(self: Element, s: string) {
      let matches = ((self as any).document || self.ownerDocument).querySelectorAll(s),
        i,
      el = self;
      do {
        i = matches.length;
        while (--i >= 0 && matches.item(i) !== el) {};
      } while ((i < 0) && (el = el.parentElement!));
      return el;
    };

export function calculatePosition(
  trigger: Element,
  dropdown: Element,
  { horizontalPosition, verticalPosition, matchTriggerWidth, previousHorizontalPosition, previousVerticalPosition }) {
  // Collect information about all the involved DOM elements
  let scroll = { left: window.pageXOffset, top: window.pageYOffset };
  let {
    left: triggerLeft,
    top: triggerTop,
    width: triggerWidth,
    height: triggerHeight
  } = trigger.getBoundingClientRect();
  let {
    height: dropdownHeight,
    width: dropdownWidth
  } = dropdown.getBoundingClientRect();
  let viewportWidth = window.innerWidth;
  let style: any = {};

  // Calculate drop down width
  dropdownWidth = matchTriggerWidth ? triggerWidth : dropdownWidth;
  if (matchTriggerWidth) {
    style.width = dropdownWidth;
  }

  // Calculate horizontal position
  let triggerLeftWithScroll = triggerLeft + scroll.left;
  if (horizontalPosition === 'auto') {
    // Calculate the number of visible horizontal pixels if we were to place the
    // dropdown on the left and right
    let leftVisible = Math.min(viewportWidth, triggerLeft + dropdownWidth) - Math.max(0, triggerLeft);
    let rightVisible = Math.min(viewportWidth, triggerLeft + triggerWidth) - Math.max(0, triggerLeft + triggerWidth - dropdownWidth);

    if (dropdownWidth > leftVisible && rightVisible > leftVisible) {
      // If the drop down won't fit left-aligned, and there is more space on the
      // right than on the left, then force right-aligned
      horizontalPosition = 'right';
    } else if (dropdownWidth > rightVisible && leftVisible > rightVisible) {
      // If the drop down won't fit right-aligned, and there is more space on
      // the left than on the right, then force left-aligned
      horizontalPosition = 'left';
    } else {
      // Keep same position as previous
      horizontalPosition = previousHorizontalPosition || 'left';
    }
  }
  if (horizontalPosition === 'right') {
    style.right = viewportWidth - (triggerLeftWithScroll + triggerWidth);
  } else if (horizontalPosition === 'center') {
    style.left = triggerLeftWithScroll + (triggerWidth - dropdownWidth) / 2;
  } else {
    style.left = triggerLeftWithScroll;
  }

  // Calculate vertical position
  let triggerTopWithScroll = triggerTop + scroll.top;
  if (verticalPosition === 'above') {
    style.top = triggerTopWithScroll - dropdownHeight;
  } else if (verticalPosition === 'below') {
    style.top = triggerTopWithScroll + triggerHeight;
  } else {
    let viewportBottom = scroll.top + self.window.innerHeight;
    let enoughRoomBelow = triggerTopWithScroll + triggerHeight + dropdownHeight < viewportBottom;
    let enoughRoomAbove = triggerTop > dropdownHeight;

    if (previousVerticalPosition === 'below' && !enoughRoomBelow && enoughRoomAbove) {
      verticalPosition = 'above';
    } else if (previousVerticalPosition === 'above' && !enoughRoomAbove && enoughRoomBelow) {
      verticalPosition = 'below';
    } else if (!previousVerticalPosition) {
      verticalPosition = enoughRoomBelow ? 'below' : 'above';
    } else {
      verticalPosition = previousVerticalPosition;
    }
    style.top = triggerTopWithScroll + (verticalPosition === 'below' ? triggerHeight : -dropdownHeight);
  }

  return { horizontalPosition, verticalPosition, style };
}

export function calculateInPlacePosition(
    trigger: Element,
    dropdown: Element,
    { horizontalPosition, verticalPosition }) {
  let dropdownRect;
  let positionData: any = {};

  if (horizontalPosition === 'auto') {
    let triggerRect = trigger.getBoundingClientRect();
    dropdownRect = dropdown.getBoundingClientRect();
    let viewportRight = window.pageXOffset + window.innerWidth;
    positionData.horizontalPosition = triggerRect.left + dropdownRect.width > viewportRight ? 'right' : 'left';
  }
  if (verticalPosition === 'above') {
    positionData.verticalPosition = verticalPosition;
    dropdownRect = dropdownRect || dropdown.getBoundingClientRect();
    positionData.style = { top: -dropdownRect.height };
  }
  return positionData;
}
