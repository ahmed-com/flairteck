import { ValueTransformer } from "typeorm";
import Decimal from "decimal.js";

export class DecimalTransformer implements ValueTransformer {
  to(value?: Decimal | null): string | null {
    if (!value) {
      return null;
    }
    return value.toString();
  }

  from(value: string | number | null): Decimal | null {
    if (value === null || value === undefined) {
      return null;
    }
    return new Decimal(value);
  }
}
