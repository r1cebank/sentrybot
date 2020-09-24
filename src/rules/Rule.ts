export type SelectorRule = {
  readonly _type: 'selector';
  readonly selector: string;
  readonly condition: Condition;
};

export enum ConditionType {
  EQUAL = 'equal',
  NOT_EQUAL = 'not_equal',
}

export type Condition = {
  readonly condition: ConditionType;
  readonly value: string;
};

export type WebsiteRule = {
  readonly _type: 'website';
  readonly name: string;
  readonly id: string;
  readonly validateFor: readonly SelectorRule[];
  readonly notifyFor: readonly SelectorRule[];
};

export type Rule = WebsiteRule;
export type RuleMap = ReadonlyMap<string, Rule>;
