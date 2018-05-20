import { remote } from "electron";
import { CloseIcon } from "mdi-react";
import { action, autorun, observable, reaction } from "mobx";
import { observer } from "mobx-react";
import * as path from "path";
import * as React from "react";
import styled from "styled-components";

import { Spinner } from "~/app/components";
import { animations, colors, fonts } from "~/app/data/style";
import { Language } from "~/app/model";
import { SettingsStore } from "~/app/stores";

import { LanguageSelect } from "~/library/components";
import { AddTextFormData, TextFileMetadata } from "~/library/model";
import { AddTextDialogStore } from "~/library/stores";
import { languageFromCode6393 } from "~/util/languageUtils";

export interface AddTextDialogProps {
  settingsStore: SettingsStore;
  addTextDialogStore: AddTextDialogStore;
}
@observer
export class AddTextDialog extends React.Component<AddTextDialogProps> {
  private static readonly defaultContentLanguage = languageFromCode6393("fra")!;
  private static readonly defaultTranslationLanguage = languageFromCode6393("eng")!;

  @observable
  private formData: AddTextFormData = {
    filePath: "",
    pastedText: "",
    title: "",
    author: "",
    contentLanguage: AddTextDialog.defaultContentLanguage,
    translationLanguage: AddTextDialog.defaultTranslationLanguage
  };
  @observable private isPickingFile: boolean = false;
  private settingsStore!: SettingsStore;
  private addTextDialogStore!: AddTextDialogStore;

  public componentWillMount(): void {
    this.settingsStore = this.props.settingsStore;
    this.addTextDialogStore = this.props.addTextDialogStore;
  }

  // TODO: See if disposers should be used for some of these and other reactions and autoruns
  public componentDidMount(): void {
    this.clearForm();
    reaction(
      () => this.addTextDialogStore.detectedTextLanguage,
      language => this.handleDetectedTextLanguageChange(language)
    );
    reaction(
      () => this.addTextDialogStore.fileMetadata,
      metadata => this.handleTextFileMetadataChange(metadata)
    );
    reaction(
      () => this.formData.filePath,
      filePath => this.addTextDialogStore.handleSelectedFilePathChange(filePath)
    );
    reaction(() => this.formData.pastedText, text => this.addTextDialogStore.setPastedText(text));
    autorun(() => {
      this.addTextDialogStore.handleSelectedLanguagesChange([
        this.formData.contentLanguage,
        this.formData.translationLanguage
      ]);
    });
  }

  public componentWillUnmount(): void {
    this.clearForm();
  }

  private clearForm(): void {
    this.updateFormData({
      filePath: "",
      pastedText: "",
      title: "",
      author: "",
      contentLanguage: AddTextDialog.defaultContentLanguage,
      translationLanguage:
        languageFromCode6393(this.settingsStore.settings.defaultTranslationLanguage) ||
        AddTextDialog.defaultTranslationLanguage
    });
    this.addTextDialogStore.discardText();
  }

  @action
  private updateFormData(slice: any): void {
    Object.assign(this.formData, slice);
  }

  @action
  private setPickingFile(value: boolean): void {
    this.isPickingFile = value;
  }

