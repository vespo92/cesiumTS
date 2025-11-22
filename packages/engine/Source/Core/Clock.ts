import ClockRange from "./ClockRange.js";
import ClockStep from "./ClockStep.js";
import Frozen from "./Frozen.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Event from "./Event.js";
import getTimestamp from "./getTimestamp.js";
import JulianDate from "./JulianDate.js";

/**
 * Options for creating a Clock instance.
 */
interface ClockOptions {
  /**
   * The start time of the clock.
   */
  startTime?: JulianDate;
  /**
   * The stop time of the clock.
   */
  stopTime?: JulianDate;
  /**
   * The current time.
   */
  currentTime?: JulianDate;
  /**
   * Determines how much time advances when {@link Clock#tick} is called,
   * negative values allow for advancing backwards.
   * @default 1.0
   */
  multiplier?: number;
  /**
   * Determines if calls to {@link Clock#tick} are frame dependent or system clock dependent.
   * @default ClockStep.SYSTEM_CLOCK_MULTIPLIER
   */
  clockStep?: number;
  /**
   * Determines how the clock should behave when {@link Clock#startTime} or {@link Clock#stopTime} is reached.
   * @default ClockRange.UNBOUNDED
   */
  clockRange?: number;
  /**
   * Indicates whether {@link Clock#tick} can advance time. This could be false if data is being buffered.
   * The clock will only tick when both {@link Clock#canAnimate} and {@link Clock#shouldAnimate} are true.
   * @default true
   */
  canAnimate?: boolean;
  /**
   * Indicates whether {@link Clock#tick} should attempt to advance time.
   * The clock will only tick when both {@link Clock#canAnimate} and {@link Clock#shouldAnimate} are true.
   * @default false
   */
  shouldAnimate?: boolean;
}

/**
 * A simple clock for keeping track of simulated time.
 *
 * @example
 * // Create a clock that loops on Christmas day 2013 and runs in real-time.
 * const clock = new Cesium.Clock({
 *    startTime : Cesium.JulianDate.fromIso8601("2013-12-25"),
 *    currentTime : Cesium.JulianDate.fromIso8601("2013-12-25"),
 *    stopTime : Cesium.JulianDate.fromIso8601("2013-12-26"),
 *    clockRange : Cesium.ClockRange.LOOP_STOP,
 *    clockStep : Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER
 * });
 *
 * @see ClockStep
 * @see ClockRange
 * @see JulianDate
 */
class Clock {
  /**
   * The start time of the clock.
   */
  startTime: JulianDate;

  /**
   * The stop time of the clock.
   */
  stopTime: JulianDate;

  /**
   * Determines how the clock should behave when
   * {@link Clock#startTime} or {@link Clock#stopTime}
   * is reached.
   * @default ClockRange.UNBOUNDED
   */
  clockRange: number;

  /**
   * Indicates whether {@link Clock#tick} can advance time.
   * This could be false if data is being buffered, for example.
   * The clock will only advance time when both
   * {@link Clock#canAnimate} and {@link Clock#shouldAnimate} are true.
   * @default true
   */
  canAnimate: boolean;

  /**
   * An {@link Event} that is fired whenever {@link Clock#tick} is called.
   */
  readonly onTick: Event<(clock: Clock) => void>;

  /**
   * An {@link Event} that is fired whenever {@link Clock#stopTime} is reached.
   */
  readonly onStop: Event<(clock: Clock) => void>;

  private _currentTime: JulianDate;
  private _multiplier: number;
  private _clockStep: number;
  private _shouldAnimate: boolean;
  private _lastSystemTime: number;

