import {memo} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';

import type {Message} from '../../../api';
import {colors} from '../../../assets/colors';
import {fonts} from '../../../assets/fonts';
import {HoroscopeCard} from './HoroscopeCard';

const mascotImage = require('../../../assets/images/mascot.png');

type AssistantIntroProps = {
  message: Message;
};

/** Last blank-line block is the closing question (white); earlier blocks use text70. */
function splitPortraitText(text: string): {body: string; question: string} {
  const parts = text
    .split(/\n\n+/)
    .map(part => part.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return {body: '', question: ''};
  }
  if (parts.length === 1) {
    return {body: parts[0], question: ''};
  }
  return {
    body: parts.slice(0, -1).join('\n\n'),
    question: parts[parts.length - 1],
  };
}

function AssistantIntroView({message}: AssistantIntroProps) {
  const signs = message.signs ?? [];
  const {body, question} = splitPortraitText(message.text ?? '');

  return (
    <View style={styles.root}>
      {signs.length > 0 ? (
        <View style={styles.signs}>
          {signs.map(sign => (
            <HoroscopeCard key={sign.kind} sign={sign} />
          ))}
        </View>
      ) : null}
      {body.length > 0 ? <Text style={styles.body}>{body}</Text> : null}
      {question.length > 0 ? (
        <Text style={styles.question}>{question}</Text>
      ) : null}
      <Image source={mascotImage} style={styles.mascot} />
    </View>
  );
}
export const AssistantIntro = memo(AssistantIntroView);

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    gap: 16,
  },
  signs: {
    gap: 12,
  },
  body: {
    fontFamily: fonts.ibmPlexMono,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.56,
    color: colors.text70,
  },
  question: {
    fontFamily: fonts.ibmPlexMono,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.56,
    color: colors.text,
  },
  mascot: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
