import React from 'react';
import {View} from 'react-native';
import {
  apertures,
  shutters,
  isoStops,
  solve,
  formatEV,
  type ExposureSettings,
} from '../camera/exposure';
import {Button, Txt, styles as s} from './theme';

export function ExposureDials({
  settings: p,
  onChange: set,
  locked = [],
}: {
  settings: ExposureSettings;
  onChange: (v: ExposureSettings) => void;
  locked?: string[];
}) {
  const r = solve(p);
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
            label={name + '减少一格'}
            disabled={locked || idx <= 0}
            onPress={() => apply(stops[idx - 1])}
          >
            −
          </Button>
          <Txt style={[s.num, {minWidth: 58, textAlign: 'center'}]}>
            {name === '曝光补偿' ? formatEV(Number(value)) : String(value)}
          </Txt>
          <Button
            label={name + '增加一格'}
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
    <>
      {row(
        '光圈',
        apertures,
        p.mode === 'S' ? r.aperture : p.aperture,
        (aperture) => set({...p, aperture}),
        p.mode === 'S' || locked.includes('aperture'),
      )}
      {row(
        '快门',
        shutters,
        p.mode === 'A' ? r.shutter : p.shutter,
        (shutter) => set({...p, shutter}),
        p.mode === 'A' || locked.includes('shutter'),
      )}
      {row(
        'ISO',
        ['AUTO' as const, ...isoStops],
        p.iso,
        (iso) => set({...p, iso}),
        locked.includes('iso'),
      )}
      {row(
        '曝光补偿',
        Array.from({length: 19}, (_, i) => (i - 9) / 3),
        p.ev,
        (ev) => set({...p, ev}),
        (p.mode === 'M' && p.iso !== 'AUTO') || locked.includes('ev'),
      )}
    </>
  );
}
