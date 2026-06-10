import React, { useRef, useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, Dimensions,
  TouchableOpacity, Text, Animated,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useFeedStore } from '../stores/feed';
import { AttentionRing } from '../components/AttentionRing';
import { MonetizePanel } from '../components/MonetizePanel';
import { ProfileSlideUp } from '../components/ProfileSlideUp';
import type { FeedPost } from '../types/feed';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

function FeedItem({
  item,
  isActive,
}: {
  item: FeedPost;
  isActive: boolean;
}) {
  const videoRef = useRef(null);
  const [showMonetize, setShowMonetize] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleLongPress = useCallback(() => {
    setShowMonetize(true);
  }, []);

  return (
    <View style={styles.feedItem}>
      <Video
        ref={videoRef}
        source={{ uri: item.videoUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={isActive}
        isMuted={!isActive}
      />

      {/* Attention Ring — fills as user watches, triggers $VIVA reward */}
      <AttentionRing postId={item.id} isActive={isActive} />

      {/* Creator info */}
      <TouchableOpacity
        style={styles.creatorRow}
        onPress={() => setShowProfile(true)}
      >
        <View style={styles.creatorAvatar}>
          <Text style={styles.creatorAvatarText}>
            {item.creator.name[0]}
          </Text>
        </View>
        <View>
          <Text style={styles.creatorName}>{item.creator.name}</Text>
          <Text style={styles.creatorScore}>
            V-Score {item.creator.vScore}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Caption */}
      <Text style={styles.caption}>{item.caption}</Text>

      {/* Right side actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>❤️</Text>
          <Text style={styles.actionCount}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleLongPress}
        >
          <Text style={styles.actionIcon}>⚡</Text>
          <Text style={styles.actionCount}>Earn</Text>
        </TouchableOpacity>
      </View>

      {/* Monetize Panel — long press */}
      {showMonetize && (
        <MonetizePanel
          post={item}
          onClose={() => setShowMonetize(false)}
        />
      )}

      {/* Profile Slide-up */}
      {showProfile && (
        <ProfileSlideUp
          userId={item.creator.id}
          onClose={() => setShowProfile(false)}
        />
      )}
    </View>
  );
}

export default function FeedScreen() {
  const { posts, fetchMore } = useFeedStore();
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <FeedItem item={item} isActive={index === activeIndex} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        onEndReached={fetchMore}
        onEndReachedThreshold={2}
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  feedItem: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  creatorRow: {
    position: 'absolute', bottom: 120, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  creatorAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1e1038', borderWidth: 1.5, borderColor: '#7c3aed',
    justifyContent: 'center', alignItems: 'center',
  },
  creatorAvatarText: { color: '#a78bfa', fontWeight: '700' },
  creatorName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  creatorScore: { color: '#a78bfa', fontSize: 11 },
  caption: {
    position: 'absolute', bottom: 80, left: 16, right: 80,
    color: '#fff', fontSize: 13, lineHeight: 18,
  },
  actions: {
    position: 'absolute', right: 12, bottom: 120,
    gap: 20, alignItems: 'center',
  },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 26 },
  actionCount: { color: '#fff', fontSize: 11 },
});