  private handlePastedTextChange = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const pastedText = e.currentTarget.value;
    if (!pastedText) {
      this.clearForm();
    } else {
      this.updateFormData({ pastedText });
    }
  };

  private handleTitleChange = (e: React.FormEvent<HTMLInputElement>) => {
    this.updateFormData({ title: e.currentTarget.value });
  };

  private handleAuthorChange = (e: React.FormEvent<HTMLInputElement>) => {
    this.updateFormData({ author: e.currentTarget.value });
  };

  private handleContentLanguageChange = (e: any) => {
    this.updateFormData({ contentLanguage: languageFromCode6393(e.target.value) });
  };

  private handleTranslationLanguageChange = (e: any) => {
    this.updateFormData({ translationLanguage: languageFromCode6393(e.target.value) });
  };

  private handleLoadFileButtonClick = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    this.setPickingFile(true);
    remote.dialog.showOpenDialog(
      {
        properties: ["openFile"]
      },
      filePaths => {
        this.setPickingFile(false);
        if (!filePaths) {
          return;
        }
        const filePath = filePaths.toString();
        this.updateFormData({
          title: path.basename(filePath, path.extname(filePath)),
          filePath
        });
      }
    );
  };

  private handleDiscardSelectedFileButtonClick = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    this.clearForm();
  };

  private handleClearPasteTextAreaButtonClick = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    this.clearForm();
  };

  private handleAddTextButtonClick = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await this.addTextDialogStore.saveText(this.formData);
    this.settingsStore.set({
      defaultTranslationLanguage: this.formData.translationLanguage
    });
    this.clearForm();
  };

  private handleTextFileMetadataChange(metadata?: TextFileMetadata): void {
    if (!metadata) {
      return;
    }
    const { author, title } = metadata;
    if (author) {
      this.updateFormData({ author });
    }
    if (title) {
      this.updateFormData({ title });
    }
  }

  private handleDetectedTextLanguageChange = (lang?: Language): void => {
    this.formData.contentLanguage = lang ? lang : AddTextDialog.defaultContentLanguage;
  };

  public render(): JSX.Element {
    const { isSavingText, fileStatus } = this.addTextDialogStore;
    const filePath = this.formData.filePath;
    const showFinalFields = fileStatus === "Valid" || this.formData.pastedText;
    return (
      <Form disabled={isSavingText}>
        {isSavingText && (
          <SavingIndicatorOverlay>
            <Spinner color={"Dark"} />
          </SavingIndicatorOverlay>
        )}
        {!this.formData.pastedText && this.renderFileField()}
        {!filePath && this.renderPasteField()}
        {showFinalFields && this.renderFinalFields()}
        {fileStatus === "Invalid" && <InvalidFileMsg>This file cannot be added.</InvalidFileMsg>}
      </Form>
    );
  }

  private renderFileField(): JSX.Element {
    const { fileStatus } = this.addTextDialogStore;
    return (
      <FileField>
        <Button onClick={this.handleLoadFileButtonClick} disabled={this.isPickingFile}>
          {fileStatus === "NotSelected" ? "Choose .epub or .txt file" : "Change my choice"}
        </Button>
        {this.formData.filePath && (
          <SelectedFileGroup>
            <SelectedFileName>{path.basename(this.formData.filePath)}</SelectedFileName>
            <ClearButton onClick={this.handleDiscardSelectedFileButtonClick} />
          </SelectedFileGroup>
        )}
      </FileField>
    );
  }

  private renderPasteField(): JSX.Element {
    return (
      <PasteField>
        <PasteFieldHeader>
          {this.formData.pastedText ? (
            <span>Content:</span>
          ) : (
            <span>…or paste from clipboard:</span>
          )}
          {this.formData.pastedText && (
            <ClearButton onClick={this.handleClearPasteTextAreaButtonClick} />
          )}
        </PasteFieldHeader>
        <TextArea
          rows={5}
          onChange={this.handlePastedTextChange}
          value={this.formData.pastedText}
        />
      </PasteField>
    );
  }

  private renderFinalFields(): JSX.Element {
    const { isLanguageConfigurationValid, tatoebaTranslationCount } = this.addTextDialogStore;
    return (
      <FinalFields>
        <Field>
          Author:
          <TextInput type="text" onChange={this.handleAuthorChange} value={this.formData.author} />
        </Field>
        <Field>
          Title:
          <TextInput type="text" onChange={this.handleTitleChange} value={this.formData.title} />
        </Field>
        <FieldGroup>
          <Field>
            Text language:
            <LanguageSelect
              invalid={!isLanguageConfigurationValid}
              onChange={this.handleContentLanguageChange}
              value={this.formData.contentLanguage.code6393}
            />
          </Field>
          <Field>
            Translation language:
            <LanguageSelect
              invalid={!isLanguageConfigurationValid}
              onChange={this.handleTranslationLanguageChange}
              value={this.formData.translationLanguage.code6393}
            />
          </Field>
        </FieldGroup>
        {tatoebaTranslationCount && this.renderTatoebaTranslationCount()}
        <AddTextButton
          onClick={this.handleAddTextButtonClick}
          disabled={!isLanguageConfigurationValid}
        >
          Add
        </AddTextButton>
      </FinalFields>
    );
  }

  private renderTatoebaTranslationCount(): JSX.Element {
    const { state, value } = this.addTextDialogStore.tatoebaTranslationCount as any;
    return (
      <Message>
        {state === "fulfilled" && (
          <MessageText>
            {value > 0 ? value : "No"} Tatoeba translations available for the selected language
            configuration.
          </MessageText>
        )}
      </Message>
    );
  }
}

