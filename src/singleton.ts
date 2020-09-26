/**
 * The singleton class to store shared data
 */
// eslint-disable-next-line functional/no-class
export class Singleton {
  // eslint-disable-next-line functional/prefer-readonly-type
  private static instance: Singleton;

  // eslint-disable-next-line functional/prefer-readonly-type
  public triggerStatus: Map<string, boolean>;

  private constructor() {
    // Noop
  }

  /**
   * Get the share instance
   */
  public static getInstance(): Singleton {
    if (!Singleton.instance) {
      // eslint-disable-next-line functional/immutable-data
      Singleton.instance = new Singleton();
      // eslint-disable-next-line functional/immutable-data
      Singleton.instance.triggerStatus = new Map<string, boolean>();
    }

    return Singleton.instance;
  }

  /**
   * Get the trigger status for the rule
   * @param ruleId The rule id
   */
  public static getTriggerStatus(ruleId: string): boolean {
    const singleton = Singleton.getInstance();
    return singleton.triggerStatus.get(ruleId) || false;
  }

  /**
   * Set the trigger status for the rule
   * @param ruleId The rule id
   * @param triggered The trigger status
   */
  public static setTriggerStatus(ruleId: string, triggered: boolean) {
    const singleton = Singleton.getInstance();
    singleton.triggerStatus.set(ruleId, triggered);
  }
}
