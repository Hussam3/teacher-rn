/** أيقونات Material Community على الويب — بديل react-native-vector-icons/MaterialCommunityIcons */
import CommunityGlyphs from 'react-native-vector-icons/dist/glyphmaps/MaterialCommunityIcons.json';
import { renderGlyph, type WebIconProps } from './iconBase';

export default function MaterialCommunityIcons(props: WebIconProps) {
  return renderGlyph({
    ...props,
    fontFamily: 'Material Design Icons',
    glyphs: CommunityGlyphs as Record<string, number>,
  });
}