const fieldMargin = "1.3rem";

const Form = styled.form`
  position: relative;
  margin-top: 1rem;
  font-size: 0.95em;
  ${(p: { disabled: boolean }) => (p.disabled ? "* { pointer-events: none; }" : ";")};

  input,
  select,
  button,
  textarea {
    display: block;
    padding: 0.6rem;
    margin-top: 0.5rem;
    color: ${colors.primary};
    background: ${colors.inputBg};
    border: 2px solid ${colors.primary};
    border-radius: 3px;
    font-size: 1em;
    transition: all 0.05s ${animations.stdFunction};
    &:disabled,
    &:hover:disabled {
      color: ${colors.primaryFade} !important;
      border-color: ${colors.primaryFade} !important;
    }
    &:hover:not(:disabled) {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
      transform: translate(0, -1px);
    }
    &:active {
      box-shadow: initial;
      transform: initial;
    }
  }
`;

const SavingIndicatorOverlay = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${colors.secondary}cc;
  animation: ${animations.fadeIn} ${animations.std};
`;

const FieldGroup = styled.div`
  display: flex;
  justify-content: space-between;
  > label:nth-child(2) {
    margin-left: 2rem;
  }
`;

const Field = styled.label`
  display: inline-block;
  width: 100%;
  margin-bottom: ${fieldMargin};
`;

const Message = styled.div`
  height: 1em;
  margin-bottom: ${fieldMargin};
`;

const MessageText = styled.span`
  font-size: 0.9em;
  animation: ${animations.fadeIn} ${animations.std};
`;

const FileField = Field.extend`
  display: flex;
  align-items: baseline;
`;

const PasteField = Field.extend`
  display: flex;
  flex-direction: column;
`;

const PasteFieldHeader = styled.div`
  display: flex;
  justify-content: space-between;
`;

// TODO: DRY (sidebar header ActionButton)
const ClearButton = styled<any, any>(CloseIcon)`
  fill: rgba(0, 0, 0, 0.5);
  transition: fill 0.2s ease;
  &:hover {
    fill: rgba(0, 0, 0, 0.7);
  }
  &:not(:last-child) {
    margin-right: 0.6rem;
  }
`;

const TextArea = styled.textarea`
  resize: none;
  margin-top: 0.7rem;
  font: 1em ${fonts.serif};
`;

const FinalFields = styled.div`
  animation: ${animations.fadeInBottom} ${animations.doubleTime};
`;

const TextInput = styled.input`
  width: 100%;
`;

const Button = styled.button``;

const InvalidFileMsg = styled.span`
  animation: ${animations.fadeInBottom} ${animations.doubleTime};
`;

const AddTextButton = Button.extend`
  margin-top: 1rem;
  width: 100%;
  border: 3px solid ${colors.accent} !important;
  color: ${colors.accent} !important;
  font-weight: bold;
  transition: all 0.05s ${animations.stdFunction};
  &:hover {
    color: ${colors.accent2} !important;
    border-color: ${colors.accent2} !important;
  }
`;

const SelectedFileGroup = styled.span`
  display: flex;
`;

const SelectedFileName = styled.span`
  margin: 0 0.5rem 0 1rem;
  max-width: 24.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  animation: ${animations.fadeIn} ${animations.doubleTime};
`;
