import React from 'react';
import {View} from 'react-native';
import {byId} from '../camera/controls';
import {Txt, color, styles as s} from './theme';

function inline(text: string, onControl: (id: string) => void) {
  return text.split(/(\[\[[\w_]+\]\]|\*\*.*?\*\*)/).map((part, i) => {
    const id = part.slice(2, -2);
    if (part.startsWith('[[') && byId[id])
      return (
        <Txt
          key={i}
          accessibilityRole="link"
          onPress={() => onControl(id)}
          style={{color: color.accent}}
        >
          {byId[id].name}
        </Txt>
      );
    if (part.startsWith('**'))
      return (
        <Txt key={i} style={{fontWeight: '700'}}>
          {inline(id, onControl)}
        </Txt>
      );
    return part;
  });
}
export function LessonReading({
  markdown,
  onControl,
}: {
  markdown: string;
  onControl: (id: string) => void;
}) {
  return (
    <>
      {markdown.split('\n').map((line, i) => {
        const text = line.trim();
        if (!text || /^\|[-: |]+\|$/.test(text)) return null;
        if (text.startsWith('|'))
          return (
            <View
              key={i}
              style={[
                s.row,
                {
                  alignItems: 'flex-start',
                  borderBottomWidth: 1,
                  borderColor: color.line,
                  paddingBottom: 5,
                },
              ]}
            >
              {text
                .slice(1, -1)
                .split('|')
                .map((v, j) => (
                  <Txt key={j} style={[s.sub, {flex: 1}]}>
                    {inline(v.trim(), onControl)}
                  </Txt>
                ))}
            </View>
          );
        return (
          <Txt key={i} style={text.startsWith('#') ? s.h2 : undefined}>
            {inline(text.replace(/^#{1,4} +/, ''), onControl)}
          </Txt>
        );
      })}
    </>
  );
}
