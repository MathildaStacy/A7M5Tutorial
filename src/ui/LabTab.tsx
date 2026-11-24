import React, {useState} from 'react';
import {ScrollView, View} from 'react-native';
import Svg, {Path, Rect, Circle, G} from 'react-native-svg';
import {
  apertures,
  shutters,
  isoStops,
  solve,
  clamp,
  formatEV,
  type ExposureSettings,
} from '../camera/exposure';
import {Button, Card, Txt, color, styles as s} from './theme';
const scenes = [
  {name: '晴天', ev: 15, sky: '#76a4c4', land: '#667859'},
  {name: '阴天', ev: 12, sky: '#94a5af', land: '#67716b'},
  {name: '室内', ev: 7, sky: '#b99b76', land: '#716953'},
  {name: '夜景', ev: 4, sky: '#313b55', land: '#323b41'},
];
export function LabTab() {
  const [scene, choose] = useState(1),
    [p, set] = useState<ExposureSettings>({
      mode: 'A',
      scene_ev: 12,
      aperture: 2.8,
      shutter: '1/500',
      iso: 'AUTO',
      ev: 0,
    });
  const sc = scenes[scene],
    r = solve({...p, scene_ev: sc.ev});
  function row<T extends number | string>(
    name: string,
    stops: readonly T[],
    value: T,
    apply: (v: T) => void,
    locked = false,
  ) {
    const idx = stops.indexOf(value);
    return (
      <View style={s.spread}>
        <Txt>{name}</Txt>
        <View style={s.row}>
          <Button
            label={name + '减少一档'}
            disabled={locked || idx <= 0}
            onPress={() => apply(stops[idx - 1])}
          >
            −
          </Button>
          <Txt style={[s.num, {minWidth: 58, textAlign: 'center'}]}>{String(value)}</Txt>
          <Button
            label={name + '增加一档'}
            disabled={locked || idx >= stops.length - 1}
            onPress={() => apply(stops[idx + 1])}
          >
            ＋
          </Button>
        </View>
      </View>
    );
  }
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}>
      <View>
        <Txt style={s.eyebrow}>光圈 · 快门 · ISO</Txt>
        <Txt style={s.title}>曝光实验室</Txt>
      </View>
      <View style={s.wrap}>
        {scenes.map((v, i) => (
          <Button key={v.name} active={scene === i} onPress={() => choose(i)}>
            {v.name + ' EV ' + v.ev}
          </Button>
        ))}
      </View>
      <Card>
        <Svg width="100%" height={145} viewBox="0 0 340 145" preserveAspectRatio="xMidYMid slice">
          <Rect width="340" height="145" fill={sc.sky} />
          <Circle
            cx="267"
            cy="34"
            r={scene === 3 ? 12 : 20}
            fill={scene === 3 ? '#e6d9ab' : '#f3dfaf'}
          />
          <Path d="M0 103L63 52 118 84 172 41 258 88 309 55 350 82V145H0Z" fill={sc.land} />
          <Path d="M0 119Q75 79 153 110T340 97V145H0Z" fill="#404e47" />
          {scene === 2 && (
            <G>
              <Rect x="0" y="0" width="340" height="145" fill="#b3a58f" opacity=".5" />
              <Path d="M72 0V124M250 0V124M0 80H340" stroke="#504838" strokeWidth="8" />
            </G>
          )}
          <Circle cx="170" cy="78" r="10" fill="#cfaa8a" />
          <Path d="M158 94Q170 80 182 94L187 124H153Z" fill="#b5664a" />
          <Path d="M159 123V145M180 123V145" stroke="#28323f" strokeWidth="8" />
          <Rect
            width="340"
            height="145"
            fill={r.bias > 0 ? 'white' : 'black'}
            opacity={clamp(Math.abs(r.bias) * 0.2, 0, 0.9)}
          />
        </Svg>
        <Txt style={s.num}>
          {r.shutter}　 F{r.aperture}　 ISO {r.iso}
        </Txt>
        <Txt style={{color: r.warning ? color.bad : color.sub}}>
          {r.warning || '测光表 ' + formatEV(r.bias) + ' EV'}
        </Txt>
      </Card>
      <View style={s.wrap}>
        {(['M', 'A', 'S'] as const).map((m, i) => (
          <Button key={m} active={m === p.mode} onPress={() => set({...p, mode: m})}>
            {['M 手动', 'A 光圈优先', 'S 快门优先'][i]}
          </Button>
        ))}
      </View>
      <Card>
        {row(
          '光圈',
          apertures,
          p.mode === 'S' ? r.aperture : p.aperture,
          (aperture) => set({...p, aperture}),
          p.mode === 'S',
        )}
        {row(
          '快门',
          shutters,
          p.mode === 'A' ? r.shutter : p.shutter,
          (shutter) => set({...p, shutter}),
          p.mode === 'A',
        )}
        {row('ISO', ['AUTO' as const, ...isoStops], p.iso, (iso) => set({...p, iso}))}
        {row(
          '曝光补偿',
          Array.from({length: 19}, (_, i) => (i - 9) / 3),
          p.ev,
          (ev) => set({...p, ev}),
          p.mode === 'M' && p.iso !== 'AUTO',
        )}
      </Card>
    </ScrollView>
  );
}
