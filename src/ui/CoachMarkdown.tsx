import React, {memo} from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import {marked, type MarkedToken, type Token, type Tokens} from 'marked';
import {Txt, color, font, styles as s} from './theme';

function inline(tokens: Token[]): React.ReactNode {
  return (tokens as MarkedToken[]).map((token, i) => {
    switch (token.type) {
      case 'strong':
      case 'em':
      case 'del':
        return (
          <Text key={i} style={md[token.type]}>
            {inline(token.tokens)}
          </Text>
        );
      case 'codespan':
        return (
          <Text key={i} style={md.code}>
            {token.text}
          </Text>
        );
      case 'link':
        if (!/^https?:\/\//i.test(token.href)) return inline(token.tokens);
        return (
          <Text
            key={i}
            accessibilityRole="link"
            style={md.link}
            onPress={() =>
              Linking.openURL(token.href).catch(() => Alert.alert('无法打开链接', token.href))
            }
          >
            {inline(token.tokens)}
          </Text>
        );
      case 'image':
        return token.text;
      case 'br':
        return '\n';
      case 'checkbox':
        return token.checked ? '☑ ' : '☐ ';
      case 'text':
        return token.tokens ? inline(token.tokens) : token.text;
      case 'escape':
        return token.text;
      default:
        return token.raw;
    }
  });
}
function table({header, rows}: Tokens.Table) {
  return (
    <ScrollView horizontal nestedScrollEnabled>
      <View>
        {[header, ...rows].map((row, i) => (
          <View key={i} style={md.tableRow}>
            {row.map((cell, j) => (
              <Txt
                key={j}
                selectable
                style={[md.cell, cell.header && md.strong, {textAlign: cell.align ?? 'left'}]}
              >
                {inline(cell.tokens)}
              </Txt>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
function blocks(tokens: Token[], textStyle?: StyleProp<TextStyle>): React.ReactNode {
  return (tokens as MarkedToken[]).map((token, i) => {
    switch (token.type) {
      case 'space':
      case 'def':
        return null;
      case 'heading':
        return (
          <Txt
            key={i}
            selectable
            accessibilityRole="header"
            style={token.depth < 3 ? s.h2 : md.strong}
          >
            {inline(token.tokens)}
          </Txt>
        );
      case 'list':
        return (
          <View key={i} style={md.group}>
            {token.items.map((item, j) => (
              <View key={j} style={md.item}>
                <Txt style={md.marker}>{token.ordered ? Number(token.start) + j + '.' : '•'}</Txt>
                <View style={[md.group, md.listBody]}>{blocks(item.tokens)}</View>
              </View>
            ))}
          </View>
        );
      case 'blockquote':
        return (
          <View key={i} style={[md.group, md.quote]}>
            {blocks(token.tokens)}
          </View>
        );
      case 'code':
        return (
          <ScrollView key={i} horizontal nestedScrollEnabled style={md.codeBox}>
            <Txt selectable style={md.code}>
              {token.text}
            </Txt>
          </ScrollView>
        );
      case 'table':
        return <View key={i}>{table(token)}</View>;
      case 'hr':
        return <View key={i} style={s.rule} />;
      case 'paragraph':
        return (
          <Txt key={i} selectable style={textStyle}>
            {inline(token.tokens)}
          </Txt>
        );
      case 'text':
        return (
          <Txt key={i} selectable style={textStyle}>
            {token.tokens ? inline(token.tokens) : token.text}
          </Txt>
        );
      default:
        return (
          <Txt key={i} selectable>
            {inline([token])}
          </Txt>
        );
    }
  });
}
export const CoachMarkdown = memo(function CoachMarkdown({
  text,
  textStyle,
}: {
  text: string;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={md.group}>{blocks(marked.lexer(text, {gfm: true, breaks: true}), textStyle)}</View>
  );
});
const md = StyleSheet.create({
  group: {gap: 6, minWidth: 0},
  listBody: {flex: 1},
  item: {flexDirection: 'row', alignItems: 'flex-start', gap: 6},
  marker: {minWidth: 16, color: color.sub},
  strong: {fontWeight: '700'},
  em: {fontStyle: 'italic'},
  del: {textDecorationLine: 'line-through'},
  code: {
    fontFamily: font.mono,
    fontSize: 13,
    color: color.ink,
    backgroundColor: color.raised,
  },
  link: {color: color.accent, textDecorationLine: 'underline'},
  codeBox: {backgroundColor: color.raised, borderRadius: 7, padding: 8},
  quote: {borderLeftWidth: 2, borderColor: color.accent, paddingLeft: 10},
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: color.line,
  },
  cell: {width: 112, paddingVertical: 4, paddingHorizontal: 6},
});