  /**
   * Creates a new Clock instance.
   *
   * @param options - Object with the following properties:
   * @throws {@link DeveloperError} startTime must come before stopTime.
   */
  constructor(options?: ClockOptions) {
    const opts = options ?? (Frozen.EMPTY_OBJECT as ClockOptions);

    let currentTime: JulianDate;
    let startTime: JulianDate;
    let stopTime: JulianDate;

    if (!defined(opts.currentTime)) {
      // if not specified, current time is the start time,
      // or if that is not specified, 1 day before the stop time,
      // or if that is not specified, then now.
      if (defined(opts.startTime)) {
        currentTime = JulianDate.clone(opts.startTime) as JulianDate;
      } else if (defined(opts.stopTime)) {
        currentTime = JulianDate.addDays(opts.stopTime, -1.0, new JulianDate());
      } else {
        currentTime = JulianDate.now();
      }
    } else {
      currentTime = JulianDate.clone(opts.currentTime) as JulianDate;
    }

    if (!defined(opts.startTime)) {
      // if not specified, start time is the current time
      // (as determined above)
      startTime = JulianDate.clone(currentTime) as JulianDate;
    } else {
      startTime = JulianDate.clone(opts.startTime) as JulianDate;
    }

    if (!defined(opts.stopTime)) {
      // if not specified, stop time is 1 day after the start time
      // (as determined above)
      stopTime = JulianDate.addDays(startTime, 1.0, new JulianDate());
    } else {
      stopTime = JulianDate.clone(opts.stopTime) as JulianDate;
    }

    //>>includeStart('debug', pragmas.debug);
    if (JulianDate.greaterThan(startTime, stopTime)) {
      throw new DeveloperError("startTime must come before stopTime.");
    }
    //>>includeEnd('debug');

    this.startTime = startTime;
    this.stopTime = stopTime;
    this.clockRange = opts.clockRange ?? ClockRange.UNBOUNDED;
    this.canAnimate = opts.canAnimate ?? true;
    this.onTick = new Event<(clock: Clock) => void>();
    this.onStop = new Event<(clock: Clock) => void>();

    this._currentTime = currentTime;
    this._multiplier = opts.multiplier ?? 1.0;
    this._clockStep = opts.clockStep ?? ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    this._shouldAnimate = opts.shouldAnimate ?? false;
    this._lastSystemTime = getTimestamp();

    // Apply property setters to ensure values are consistent
    this.currentTime = currentTime;
    this.multiplier = opts.multiplier ?? 1.0;
    this.shouldAnimate = opts.shouldAnimate ?? false;
    this.clockStep = opts.clockStep ?? ClockStep.SYSTEM_CLOCK_MULTIPLIER;
  }

  /**
   * The current time.
   * Changing this property will change
   * {@link Clock#clockStep} from {@link ClockStep.SYSTEM_CLOCK} to
   * {@link ClockStep.SYSTEM_CLOCK_MULTIPLIER}.
   */
  get currentTime(): JulianDate {
    return this._currentTime;
  }

  set currentTime(value: JulianDate) {
    if (JulianDate.equals(this._currentTime, value)) {
      return;
    }

    if (this._clockStep === ClockStep.SYSTEM_CLOCK) {
      this._clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    }

    this._currentTime = value;
  }

  /**
   * Gets or sets how much time advances when {@link Clock#tick} is called.
   * Negative values allow for advancing backwards.
   * If {@link Clock#clockStep} is set to {@link ClockStep.TICK_DEPENDENT}, this is the number of seconds to advance.
   * If {@link Clock#clockStep} is set to {@link ClockStep.SYSTEM_CLOCK_MULTIPLIER}, this value is multiplied by the
   * elapsed system time since the last call to {@link Clock#tick}.
   * Changing this property will change
   * {@link Clock#clockStep} from {@link ClockStep.SYSTEM_CLOCK} to
   * {@link ClockStep.SYSTEM_CLOCK_MULTIPLIER}.
   * @default 1.0
   */
  get multiplier(): number {
    return this._multiplier;
  }

  set multiplier(value: number) {
    if (this._multiplier === value) {
      return;
    }

    if (this._clockStep === ClockStep.SYSTEM_CLOCK) {
      this._clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    }

    this._multiplier = value;
  }

