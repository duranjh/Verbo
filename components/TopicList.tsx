import React from 'react';
import { Topic } from '../types';
import { MagazineGrid } from './home/MagazineGrid';

interface TopicListProps {
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
}

export const TopicList: React.FC<TopicListProps> = (props) => <MagazineGrid {...props} />;
