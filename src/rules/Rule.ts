export type SelectorRule = {
  readonly type: 'selector';
  readonly selector: string;
  readonly condition: Condition;
};

export enum ConditionType {
  EXISTS = 'exists',
  EQUAL = 'equal',
  INCLUDES = 'includes',
  NOT_INCLUDES = 'not_includes',
  NOT_EQUAL = 'not_equal',
}

export type Condition = {
  readonly condition: ConditionType;
  readonly value: string;
};

export type WebsiteRule = {
  readonly type: 'website';
  readonly name: string;
  readonly id: string;
  readonly url: string;
  readonly validateFor: readonly SelectorRule[];
  readonly notifyFor: readonly SelectorRule[];
};

export type Rule = WebsiteRule;
export type RuleMap = ReadonlyMap<string, Rule>;
