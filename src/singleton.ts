/**
 * The singleton class to store shared data
 */
// eslint-disable-next-line functional/no-class
export class Singleton {
  // eslint-disable-next-line functional/prefer-readonly-type
  private static instance: Singleton;

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
    }

    return Singleton.instance;
  }
}
