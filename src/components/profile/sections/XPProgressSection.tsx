import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star, Trophy, Zap } from 'lucide-react';
import { gameScoreService } from '@/services/gameScoreService';
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
  const levelInfo = gameScoreService.calculateLevelProgress(permanentXP);
  return null;
};
export default XPProgressSection;