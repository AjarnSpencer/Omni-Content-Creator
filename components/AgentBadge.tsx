import React from 'react';
import { AgentStatus } from '../types';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';

interface AgentBadgeProps {
  agent: AgentStatus;
}

export const AgentBadge: React.FC<AgentBadgeProps> = ({ agent }) => {
  const getStatusColor = () => {
    switch (agent.status) {
      case 'active': return 'text-blue-500 border-blue-500 bg-blue-50';
      case 'completed': return 'text-green-600 border-green-200 bg-green-50 opacity-70';
      case 'waiting': return 'text-gray-400 border-gray-200 bg-gray-50 opacity-50';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`flex items-center space-x-3 p-3 border rounded-lg transition-all duration-300 ${getStatusColor()}`}>
      <div className="flex-shrink-0">
        {agent.status === 'active' && <Loader2 className="w-5 h-5 animate-spin" />}
        {agent.status === 'completed' && <CheckCircle2 className="w-5 h-5" />}
        {(agent.status === 'waiting' || agent.status === 'idle') && <Circle className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{agent.name}</p>
        <p className="text-xs truncate opacity-80">{agent.role}</p>
      </div>
      {agent.status === 'active' && (
        <div className="hidden md:block text-xs italic animate-pulse text-blue-600">
           {agent.log[agent.log.length - 1] || 'Processing...'}
        </div>
      )}
    </div>
  );
};
