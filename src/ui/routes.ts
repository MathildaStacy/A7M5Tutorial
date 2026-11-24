import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
export type Routes = {
  学习: undefined;
  相机: undefined;
  实验室: undefined;
  'AI 教练': undefined;
  我的: undefined;
};
export type TabProps<K extends keyof Routes> = BottomTabScreenProps<Routes, K>;
