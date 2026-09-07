/** أيقونات Material على الويب — بديل react-native-vector-icons/MaterialIcons */
import MaterialGlyphs from 'react-native-vector-icons/dist/glyphmaps/MaterialIcons.json';
import { renderGlyph, type WebIconProps } from './iconBase';

export default function MaterialIcons(props: WebIconProps) {
  return renderGlyph({ ...props, fontFamily: 'Material Icons', glyphs: MaterialGlyphs as Record<string, number> });
}