
import React from 'react';
import { Topic, DebateType } from '../types';
import { IconComment, IconClock, IconGlobe, IconShieldAlert } from './Icons';

interface TopicListProps {
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
}

export const TopicList: React.FC<TopicListProps> = ({ topics, onSelectTopic }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {topics.map((topic) => {
        const isClosed = topic.type === DebateType.TIMED && topic.closesAt && Date.now() > topic.closesAt;

        return (
          <div 
            key={topic.id}
            onClick={() => onSelectTopic(topic)}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group flex flex-col"
          >
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* Debate Type Pill */}
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border ${
                topic.type === DebateType.TIMED 
                  ? 'bg-orange-50 text-orange-700 border-orange-200' 
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {topic.type === DebateType.TIMED ? <IconClock className="w-3 h-3" /> : <IconGlobe className="w-3 h-3" />}
                {topic.type === DebateType.TIMED ? 'Timed-Debate' : 'Debate'}
              </span>

              {/* Closed Pill */}
              {isClosed && (
                <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border bg-slate-100 text-slate-500 border-slate-200">
                  <IconClock className="w-3 h-3" />
                  Closed
                </span>
              )}

              {/* 18+ Pill */}
              {topic.isAgeRestricted && (
                <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border bg-red-50 text-red-600 border-red-200">
                  <IconShieldAlert className="w-3 h-3" />
                  18+
                </span>
              )}

              <span className="text-slate-400 text-xs ml-auto">{new Date(topic.createdAt).toLocaleDateString()}</span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
              {topic.title}
            </h3>
            <p className="text-slate-600 text-sm mb-4 line-clamp-2">
              {topic.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6 mt-auto">
               {topic.tags?.slice(0, 3).map(tag => (
                   <span key={tag} className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                      {tag}
                   </span>
               ))}
               {topic.tags && topic.tags.length > 3 && (
                   <span className="text-xs text-slate-400 self-center">+{topic.tags.length - 3}</span>
               )}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="text-blue-600">{topic.stats.for} For</span>
                <span className="text-red-600">{topic.stats.against} Against</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <IconComment className="w-4 h-4" />
                {/* Total count includes unverified comments too as it's just raw activity, but for consistency with pills let's keep it simply as total number of posts */}
                <span className="text-xs">{topic.stats.for + topic.stats.against + topic.stats.neutral} Verified</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
