import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMusic } from 'react-icons/fi';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Track } from '../types';
import { getArtists } from '../utils';
import styles from './PlayerPlaylist.module.css';

interface PlayerPlaylistProps {
  /** 是否显示播放列表 */
  showPlaylist: boolean;
  /** 播放列表数据 */
  playlist: Track[];
  /** 当前播放曲目的索引 */
  currentTrackIndex: number;
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 点击曲目的回调 */
  onPlayTrack: (index: number) => void;
  /** 列表排序回调 */
  onReorder: (newPlaylist: Track[]) => void;
}

/**
 * 播放列表组件
 * 
 * 职责：
 * 1. 展示当前播放列表的所有曲目
 * 2. 高亮当前播放的曲目
 * 3. 支持点击切换曲目
 * 4. 支持拖拽排序（基于 react-beautiful-dnd / @hello-pangea/dnd）
 * 5. 处理列表的展开/折叠动画
 */
const PlayerPlaylist: React.FC<PlayerPlaylistProps> = ({
  showPlaylist,
  playlist,
  currentTrackIndex,
  isPlaying,
  onPlayTrack,
  onReorder
}) => {

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(playlist);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items);
  };

  return (
    <AnimatePresence>
      {showPlaylist && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 250 }}
          exit={{ height: 0 }}
          className={styles.playlist}
        >
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="playlist">
              {(provided) => (
                <ul 
                  className={styles.playlistList}
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {playlist.map((track, idx) => (
                    <Draggable 
                      key={track.id} 
                      draggableId={track.id.toString()} 
                      index={idx}
                    >
                      {(provided, snapshot) => (
                        <li 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onPlayTrack(idx)}
                          className={`${styles.playlistItem} ${idx === currentTrackIndex ? styles.active : ''}`}
                          style={{
                            ...provided.draggableProps.style,
                            backgroundColor: snapshot.isDragging ? 'rgba(var(--color-bg-rgb), 0.9)' : undefined,
                            boxShadow: snapshot.isDragging ? '0 4px 12px rgba(0,0,0,0.1)' : undefined,
                          }}
                        >
                          <span className={styles.trackIndex}>{idx + 1}</span>
                          <div className={styles.trackMeta}>
                            <div className={styles.trackName}>{track.name}</div>
                            <div className={styles.trackArtist}>{getArtists(track)}</div>
                          </div>
                          {idx === currentTrackIndex && isPlaying && (
                            <FiMusic className="animate-bounce ml-2" />
                          )}
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlayerPlaylist;
