import * as React from "react";
import styled from "styled-components";

import { languages } from "~/app/data/languages";
import { colors } from "~/app/data/style";

export interface LanguageSelectProps {
  value: string;
  invalid: boolean;
  onChange: (e: any) => void;
}
export function LanguageSelect({ value, invalid, onChange }: LanguageSelectProps): JSX.Element {
  return (
    <Select value={value} invalid={invalid} onChange={onChange}>
      {languages.map(l => (
        <option key={l.code6393} value={l.code6393}>
          {l.localName}
        </option>
      ))}
    </Select>
  );
}

// TODO: DRY
const Select = styled.select`
  width: 100%;
  border: 2px solid ${(p: LanguageSelectProps) => (p.invalid ? colors.danger : colors.primary)} !important;
`;