  /**
   * Determines if calls to {@link Clock#tick} are frame dependent or system clock dependent.
   * Changing this property to {@link ClockStep.SYSTEM_CLOCK} will set
   * {@link Clock#multiplier} to 1.0, {@link Clock#shouldAnimate} to true, and
   * {@link Clock#currentTime} to the current system clock time.
   * @default ClockStep.SYSTEM_CLOCK_MULTIPLIER
   */
  get clockStep(): number {
    return this._clockStep;
  }

  set clockStep(value: number) {
    if (value === ClockStep.SYSTEM_CLOCK) {
      this._multiplier = 1.0;
      this._shouldAnimate = true;
      this._currentTime = JulianDate.now();
    }

    this._clockStep = value;
  }

  /**
   * Indicates whether {@link Clock#tick} should attempt to advance time.
   * The clock will only advance time when both
   * {@link Clock#canAnimate} and {@link Clock#shouldAnimate} are true.
   * Changing this property will change
   * {@link Clock#clockStep} from {@link ClockStep.SYSTEM_CLOCK} to
   * {@link ClockStep.SYSTEM_CLOCK_MULTIPLIER}.
   * @default false
   */
  get shouldAnimate(): boolean {
    return this._shouldAnimate;
  }

  set shouldAnimate(value: boolean) {
    if (this._shouldAnimate === value) {
      return;
    }

    if (this._clockStep === ClockStep.SYSTEM_CLOCK) {
      this._clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    }

    this._shouldAnimate = value;
  }

  /**
   * Advances the clock from the current time based on the current configuration options.
   * tick should be called every frame, regardless of whether animation is taking place
   * or not. To control animation, use the {@link Clock#shouldAnimate} property.
   *
   * @returns The new value of the {@link Clock#currentTime} property.
   */
  tick(): JulianDate {
    const currentSystemTime = getTimestamp();
    let currentTime = JulianDate.clone(this._currentTime) as JulianDate;

    if (this.canAnimate && this._shouldAnimate) {
      const clockStep = this._clockStep;
      if (clockStep === ClockStep.SYSTEM_CLOCK) {
        currentTime = JulianDate.now(currentTime);
      } else {
        const multiplier = this._multiplier;

        if (clockStep === ClockStep.TICK_DEPENDENT) {
          currentTime = JulianDate.addSeconds(
            currentTime,
            multiplier,
            currentTime,
          );
        } else {
          const milliseconds = currentSystemTime - this._lastSystemTime;
          currentTime = JulianDate.addSeconds(
            currentTime,
            multiplier * (milliseconds / 1000.0),
            currentTime,
          );
        }

        const clockRange = this.clockRange;
        const startTime = this.startTime;
        const stopTime = this.stopTime;

        if (clockRange === ClockRange.CLAMPED) {
          if (JulianDate.lessThan(currentTime, startTime)) {
            currentTime = JulianDate.clone(startTime, currentTime) as JulianDate;
          } else if (JulianDate.greaterThan(currentTime, stopTime)) {
            currentTime = JulianDate.clone(stopTime, currentTime) as JulianDate;
            this.onStop.raiseEvent(this);
          }
        } else if (clockRange === ClockRange.LOOP_STOP) {
          if (JulianDate.lessThan(currentTime, startTime)) {
            currentTime = JulianDate.clone(startTime, currentTime) as JulianDate;
          }
          while (JulianDate.greaterThan(currentTime, stopTime)) {
            currentTime = JulianDate.addSeconds(
              startTime,
              JulianDate.secondsDifference(currentTime, stopTime),
              currentTime,
            );
            this.onStop.raiseEvent(this);
          }
        }
      }
    }

    this._currentTime = currentTime;
    this._lastSystemTime = currentSystemTime;
    this.onTick.raiseEvent(this);
    return currentTime;
  }
}

export default Clock;
