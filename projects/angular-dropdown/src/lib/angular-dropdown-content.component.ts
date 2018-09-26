import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  Component,
  Input,
  Host,
  Inject,
  forwardRef,
  AfterViewChecked,
  OnInit,
  OnDestroy,
  NgZone
} from '@angular/core';

import { DOCUMENT } from '@angular/common';

import { AngularDropdownDirective } from './angular-dropdown.directive';
import { closest, waitForAnimation } from './utils';

const MutationObserver = (window as any).MutationObserver;

@Component({
  selector: 'ng-dropdown-content,[ng-dropdown-content],[ngDropdownContent]',
  templateUrl: './angular-dropdown-content.component.html',
  styleUrls: ['./angular-dropdown-content.component.css'],
  host: {
    '[class.render-in-place]': 'dropdown.renderInPlace'
  }
})
export class AngularDropdownContentComponent
  implements OnInit, AfterViewChecked, OnDestroy {
  @Input()
  dropdownClass = '';

  @Input()
  overlay = false;

  private hasMoved = false;
  private _animationClass: string | null = null;
  private isTouchDevice: boolean = 'ontouchstart' in window;
  private mutationObserver: MutationObserver | null = null;
  private destroy$ = new Subject<void>();

  @Input()
  transitioningInClass = 'ng-dropdown-content--transitioning-in';
  @Input()
  transitionedInClass = 'ng-dropdown-content--transitioned-in';
  @Input()
  transitioningOutClass = 'ng-dropdown-content--transitioning-out';

  private get dropdownElement(): HTMLElement {
    return this.dropdown.dropdownElement;
  }

  private shouldOpen = false;
  private document: Document;

  constructor(
    @Host()
    @Inject(forwardRef(() => AngularDropdownDirective))
    public dropdown: AngularDropdownDirective,
    private zone: NgZone,
    @Inject(DOCUMENT) document: any
  ) {
    this.document = document;
  }

  ngOnInit(): void {
    this.dropdown.onOpen
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.shouldOpen = true));

    this.dropdown.onClose
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.close());
  }

  set animationClass(className: string | null) {
    if (this._animationClass && className !== this._animationClass) {
      this.dropdownElement.classList.remove(this._animationClass);
    } else if (className) {
      this.dropdownElement.classList.add(className);
    }
    this._animationClass = className;
  }

  get animationClass(): string | null {
    return this._animationClass;
  }

  get triggerElement(): Element {
    return this.dropdown.triggerElement;
  }

  ngAfterViewChecked() {
    if (this.shouldOpen) {
      this.animationClass = this.transitioningInClass;
      requestAnimationFrame(() => this.open());
      this.shouldOpen = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.teardownEvents();
  }

  open(): void {
    this.document.body.addEventListener(
      'mousedown',
      this.handleRootMouseDown,
      true
    );

    if (this.isTouchDevice) {
      this.document.body.addEventListener(
        'touchstart',
        this.touchStartHandler,
        true
      );
      this.document.body.addEventListener(
        'touchend',
        this.handleRootMouseDown,
        true
      );
    }

    let changes = this.dropdown.reposition();
    if (!this.dropdown.renderInPlace) {
      this.addGlobalEvents();
      this.startObservingDomMutations();
    } else if (changes !== null && changes.vPosition === 'above') {
      this.startObservingDomMutations();
    }

    requestAnimationFrame(() => this.animateIn());
  }

  close(): void {
    this.teardownEvents();
    this.animateOut();
  }

  private repositionInZone = () =>
    this.zone.run(() => this.dropdown.reposition());

  private animateIn(): void {
    waitForAnimation(this.dropdownElement, () => {
      this.animationClass = this.transitionedInClass;
    });
  }

  private animateOut(): void {
    let parentElement = this.dropdown.renderInPlace
      ? this.dropdownElement.parentElement!.parentElement
      : this.dropdownElement.parentElement;
    let clone = this.dropdownElement.cloneNode(true) as HTMLElement;
    clone.id = `${this.dropdownElement.id}--clone`;
    clone.classList.remove(this.transitionedInClass);
    clone.classList.remove(this.transitioningInClass);
    clone.classList.add(this.transitioningOutClass);
    parentElement!.appendChild(clone);
    this.animationClass = this.transitioningInClass;
    waitForAnimation(clone, () => parentElement!.removeChild(clone));
  }

  private handleRootMouseDown = (e: Event): void => {
    if (
      this.hasMoved ||
      this.dropdownElement.contains(e.target as Element) ||
      (this.triggerElement &&
        this.triggerElement.contains(e.target as Element))
    ) {
      this.hasMoved = false;
      return;
    }

    let closestDropdown = closest(e.target as Element, 'ng-dropdown-content');
    if (closestDropdown) {
      let trigger = this.document.querySelector(
        `[aria-controls=${closestDropdown.getAttribute('id')}]`
      );
      let parentDropdown = closest(trigger!, 'ng-dropdown-content');
      if (
        parentDropdown &&
        parentDropdown.getAttribute('id') === this.dropdown.dropdownId
      ) {
        this.hasMoved = false;
        return;
      }
    }

    this.dropdown.close(true);
  };

  private startObservingDomMutations(): void {
    if (MutationObserver) {
      this.mutationObserver = new MutationObserver((mutations: any) => {
        if (
          mutations[0].addedNodes.length ||
          mutations[0].removedNodes.length
        ) {
          this.repositionInZone();
        }
      });
      this.mutationObserver!.observe(this.dropdownElement, {
        childList: true,
        subtree: true
      });
    } else {
      this.dropdownElement.addEventListener(
        'DOMNodeInserted',
        this.repositionInZone,
        false
      );
      this.dropdownElement.addEventListener(
        'DOMNodeRemoved',
        this.repositionInZone,
        false
      );
    }
  }

  private stopObservingDomMutations(): void {
    if (MutationObserver) {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }
    } else {
      if (this.dropdownElement) {
        this.dropdownElement.removeEventListener(
          'DOMNodeInserted',
          this.repositionInZone
        );
        this.dropdownElement.removeEventListener(
          'DOMNodeRemoved',
          this.repositionInZone
        );
      }
    }
  }

  private addGlobalEvents(): void {
    window.addEventListener('scroll', this.repositionInZone);
    window.addEventListener('resize', this.repositionInZone);
    window.addEventListener('orientationchange', this.repositionInZone);
  }

  private removeGlobalEvents(): void {
    window.removeEventListener('scroll', this.repositionInZone);
    window.removeEventListener('resize', this.repositionInZone);
    window.removeEventListener('orientationchange', this.repositionInZone);
  }

  private touchStartHandler = (e: Event) => {
    this.document.body.addEventListener(
      'touchmove',
      this.touchMoveHandler,
      true
    );
  };

  private touchMoveHandler = (e: Event) => {
    this.hasMoved = true;
    this.document.body.removeEventListener(
      'touchmove',
      this.touchMoveHandler,
      true
    );
  };

  private teardownEvents() {
    this.removeGlobalEvents();
    this.stopObservingDomMutations();
    this.document.body.removeEventListener(
      'mousedown',
      this.handleRootMouseDown,
      true
    );

    if (this.isTouchDevice) {
      this.document.body.removeEventListener(
        'touchstart',
        this.touchStartHandler,
        true
      );
      this.document.body.removeEventListener(
        'touchend',
        this.handleRootMouseDown,
        true
      );
    }
  }
}
