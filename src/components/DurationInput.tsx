import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Platform, ReturnKeyTypeOptions, TextInput, View } from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import _ from 'lodash';
import Util from 'services/Util';
import { RowView } from './RowView';
import { commonStyles } from 'styles/common';
import Theme from 'services/Theme';
import ScreenInfo from 'services/ScreenInfo';

interface Props {
  value: number | null;
  onSetValue: (value: number | null) => void;
  ref?: (r: any) => void;
  disabled?: boolean;
  mandatory?: boolean;
  outerStyle?: any;
  boxStyle?: any;
  borderColor?: string;
  fontSize?: number;
  decimal?: boolean; // whether or not supports decimal seconds - if not will accept . as h/m/s separator, possibly replace wiith # decimal places accepted AND DISPLAYED
  returnKeyType?: ReturnKeyTypeOptions; // for next field focus
  onSubmitEditing?: () => void;         // for next field focus
  blurOnSubmit?: boolean;
}

/**
 * Duration Input component that resolves h:mm:ss inputs to seconds
 */
function DurationInputBase({ value,
  onSetValue,
  disabled = false,
  mandatory = false,
  outerStyle = {},
  boxStyle = {},
  borderColor = '',
  fontSize,
  decimal = false,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit
}: Props, ref) {
  const inputRef: any = useRef();
  useImperativeHandle(ref, () => ({
    // allow focus to be called externally
    focus: () => {
      if (inputRef && inputRef.current && inputRef.current.focus) {
        inputRef.current.focus();
      }
    }
  }));

  const parseDuration = (hhmmss: string): number | null => {
    if (!hhmmss && !mandatory) {
      return null;
    }
    const separators = !decimal ? /[\:\ \;\-\,\.]/g : /[\:\ \;\-\,]/g; // dot allowed as separator if decimal not supported
    const secs: number = !hhmmss ? 0 : hhmmss.split(separators).reduce((acc, time) => (60 * acc) + +time, 0);
    return isNaN(secs) ? null : secs;
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null || isNaN(seconds)) {
      return '';
    }
    const hh = Math.floor(seconds / 3600);
    const mm = Math.floor((seconds - (hh * 3600)) / 60);
    const ss = Math.floor(seconds - (hh * 3600) - (mm * 60));
    const ms = (seconds % 1).toFixed(4).substring(2).replace(/0+$/, ''); // fractional part (string)
    return (hh > 0 ? hh + ':' : '') +
      (mm > 0 || hh > 0 ? ('0' + mm).slice(-2) + ':' : '0:') +
      ('0' + ss).slice(-2) +
      (!decimal || ms === '' ? '' : '.' + ms);
  };

  // Local state:
  const [durationInput, setDurationInput] = useState<string>(formatDuration(value));

  // Styles:
  const styles = EStyleSheet.create({
    container: {
      minHeight: 32
    },
    input: {
      paddingHorizontal: 3,
      fontFamily: Util.monoFontFamily(),
      fontWeight: 'bold',
      textAlign: 'right',
      fontSize: fontSize || (ScreenInfo.Width() < 400 ? 15 : 20),
      color: disabled ? '#555' : '#000',
      marginVertical: Platform.OS === 'android' ? -10 : 0,
      width: '100%'
    }
  });

  // Local methods:
  const onChangeText = (txt: string) => {
    setDurationInput(txt); // dont parse while editing
  };
  const onEndEditing = () => {
    const secs = parseDuration(durationInput);
    setDurationInput(formatDuration(secs));
    if (secs !== value) {
      onSetValue(secs);
    }
  };

  // Main render:
  return (
    <View style={[styles.container, outerStyle]}>
      <RowView right nowrap style={[
        commonStyles.textInputContainer,
        styles.container,
        {
          backgroundColor: disabled ? '#eee' : Theme.textInputBackground
        },
        !!borderColor && {
          borderBottomColor: borderColor,
          borderTopColor: borderColor,
          borderLeftColor: borderColor,
          borderRightColor: borderColor
        },
        boxStyle
      ]}>
        <TextInput
          ref={inputRef}
          selectTextOnFocus
          editable={!disabled}
          keyboardType={'numeric'}
          style={styles.input}
          value={durationInput}
          onChangeText={(txt) => onChangeText(txt)}
          onEndEditing={() => onEndEditing()}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
        />
      </RowView>
    </View>
  );
};

export const DurationInput = forwardRef(DurationInputBase);