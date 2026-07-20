import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  Output,
  EventEmitter,
  SimpleChanges,
  forwardRef,
  booleanAttribute,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { IconComponent } from '../../atoms/icon/icon.component';

export type QuantitySelectorSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-quantity-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './quantity-selector.component.html',
  styleUrls: ['./quantity-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QuantitySelectorComponent),
      multi: true
    }
  ]
})
export class QuantitySelectorComponent implements ControlValueAccessor, OnChanges {
  @Input() size: QuantitySelectorSize = 'md';
  @Input() min = 1;
  @Input() max = 999999;
  @Input() step = 1;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) readonly = false;
  @Input({ transform: booleanAttribute }) showInput = true;

  @Input()
  set value(val: number) {
    this.incomingValue = val ?? this.min;
    this._value.set(this.clampValue(this.incomingValue));
  }
  get value(): number {
    return this._value();
  }

  /** Last value pushed in by the host, before clamping (see ngOnChanges). */
  private incomingValue: number | null = null;

  @Output() quantityChange = new EventEmitter<number>();
  @Output() quantityAdjusted = new EventEmitter<{ original: number; adjusted: number; step: number }>();

  protected _value = signal(1);

  protected canDecrement = computed(() => this._value() > this.min);
  protected canIncrement = computed(() => this._value() < this.max);

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnChanges(changes: SimpleChanges): void {
    // Input setters run in template-declaration order, so when [value] changes in
    // the same cycle as [min]/[max]/[step] (e.g. the host switches to another
    // product), the value setter clamps against the PREVIOUS limits — a reset to 1
    // gets snapped back up to the old product's min. Once all inputs of the cycle
    // are assigned, re-apply the host's intended value against the fresh limits,
    // and tell the host if the displayed value had to move (so host state and the
    // visible counter can never disagree on what "Add to Cart" will do).
    if (changes['min'] || changes['max'] || changes['step']) {
      if (this.incomingValue !== null) {
        const corrected = this.clampValue(this.incomingValue);
        this._value.set(corrected);
        if (corrected !== this.incomingValue) {
          this.onChange(corrected);
          this.quantityChange.emit(corrected);
        }
      }
    }
  }

  writeValue(value: number): void {
    this._value.set(this.clampValue(value ?? this.min));
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  increment(): void {
    if (this.disabled || !this.canIncrement()) return;

    const newValue = this.clampValue(this._value() + this.step);
    this.updateValue(newValue);
  }

  decrement(): void {
    if (this.disabled || !this.canDecrement()) return;

    const newValue = this.clampValue(this._value() - this.step);
    this.updateValue(newValue);
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const numValue = parseInt(target.value, 10);
    if (isNaN(numValue)) return;

    // While typing: keep the raw value for display (only cap at max so users can't enter > max).
    // Min and step rounding are deferred to onBlur so users can freely type intermediate digits.
    const capped = Math.min(numValue, this.max);
    this._value.set(capped);

    // Never propagate a non-positive value mid-edit. A transient 0 or negative
    // (e.g. while the field is cleared to retype) would otherwise be treated as
    // a line removal downstream. These are clamped up to the minimum on blur.
    if (capped > 0) {
      this.onChange(capped);
      this.quantityChange.emit(capped);
    }
  }

  onBlur(): void {
    this.onTouched();

    // On blur, finalize: ensure value is at least min and snapped up to a valid step.
    const current = this._value();
    const clamped = this.clampValue(current);
    const stepped = this.roundUpToStep(clamped);

    if (stepped !== current) {
      // Notify the host whenever we had to correct the typed value — both when
      // rounding up to a step and when clamping a below-minimum (or 0) entry back
      // up to the minimum. The host surfaces this via its toast/notification.
      this.quantityAdjusted.emit({ original: current, adjusted: stepped, step: this.step });
      this.updateValue(stepped);
    }
  }

  private updateValue(newValue: number): void {
    this._value.set(newValue);
    this.onChange(newValue);
    this.quantityChange.emit(newValue);
  }

  private clampValue(value: number): number {
    return Math.min(Math.max(value, this.min), this.max);
  }

  private roundUpToStep(value: number): number {
    if (this.step <= 1) return value;
    const remainder = value % this.step;
    if (remainder === 0) return value;
    return Math.min(value + (this.step - remainder), this.max);
  }

  get containerClasses(): string[] {
    const classes = ['ui-quantity-selector', `ui-quantity-selector--${this.size}`];

    if (this.disabled) {
      classes.push('ui-quantity-selector--disabled');
    }

    return classes;
  }
}
