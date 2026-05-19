import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  index: { label: 'Home', icon: 'home-outline' },
  map: { label: 'Map', icon: 'map-outline' },
  publish: { label: 'Publish', icon: 'add-circle-outline' },
  social: { label: 'Social', icon: 'people-outline' },
  profile: { label: 'Profile', icon: 'person-outline' },
};

function TabItem({
  focused,
  icon,
  label,
  onPress,
}: {
  focused: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1.04 : 1, { damping: 16, stiffness: 180 }) }],
  }));

  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="flex-1 items-center">
      <Animated.View style={animatedStyle} className="h-14 min-w-14 items-center justify-center rounded-full">
        {focused ? (
          <LinearGradient
            colors={['#ff6fca', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="absolute inset-0 rounded-full"
          />
        ) : null}
        <View className="items-center">
          <Ionicons name={icon} size={21} color={focused ? '#ffffff' : '#a1a1aa'} />
          <Text className={`mt-1 text-[10px] font-medium ${focused ? 'text-white' : 'text-zinc-400'}`}>
            {label}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function LiquidTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 items-center px-5" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <View
        className="w-full max-w-[420px] overflow-hidden rounded-full border"
        style={{
          backgroundColor: 'rgba(255,255,255,0.72)',
          borderColor: 'rgba(255,255,255,0.7)',
          shadowColor: '#8b5cf6',
          shadowOffset: { width: 0, height: 18 },
          shadowOpacity: 0.16,
          shadowRadius: 28,
          elevation: 18,
        }}
      >
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.88)', 'rgba(255,245,252,0.48)', 'rgba(239,232,255,0.62)']}
          className="absolute inset-0"
        />
        <View
          pointerEvents="none"
          className="absolute left-8 right-8 top-2 h-[1px] rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.82)' }}
        />
        <View className="h-[76px] flex-row items-center px-3">
          {state.routes.map((route, index) => {
            const meta = TAB_META[route.name];
            const focused = state.index === index;
            const { options } = descriptors[route.key];

            if (!meta) {
              return null;
            }

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <TabItem
                key={route.key}
                focused={focused}
                icon={meta.icon}
                label={options.title ?? meta.label}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}
