import React, {memo, useState} from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import {Marked, type MarkedToken, type Token, type Tokens} from 'marked';
import markedCjkFriendly from 'marked-cjk-friendly';
import {decodeHTMLStrict} from 'entities/lib/decode.js';
import {Txt, color, font, styles as s} from './theme';

const parser = new Marked({gfm: true, breaks: true}, markedCjkFriendly());

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
          <Text key={i} style={[md.mono, md.inlineCode]}>
            {token.text}
          </Text>
        );
      case 'link':
      case 'image': {
        const label =
          token.type === 'image' ? decodeHTMLStrict(token.text || '图片') : inline(token.tokens);
        const href =
          token.type === 'link' && token.autolink ? token.href : decodeHTMLStrict(token.href);
        if (!/^https?:\/\//i.test(href)) return label;
        return (
          <Text
            key={i}
            accessibilityRole="link"
            style={md.link}
            onPress={() => Linking.openURL(href).catch(() => Alert.alert('无法打开链接', href))}
          >
            {label}
          </Text>
        );
      }
      case 'br':
        return '\n';
      case 'html':
        return /^<br\s*\/?\s*>$/i.test(token.raw.trim()) ? '\n' : token.raw;
      case 'checkbox':
        // The list renders the checkbox in its marker column for both tight and loose items.
        return null;
      case 'text':
        return token.tokens ? inline(token.tokens) : decodeHTMLStrict(token.text);
      case 'escape':
        return token.text;
      default:
        return token.raw;
    }
  });
}

function MarkdownTable({table}: {table: Tokens.Table}) {
  const [width, setWidth] = useState(0);
  const {fontScale} = useWindowDimensions();
  const columnWidth = Math.max(92 * fontScale, width / table.header.length);
  return (
    <View style={md.table}>
      <ScrollView
        horizontal
        nestedScrollEnabled
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        <View>
          {[table.header, ...table.rows].map((row, i) => (
            <View key={i} style={[md.tableRow, i === 0 && md.tableHead]}>
              {row.map((cell, j) => (
                <Txt
                  key={j}
                  selectable
                  style={[
                    md.cell,
                    cell.header && md.strong,
                    {width: columnWidth, textAlign: cell.align ?? 'left'},
                  ]}
                >
                  {inline(cell.tokens)}
                </Txt>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function blocks(tokens: Token[], textStyle?: StyleProp<TextStyle>, listDepth = 0): React.ReactNode {
  return (tokens as MarkedToken[]).map((token, i) => {
    switch (token.type) {
      case 'space':
      case 'def':
      case 'checkbox':
        return null;
      case 'heading':
        return (
          <Txt
            key={i}
            selectable
            accessibilityRole="header"
            style={[
              md.strong,
              token.depth === 1 ? md.title : token.depth === 2 ? md.heading : md.subheading,
            ]}
          >
            {inline(token.tokens)}
          </Txt>
        );
      case 'list':
        return (
          <View key={i} style={token.loose ? md.document : md.list}>
            {token.items.map((item, j) => {
              let marker = listDepth ? '◦' : '•';
              if (token.ordered) marker = String(Number(token.start) + j) + '.';
              if (item.task) marker = item.checked ? '☑' : '☐';
              return (
                <View key={j} style={md.item}>
                  <Txt style={[md.marker, item.task && {color: color.accent}]}>{marker}</Txt>
                  <View style={[md.listBody, token.loose ? md.document : md.list]}>
                    {blocks(item.tokens, textStyle, listDepth + 1)}
                  </View>
                </View>
              );
            })}
          </View>
        );
      case 'blockquote':
        return (
          <View key={i} style={[md.document, md.quote]}>
            {blocks(token.tokens, [textStyle, {color: color.sub}], listDepth)}
          </View>
        );
      case 'code':
        return (
          <View key={i} style={md.codeBox}>
            {!!token.lang && <Txt style={s.eyebrow}>{token.lang}</Txt>}
            <ScrollView horizontal nestedScrollEnabled>
              <Txt selectable style={md.mono}>
                {token.text}
              </Txt>
            </ScrollView>
          </View>
        );
      case 'table':
        return <MarkdownTable key={i} table={token} />;
      case 'hr':
        return <View key={i} style={s.rule} />;
      default:
        return (
          <Txt key={i} selectable style={[md.prose, textStyle]}>
            {token.type === 'paragraph' ? inline(token.tokens) : inline([token])}
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
  return <View style={md.document}>{blocks(parser.lexer(text), textStyle)}</View>;
});

const md = StyleSheet.create({
  document: {gap: 10, minWidth: 0},
  prose: {fontSize: 15, lineHeight: 24},
  title: {fontSize: 21, lineHeight: 29},
  heading: {fontSize: 18, lineHeight: 26},
  subheading: {fontSize: 16, lineHeight: 24},
  list: {gap: 4, minWidth: 0},
  listBody: {flex: 1, minWidth: 0},
  item: {flexDirection: 'row', alignItems: 'flex-start', gap: 7},
  marker: {minWidth: 17, textAlign: 'right', lineHeight: 24, color: color.sub},
  strong: {fontWeight: '700'},
  em: {fontStyle: 'italic'},
  del: {textDecorationLine: 'line-through'},
  mono: {fontFamily: font.mono, fontSize: 13, lineHeight: 21, color: color.ink},
  inlineCode: {backgroundColor: color.raised, color: '#FFC58E'},
  link: {color: color.accent, textDecorationLine: 'underline'},
  codeBox: {backgroundColor: color.bg, borderRadius: 8, padding: 10, gap: 5},
  quote: {borderLeftWidth: 3, borderColor: color.accent, paddingLeft: 11, paddingVertical: 2},
  table: {
    minWidth: 0,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHead: {backgroundColor: color.raised},
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
  },
  cell: {fontSize: 14, lineHeight: 22, paddingVertical: 6, paddingHorizontal: 8},
});
