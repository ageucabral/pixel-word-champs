import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star, Trophy, Zap } from 'lucide-react';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';

interface XPProgressSectionProps {
  permanentXP: number; // experience_points
  temporaryScore: number; // total_score
  gamesPlayed: number;
}

const XPProgressSection = ({
  permanentXP,
  temporaryScore,
  gamesPlayed
}: XPProgressSectionProps) => {
  const { currentLevel, nextLevel, progress } = usePlayerLevel(permanentXP);
  
  // Este componente foi desabilitado - use usePlayerLevel diretamente nos componentes pais
  return null;
};
export default XPProgressSection;