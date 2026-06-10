import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useVScoreStore } from '../stores/vscore';
import { useWalletStore } from '../stores/wallet';
import { useTwinStore } from '../stores/twin';
import { VScoreRings } from '../components/VScoreRings';
import { EarnedTodayPill } from '../components/EarnedTodayPill';
import { TwinStatusCard } from '../components/TwinStatusCard';
import { AlarmStakeCard } from '../components/AlarmStakeCard';
import { DatingMatchCard } from '../components/DatingMatchCard';
import { ValueDropCard } from '../components/ValueDropCard';
import { useNavigation } from '@react-navigation/native';

export default function HomeCanvas() {
  const navigation = useNavigation();
  const { score, tier, rings, streak } = useVScoreStore();
  const { earnedToday } = useWalletStore();
  const { status, lastAction } = useTwinStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>GOOD MORNING</Text>
            <Text style={styles.userName}>Scott</Text>
          </View>
          <View style={styles.topBarRight}>
            <TouchableOpacity style={styles.notifBtn}>
              <Text style={styles.notifDot}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile', { userId: 'me' })}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>S</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* V-Score Rings */}
        <VScoreRings
          score={score}
          tier={tier}
          rings={rings}
        />

        {/* Earned Today */}
        <EarnedTodayPill amount={earnedToday} />

        {/* Cards */}
        <View style={styles.cards}>
          <TwinStatusCard
            status={status}
            lastAction={lastAction}
            onPress={() => navigation.navigate('Twin')}
          />
          <AlarmStakeCard streak={streak} />
          <DatingMatchCard
            onPress={() => navigation.navigate('Dating')}
          />
          <ValueDropCard />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d14' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  greeting: { fontSize: 11, color: '#555', letterSpacing: 1 },
  userName: { fontSize: 18, fontWeight: '600', color: '#e8e8f0', marginTop: 2 },
  topBarRight: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  notifBtn: { padding: 4 },
  notifDot: { fontSize: 20 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1e1038', borderWidth: 1.5, borderColor: '#7c3aed',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#a78bfa', fontWeight: '600', fontSize: 14 },
  cards: { paddingHorizontal: 14, gap: 10, paddingBottom: 32 },
});
